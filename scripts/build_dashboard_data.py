from __future__ import annotations

import json
import hashlib
import math
import re
from decimal import Decimal, ROUND_FLOOR
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pandas as pd
from source_evidence import add_evidence, apply_status_policy
from build_bundle import build_bundle


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "RawSource"
OUTPUT = ROOT / "public" / "data" / "dashboard-data.json"
AS_OF = date(2026, 9, 30)
CURRENT_WEEK = 40
EQUIVALENCE_GIT_BLOB = "0b9ca178dc18a838e9d54613001269c0e4797658"


def equivalence_links(frame, family_by_key, tidp_keys):
    """Explicit user-approved temporary aliases; never infer from confidence/status."""
    links = {}
    uploaded_keys = set()
    for index, row in frame.iterrows():
        source = normalize_family_name(row.get("Uploaded family"))
        target = normalize_family_name(row.get("Equivalent TIDP family"))
        if not source or source not in family_by_key or not target or target not in tidp_keys:
            raise ValueError(f"Invalid equivalence endpoint at Excel row {index + 2}")
        if text(row.get("In TIDP (Y/N)")) != "Y":
            raise ValueError(f"Equivalence not marked in TIDP at Excel row {index + 2}")
        if source in uploaded_keys or target in links:
            raise ValueError(f"Ambiguous equivalence at Excel row {index + 2}")
        if target in family_by_key and target != source:
            raise ValueError(f"Equivalence conflicts with an existing exact upload at row {index + 2}")
        if set(parse_ticket_ids(row.get('Ticket ID'))) != set(family_by_key[source]['ticketIds']):
            raise ValueError(f"Annotation_RFA_equivalence_Checked.xlsx / Equivalence row {index + 2}, {source}: Ticket ID differs from source Family ticketIds")
        uploaded_keys.add(source)
        links[target] = {
            "familyId": family_by_key[source]["id"],
            "uploadedKey": source,
            "tidpKey": target,
            "uploadedName": text(row.get("Uploaded family")),
            "tidpName": text(row.get("Equivalent TIDP family")),
            "sourceRow": int(index) + 2,
            "sourceDecision": text(row.get("Decision")),
            "sourceMethod": text(row.get("Method")),
            "sourceConfidence": clean(row.get("Confidence %")),
            "ticketIds": parse_ticket_ids(row.get("Ticket ID")),
            "appliedDecision": "User-approved temporary equivalence",
        }
    return links


def clean(value: Any) -> Any:
    if value is None or (isinstance(value, float) and math.isnan(value)) or pd.isna(value):
        return None
    if isinstance(value, (pd.Timestamp, datetime, date)):
        return value.strftime("%Y-%m-%d")
    if hasattr(value, "item"):
        return value.item()
    return value


def text(value: Any) -> str | None:
    value = clean(value)
    if value is None:
        return None
    stripped = str(value).strip()
    return stripped or None


def normalize_family_name(value: Any) -> str:
    raw = (text(value) or "").lower()
    if raw.endswith(".rfa"):
        raw = raw[:-4]
    return re.sub(r"[^a-z0-9]+", "", raw)


def parse_ticket_ids(value: Any) -> list[int]:
    if value is None or pd.isna(value):
        return []
    return sorted({int(match) for match in re.findall(r"\d+", str(value))})


def week_number(label: str) -> int:
    return int(re.search(r"CW(\d+)", label).group(1))


def quarter_hours(value: Any) -> float | None:
    value = clean(value)
    if value is None:
        return None
    return float((Decimal(str(value)) * 4).to_integral_value(rounding=ROUND_FLOOR) / 4)


def validate_family_source(frame, matrix):
    weights = dict(zip(matrix['Ticket ID'], matrix['Weigh Score']))
    keys, seen_tickets = set(), set()
    for index, row in frame.iterrows():
        key = normalize_family_name(row['Family Name'])
        ids = parse_ticket_ids(row['Ticket_IDs'])
        where = f"Family_Upload_vs_Annotation_Tickets_Checked.xlsx / Family_vs_Tickets row {index + 2}, {key}"
        if not key or key in keys:
            raise ValueError(f'{where}: duplicate or missing normalized Family Name')
        keys.add(key)
        if len(ids) != row['Ticket_Count'] or len(ids) != len(set(ids)):
            raise ValueError(f"{where}: Ticket_Count={row['Ticket_Count']}, expected {len(set(ids))}")
        if any(i not in weights or i in seen_tickets for i in ids):
            raise ValueError(f'{where}: orphan or unapproved ticket fanout {ids}')
        seen_tickets.update(ids)
        expected = sum(weights[i] for i in ids)
        if row['Weigh Score Sum'] != expected:
            raise ValueError(f"{where}: Weigh Score Sum={row['Weigh Score Sum']}, expected {expected}")


def main() -> None:
    ticket_path = RAW / "Annotation_Ticket_User_Matrix_Checked.xlsx"
    family_path = RAW / "Family_Upload_vs_Annotation_Tickets_Checked.xlsx"
    tidp_path = RAW / "DCMvn_TIDP_Combined_20260930.xlsx"
    equivalence_path = RAW / "Annotation_RFA_equivalence_Checked.xlsx"
    equivalence_bytes = equivalence_path.read_bytes()
    equivalence_hash = hashlib.sha1(b"blob " + str(len(equivalence_bytes)).encode() + b"\0" + equivalence_bytes).hexdigest()
    if equivalence_hash != EQUIVALENCE_GIT_BLOB:
        raise ValueError("Equivalence workbook changed: review and renew temporary approval before rebuilding")
    equivalence_frame = pd.read_excel(equivalence_path, sheet_name="Equivalence")

    ticket_frame = pd.read_excel(ticket_path, sheet_name="Matrix")
    family_frame = pd.read_excel(family_path, sheet_name="Family_vs_Tickets")
    family_frame = family_frame.loc[
        family_frame["Project Name"].fillna("").str.strip().eq("DCMvn_Annotation Project")
    ].copy()
    family_unmatched = pd.read_excel(family_path, sheet_name="Unmatched")
    validate_family_source(family_frame, ticket_frame)
    tidp_frame = pd.read_excel(tidp_path, sheet_name="TIDP_Combined")
    week_columns = [column for column in tidp_frame.columns if str(column).startswith("CW")]

    tickets: list[dict[str, Any]] = []
    ticket_lookup: dict[int, dict[str, Any]] = {}
    for _, row in ticket_frame.iterrows():
        ticket_id = int(row["Ticket ID"])
        record = {
            "id": ticket_id,
            "created": clean(row.get("Created Date")),
            "start": clean(row.get("Start Date")),
            "end": clean(row.get("End Date")),
            "duration": clean(row.get("Duration")),
            "status": text(row.get("Ticket Status")) or "unknown",
            "summary": text(row.get("Ticket Summary")) or f"Ticket {ticket_id}",
            "workType": text(row.get("Work Type")) or "Unknown",
            "reporter": text(row.get("Reporter")),
            "department": text(row.get("Department")) or "Unknown",
            "handler": text(row.get("Handler")),
            "actualHoursSource": clean(row.get("Actual Hours")),
            "actualHours": quarter_hours(row.get("Actual Hours")),
            "active": text(row.get("Active")),
        }
        tickets.append(record)
        ticket_lookup[ticket_id] = record

    families: list[dict[str, Any]] = []
    family_by_key: dict[str, dict[str, Any]] = {}
    ticket_to_families: dict[int, list[str]] = defaultdict(list)
    for index, row in family_frame.iterrows():
        family_id = f"FAM-{index + 1:04d}"
        name = text(row.get("Family Name")) or family_id
        key = normalize_family_name(name)
        ticket_ids = parse_ticket_ids(row.get("Ticket_IDs"))
        record = {
            "id": family_id,
            "name": name,
            "key": key,
            "category": text(row.get("Category")) or "Unknown",
            "uploader": text(row.get("Uploader")),
            "actualCfm": clean(row.get("Actual_CFM")),
            "actualTrm": clean(row.get("Actual_TRM")),
            "start": clean(row.get("Start Date")),
            "end": clean(row.get("End Date")),
            "ticketIds": ticket_ids,
            "ticketStatus": text(row.get("Ticket_Status")) or "unknown",
            "active": text(row.get("Active")),
            "matchType": text(row.get("Match_Type")) or "Unknown",
            "detection": text(row.get("Detection")) or "Unknown",
            "projectClass": text(row.get("Project_Class")),
            "reworkOutcome": text(row.get("Rework_Outcome")),
            "reworkErrors": [column for column in ['Geometry_Dimensions', 'Connector_MEP', 'Parameter_Naming', 'Graphics_2D_Visibility', 'Family_Naming_Convention', 'Category_Template_Structure', 'Ticket Missing Meta Data', 'RevitVersion_File_Upload', 'Other_Unclear'] if str(row.get(column, '')).strip().upper() == 'X'],
            "relationship": "Direct",
        }
        families.append(record)
        if key and key not in family_by_key:
            family_by_key[key] = record
        for ticket_id in ticket_ids:
            ticket_to_families[ticket_id].append(family_id)

    tidp_keys = {normalize_family_name(row.get("Detailed work item")) for _, row in tidp_frame.iterrows()
                 if text(row.get("Work type")) == "Revise the RFA library"}
    aliases = equivalence_links(equivalence_frame, family_by_key, tidp_keys)
    family_by_id = {family["id"]: family for family in families}
    for alias in aliases.values():
        family_by_id[alias["familyId"]]["tidpEquivalence"] = alias

    deliverables: list[dict[str, Any]] = []
    relation_counts = Counter()
    for index, row in tidp_frame.iterrows():
        active_weeks = []
        for column in week_columns:
            activity = text(row.get(column))
            if activity:
                active_weeks.append({"week": week_number(column), "activity": activity})
        work_type = text(row.get("Work type")) or "Unknown"
        title = text(row.get("Detailed work item")) or f"TIDP row {index + 1}"
        family_key = normalize_family_name(title) if work_type == "Revise the RFA library" else None
        family = family_by_key.get(family_key or "")
        alias = aliases.get(family_key or "")
        match_method = "Exact normalized name" if family else None
        if not family and alias:
            family = family_by_id[alias["familyId"]]
            match_method = "Temporary equivalence"
        if family:
            relationship = "Derived"
        elif family_key:
            relationship = "Unlinked"
        else:
            relationship = "Not applicable"
        relation_counts[relationship] += 1
        deliverables.append(
            {
                "id": f"TIDP-{index + 1:04d}",
                "title": title,
                "familyKey": family_key,
                "system": text(row.get("System")) or "Unknown",
                "owner": text(row.get("Person In Charge")),
                "workType": work_type,
                "weeks": active_weeks,
                "plannedStartWeek": min((item["week"] for item in active_weeks), default=None),
                "plannedFinishWeek": max((item["week"] for item in active_weeks), default=None),
                "currentActivity": next(
                    (item["activity"] for item in active_weeks if item["week"] == CURRENT_WEEK), None
                ),
                "familyId": family["id"] if family else None,
                "familyMatchMethod": match_method,
                "equivalenceRow": alias["sourceRow"] if match_method == "Temporary equivalence" else None,
                "relationship": relationship,
            }
        )

    for ticket in tickets:
        ticket["familyIds"] = ticket_to_families.get(ticket["id"], [])

    quality_records = add_evidence(families, family_frame, ticket_frame, family_unmatched, clean, normalize_family_name, AS_OF.isoformat())
    apply_status_policy(tickets, families)

    internal_family_unmatched = {
        normalize_family_name(value)
        for value in family_unmatched.get("Family Name", pd.Series(dtype=str)).dropna()
    }
    main_family_keys = {family["key"] for family in families}
    quality = {
        "ticketMissingStart": int(ticket_frame["Start Date"].isna().sum()),
        "ticketMissingEnd": int(ticket_frame["End Date"].isna().sum()),
        "ticketMissingHandler": int(ticket_frame["Handler"].isna().sum()),
        "ticketDuplicateIds": int(ticket_frame["Ticket ID"].duplicated().sum()),
        "tidpMissingOwner": int(tidp_frame["Person In Charge"].isna().sum()),
        "tidpUnscheduled": int(tidp_frame[week_columns].isna().all(axis=1).sum()),
        "tidpDuplicateRows": int(tidp_frame.duplicated().sum()),
        "familyDuplicateNames": int(family_frame["Family Name"].map(normalize_family_name).duplicated().sum()),
        "familySheetContradictions": len(internal_family_unmatched & main_family_keys),
        "familyTicketIdsNotInMatrix": sum(
            1 for ticket_id in ticket_to_families if ticket_id not in ticket_lookup
        ),
        "unlinkedTidpFamilyRows": int(relation_counts["Unlinked"]),
    }

    output = {
        "meta": {
            "project": "DCMvn Annotation Project",
            "asOf": AS_OF.isoformat(),
            "reportingWeek": CURRENT_WEEK,
            "generated": datetime.now().isoformat(timespec="seconds"),
            "sources": [ticket_path.name, family_path.name, tidp_path.name],
            "equivalence": {
                "source": equivalence_path.name,
                "sheet": "Equivalence",
                "gitBlob": equivalence_hash,
                "approvalDate": "2026-10-05",
                "policy": "User-confirmed exclusion of ticket 72176 alias; remaining temporary mappings retained. Source weight and metadata corrections authorized 2026-10-05. Physical upload and semantic equivalence are not independently verified.",
                "rows": len(aliases),
                "additionalUniqueLinks": sum(alias["uploadedKey"] != alias["tidpKey"] for alias in aliases.values()),
            },
            "limitations": [
                "TIDP has weekly plan markers but no actual-finish or explicit completion field.",
                "Tickets have actual start/end evidence but no contractual due date.",
                "TIDP-to-family links use exact normalized names and the user-approved temporary equivalence workbook. Equivalence is not verified model identity or approval.",
                "Family approval status and revision due dates are not present in the supplied sources.",
            ],
        },
        "config": {
            "dueSoonWeeks": 1,
            "ticketAgingWarningDays": 14,
            "ticketAgingCriticalDays": 30,
            "targetOnTimeDelivery": 0.9,
            "reportingWeekStart": "Monday",
        },
        "deliverables": deliverables,
        "tickets": tickets,
        "families": families,
        "quality": quality,
        "qualityRecords": quality_records,
        "relationshipSummary": dict(relation_counts),
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")
    print(f"Offline bundle: {build_bundle(ROOT)['releaseId']}")


if __name__ == "__main__":
    main()

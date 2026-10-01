from __future__ import annotations

import json
import math
import re
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "RawSource"
OUTPUT = ROOT / "public" / "data" / "dashboard-data.json"
AS_OF = date(2026, 9, 30)
CURRENT_WEEK = 40


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


def main() -> None:
    ticket_path = RAW / "Annotation_Ticket_User_Matrix_Checked.xlsx"
    family_path = RAW / "Family_Upload_vs_Annotation_Tickets_Checked.xlsx"
    tidp_path = RAW / "DCMvn_TIDP_Combined_20260930.xlsx"

    ticket_frame = pd.read_excel(ticket_path, sheet_name="Matrix")
    family_frame = pd.read_excel(family_path, sheet_name="Family_vs_Tickets")
    family_unmatched = pd.read_excel(family_path, sheet_name="Unmatched")
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
            "actualHours": clean(row.get("Actual Hours")),
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
            "ticketIds": ticket_ids,
            "ticketStatus": text(row.get("Ticket_Status")) or "unknown",
            "active": text(row.get("Active")),
            "matchType": text(row.get("Match_Type")) or "Unknown",
            "detection": text(row.get("Detection")) or "Unknown",
            "projectClass": text(row.get("Project_Class")),
            "relationship": "Direct",
        }
        families.append(record)
        if key and key not in family_by_key:
            family_by_key[key] = record
        for ticket_id in ticket_ids:
            ticket_to_families[ticket_id].append(family_id)

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
                "relationship": relationship,
            }
        )

    for ticket in tickets:
        ticket["familyIds"] = ticket_to_families.get(ticket["id"], [])

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
            "limitations": [
                "TIDP has weekly plan markers but no actual-finish or explicit completion field.",
                "Tickets have actual start/end evidence but no contractual due date.",
                "Family upload source contains uploaded families; TIDP-to-family matching is derived from normalized exact names.",
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
        "relationshipSummary": dict(relation_counts),
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()

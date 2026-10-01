from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "tickets": ROOT / "RawSource" / "Annotation_Ticket_User_Matrix_Checked.xlsx",
    "families": ROOT / "RawSource" / "Family_Upload_vs_Annotation_Tickets_Checked.xlsx",
    "tidp": ROOT / "RawSource" / "DCMvn_TIDP_Combined_20260930.xlsx",
}


def json_value(value: Any) -> Any:
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if hasattr(value, "item"):
        return value.item()
    return str(value) if not isinstance(value, (str, int, float, bool)) else value


def profile_frame(frame: pd.DataFrame) -> dict[str, Any]:
    columns: list[dict[str, Any]] = []
    for name in frame.columns:
        series = frame[name]
        non_null = series.dropna()
        examples = [json_value(v) for v in non_null.head(5).tolist()]
        columns.append(
            {
                "name": str(name),
                "dtype": str(series.dtype),
                "non_null": int(series.notna().sum()),
                "null": int(series.isna().sum()),
                "null_pct": round(float(series.isna().mean() * 100), 2),
                "unique": int(non_null.nunique(dropna=True)),
                "examples": examples,
            }
        )
    return {
        "rows": int(len(frame)),
        "columns": int(len(frame.columns)),
        "duplicate_rows": int(frame.duplicated().sum()),
        "fields": columns,
    }


def main() -> None:
    result: dict[str, Any] = {}
    for dataset, path in SOURCES.items():
        workbook = pd.ExcelFile(path)
        result[dataset] = {"file": path.name, "sheets": {}}
        for sheet in workbook.sheet_names:
            frame = pd.read_excel(path, sheet_name=sheet)
            result[dataset]["sheets"][sheet] = profile_frame(frame)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

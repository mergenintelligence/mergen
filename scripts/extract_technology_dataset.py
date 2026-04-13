import csv
import json
import sys


def parse_number(value):
    if value is None:
        return None
    value = str(value).replace(",", "").replace("%", "").strip()
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def normalize_header(value):
    return str(value).strip().lower().replace("\ufeff", "").replace(" ", "_").replace("-", "_")


def find_header(fieldnames, candidates):
    normalized = {field: normalize_header(field) for field in fieldnames or []}
    for field, header in normalized.items():
        if header in candidates:
            return field
    return None


def normalize_date(raw_date, raw_year=None, raw_quarter=None):
    if raw_date:
        value = str(raw_date).strip()
        if len(value) >= 10 and value[4] == "-":
            return value[:10]
        if len(value) >= 4 and value[:4].isdigit():
            year = int(value[:4])
            return f"{year}-12-31"

    if raw_year:
        year = int(float(str(raw_year).strip()))
        quarter = str(raw_quarter or "").strip().upper()
        if quarter in {"Q1", "1", "01"}:
            return f"{year}-03-31"
        if quarter in {"Q2", "2", "02"}:
            return f"{year}-06-30"
        if quarter in {"Q3", "3", "03"}:
            return f"{year}-09-30"
        return f"{year}-12-31"

    return None


def extract_generic(path):
    rows = []
    with open(path, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        date_header = find_header(reader.fieldnames, {"date", "period", "observation_date"})
        year_header = find_header(reader.fieldnames, {"year", "fiscal_year"})
        quarter_header = find_header(reader.fieldnames, {"quarter", "fiscal_quarter"})
        value_header = find_header(reader.fieldnames, {"value", "score", "capex", "demand", "share", "index"})

        if value_header is None or (date_header is None and year_header is None):
            raise RuntimeError("Technology dataset headers are not recognized.")

        for row in reader:
            value = parse_number(row.get(value_header))
            if value is None:
                continue

            date_value = normalize_date(
                row.get(date_header) if date_header else None,
                row.get(year_header) if year_header else None,
                row.get(quarter_header) if quarter_header else None,
            )
            if not date_value:
                continue

            rows.append({
                "date": date_value,
                "value": round(value, 4),
            })

    return rows


if __name__ == "__main__":
    dataset = sys.argv[1]
    path = sys.argv[2]

    if dataset != "generic":
        raise RuntimeError(f"Unsupported dataset: {dataset}")

    print(json.dumps(extract_generic(path)))

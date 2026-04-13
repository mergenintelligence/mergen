import csv
import json
import sys
from zipfile import ZipFile
import xml.etree.ElementTree as ET


NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def parse_number(value):
    if value is None:
        return None
    value = str(value).replace(",", "").strip()
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def extract_vdem(path, country_candidates):
    rows = []
    with open(path, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            country = row.get("country_name") or row.get("country_text_id") or row.get("country")
            year = row.get("year")
            value = parse_number(row.get("v2x_libdem"))
            if country in country_candidates and year and value is not None:
                rows.append({
                    "date": f"{int(float(year))}-12-31",
                    "value": round(value, 4),
                })
    return rows


def read_shared_strings(zip_file):
    if "xl/sharedStrings.xml" not in zip_file.namelist():
        return []
    root = ET.fromstring(zip_file.read("xl/sharedStrings.xml"))
    values = []
    for si in root.findall("a:si", NS):
        text = "".join(node.text or "" for node in si.iterfind(".//a:t", NS))
        values.append(text)
    return values


def xlsx_rows(path):
    with ZipFile(path) as zip_file:
        shared_strings = read_shared_strings(zip_file)
        sheet = ET.fromstring(zip_file.read("xl/worksheets/sheet1.xml"))
        for row in sheet.findall(".//a:sheetData/a:row", NS):
            values = []
            for cell in row.findall("a:c", NS):
                cell_type = cell.get("t")
                value_node = cell.find("a:v", NS)
                value = value_node.text if value_node is not None and value_node.text is not None else ""
                if cell_type == "s" and value != "":
                    value = shared_strings[int(value)]
                values.append(value)
            if any(str(value).strip() for value in values):
                yield values


def extract_whr(path, country_candidates):
    rows_iter = xlsx_rows(path)
    headers = next(rows_iter)
    normalized = [
        str(header).strip().lower().replace("\ufeff", "").replace(" ", "_").replace("-", "_").replace("(", "").replace(")", "").replace("/", "_")
        for header in headers
    ]

    def index_of(candidates):
        for candidate in candidates:
            if candidate in normalized:
                return normalized.index(candidate)
        return None

    country_idx = index_of(["country_name", "country", "country_or_region"])
    year_idx = index_of(["year"])
    value_idx = index_of([
        "life_ladder",
        "ladder_score",
        "happiness_score",
        "life_evaluation_3_year_average",
        "life_evaluation",
    ])

    if country_idx is None or year_idx is None or value_idx is None:
        raise RuntimeError("World Happiness headers are not recognized.")

    rows = []
    for row in rows_iter:
        country = row[country_idx] if country_idx < len(row) else None
        year = row[year_idx] if year_idx < len(row) else None
        value = parse_number(row[value_idx] if value_idx < len(row) else None)
        if country in country_candidates and year and value is not None:
            rows.append({
                "date": f"{int(float(year))}-12-31",
                "value": round(value, 4),
            })
    return rows


def extract_wid(path, country_candidates):
    top10_rows = []
    bottom50_rows = []
    with open(path, newline="", encoding="utf-8") as handle:
        reader = csv.reader(handle, delimiter=";")
        for row in reader:
            if len(row) < 3:
                continue
            percentile = str(row[0]).strip()
            year = str(row[1]).strip()
            value = parse_number(row[2])

            if not year.isdigit() or value is None:
                continue

            payload = {
                "date": f"{int(year)}-12-31",
                "value": round(value, 4),
            }

            if percentile == "p90p100":
                top10_rows.append(payload)
            elif percentile == "p0p50":
                bottom50_rows.append(payload)

    return {
        "WID_TOP10_SHARE": top10_rows,
        "WID_BOTTOM50_SHARE": bottom50_rows,
    }


def extract_cornell(path, country_candidates):
    with open(path, newline="", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        rows = list(reader)

    table_start = None
    year_row = None

    for index, row in enumerate(rows):
        first_cell = row[0].strip() if row and len(row) > 0 else ""
        second_cell = row[1].strip() if row and len(row) > 1 else ""
        if first_cell == "Table 1A":
            table_start = index
        if table_start is not None and second_cell == "2021":
            year_row = row
            data_start = index + 1
            break

    if year_row is None:
        return []

    year_columns = []
    for col_index, cell in enumerate(year_row):
        cell = str(cell).strip()
        if cell.isdigit():
            year_columns.append((col_index, int(cell)))

    totals = {year: 0.0 for _, year in year_columns}
    month_names = {
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    }

    for row in rows[data_start:]:
        label = row[0].strip() if row and len(row) > 0 else ""
        if label not in month_names:
            if label.startswith("Table "):
                break
            continue

        for col_index, year in year_columns:
            if col_index < len(row):
                value = parse_number(row[col_index])
                if value is not None:
                    totals[year] += value

    return [
        {
            "date": f"{year}-12-31",
            "value": round(total, 4),
        }
        for year, total in sorted(totals.items(), reverse=True)
    ]


def extract_mainstream_vote_loss(path, country_candidates):
    rows = []
    with open(path, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        normalized_headers = {
            header: header.strip().lower().replace("\ufeff", "").replace(" ", "_").replace("-", "_")
            for header in reader.fieldnames or []
        }

        def get_value(row, candidates):
            for original, normalized in normalized_headers.items():
                if normalized in candidates:
                    return row.get(original)
            return None

        for row in reader:
            year = get_value(row, {"year", "election_year", "date"})
            value = parse_number(get_value(row, {"vote_loss", "mainstream_vote_loss", "value", "loss"}))
            if year and value is not None:
                year_str = str(year).strip()
                year_num = int(float(year_str[:4])) if len(year_str) >= 4 else int(float(year_str))
                rows.append({
                    "date": f"{year_num}-12-31",
                    "value": round(value, 4),
                })

    return rows


if __name__ == "__main__":
    dataset = sys.argv[1]
    path = sys.argv[2]
    country_candidates = sys.argv[3].split("|")

    if dataset == "vdem":
        print(json.dumps(extract_vdem(path, country_candidates)))
    elif dataset == "whr":
        print(json.dumps(extract_whr(path, country_candidates)))
    elif dataset == "wid":
        print(json.dumps(extract_wid(path, country_candidates)))
    elif dataset == "cornell":
        print(json.dumps(extract_cornell(path, country_candidates)))
    elif dataset == "mainstream_vote_loss":
        print(json.dumps(extract_mainstream_vote_loss(path, country_candidates)))
    else:
        raise RuntimeError(f"Unsupported dataset: {dataset}")

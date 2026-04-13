import json
import sys
from zipfile import ZipFile
import xml.etree.ElementTree as ET


NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def read_shared_strings(zip_file: ZipFile):
    if "xl/sharedStrings.xml" not in zip_file.namelist():
        return []

    root = ET.fromstring(zip_file.read("xl/sharedStrings.xml"))
    values = []
    for si in root.findall("a:si", NS):
        text = "".join(node.text or "" for node in si.iterfind(".//a:t", NS))
        values.append(text)
    return values


def cell_value(cell, shared_strings):
    cell_type = cell.get("t")
    value_node = cell.find("a:v", NS)
    if value_node is None or value_node.text is None:
      return ""

    value = value_node.text
    if cell_type == "s":
        return shared_strings[int(value)]
    return value


def rows_from_sheet(path: str):
    with ZipFile(path) as zip_file:
        shared_strings = read_shared_strings(zip_file)
        sheet = ET.fromstring(zip_file.read("xl/worksheets/sheet1.xml"))
        rows = []

        for row in sheet.findall(".//a:sheetData/a:row", NS):
            values = [cell_value(cell, shared_strings) for cell in row.findall("a:c", NS)]
            if any(str(value).strip() for value in values):
                rows.append(values)

        return rows


if __name__ == "__main__":
    path = sys.argv[1]
    print(json.dumps(rows_from_sheet(path)))

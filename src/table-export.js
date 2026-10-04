// Shared view selection: rendering and export use the same complete result set.
export function selectTableRows({ rows, columns, searches = {}, sort = "", descending = true }) {
  const selected = rows.filter(row => columns.every(key => String(row[key] ?? "").toLowerCase().includes((searches[key] || "").toLowerCase())));
  if (sort) selected.sort((a, b) => {
    const av = a[sort], bv = b[sort];
    if (av === null || av === undefined || av === "") return bv === null || bv === undefined || bv === "" ? 0 : 1;
    if (bv === null || bv === undefined || bv === "") return -1;
    return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true })) * (descending ? -1 : 1);
  });
  return selected;
}

export function serializeCsv(columns, rows) {
  const quote = value => {
    let text = String(value ?? "");
    // Spreadsheet formula injection protection; real numeric negatives stay numeric.
    if (typeof value === "string" && (/^[\s\uFEFF]*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text))) text = "'" + text;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + [columns.map(column => quote(column.label)).join(","),
    ...rows.map(row => columns.map(column => quote(column.value ? column.value(row) : row[column.key])).join(","))].join("\r\n") + "\r\n";
}

export function csvFilename(title, asOf) {
  const name = String(title).normalize("NFKC").replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^[. -]+|[. -]+$/g, "").slice(0, 120) || "table";
  return `${name}-${asOf}.csv`;
}

export function downloadCsv({ title, asOf, columns, rows }) {
  const url = URL.createObjectURL(new Blob([serializeCsv(columns, rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = csvFilename(title, asOf);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

import * as ExcelJS from "exceljs";
import Papa from "papaparse";

/* ---------- Types ---------- */

export type ParsedPricingRow = {
  material_name: string;
  price_date: string; // YYYY-MM-DD
  price: number;
  port: string | null;
};

export type ParseResult = {
  rows: ParsedPricingRow[];
  materials: string[];
  dates: string[];
  warnings: string[];
};

/* ---------- Cell value helpers ---------- */

function getPlainCellValue(value: unknown): unknown {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value !== "object") return value;

  const v = value as Record<string, unknown>;

  // Formula / shared-formula result
  if ("result" in v && v.result !== undefined) {
    return getPlainCellValue(v.result);
  }

  // Rich text
  if (Array.isArray(v.richText)) {
    return (v.richText as any[])
      .map((item) => String(item?.text ?? ""))
      .join("");
  }

  // Hyperlink cell
  if ("text" in v) return v.text;

  // Excel error cell (#REF!, #VALUE!, etc.)
  if ("error" in v) return null;

  return null;
}

function isDateNumberFormat(format: string | undefined): boolean {
  if (!format) return false;
  const normalized = format
    .replace(/"[^"]*"/g, "")
    .replace(/\\./g, "")
    .toLowerCase();
  return /[dy]/.test(normalized) && /m/.test(normalized);
}

function excelSerialToDate(serial: number, date1904: boolean): Date | null {
  if (!Number.isFinite(serial) || serial < 0) return null;
  const days = Math.floor(serial);
  let timestamp: number;
  if (date1904) {
    timestamp = Date.UTC(1904, 0, 1) + days * 86400000;
  } else {
    const adjustedDays = days >= 60 ? days - 1 : days;
    timestamp = Date.UTC(1899, 11, 31) + adjustedDays * 86400000;
  }
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Header cells — apply Excel date-serial conversion when numFmt is a date format.
 */
function getHeaderCellValue(cell: ExcelJS.Cell, date1904: boolean): unknown {
  const value = getPlainCellValue(cell.value);
  if (typeof value === "number" && isDateNumberFormat(cell.numFmt)) {
    return excelSerialToDate(value, date1904) ?? value;
  }
  return value;
}

/**
 * Data cells — no date conversion. Prices stay numbers/strings.
 */
function getDataCellValue(cell: ExcelJS.Cell): unknown {
  return getPlainCellValue(cell.value);
}

/* ---------- Date parsing ---------- */

function toIsoDate(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  else if (y < 1000) y = (y % 100) + 2000;

  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt.toISOString().slice(0, 10);
}

function parseDateCell(raw: unknown): string | null {
  if (raw == null) return null;

  // Date object → UTC getters (ExcelJS returns UTC midnight)
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return toIsoDate(
      raw.getUTCFullYear(),
      raw.getUTCMonth() + 1,
      raw.getUTCDate(),
    );
  }

  // Number → likely an Excel serial date
  if (typeof raw === "number") {
    // Plausible serial range for 2000–2100
    if (raw > 30000 && raw < 80000) {
      const dt = excelSerialToDate(raw, false);
      if (dt) {
        return toIsoDate(
          dt.getUTCFullYear(),
          dt.getUTCMonth() + 1,
          dt.getUTCDate(),
        );
      }
    }
    return null;
  }

  let s = String(raw).trim();
  if (!s) return null;

  // 06.10..25 → 06.10.25
  s = s.replace(/\.{2,}/g, ".");

  let parts = s.split(/[.\-/]/).filter(Boolean);

  // 18.0626 → 18.06.26
  if (parts.length !== 3) {
    const match = s.match(/^(\d{1,4})[.\-/]?(\d{1,2})[.\-/]?(\d{2,4})$/);
    if (!match) return null;
    parts = [match[1], match[2], match[3]];
  }

  if (parts.some((part) => !/^\d+$/.test(part))) return null;

  const nums = parts.map(Number);

  if (nums[0] > 31) return toIsoDate(nums[0], nums[1], nums[2]);
  return toIsoDate(nums[2], nums[1], nums[0]);
}

/* ---------- Price parsing ---------- */

function parsePriceCell(raw: unknown): number | null {
  if (raw == null) return null;

  // A price cell should never legitimately be a Date
  if (raw instanceof Date) return null;

  let s = String(raw).trim();
  if (!s) return null;

  s = s
    .replace(/<br\s*\/?>/gi, "")
    .replace(/,/g, ".")
    .trim();
  if (!s) return null;

  if (s.startsWith("=")) s = s.slice(1);

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/* ---------- Bounds detection (robust against bad dimensions) ---------- */

function detectMaxRow(worksheet: ExcelJS.Worksheet): number {
  let max = Math.max(0, worksheet.rowCount || 0, worksheet.actualRowCount || 0);

  // Scan a buffer past the reported max, bailing after 10 consecutive empties
  let consecutiveEmpty = 0;
  const scanLimit = max + 500;

  for (let r = 1; r <= scanLimit; r++) {
    const cell = worksheet.getRow(r).getCell(1);
    const plain = getPlainCellValue(cell.value);
    const isEmpty = plain == null || String(plain).trim() === "";

    if (isEmpty) {
      consecutiveEmpty++;
      if (consecutiveEmpty > 10 && r > max) break;
    } else {
      consecutiveEmpty = 0;
      if (r > max) max = r;
    }
  }

  return max;
}

function detectMaxCol(
  worksheet: ExcelJS.Worksheet,
  headerRow: ExcelJS.Row,
): number {
  let max = Math.max(
    0,
    worksheet.columnCount || 0,
    worksheet.actualColumnCount || 0,
  );

  // Scan header row for actual last non-empty cell
  const scanLimit = Math.max(max + 50, 500);

  for (let c = 1; c <= scanLimit; c++) {
    const cell = headerRow.getCell(c);
    const plain = getPlainCellValue(cell.value);
    if (plain != null && String(plain).trim() !== "") {
      if (c > max) max = c;
    }
  }

  return max;
}

/* ---------- Grid conversion ---------- */

function buildGrid(
  worksheet: ExcelJS.Worksheet,
  maxRow: number,
  maxCol: number,
  date1904: boolean,
): unknown[][] {
  const grid: unknown[][] = [];

  for (let r = 1; r <= maxRow; r++) {
    const row = worksheet.getRow(r);
    const values: unknown[] = [];

    for (let c = 1; c <= maxCol; c++) {
      const cell = row.getCell(c);
      values.push(
        r === 1 ? getHeaderCellValue(cell, date1904) : getDataCellValue(cell),
      );
    }

    grid.push(values);
  }

  return grid;
}

/* ---------- CSV fallback ---------- */

function csvToGrid(file: File): Promise<unknown[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: false,
      complete: (results) => {
        const grid = (results.data as any[][]).map((row) =>
          Array.isArray(row) ? row.map((c) => c ?? null) : [],
        );
        resolve(grid);
      },
      error: (err: any) =>
        reject(new Error(`CSV parse failed: ${err.message}`)),
    });
  });
}

/* ---------- Main entry ---------- */

export async function parsePricingFile(file: File): Promise<ParseResult> {
  try {
    if (!file) throw new Error("No file selected");

    let grid: unknown[][];

    const isCsv = file.name.toLowerCase().endsWith(".csv");

    if (isCsv) {
      grid = await csvToGrid(file);
    } else {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error("No worksheet found in the Excel file");

      const date1904 = Boolean(workbook.properties.date1904);
      const headerRow = worksheet.getRow(1);

      const maxRow = detectMaxRow(worksheet);
      const maxCol = detectMaxCol(worksheet, headerRow);

      if (maxRow < 2) throw new Error("File has no data rows");
      if (maxCol < 2) throw new Error("File has no date columns");

      grid = buildGrid(worksheet, maxRow, maxCol, date1904);
    }

    if (grid.length < 2) throw new Error("File has no data rows");

    const warnings: string[] = [];
    const header = grid[0];

    if (
      String(header[0] ?? "")
        .trim()
        .toLowerCase() !== "material name"
    ) {
      warnings.push(
        `Column A header is "${header[0] ?? ""}", expected "Material name"`,
      );
    }

    const portCol = header.findIndex(
      (h) =>
        String(h ?? "")
          .trim()
          .toLowerCase() === "port",
    );

    /* ---- 1. Parse header dates ---- */
    const dateCols: { col: number; date: string }[] = [];

    for (let c = 1; c < header.length; c++) {
      if (c === portCol) continue;
      const raw = header[c];
      if (!String(raw ?? "").trim()) continue;

      const date = parseDateCell(raw);
      if (!date) {
        warnings.push(`Skipped unparseable date column "${raw}" at index ${c}`);
        continue;
      }
      dateCols.push({ col: c, date });
    }

    if (!dateCols.length) throw new Error("No valid date columns found");

    /* ---- 2. Keep only dates with at least one price ---- */
    const datesWithData = new Set<string>();

    for (let r = 1; r < grid.length; r++) {
      const row = grid[r];
      if (!row || !String(row[0] ?? "").trim()) continue;

      for (const { col, date } of dateCols) {
        const price = parsePriceCell(row[col]);
        if (price !== null) datesWithData.add(date);
      }
    }

    /* ---- 3. Emit rows ---- */
    const rows: ParsedPricingRow[] = [];
    const materialSet = new Set<string>();

    for (let r = 1; r < grid.length; r++) {
      const row = grid[r];

      const material = String(row[0] ?? "")
        .trim()
        .replace(/\s+/g, " ");

      if (!material) continue;
      materialSet.add(material);

      const port =
        portCol >= 0 ? String(row[portCol] ?? "").trim() || null : null;

      const byDate = new Map<string, number>();

      for (const { col, date } of dateCols) {
        if (!datesWithData.has(date)) continue;

        const price = parsePriceCell(row[col]);

        // Last non-null wins on duplicate dates; only fill 0 if never set
        if (price !== null || !byDate.has(date)) {
          byDate.set(date, price ?? 0);
        }
      }

      for (const [date, price] of byDate) {
        rows.push({ material_name: material, price_date: date, price, port });
      }
    }

    return {
      rows,
      materials: [...materialSet].sort(),
      dates: [...datesWithData].sort(),
      warnings,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Parse failed: ${message}`);
  }
}

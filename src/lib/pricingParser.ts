import * as ExcelJS from "exceljs";

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

/* ---------- Excel cell helpers ---------- */

/**
 * Convert ExcelJS cell values into plain JavaScript values.
 *
 * Supports:
 * - Normal strings and numbers
 * - Date values
 * - Formula results
 * - Rich text
 * - Hyperlinks
 */
function getPlainCellValue(value: unknown): unknown {
  if (value == null) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  const cellValue = value as Record<string, unknown>;

  // Formula or shared formula result
  if ("result" in cellValue) {
    return getPlainCellValue(cellValue.result);
  }

  // Rich text
  if (Array.isArray(cellValue.richText)) {
    return cellValue.richText
      .map((item: any) => String(item?.text ?? ""))
      .join("");
  }

  // Hyperlink
  if ("text" in cellValue) {
    return cellValue.text;
  }

  return null;
}

/**
 * Detect whether an Excel number format represents a date.
 */
function isDateNumberFormat(format: string | undefined): boolean {
  if (!format) return false;

  // Remove quoted text and escaped characters.
  const normalized = format
    .replace(/"[^"]*"/g, "")
    .replace(/\\./g, "")
    .toLowerCase();

  return /[dy]/.test(normalized) && /m/.test(normalized);
}

/**
 * Convert an Excel serial date into a JavaScript Date.
 *
 * Supports both the 1900 and 1904 Excel date systems.
 */
function excelSerialToDate(serial: number, date1904: boolean): Date | null {
  if (!Number.isFinite(serial) || serial < 0) {
    return null;
  }

  const days = Math.floor(serial);

  let timestamp: number;

  if (date1904) {
    timestamp = Date.UTC(1904, 0, 1) + days * 86400000;
  } else {
    // Excel's 1900 date system includes the fictitious
    // February 29, 1900.
    const adjustedDays = days >= 60 ? days - 1 : days;

    timestamp = Date.UTC(1899, 11, 31) + adjustedDays * 86400000;
  }

  const date = new Date(timestamp);

  return isNaN(date.getTime()) ? null : date;
}

/**
 * Read a cell value while respecting Excel date formatting.
 */
function getCellValue(cell: ExcelJS.Cell, date1904: boolean = false): unknown {
  const value = getPlainCellValue(cell.value);

  if (typeof value === "number" && isDateNumberFormat(cell.numFmt)) {
    return excelSerialToDate(value, date1904) ?? value;
  }

  return value;
}

/* ---------- Date parsing ---------- */

function toIsoDate(y: number, m: number, d: number): string | null {
  if (y < 100) {
    y += 2000;
  } else if (y < 1000) {
    y = (y % 100) + 2000;
  }

  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return null;
  }

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

  // ExcelJS may return a real Date object.
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return toIsoDate(raw.getFullYear(), raw.getMonth() + 1, raw.getDate());
  }

  let s = String(raw).trim();

  if (!s) return null;

  // 06.10..25 -> 06.10.25
  s = s.replace(/\.{2,}/g, ".");

  // Standard formats:
  // DD.MM.YY
  // DD.MM.YYYY
  // YYYY-MM-DD
  let parts = s.split(/[.\-/]/).filter(Boolean);

  // Fallback for missing separator:
  // 18.0626 -> 18.06.26
  if (parts.length !== 3) {
    const match = s.match(/^(\d{1,4})[.\-/]?(\d{1,2})[.\-/]?(\d{2,4})$/);

    if (!match) return null;

    parts = [match[1], match[2], match[3]];
  }

  if (parts.some((part) => !/^\d+$/.test(part))) {
    return null;
  }

  const nums = parts.map(Number);

  // If first value is a 4-digit year:
  // YYYY-MM-DD
  // Otherwise:
  // DD.MM.YY or DD.MM.YYYY
  if (nums[0] > 31) {
    return toIsoDate(nums[0], nums[1], nums[2]);
  }

  return toIsoDate(nums[2], nums[1], nums[0]);
}

/* ---------- Price parsing ---------- */

function parsePriceCell(raw: unknown): number | null {
  if (raw == null) return null;

  let s = String(raw).trim();

  if (!s) return null;

  s = s
    .replace(/<br\s*\/?>/gi, "")
    .replace(/,/g, ".")
    .trim();

  if (!s) return null;

  // =71 -> 71
  if (s.startsWith("=")) {
    s = s.slice(1);
  }

  const n = parseFloat(s);

  return Number.isFinite(n) ? n : null;
}

/* ---------- Main entry ---------- */

export async function parsePricingFile(file: File): Promise<ParseResult> {
  try {
    if (!file) {
      throw new Error("No file selected");
    }

    const workbook = new ExcelJS.Workbook();

    // Read the uploaded Excel file in the browser.
    const buffer = await file.arrayBuffer();

    await workbook.xlsx.load(buffer);

    // Use the first worksheet.
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new Error("No worksheet found in the Excel file");
    }

    const date1904 = Boolean(workbook.properties.date1904);

    const rowCount = worksheet.rowCount;
    const columnCount = worksheet.columnCount;

    if (rowCount < 2) {
      throw new Error("File has no data rows");
    }

    /* ---------- Convert worksheet into a 2D grid ---------- */

    const grid: unknown[][] = [];

    for (let r = 1; r <= rowCount; r++) {
      const row = worksheet.getRow(r);

      const values: unknown[] = [];

      for (let c = 1; c <= columnCount; c++) {
        values.push(getCellValue(row.getCell(c), date1904));
      }

      grid.push(values);
    }

    if (grid.length < 2) {
      throw new Error("File has no data rows");
    }

    const warnings: string[] = [];

    const header = grid[0];

    /* ---------- Validate material name header ---------- */

    if (
      String(header[0] ?? "")
        .trim()
        .toLowerCase() !== "material name"
    ) {
      warnings.push(
        `Column A header is "${header[0] ?? ""}", expected "Material name"`,
      );
    }

    /* ---------- Find port column ---------- */

    const portCol = header.findIndex(
      (h) =>
        String(h ?? "")
          .trim()
          .toLowerCase() === "port",
    );

    /* ---------- 1. Parse every header date ---------- */

    const dateCols: {
      col: number;
      date: string;
    }[] = [];

    for (let c = 1; c < header.length; c++) {
      // Ignore the port column.
      if (c === portCol) continue;

      const raw = header[c];

      if (!String(raw ?? "").trim()) {
        continue;
      }

      const date = parseDateCell(raw);

      if (!date) {
        warnings.push(`Skipped unparseable date column "${raw}" at index ${c}`);

        continue;
      }

      dateCols.push({
        col: c,
        date,
      });
    }

    if (!dateCols.length) {
      throw new Error("No valid date columns found");
    }

    /* ---------- 2. Find dates having at least one price ---------- */

    const datesWithData = new Set<string>();

    for (let r = 1; r < grid.length; r++) {
      const row = grid[r];

      if (!row || !String(row[0] ?? "").trim()) {
        continue;
      }

      for (const { col, date } of dateCols) {
        const price = parsePriceCell(row[col]);

        if (price !== null) {
          datesWithData.add(date);
        }
      }
    }

    /* ---------- 3. Generate pricing rows ---------- */

    const rows: ParsedPricingRow[] = [];

    const materialSet = new Set<string>();

    for (let r = 1; r < grid.length; r++) {
      const row = grid[r];

      // Material name:
      // Trim + collapse internal whitespace.
      const material = String(row[0] ?? "")
        .trim()
        .replace(/\s+/g, " ");

      if (!material) {
        continue;
      }

      materialSet.add(material);

      // Port extraction.
      const port =
        portCol >= 0 ? String(row[portCol] ?? "").trim() || null : null;

      /* ---------- Dedupe by date ---------- */

      const byDate = new Map<string, number>();

      for (const { col, date } of dateCols) {
        // Ignore dates that have no prices anywhere.
        if (!datesWithData.has(date)) {
          continue;
        }

        const price = parsePriceCell(row[col]);

        // Preserve existing behavior:
        // Last non-null price wins for duplicate dates.
        // If every value is blank, use 0.
        if (price !== null || !byDate.has(date)) {
          byDate.set(date, price ?? 0);
        }
      }

      /* ---------- Emit parsed rows ---------- */

      for (const [date, price] of byDate) {
        rows.push({
          material_name: material,
          price_date: date,
          price,
          port,
        });
      }
    }

    /* ---------- 4. Return result ---------- */

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

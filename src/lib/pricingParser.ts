import * as XLSX from "xlsx";

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

/* ---------- Date parsing ---------- */
function toIsoDate(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  else if (y < 1000) y = (y % 100) + 2000; // 225 → 2025, 126 → 2026
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  )
    return null;
  return dt.toISOString().slice(0, 10);
}

function parseDateCell(raw: any): string | null {
  if (raw == null) return null;

  // SheetJS may give us a real Date (cellDates: true)
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return toIsoDate(raw.getFullYear(), raw.getMonth() + 1, raw.getDate());
  }

  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/\.{2,}/g, "."); // 06.10..25 → 06.10.25

  // Standard split: DD.MM.YY / DD.MM.YYYY / YYYY-MM-DD
  let parts = s.split(/[.\-/]/).filter(Boolean);

  // Fallback for missing separator: 18.0626
  if (parts.length !== 3) {
    const m = s.match(/^(\d{1,4})[.\-/]?(\d{1,2})[.\-/]?(\d{2,4})$/);
    if (!m) return null;
    parts = [m[1], m[2], m[3]];
  }
  if (parts.some((p) => !/^\d+$/.test(p))) return null;

  const nums = parts.map(Number);
  // If first is 4-digit → YYYY-MM-DD, else DD.MM.YY(YY)
  if (nums[0] > 31) return toIsoDate(nums[0], nums[1], nums[2]);
  return toIsoDate(nums[2], nums[1], nums[0]);
}

/* ---------- Price parsing ---------- */
function parsePriceCell(raw: any): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s
    .replace(/<br\s*\/?>/gi, "")
    .replace(/,/g, ".")
    .trim();
  if (!s) return null;
  if (s.startsWith("=")) s = s.slice(1); // =71 → 71
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}

/* ---------- Main entry ---------- */
export function parsePricingFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const grid: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: true,
          defval: null,
        });

        if (grid.length < 2) return reject(new Error("File has no data rows"));

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
          (h: any) =>
            String(h ?? "")
              .trim()
              .toLowerCase() === "port",
        );

        // ---- 1. Parse every header date ----
        const dateCols: { col: number; date: string }[] = [];
        for (let c = 1; c < header.length; c++) {
          if (c === portCol) continue;
          const raw = header[c];
          if (!String(raw ?? "").trim()) continue;
          const d = parseDateCell(raw);
          if (!d) {
            warnings.push(
              `Skipped unparseable date column "${raw}" at index ${c}`,
            );
            continue;
          }
          dateCols.push({ col: c, date: d });
        }
        if (!dateCols.length)
          return reject(new Error("No valid date columns found"));

        // ---- 2. Keep ONLY dates that have at least one non-blank price ----
        // This removes empty / typo / garbage date columns from the header.
        const datesWithData = new Set<string>();
        for (let r = 1; r < grid.length; r++) {
          const row = grid[r];
          if (!row || !String(row[0] ?? "").trim()) continue;
          for (const { col, date } of dateCols) {
            if (parsePriceCell(row[col]) !== null) datesWithData.add(date);
          }
        }

        // ---- 3. Emit rows: only active dates, blanks become 0 ----
        const rows: ParsedPricingRow[] = [];
        const materialSet = new Set<string>();

        for (let r = 1; r < grid.length; r++) {
          const row = grid[r];
          // Material name: trim + collapse internal whitespace, KEEP all other chars
          const material = String(row[0] ?? "")
            .trim()
            .replace(/\s+/g, " ");
          if (!material) continue;
          materialSet.add(material);

          const port =
            portCol >= 0 ? String(row[portCol] ?? "").trim() || null : null;

          // Dedupe by date: last non-null wins; blanks become 0 only if no data anywhere
          const byDate = new Map<string, number>();
          for (const { col, date } of dateCols) {
            if (!datesWithData.has(date)) continue;
            const p = parsePriceCell(row[col]);
            if (p !== null || !byDate.has(date)) {
              byDate.set(date, p ?? 0);
            }
          }

          for (const [date, price] of byDate) {
            rows.push({
              material_name: material,
              price_date: date,
              price,
              port,
            });
          }
        }

        resolve({
          rows,
          materials: [...materialSet].sort(),
          dates: [...datesWithData].sort(),
          warnings,
        });
      } catch (err: any) {
        reject(new Error(`Parse failed: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsArrayBuffer(file);
  });
}

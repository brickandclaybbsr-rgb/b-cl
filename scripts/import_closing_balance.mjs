import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wb = XLSX.readFile(path.join(__dirname, "..", "Assets", "CLOSING BALANCE 2026.xlsx"));

const COL = {
  cash: 1, card: 3, upi: 5, zo_goid: 7,
  zomato: 9, swiggy: 11, swiggy_din: 13, eazy_diner: 15,
};

function num(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  if (!cell) return 0;
  const v = parseFloat(String(cell.v ?? "").replace(/,/g, ""));
  return isNaN(v) ? 0 : v;
}
function str(ws, r, c) {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  return cell ? String(cell.v ?? "").trim() : "";
}

// Parse each sheet into a daily sales record
const rows = [];

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];

  const openingCash  = num(ws, 1, COL.cash);
  const cashSale     = num(ws, 2, COL.cash);

  // Platform values can appear on R2 or R3 — take whichever is non-zero
  const pv = (col) => num(ws, 1, col) || num(ws, 2, col);
  const card      = pv(COL.card);
  const upi       = pv(COL.upi);
  const zoGoid    = pv(COL.zo_goid);
  const zomato    = pv(COL.zomato);
  const swiggy    = pv(COL.swiggy);
  const swiggyDin = pv(COL.swiggy_din);
  const eazyDiner = pv(COL.eazy_diner);

  const closingBalance = num(ws, 20, COL.cash);

  const onlineSales     = card + upi;
  const aggregatorSales = zoGoid + zomato + swiggy + swiggyDin + eazyDiner;
  const totalSale       = cashSale + onlineSales + aggregatorSales;

  // Skip days with no actual sales
  if (totalSale === 0) continue;

  // Convert sheet name DD-MM-YYYY → YYYY-MM-DD
  const [dd, mm, yyyy] = sheetName.split("-");
  const date = `${yyyy}-${mm}-${dd}`;

  const notes = `Opening: ₹${openingCash} | Closing: ₹${closingBalance} | Card: ₹${card} | UPI: ₹${upi} | ZoGoId: ₹${zoGoid} | Zomato: ₹${zomato} | Swiggy: ₹${swiggy} | SwiggyDin: ₹${swiggyDin} | EazyDiner: ₹${eazyDiner}`;

  rows.push({ date, cashSale, onlineSales, aggregatorSales, notes });
}

console.log(`Parsed ${rows.length} days of sales data:`);
rows.forEach(r => console.log(`  ${r.date}  cash:${r.cashSale}  online:${r.onlineSales}  aggregator:${r.aggregatorSales}`));

// Generate SQL
const lines = [
  `-- ═══════════════════════════════════════════════════════════════════════`,
  `-- Brick & Clay — Historical Sales Import from Closing Balance Excel`,
  `-- June 2026 (${rows.length} days)`,
  `-- cash_sales = Cash Sale`,
  `-- online_sales = Card + UPI`,
  `-- aggregator_sales = ZoGoId + Zomato + Swiggy + SwiggyDin + EazyDiner`,
  `-- Run in Supabase SQL Editor`,
  `-- ═══════════════════════════════════════════════════════════════════════`,
  ``,
  `DO $$`,
  `DECLARE`,
  `  v_owner_id uuid;`,
  `BEGIN`,
  `  SELECT id INTO v_owner_id FROM public.profiles WHERE role = 'owner' LIMIT 1;`,
  `  IF v_owner_id IS NULL THEN`,
  `    RAISE EXCEPTION 'Owner profile not found';`,
  `  END IF;`,
  ``,
];

for (const r of rows) {
  lines.push(
    `  INSERT INTO public.daily_sales (date, submitted_by, cash_sales, online_sales, aggregator_sales, total_bills, discount_amount, complimentary_count, complimentary_value, notes)` +
    ` VALUES ('${r.date}', v_owner_id, ${r.cashSale}, ${r.onlineSales}, ${r.aggregatorSales}, 0, 0, 0, 0, '${r.notes.replace(/'/g, "''")}')` +
    ` ON CONFLICT (date) DO UPDATE SET` +
    ` cash_sales = EXCLUDED.cash_sales,` +
    ` online_sales = EXCLUDED.online_sales,` +
    ` aggregator_sales = EXCLUDED.aggregator_sales,` +
    ` notes = EXCLUDED.notes,` +
    ` submitted_by = EXCLUDED.submitted_by;`
  );
}

lines.push(``);
lines.push(`  RAISE NOTICE 'Done — imported ${rows.length} days of sales data';`);
lines.push(`END $$;`);

const sql = lines.join("\n");
const outPath = path.join(__dirname, "import_sales.sql");
fs.writeFileSync(outPath, sql, "utf8");
console.log(`\nSQL written to: scripts/import_sales.sql`);

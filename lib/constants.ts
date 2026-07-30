/**
 * Default master data. These mirror the SQL seed in supabase/seed.sql and are
 * used as fallbacks so screens render sensibly even before the owner customises
 * checklists / stock items in Settings.
 */

/** Earliest business date — the day the app went live. Used as the backfill window start. */
export const APP_START_DATE = "2026-06-14";

/**
 * QR + geofence attendance rollout. Before this date the check-in gate is
 * dormant (staff use the app normally); on/after it, staff must scan an outlet
 * QR within its geofence before they can use the app for the day.
 */
export const ATTENDANCE_ROLLOUT_DATE = "2026-07-31";

export type ChecklistType = "opening" | "closing";

export interface ChecklistItemDef {
  section: string;
  label: string;
}

export const OPENING_CHECKLIST: ChecklistItemDef[] = [
  { section: "Kitchen", label: "Gas cylinders checked" },
  { section: "Kitchen", label: "Wood fire oven preheated" },
  { section: "Kitchen", label: "Prep ingredients stocked (dough, sauce, toppings)" },
  { section: "Kitchen", label: "Refrigerator temperatures checked" },
  { section: "Kitchen", label: "All utensils clean and in place" },
  { section: "Kitchen", label: "Exhaust fans working" },
  { section: "Front Desk / Dining", label: "POS system (Petpooja) turned on and working" },
  { section: "Front Desk / Dining", label: "Dining area cleaned and tables set" },
  { section: "Front Desk / Dining", label: "Menu cards placed" },
  { section: "Front Desk / Dining", label: "AC / fans working" },
  { section: "Front Desk / Dining", label: "Music system on" },
  { section: "Front Desk / Dining", label: "Entry area clean" },
  { section: "Staff", label: "All scheduled staff present" },
  { section: "Staff", label: "Uniforms on" },
];

export const CLOSING_CHECKLIST: ChecklistItemDef[] = [
  { section: "Kitchen", label: "Gas valves closed" },
  { section: "Kitchen", label: "Oven cleaned and shut down" },
  { section: "Kitchen", label: "All perishables stored properly" },
  { section: "Kitchen", label: "Leftover food labeled and refrigerated" },
  { section: "Kitchen", label: "Kitchen surfaces cleaned" },
  { section: "Kitchen", label: "Exhaust fans cleaned" },
  { section: "Kitchen", label: "Trash taken out" },
  { section: "Front Desk / Dining", label: "POS system closed and billing reconciled" },
  { section: "Front Desk / Dining", label: "Dining area cleaned" },
  { section: "Front Desk / Dining", label: "Tables wiped and chairs stacked" },
  { section: "Front Desk / Dining", label: "AC / fans off" },
  { section: "Front Desk / Dining", label: "All lights off" },
  { section: "Front Desk / Dining", label: "Entry locked" },
];

export const SEED_STOCK_ITEMS: { name: string; category: string }[] = [
  { name: "Mozzarella Cheese", category: "Dairy" },
  { name: "Pizza Dough", category: "Base" },
  { name: "Tomato Sauce", category: "Base" },
  { name: "Olive Oil", category: "Base" },
  { name: "Wood (Fuel)", category: "Fuel" },
  { name: "Bell Peppers", category: "Vegetables" },
  { name: "Onions", category: "Vegetables" },
  { name: "Mushrooms", category: "Vegetables" },
  { name: "Chicken", category: "Toppings" },
  { name: "Paneer", category: "Toppings" },
  { name: "Sweet Corn", category: "Toppings" },
  { name: "Olives", category: "Toppings" },
  { name: "Jalapeños", category: "Toppings" },
  { name: "Chili Flakes", category: "Seasoning" },
  { name: "Oregano", category: "Seasoning" },
  { name: "Disposable Boxes", category: "Packaging" },
  { name: "Tissue Paper", category: "Packaging" },
  { name: "Packaging Material", category: "Packaging" },
  { name: "Cold Drinks / Beverages", category: "Beverages" },
  { name: "Water Bottles", category: "Beverages" },
];

export type StockStatus = "available" | "low" | "out";

export const STOCK_STATUS_META: Record<
  StockStatus,
  { label: string; icon: string; tone: "success" | "warning" | "danger" }
> = {
  available: { label: "Available", icon: "✅", tone: "success" },
  low: { label: "Low", icon: "⚠️", tone: "warning" },
  out: { label: "Out", icon: "❌", tone: "danger" },
};

export const URGENCY = ["normal", "urgent"] as const;
export const ORDER_STATUS = ["pending", "placed", "received"] as const;
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

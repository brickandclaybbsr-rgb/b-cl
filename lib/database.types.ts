/**
 * Hand-maintained types mirroring supabase/schema.sql.
 * If you later run `supabase gen types typescript`, you can replace this file.
 *
 * NOTE: row shapes are declared with `type` (not `interface`) on purpose —
 * supabase-js requires each table Row to be assignable to
 * `Record<string, unknown>`, and only type-aliases get an implicit index
 * signature. Using `interface` here silently breaks query result typing.
 */

export type Role = "owner" | "staff" | "inventory_manager";
export type Urgency = "normal" | "urgent";
export type OrderStatus = "pending" | "placed" | "received";
export type ReportStatus = "sent" | "failed";
export type StockStatusValue = "available" | "low" | "out";

/** Shape of a single checklist line as stored in the `items` JSONB column. */
export type ChecklistLine = {
  section: string;
  label: string;
  checked: boolean;
  note?: string;
};

/** Shape of a single stock line as stored in the `items` JSONB column. */
export type StockLine = {
  item_id: string;
  item_name: string;
  status: StockStatusValue;
  current_qty?: number;
  current_unit?: string;
  qty_required?: number;
  qty_required_unit?: string;
  needed_by_date?: string;
  needed_by_time?: string;
  note?: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  is_active: boolean;
  biometric_pin: string | null;
  biometric_name: string | null;
  created_at: string;
  employee_code?: string | null;
  dob?: string | null;
  aadhar_number?: string | null;
  pan_number?: string | null;
  basic_pay?: number | null;
  paid_through?: string | null;
  personal_email?: string | null;
  phone_number?: string | null;
  address?: string | null;
  designation?: string | null;
  date_of_joining?: string | null;
  work_location?: string | null;
  working_hours?: string | null;
  employment_type?: string | null;
  reporting_authority?: string | null;
  signature_url?: string | null;
  fcm_token?: string | null;
  team?: "kitchen" | "front_desk" | "head_chef" | null;
  /** Outlet this employee is assigned to. Null = may mark attendance anywhere. */
  outlet_id?: string | null;
  /** Paid daily in cash, no app attendance/checklists (house helpers). */
  is_house_helper?: boolean;
};

export type OpeningChecklist = {
  id: string;
  date: string;
  team: string;
  submitted_by: string | null;
  items: ChecklistLine[];
  opening_cash: number | null;
  cash_discrepancy: number | null;
  cash_discrepancy_reason: string | null;
  absent_staff: string | null;
  notes: string | null;
  photo_url: string | null;
  submitted_at: string;
};

export type ClosingChecklist = {
  id: string;
  date: string;
  team: string;
  submitted_by: string | null;
  items: ChecklistLine[];
  closing_cash: number | null;
  cash_deposited: number | null;
  discrepancy_notes: string | null;
  closing_stock_updated: boolean;
  notes: string | null;
  photo_url: string | null;
  submitted_at: string;
};

export type DailySales = {
  id: string;
  date: string;
  submitted_by: string | null;
  opening_cash: number;
  cash_sales: number;
  card_sales: number;
  upi_sales: number;
  online_sales: number;
  zomato_gold_sales: number;
  zomato_sales: number;
  swiggy_sales: number;
  swiggy_dineout_sales: number;
  eazy_diner_sales: number;
  aggregator_sales: number;
  closing_balance: number;
  total_bills: number;
  discount_amount: number;
  complimentary_count: number;
  complimentary_value: number;
  notes: string | null;
  submitted_at: string;
};

export type StockItem = {
  id: string;
  name: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  min_qty: number | null;
  min_unit: string | null;
  price_per_unit: number | null;
};

export type StockSnapshot = {
  id: string;
  date: string;
  submitted_by: string | null;
  items: StockLine[];
  submitted_at: string;
};

export type Vendor = {
  id: string;
  name: string;
  contact: string | null;
  supply_category: string | null;
  order_days: string | null;
  is_active: boolean;
};

export type VendorOrder = {
  id: string;
  vendor_id: string | null;
  raised_by: string | null;
  items: string;
  urgency: Urgency;
  status: OrderStatus;
  notes: string | null;
  raised_at: string;
  updated_at: string;
};

export type ChecklistItemConfig = {
  id: string;
  type: "opening" | "closing";
  section: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

export type EodReport = {
  id: string;
  date: string;
  report_text: string | null;
  sent_to: string | null;
  sent_at: string;
  status: ReportStatus;
};

export type AppSetting = {
  key: string;
  value: string | null;
  updated_at: string;
};

export type Purchase = {
  id: string;
  vendor_id: string | null;
  submitted_by: string | null;
  items: string;
  amount: number;
  bill_url: string | null;
  notes: string | null;
  purchased_at: string;
};

export type Reimbursement = {
  id: string;
  submitted_by: string;
  amount: number;
  purpose: string;
  receipt_url: string | null;
  status: "pending" | "approved" | "rejected" | "paid";
  notes: string | null;
  submitted_at: string;
  processed_by: string | null;
  processed_at: string | null;
};

export type AttendancePunch = {
  id: string;
  profile_id: string;
  pin: string;
  name: string;
  date: string;
  time: string;
  status: string | null;
  dept_name: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type StaffLeave = {
  id: string;
  profile_id: string;
  leave_type: "cl" | "sl" | "lwp";
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  submitted_at: string;
  processed_by: string | null;
  processed_at: string | null;
};

export type StaffDocument = {
  id: string;
  profile_id: string;
  type: "appointment_letter" | "salary_slip" | "aadhar_card" | "pan_card";
  month: string | null;
  file_url: string;
  file_name: string;
  uploaded_by: string | null;
  uploaded_at: string;
  is_visible_to_staff: boolean;
  // Populated when a salary slip is finalized — surfaced on the employee's card.
  payment_date: string | null;
  payment_reference: string | null;
  payment_mode: string | null;
  amount_paid: number | null;
};

export type PayrollAdvance = {
  id: string;
  profile_id: string;
  month: string;        // YYYY-MM
  amount: number;
  notes: string | null;
  advance_date: string | null; // YYYY-MM-DD
  recorded_by: string | null;
  created_at: string;
};

export type CashExpense = {
  id: string;
  date: string;
  person_name: string;
  amount: number;
  category: "withdrawal" | "advance" | "expense" | "other" | "deposit";
  notes: string | null;
  submitted_by: string | null;
  submitted_at: string;
};

export type Outlet = {
  id: string;
  name: string;
  qr_token: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  is_active: boolean;
  created_at: string;
};

export type AttendanceCheckin = {
  id: string;
  profile_id: string;
  outlet_id: string | null;
  date: string;         // IST business date, yyyy-MM-dd
  checked_in_at: string;
  latitude: number | null;
  longitude: number | null;
  distance_m: number | null;
  created_at: string;
  checked_out_at: string | null;
  checkout_latitude: number | null;
  checkout_longitude: number | null;
  checkout_distance_m: number | null;
};

/**
 * A typed QR code. One universal scanner resolves a scanned token to a row
 * here and dispatches on `qr_type`, so new QR workflows are added as data
 * (from the admin panel) rather than as scanner code changes.
 */
export type QrType =
  | "attendance"
  | "review"
  | "training"
  | "survey"
  | "task";

export type QrCode = {
  id: string;
  token: string;
  qr_type: string;      // QrType, but kept open so new types need no code change
  label: string;
  action: string | null;
  outlet_id: string | null;
  metadata: Record<string, unknown>;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
};

/** A table definition in the shape supabase-js expects (incl. Relationships). */
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

/** Minimal Database generic so the typed Supabase client compiles. */
export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile>;
      opening_checklists: Table<OpeningChecklist>;
      closing_checklists: Table<ClosingChecklist>;
      daily_sales: Table<DailySales>;
      stock_items: Table<StockItem>;
      stock_snapshots: Table<StockSnapshot>;
      vendors: Table<Vendor>;
      vendor_orders: Table<VendorOrder>;
      checklist_items: Table<ChecklistItemConfig>;
      eod_reports: Table<EodReport>;
      app_settings: Table<AppSetting>;
      purchases: Table<Purchase>;
      reimbursements: Table<Reimbursement>;
      attendance_punches: Table<AttendancePunch>;
      leaves: Table<StaffLeave>;
      staff_documents: Table<StaffDocument>;
      payroll_advances: Table<PayrollAdvance>;
      cash_expenses: Table<CashExpense>;
      outlets: Table<Outlet>;
      attendance_checkins: Table<AttendanceCheckin>;
      qr_codes: Table<QrCode>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

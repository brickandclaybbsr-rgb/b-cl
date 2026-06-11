// ─────────────────────────────────────────────────────────────────────────
//  Petpooja integration — PHASE 2 PLACEHOLDER
// ─────────────────────────────────────────────────────────────────────────
//  When API credentials are available:
//   - Auto-import daily sales from Petpooja
//   - Match with manually entered data for reconciliation
//   - Pull item-wise sales for inventory deduction
// ─────────────────────────────────────────────────────────────────────────

export interface PetpoojaSales {
  date: string;
  cash: number;
  online: number;
  aggregator: number;
  bills: number;
}

export async function fetchPetpoojaData(_date: string): Promise<PetpoojaSales> {
  // PLACEHOLDER — implement when API access is confirmed.
  throw new Error("Petpooja integration not yet configured");
}

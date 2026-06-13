-- ═══════════════════════════════════════════════════════════════════════
-- Backfill individual platform columns from imported notes field
-- Notes format: "Opening: ₹X | Closing: ₹X | Card: ₹X | UPI: ₹X |
--               ZomatoGold: ₹X | Zomato: ₹X | Swiggy: ₹X |
--               SwiggyDin: ₹X | EazyDiner: ₹X"
-- ═══════════════════════════════════════════════════════════════════════

UPDATE public.daily_sales
SET
  opening_cash         = COALESCE((regexp_match(notes, 'Opening: [^0-9]*([0-9.]+)'))[1]::numeric, 0),
  closing_balance      = COALESCE((regexp_match(notes, 'Closing: [^0-9]*([0-9.]+)'))[1]::numeric, 0),
  card_sales           = COALESCE((regexp_match(notes, 'Card: [^0-9]*([0-9.]+)'))[1]::numeric, 0),
  upi_sales            = COALESCE((regexp_match(notes, 'UPI: [^0-9]*([0-9.]+)'))[1]::numeric, 0),
  -- Handle both old label (ZoGoId) and new label (ZomatoGold)
  zomato_gold_sales    = COALESCE(
                           (regexp_match(notes, 'ZomatoGold: [^0-9]*([0-9.]+)'))[1]::numeric,
                           (regexp_match(notes, 'ZoGoId: [^0-9]*([0-9.]+)'))[1]::numeric,
                           0
                         ),
  -- Use "| Zomato: " (pipe prefix) to avoid matching ZomatoGold
  zomato_sales         = COALESCE((regexp_match(notes, '\| Zomato: [^0-9]*([0-9.]+)'))[1]::numeric, 0),
  -- Use "| Swiggy: " (pipe prefix) to avoid matching SwiggyDin
  swiggy_sales         = COALESCE((regexp_match(notes, '\| Swiggy: [^0-9]*([0-9.]+)'))[1]::numeric, 0),
  swiggy_dineout_sales = COALESCE((regexp_match(notes, 'SwiggyDin: [^0-9]*([0-9.]+)'))[1]::numeric, 0),
  eazy_diner_sales     = COALESCE((regexp_match(notes, 'EazyDiner: [^0-9]*([0-9.]+)'))[1]::numeric, 0)
WHERE notes LIKE 'Opening:%';

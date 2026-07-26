-- 20260726000002_quote_requests_extraction_fields.sql
-- More broker write-surface columns the CRM-light table lacked (companion to 20260726000001).
-- broker-tick's extraction patch writes missing_info / internal_action_needed (string|null from
-- the LLM extractor), and the deliver step writes delivered_at — without these the RESPONDED→QUOTED
-- →DELIVERED transitions PATCH-failed (PGRST204) and the quote never reached the customer.
alter table public.quote_requests
  add column if not exists missing_info            text,
  add column if not exists internal_action_needed  text,
  add column if not exists delivered_at            timestamptz;

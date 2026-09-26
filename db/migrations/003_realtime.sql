-- ============================================================
-- Migration 003: Enable Supabase Realtime on specific tables
--
-- Only tables that drive live UI get realtime enabled.
-- Do NOT enable it on every table — it adds unnecessary load.
-- ============================================================

-- Enable realtime publication for kitchen and order tracking
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table deliveries;
alter publication supabase_realtime add table table_sessions;

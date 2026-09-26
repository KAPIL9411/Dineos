-- ============================================================
-- Migration 002: Row Level Security policies
--
-- Strategy: Application code uses the service-role client for
-- all privileged mutations (enforcing tenant isolation itself).
-- RLS here acts as defense-in-depth for the anon/user client.
--
-- Public access: restaurant page + menu (read-only, is_active guard).
-- Authenticated staff: scoped to their own restaurant via staff table.
-- ============================================================

-- Enable RLS on all tenant-owned tables
alter table restaurants    enable row level security;
alter table staff           enable row level security;
alter table categories      enable row level security;
alter table products        enable row level security;
alter table tables          enable row level security;
alter table table_sessions  enable row level security;
alter table customers       enable row level security;
alter table addresses       enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table payments        enable row level security;
alter table deliveries      enable row level security;
alter table audit_logs      enable row level security;

-- ─── Helper function: resolve current user's restaurant_id ────────────────────
-- Returns the restaurant_id linked to the authenticated Supabase user.
-- Used in RLS policies so they stay readable.

create or replace function current_restaurant_id()
returns uuid language sql security definer stable as $$
  select restaurant_id from staff
  where user_id = auth.uid() and is_active = true
  limit 1;
$$;

create or replace function current_tenant_id()
returns uuid language sql security definer stable as $$
  select tenant_id from staff
  where user_id = auth.uid() and is_active = true
  limit 1;
$$;

-- ─── restaurants ─────────────────────────────────────────────────────────────

-- Anyone can read active restaurants (for the public menu page)
create policy "public_read_active_restaurants"
  on restaurants for select
  using (is_active = true);

-- Staff can read/update their own restaurant
create policy "staff_read_own_restaurant"
  on restaurants for select
  using (id = current_restaurant_id());

create policy "staff_update_own_restaurant"
  on restaurants for update
  using (id = current_restaurant_id());

-- ─── categories ──────────────────────────────────────────────────────────────

-- Public can read active categories of active restaurants
create policy "public_read_active_categories"
  on categories for select
  using (
    is_active = true
    and exists (
      select 1 from restaurants r
      where r.id = categories.restaurant_id and r.is_active = true
    )
  );

-- Staff scoped to their restaurant
create policy "staff_manage_categories"
  on categories for all
  using (restaurant_id = current_restaurant_id());

-- ─── products ────────────────────────────────────────────────────────────────

create policy "public_read_available_products"
  on products for select
  using (
    is_available = true
    and exists (
      select 1 from restaurants r
      where r.id = products.restaurant_id and r.is_active = true
    )
  );

create policy "staff_manage_products"
  on products for all
  using (restaurant_id = current_restaurant_id());

-- ─── tables ──────────────────────────────────────────────────────────────────

create policy "staff_manage_tables"
  on tables for all
  using (restaurant_id = current_restaurant_id());

-- ─── table_sessions ──────────────────────────────────────────────────────────

-- Public insert for QR scan (session is created by anon user scanning QR)
create policy "public_create_table_session"
  on table_sessions for insert
  with check (true);

-- Public read for their own session (by ID — enforced at app layer)
create policy "public_read_table_session"
  on table_sessions for select
  using (true);

create policy "staff_manage_table_sessions"
  on table_sessions for all
  using (restaurant_id = current_restaurant_id());

-- ─── customers ───────────────────────────────────────────────────────────────

-- Customers can read/update their own row (authenticated only)
create policy "customer_read_own"
  on customers for select
  using (user_id = auth.uid());

create policy "customer_update_own"
  on customers for update
  using (user_id = auth.uid());

-- Anon insert for guest customer creation
create policy "anon_create_customer"
  on customers for insert
  with check (true);

-- Staff can read customers in their tenant (for order management)
create policy "staff_read_customers"
  on customers for select
  using (
    exists (
      select 1 from orders o
      where o.customer_id = customers.id
        and o.restaurant_id = current_restaurant_id()
    )
  );

-- ─── addresses ───────────────────────────────────────────────────────────────

create policy "customer_manage_own_addresses"
  on addresses for all
  using (
    customer_id in (
      select id from customers where user_id = auth.uid()
    )
  );

create policy "anon_create_address"
  on addresses for insert
  with check (true);

-- ─── orders ──────────────────────────────────────────────────────────────────

-- Customers read their own orders (app layer further scopes by customer_id cookie)
create policy "customer_read_own_orders"
  on orders for select
  using (
    customer_id in (
      select id from customers where user_id = auth.uid()
    )
  );

-- Anon can create orders (guest checkout)
create policy "anon_create_order"
  on orders for insert
  with check (true);

-- Staff can read/update orders in their restaurant
create policy "staff_manage_orders"
  on orders for all
  using (restaurant_id = current_restaurant_id());

-- ─── order_items ─────────────────────────────────────────────────────────────

create policy "anon_create_order_items"
  on order_items for insert
  with check (true);

create policy "read_order_items"
  on order_items for select
  using (
    tenant_id = current_tenant_id()
    or order_id in (
      select id from orders o
      where o.customer_id in (
        select id from customers where user_id = auth.uid()
      )
    )
  );

-- ─── payments ────────────────────────────────────────────────────────────────

create policy "staff_manage_payments"
  on payments for all
  using (tenant_id = current_tenant_id());

-- ─── deliveries ──────────────────────────────────────────────────────────────

create policy "staff_manage_deliveries"
  on deliveries for all
  using (tenant_id = current_tenant_id());

-- ─── audit_logs ──────────────────────────────────────────────────────────────

-- Append-only for all authenticated users
create policy "authenticated_insert_audit"
  on audit_logs for insert
  with check (auth.role() = 'authenticated');

-- Staff can only read their own tenant's logs
create policy "staff_read_own_audit_logs"
  on audit_logs for select
  using (tenant_id = current_tenant_id());

-- ============================================================
-- Migration 001: Initial schema
-- Run against Supabase SQL editor or via: supabase db push
--
-- All money values are stored in integer paise (₹1 = 100 paise).
-- All tenant-owned tables carry tenant_id for row-level isolation.
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type order_type as enum (
  'DINE_IN',
  'TAKEAWAY',
  'DELIVERY'
);

create type order_status as enum (
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REJECTED'
);

create type payment_status as enum (
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED'
);

create type payment_method as enum (
  'PAY_AT_RESTAURANT',
  'CASH_ON_DELIVERY',
  'ONLINE'
);

create type staff_role as enum (
  'PLATFORM_ADMIN',
  'RESTAURANT_OWNER',
  'RESTAURANT_MANAGER',
  'KITCHEN_STAFF',
  'WAITER',
  'DELIVERY_STAFF'
);

create type delivery_status as enum (
  'ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
);

-- ─── tenants ─────────────────────────────────────────────────────────────────
-- One tenant per restaurant in MVP (1:1). Exists to support future multi-branch chains.

create table tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── restaurants ─────────────────────────────────────────────────────────────

create table restaurants (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id) on delete cascade,
  name                  text not null,
  slug                  text not null unique,
  description           text,
  logo_url              text,
  cover_url             text,
  primary_color         text not null default '#FF6B35',
  secondary_color       text not null default '#2C2C2C',
  phone                 text,
  email                 text,
  address               text,
  city                  text,
  state                 text,
  pincode               text,
  -- JSON: { MON: { open: "09:00", close: "22:00", is_closed: false }, ... }
  opening_hours         jsonb not null default '{}',
  is_open               boolean not null default true,
  is_active             boolean not null default true,
  delivery_enabled      boolean not null default false,
  delivery_fee          integer not null default 0 check (delivery_fee >= 0),
  minimum_order_amount  integer not null default 0 check (minimum_order_amount >= 0),
  -- tax_rate stored as integer basis points: 500 = 5.00%
  tax_rate              integer not null default 0 check (tax_rate >= 0 and tax_rate <= 10000),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_restaurants_tenant_id on restaurants(tenant_id);
create index idx_restaurants_slug     on restaurants(slug);
create index idx_restaurants_is_active on restaurants(is_active);

-- ─── staff ───────────────────────────────────────────────────────────────────
-- Links Supabase Auth users to a restaurant with a role.

create table staff (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  role           staff_role not null,
  name           text not null,
  email          text not null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (restaurant_id, user_id)
);

create index idx_staff_tenant_id     on staff(tenant_id);
create index idx_staff_restaurant_id on staff(restaurant_id);
create index idx_staff_user_id       on staff(user_id);

-- ─── categories ──────────────────────────────────────────────────────────────

create table categories (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  name           text not null,
  description    text,
  image_url      text,
  sort_order     integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_categories_tenant_id     on categories(tenant_id);
create index idx_categories_restaurant_id on categories(restaurant_id);
create index idx_categories_sort_order    on categories(restaurant_id, sort_order);

-- ─── products ────────────────────────────────────────────────────────────────

create table products (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  category_id    uuid not null references categories(id) on delete restrict,
  name           text not null,
  description    text,
  image_url      text,
  price          integer not null check (price >= 0),  -- paise
  is_available   boolean not null default true,
  is_veg         boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_products_tenant_id     on products(tenant_id);
create index idx_products_restaurant_id on products(restaurant_id);
create index idx_products_category_id   on products(category_id);
create index idx_products_is_available  on products(restaurant_id, is_available);

-- ─── tables ──────────────────────────────────────────────────────────────────

create table tables (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  name           text not null,
  capacity       integer not null default 4 check (capacity > 0),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_tables_tenant_id     on tables(tenant_id);
create index idx_tables_restaurant_id on tables(restaurant_id);

-- ─── table_sessions ──────────────────────────────────────────────────────────
-- Created when a customer scans a QR code. Acts as the trust anchor for dine-in orders.

create table table_sessions (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  restaurant_id  uuid not null references restaurants(id) on delete cascade,
  table_id       uuid not null references tables(id) on delete cascade,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  closed_at      timestamptz
);

create index idx_table_sessions_tenant_id     on table_sessions(tenant_id);
create index idx_table_sessions_restaurant_id on table_sessions(restaurant_id);
create index idx_table_sessions_table_id      on table_sessions(table_id);
create index idx_table_sessions_is_active     on table_sessions(table_id, is_active);

-- ─── customers ───────────────────────────────────────────────────────────────
-- Guest customers have user_id = NULL. Authenticated customers link to auth.users.

create table customers (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  phone       text,
  email       text,
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_customers_user_id on customers(user_id);
create index idx_customers_phone   on customers(phone);
create index idx_customers_email   on customers(email);

-- ─── addresses ───────────────────────────────────────────────────────────────

create table addresses (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references customers(id) on delete cascade,
  label          text,
  address_line1  text not null,
  address_line2  text,
  city           text not null,
  state          text not null,
  pincode        text not null,
  landmark       text,
  created_at     timestamptz not null default now()
);

create index idx_addresses_customer_id on addresses(customer_id);

-- ─── orders ──────────────────────────────────────────────────────────────────

create table orders (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid not null references tenants(id) on delete cascade,
  restaurant_id        uuid not null references restaurants(id) on delete cascade,
  customer_id          uuid not null references customers(id),
  order_type           order_type not null,
  status               order_status not null default 'PENDING',
  payment_status       payment_status not null default 'PENDING',
  payment_method       payment_method not null,
  subtotal             integer not null check (subtotal >= 0),
  discount             integer not null default 0 check (discount >= 0),
  tax                  integer not null default 0 check (tax >= 0),
  delivery_fee         integer not null default 0 check (delivery_fee >= 0),
  total                integer not null check (total >= 0),
  table_id             uuid references tables(id),
  table_session_id     uuid references table_sessions(id),
  delivery_address_id  uuid references addresses(id),
  notes                text,
  -- Client-provided key to prevent duplicate submissions
  idempotency_key      text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- Prevent exact duplicate order submissions
  unique (restaurant_id, idempotency_key),

  -- Dine-in orders must reference a table session
  constraint dine_in_requires_session
    check (order_type != 'DINE_IN' or table_session_id is not null),

  -- Delivery orders must reference an address
  constraint delivery_requires_address
    check (order_type != 'DELIVERY' or delivery_address_id is not null)
);

create index idx_orders_tenant_id          on orders(tenant_id);
create index idx_orders_restaurant_id      on orders(restaurant_id);
create index idx_orders_customer_id        on orders(customer_id);
create index idx_orders_status             on orders(tenant_id, status);
create index idx_orders_created_at         on orders(tenant_id, created_at desc);
create index idx_orders_restaurant_date    on orders(restaurant_id, created_at desc);
create index idx_orders_idempotency        on orders(restaurant_id, idempotency_key);

-- ─── order_items ─────────────────────────────────────────────────────────────
-- Product name and price are snapshotted here so historical orders remain
-- correct even when the restaurant later changes its menu.

create table order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  tenant_id          uuid not null references tenants(id) on delete cascade,
  product_id         uuid not null references products(id),
  product_name       text not null,   -- snapshotted
  product_image_url  text,            -- snapshotted
  quantity           integer not null check (quantity > 0),
  unit_price         integer not null check (unit_price >= 0),  -- paise, snapshotted
  total_price        integer not null check (total_price >= 0), -- paise
  notes              text,
  created_at         timestamptz not null default now()
);

create index idx_order_items_order_id   on order_items(order_id);
create index idx_order_items_tenant_id  on order_items(tenant_id);
create index idx_order_items_product_id on order_items(product_id);

-- ─── payments ────────────────────────────────────────────────────────────────

create table payments (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders(id) on delete cascade,
  tenant_id           uuid not null references tenants(id) on delete cascade,
  method              payment_method not null,
  status              payment_status not null default 'PENDING',
  amount              integer not null check (amount >= 0),  -- paise
  provider_payment_id text,
  provider_order_id   text,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_payments_order_id  on payments(order_id);
create index idx_payments_tenant_id on payments(tenant_id);

-- ─── deliveries ──────────────────────────────────────────────────────────────

create table deliveries (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  tenant_id          uuid not null references tenants(id) on delete cascade,
  delivery_staff_id  uuid references staff(id) on delete set null,
  status             delivery_status not null default 'ASSIGNED',
  assigned_at        timestamptz,
  picked_up_at       timestamptz,
  delivered_at       timestamptz,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_deliveries_order_id  on deliveries(order_id);
create index idx_deliveries_tenant_id on deliveries(tenant_id);
create index idx_deliveries_staff_id  on deliveries(delivery_staff_id);

-- ─── audit_logs ──────────────────────────────────────────────────────────────

create table audit_logs (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references tenants(id) on delete set null,
  user_id        uuid references auth.users(id) on delete set null,
  action         text not null,
  resource_type  text not null,
  resource_id    text,
  metadata       jsonb not null default '{}',
  ip_address     text,
  created_at     timestamptz not null default now()
);

create index idx_audit_logs_tenant_id     on audit_logs(tenant_id);
create index idx_audit_logs_user_id       on audit_logs(user_id);
create index idx_audit_logs_action        on audit_logs(action);
create index idx_audit_logs_resource      on audit_logs(resource_type, resource_id);
create index idx_audit_logs_created_at    on audit_logs(created_at desc);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_tenants_updated_at
  before update on tenants
  for each row execute function set_updated_at();

create trigger trg_restaurants_updated_at
  before update on restaurants
  for each row execute function set_updated_at();

create trigger trg_staff_updated_at
  before update on staff
  for each row execute function set_updated_at();

create trigger trg_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger trg_tables_updated_at
  before update on tables
  for each row execute function set_updated_at();

create trigger trg_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

create trigger trg_payments_updated_at
  before update on payments
  for each row execute function set_updated_at();

create trigger trg_deliveries_updated_at
  before update on deliveries
  for each row execute function set_updated_at();

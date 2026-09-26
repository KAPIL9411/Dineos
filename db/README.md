# Database Migrations

All schema changes live here as numbered SQL files. Apply them in order.

## Apply migrations

### Option A — Supabase SQL Editor (recommended for MVP)
1. Open your Supabase project → SQL Editor
2. Paste and run each file in order: `001_`, `002_`, `003_`, `004_`

### Option B — Supabase CLI
```bash
supabase db push
```
Requires `supabase/config.toml` and local Supabase CLI setup.

## Migration files

| File | Description |
|---|---|
| `001_initial_schema.sql` | All tables, enums, indexes, check constraints, updated_at triggers |
| `002_rls_policies.sql` | Row Level Security policies (defense-in-depth layer) |
| `003_realtime.sql` | Enable Supabase Realtime on orders, order_items, deliveries |
| `004_storage_buckets.sql` | Create Supabase Storage buckets for images |

## Notes

- All money values are **integer paise** (₹1 = 100). Never use FLOAT or NUMERIC for money.
- Every tenant-owned table has a `tenant_id` column.
- The application enforces tenant isolation in code (service-role client + explicit `where tenant_id = ?`). RLS is a secondary guard.
- Do **not** modify production schema without a new migration file.
- Rollback: each migration should have a corresponding `XXX_rollback.sql` before deploying to production scale.

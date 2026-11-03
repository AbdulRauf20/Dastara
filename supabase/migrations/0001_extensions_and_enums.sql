-- ============================================================================
-- DASTARA — 0001 Extensions & Enum Types
-- ============================================================================
-- Run order: this file first. All subsequent migrations depend on these types.

create extension if not exists "pgcrypto"; -- gen_random_uuid()
create extension if not exists "citext";   -- case-insensitive text (emails)
create extension if not exists "pg_trgm";  -- trigram indexes for fuzzy search

-- ----------------------------------------------------------------------------
-- Enum types (kept in sync with lib/constants.ts)
-- ----------------------------------------------------------------------------
do $$ begin
  create type admin_role as enum ('super_admin', 'admin', 'editor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_status as enum (
    'available', 'sold_out', 'made_to_order', 'coming_soon', 'draft', 'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'inquiry_received', 'availability_verification', 'availability_confirmed',
    'awaiting_payment', 'payment_verified', 'procurement_in_progress',
    'quality_inspection', 'packaging', 'dispatched', 'delivered',
    'cancelled', 'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum (
    'not_requested', 'awaiting_payment', 'payment_proof_received',
    'verified', 'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum (
    'bank_transfer', 'easypaisa', 'jazzcash', 'cash', 'other'
  );
exception when duplicate_object then null; end $$;

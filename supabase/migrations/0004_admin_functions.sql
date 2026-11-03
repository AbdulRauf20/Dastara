-- ============================================================================
-- DASTARA — 0004 Admin Functions (status workflow, payments, audit)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Valid order status transitions (mirrors ORDER_STATUS_TRANSITIONS in
-- lib/constants.ts). Enforced server-side to prevent invalid workflow jumps.
-- ----------------------------------------------------------------------------
create or replace function is_valid_order_transition(p_from order_status, p_to order_status)
returns boolean language sql immutable as $$
  select case
    when p_from = p_to then true
    when p_from = 'inquiry_received'          and p_to in ('availability_verification','cancelled') then true
    when p_from = 'availability_verification' and p_to in ('availability_confirmed','cancelled') then true
    when p_from = 'availability_confirmed'    and p_to in ('awaiting_payment','cancelled') then true
    when p_from = 'awaiting_payment'          and p_to in ('payment_verified','cancelled') then true
    when p_from = 'payment_verified'          and p_to in ('procurement_in_progress','refunded','cancelled') then true
    when p_from = 'procurement_in_progress'   and p_to in ('quality_inspection','refunded','cancelled') then true
    when p_from = 'quality_inspection'        and p_to in ('packaging','procurement_in_progress','refunded','cancelled') then true
    when p_from = 'packaging'                 and p_to in ('dispatched','refunded','cancelled') then true
    when p_from = 'dispatched'                and p_to in ('delivered','refunded') then true
    when p_from = 'delivered'                 and p_to in ('refunded') then true
    else false
  end;
$$;

-- ----------------------------------------------------------------------------
-- log_audit — append-only audit trail for sensitive admin actions.
-- ----------------------------------------------------------------------------
create or replace function log_audit(
  p_action text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_details jsonb default null
)
returns void
language plpgsql security definer
set search_path = public, pg_temp as $$
declare v_email text;
begin
  select email into v_email from admin_profiles where id = auth.uid();
  insert into audit_logs (actor_id, actor_email, action, entity_type, entity_id, details)
  values (auth.uid(), v_email, p_action, p_entity_type, p_entity_id, p_details);
end;
$$;
grant execute on function log_audit(text, text, text, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- admin_change_order_status — validated transition + history + audit, atomic.
-- ----------------------------------------------------------------------------
create or replace function admin_change_order_status(
  p_inquiry_id uuid,
  p_to_status  order_status,
  p_note       text default null
)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_from order_status;
  v_ref  text;
begin
  if not is_admin_or_above() then
    raise exception 'FORBIDDEN' using errcode = 'insufficient_privilege';
  end if;

  select status, order_reference into v_from, v_ref
    from order_inquiries where id = p_inquiry_id for update;
  if not found then
    raise exception 'INQUIRY_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  if not is_valid_order_transition(v_from, p_to_status) then
    raise exception 'INVALID_TRANSITION' using errcode = 'check_violation';
  end if;

  if v_from = p_to_status then
    return jsonb_build_object('id', p_inquiry_id, 'status', p_to_status, 'unchanged', true);
  end if;

  update order_inquiries
     set status = p_to_status,
         payment_status = case
           when p_to_status = 'awaiting_payment' and payment_status = 'not_requested'
             then 'awaiting_payment'::payment_status
           when p_to_status = 'payment_verified' then 'verified'::payment_status
           when p_to_status = 'refunded' then 'refunded'::payment_status
           else payment_status end
   where id = p_inquiry_id;

  insert into order_status_history (inquiry_id, from_status, to_status, changed_by, note)
  values (p_inquiry_id, v_from, p_to_status, auth.uid(), nullif(btrim(p_note), ''));

  perform log_audit('order_status_change', 'order_inquiry', p_inquiry_id::text,
    jsonb_build_object('from', v_from, 'to', p_to_status, 'reference', v_ref));

  return jsonb_build_object('id', p_inquiry_id, 'from', v_from, 'status', p_to_status);
end;
$$;
grant execute on function admin_change_order_status(uuid, order_status, text) to authenticated;

-- ----------------------------------------------------------------------------
-- admin_verify_payment — explicit verification is the ONLY way to mark paid.
-- Submitting a screenshot never auto-verifies.
-- ----------------------------------------------------------------------------
create or replace function admin_verify_payment(p_payment_id uuid)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_inquiry uuid;
  v_amount  numeric(12,2);
begin
  if not is_admin_or_above() then
    raise exception 'FORBIDDEN' using errcode = 'insufficient_privilege';
  end if;

  update payments
     set status = 'verified',
         verified_at = now(),
         verified_by = auth.uid()
   where id = p_payment_id
   returning inquiry_id, amount into v_inquiry, v_amount;

  if not found then
    raise exception 'PAYMENT_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  update order_inquiries set payment_status = 'verified' where id = v_inquiry;

  perform log_audit('payment_verified', 'payment', p_payment_id::text,
    jsonb_build_object('inquiry_id', v_inquiry, 'amount', v_amount));

  return jsonb_build_object('id', p_payment_id, 'inquiry_id', v_inquiry, 'status', 'verified');
end;
$$;
grant execute on function admin_verify_payment(uuid) to authenticated;

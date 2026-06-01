CREATE OR REPLACE FUNCTION process_purchase(p_user_id UUID, p_product_id UUID, p_package_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_package product_packages%ROWTYPE; v_product products%ROWTYPE; v_wallet_balance NUMERIC;
  v_key license_keys%ROWTYPE; v_order_id UUID; v_expires_at TIMESTAMPTZ; v_auto_cancel_at TIMESTAMPTZ; v_cancel_hours INT;
BEGIN
  SELECT wallet_balance INTO v_wallet_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  SELECT * INTO v_package FROM product_packages WHERE id = p_package_id AND product_id = p_product_id AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'PACKAGE_NOT_FOUND'); END IF;
  SELECT * INTO v_product FROM products WHERE id = p_product_id AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'PRODUCT_NOT_FOUND'); END IF;
  IF v_wallet_balance < v_package.price THEN RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_BALANCE'); END IF;
  SELECT * INTO v_key FROM license_keys WHERE product_id = p_product_id AND (package_id = p_package_id OR package_id IS NULL) AND status = 'AVAILABLE' LIMIT 1 FOR UPDATE SKIP LOCKED;
  UPDATE profiles SET wallet_balance = wallet_balance - v_package.price, total_spent = total_spent + v_package.price WHERE id = p_user_id;
  INSERT INTO wallet_logs (user_id, amount, type, balance_after, note) VALUES (p_user_id, v_package.price, 'DEBIT', v_wallet_balance - v_package.price, 'Purchase: ' || v_product.name);
  IF v_key.id IS NOT NULL THEN
    v_expires_at := NOW() + (v_package.duration_days || ' days')::INTERVAL;
    UPDATE license_keys SET status = 'SOLD', sold_to = p_user_id, sold_at = NOW(), expires_at = v_expires_at WHERE id = v_key.id;
    INSERT INTO orders (user_id, product_id, package_id, key_id, amount_paid, status, completed_at) VALUES (p_user_id, p_product_id, p_package_id, v_key.id, v_package.price, 'COMPLETED', NOW()) RETURNING id INTO v_order_id;
    RETURN jsonb_build_object('success', true, 'status', 'COMPLETED', 'order_id', v_order_id, 'key_id', v_key.id, 'expires_at', v_expires_at);
  ELSE
    IF v_product.stock_behavior = 'SHOW_OUT_OF_STOCK' THEN
      UPDATE profiles SET wallet_balance = wallet_balance + v_package.price, total_spent = total_spent - v_package.price WHERE id = p_user_id;
      DELETE FROM wallet_logs WHERE user_id = p_user_id AND note = 'Purchase: ' || v_product.name AND created_at >= NOW() - INTERVAL '5 seconds';
      RETURN jsonb_build_object('success', false, 'error', 'OUT_OF_STOCK');
    ELSE
      SELECT value::INT INTO v_cancel_hours FROM site_settings WHERE key = 'pending_order_auto_cancel_hours';
      v_auto_cancel_at := NOW() + (v_cancel_hours || ' hours')::INTERVAL;
      INSERT INTO orders (user_id, product_id, package_id, amount_paid, status, auto_cancel_at) VALUES (p_user_id, p_product_id, p_package_id, v_package.price, 'PENDING', v_auto_cancel_at) RETURNING id INTO v_order_id;
      RETURN jsonb_build_object('success', true, 'status', 'PENDING', 'order_id', v_order_id, 'auto_cancel_at', v_auto_cancel_at);
    END IF;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION credit_wallet(p_user_id UUID, p_amount NUMERIC, p_merchant_order_id TEXT, p_vt_txn_id TEXT, p_mfs_type TEXT, p_webhook_raw JSONB DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_existing transactions%ROWTYPE; v_new_balance NUMERIC;
BEGIN
  SELECT * INTO v_existing FROM transactions WHERE merchant_order_id = p_merchant_order_id AND status = 'VERIFIED';
  IF FOUND THEN RETURN jsonb_build_object('success', true, 'already_processed', true); END IF;
  UPDATE profiles SET wallet_balance = wallet_balance + p_amount WHERE id = p_user_id RETURNING wallet_balance INTO v_new_balance;
  UPDATE transactions SET status = 'VERIFIED', vt_txn_id = p_vt_txn_id, mfs_type = p_mfs_type::mfs_type_enum, verified_at = NOW(), webhook_raw = p_webhook_raw WHERE merchant_order_id = p_merchant_order_id;
  IF NOT FOUND THEN INSERT INTO transactions (user_id, type, amount, mfs_type, merchant_order_id, vt_txn_id, status, verified_at, webhook_raw) VALUES (p_user_id, 'TOPUP', p_amount, p_mfs_type::mfs_type_enum, p_merchant_order_id, p_vt_txn_id, 'VERIFIED', NOW(), p_webhook_raw); END IF;
  INSERT INTO wallet_logs (user_id, amount, type, balance_after, reference_id, note) VALUES (p_user_id, p_amount, 'CREDIT', v_new_balance, p_merchant_order_id, 'Topup via ' || p_mfs_type);
  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END; $$;

CREATE OR REPLACE FUNCTION cancel_expired_pending_orders() RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order orders%ROWTYPE; v_count INT := 0;
BEGIN
  FOR v_order IN SELECT * FROM orders WHERE status = 'PENDING' AND auto_cancel_at IS NOT NULL AND auto_cancel_at < NOW() LOOP
    UPDATE profiles SET wallet_balance = wallet_balance + v_order.amount_paid WHERE id = v_order.user_id;
    INSERT INTO wallet_logs (user_id, amount, type, balance_after, reference_id, note) SELECT v_order.user_id, v_order.amount_paid, 'CREDIT', wallet_balance, v_order.id::TEXT, 'Refund: auto-cancelled' FROM profiles WHERE id = v_order.user_id;
    UPDATE orders SET status = 'CANCELLED' WHERE id = v_order.id; v_count := v_count + 1;
  END LOOP; RETURN v_count;
END; $$;
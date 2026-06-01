CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  wallet_balance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (wallet_balance >= 0),
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
  ('min_topup_amount', '10'),
  ('max_topup_amount', '10000'),
  ('pending_order_auto_cancel_hours', '72'),
  ('site_notice', ''),
  ('registration_enabled', 'true');

CREATE TYPE product_type_enum AS ENUM ('KEY', 'LOGIN', 'SERVICE');
CREATE TYPE product_category_enum AS ENUM ('ROOT', 'NON_ROOT', 'VIP');
CREATE TYPE stock_behavior_enum AS ENUM ('SHOW_OUT_OF_STOCK', 'ALLOW_PENDING');

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  product_type product_type_enum NOT NULL,
  category product_category_enum NOT NULL,
  thumbnail TEXT,
  video_url TEXT,
  notice TEXT,
  stock_behavior stock_behavior_enum NOT NULL DEFAULT 'SHOW_OUT_OF_STOCK',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  duration_days INT NOT NULL CHECK (duration_days IN (1, 3, 7, 15, 30)),
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE key_status_enum AS ENUM ('AVAILABLE', 'SOLD', 'RESERVED');

CREATE TABLE license_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  package_id UUID REFERENCES product_packages(id) ON DELETE SET NULL,
  key_value TEXT,
  login_user TEXT,
  login_pass TEXT,
  service_content TEXT,
  status key_status_enum NOT NULL DEFAULT 'AVAILABLE',
  sold_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sold_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE order_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  package_id UUID REFERENCES product_packages(id),
  key_id UUID REFERENCES license_keys(id),
  amount_paid NUMERIC(10,2) NOT NULL,
  status order_status_enum NOT NULL DEFAULT 'PENDING',
  auto_cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TYPE transaction_type_enum AS ENUM ('TOPUP', 'PURCHASE', 'REFUND');
CREATE TYPE mfs_type_enum AS ENUM ('BKASH', 'NAGAD', 'ROCKET');
CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type transaction_type_enum NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  mfs_type mfs_type_enum,
  merchant_order_id TEXT UNIQUE,
  vt_session_id TEXT,
  vt_txn_id TEXT,
  checkout_url TEXT,
  status transaction_status_enum NOT NULL DEFAULT 'PENDING',
  failed_reason TEXT,
  verified_at TIMESTAMPTZ,
  webhook_raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE wallet_log_type_enum AS ENUM ('CREDIT', 'DEBIT');

CREATE TABLE wallet_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type wallet_log_type_enum NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  reference_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
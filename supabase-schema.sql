-- Copy and paste this script into your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS menu_items (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  price BIGINT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT PRIMARY KEY,
  items JSONB NOT NULL,
  total BIGINT NOT NULL,
  payment_method TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  order_number BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT PRIMARY KEY,
  description TEXT NOT NULL,
  amount BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_incomes (
  id BIGINT PRIMARY KEY,
  description TEXT NOT NULL,
  amount BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS store_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

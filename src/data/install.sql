CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(255),
    avatar_url VARCHAR(255),
    created_at timestamptz
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    user_address VARCHAR(255) NOT NULL,
    amount DECIMAL NOT NULL,
    credits INTEGER NOT NULL,
    network VARCHAR(50) NOT NULL,
    transaction_hash VARCHAR(255),
    order_status INTEGER NOT NULL,
    expired_at TIMESTAMP NOT NULL,
    paied_at TIMESTAMP,
    plan VARCHAR(50) NOT NULL,
    token_address VARCHAR(255),
    token_decimals INTEGER
);

CREATE INDEX idx_user_address ON orders(user_address);
CREATE INDEX idx_transaction_hash ON orders(transaction_hash);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    user_address VARCHAR(255) NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE TABLE user_credits (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(255) UNIQUE NOT NULL,
    credits INTEGER NOT NULL DEFAULT 0,
    used_credits INTEGER NOT NULL DEFAULT 0,
    plan VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_credits_address ON user_credits(user_address);

CREATE TABLE credit_consumption (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('view', 'generate')),
    report_id INTEGER REFERENCES reports(id),
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_address) REFERENCES users(user_address)
);

CREATE TABLE user_reports (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(255) NOT NULL,
    report_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_address) REFERENCES users(user_address),
    FOREIGN KEY (report_id) REFERENCES reports(id),
    UNIQUE (user_address, report_id)
);

CREATE INDEX idx_credit_consumption_user ON credit_consumption(user_address);
CREATE INDEX idx_credit_consumption_report ON credit_consumption(report_id);
CREATE INDEX idx_user_reports_user ON user_reports(user_address);
CREATE INDEX idx_user_reports_report ON user_reports(report_id);

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- 创建策略
-- users 表策略
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (auth.uid()::text = user_address);

-- orders 表策略
CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (auth.uid()::text = user_address);

-- reports 表策略
CREATE POLICY "Anyone can view reports"
ON reports FOR SELECT
TO PUBLIC
USING (true);

-- user_credits 表策略
CREATE POLICY "Users can view their own credits"
ON user_credits FOR SELECT
USING (auth.uid()::text = user_address);

-- credit_consumption 表策略
CREATE POLICY "Users can view their own consumption"
ON credit_consumption FOR SELECT
USING (auth.uid()::text = user_address);

-- user_reports 表策略
CREATE POLICY "Users can view their own reports"
ON user_reports FOR SELECT
USING (auth.uid()::text = user_address);
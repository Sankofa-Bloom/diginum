-- Drop and recreate tables to fix precision issues
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS exchange_rates CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supabase_user_id UUID UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  country VARCHAR(100),
  balance DECIMAL(10, 2) DEFAULT 0.00,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP WITH TIME ZONE,
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  currency VARCHAR(3) NOT NULL UNIQUE,
  rate DECIMAL(15, 6) NOT NULL,
  markup DECIMAL(5, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create price_adjustments table
CREATE TABLE IF NOT EXISTS price_adjustments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service VARCHAR(50) NOT NULL,
  country VARCHAR(50) NOT NULL,
  markup DECIMAL(5, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_service_country UNIQUE (service, country)
);





-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_password_token ON users(reset_password_token);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency ON exchange_rates(currency);
CREATE INDEX IF NOT EXISTS idx_price_adjustments_service_country ON price_adjustments(service, country);




-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';



-- Insert default exchange rates
INSERT INTO exchange_rates (currency, rate, markup)
VALUES 
  ('USD', 1.00, 0),
  ('EUR', 0.85, 10.0),
  ('GBP', 0.73, 10.0),
  ('JPY', 110.50, 10.0),
  ('CAD', 1.25, 10.0),
  ('AUD', 1.35, 10.0),
  ('CHF', 0.92, 10.0),
  ('CNY', 6.45, 10.0),
  ('INR', 74.50, 10.0),
  ('BRL', 5.20, 10.0),
  ('MXN', 20.50, 10.0),
  ('SGD', 1.35, 10.0),
  ('HKD', 7.80, 10.0),
  ('SEK', 8.60, 10.0),
  ('NOK', 8.80, 10.0),
  ('DKK', 6.30, 10.0),
  ('PLN', 3.80, 10.0),
  ('CZK', 21.50, 10.0),
  ('HUF', 300.00, 10.0),
  ('RUB', 75.00, 10.0),
  ('TRY', 8.50, 10.0),
  ('ZAR', 14.50, 10.0),
  ('KRW', 1150.00, 10.0),
  ('THB', 32.50, 10.0),
  ('MYR', 4.15, 10.0),
  ('IDR', 14200.00, 10.0),
  ('PHP', 50.50, 10.0),
  ('VND', 23000.00, 10.0),
  ('NGN', 410.00, 10.0),
  ('EGP', 15.70, 10.0),
  ('KES', 110.00, 10.0),
  ('GHS', 6.00, 10.0),
  ('UGX', 3500.00, 10.0),
  ('TZS', 2300.00, 10.0),
  ('XAF', 550.00, 10.0),
  ('XOF', 550.00, 10.0),
  ('MAD', 9.00, 10.0),
  ('TND', 2.80, 10.0),
  ('DZD', 135.00, 10.0),
  ('LYD', 4.50, 10.0),
  ('SDG', 55.00, 10.0),
  ('ETB', 45.00, 10.0),
  ('SOS', 580.00, 10.0),
  ('DJF', 177.00, 10.0),
  ('KMF', 440.00, 10.0),
  ('MUR', 40.00, 10.0),
  ('SCR', 13.50, 10.0),
  ('CVE', 95.00, 10.0),
  ('STD', 21000.00, 10.0),
  ('GMD', 52.00, 10.0),
  ('GNF', 10200.00, 10.0),
  ('SLL', 10300.00, 10.0),
  ('LRD', 150.00, 10.0),
  ('CDF', 2000.00, 10.0),
  ('RWF', 1000.00, 10.0),
  ('BIF', 2000.00, 10.0),
  ('MWK', 800.00, 10.0),
  ('ZMW', 18.00, 10.0),
  ('ZWL', 85.00, 10.0),
  ('NAD', 14.50, 10.0),
  ('BWP', 11.00, 10.0),
  ('SZL', 14.50, 10.0),
  ('LSL', 14.50, 10.0),
  ('MZN', 60.00, 10.0),
  ('AOA', 650.00, 10.0),
  ('STN', 21.00, 10.0)
ON CONFLICT (currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  markup = EXCLUDED.markup,
  updated_at = CURRENT_TIMESTAMP;

-- Insert default price adjustments
INSERT INTO price_adjustments (service, country, markup)
VALUES 
  ('whatsapp', 'US', 0.10),
  ('instagram', 'US', 0.15),
  ('telegram', 'RU', 0.20)
ON CONFLICT (service, country) DO UPDATE SET
  markup = EXCLUDED.markup,
  updated_at = CURRENT_TIMESTAMP;

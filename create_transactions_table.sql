-- Create transactions table for payment tracking
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'purchase', 'refund')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    metadata JSONB,
    transaction_id VARCHAR(100),
    payment_method VARCHAR(50),
    country_code VARCHAR(2),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_mobile VARCHAR(20),
    fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON public.transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_country_code ON public.transactions(country_code);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON public.transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample transaction types for testing
INSERT INTO public.transactions (user_id, type, amount, currency, status, reference, description, payment_method, country_code, customer_name, customer_email)
SELECT 
    u.id,
    'deposit',
    100.00,
    'USD',
    'completed',
    'SAMPLE_DEP_' || u.id,
    'Sample deposit for testing',
    'payment_link',
    'US',
    'Test User',
    'test@example.com'
FROM auth.users u
LIMIT 1
ON CONFLICT (reference) DO NOTHING;

-- Verify table creation
SELECT 
    'transactions' as table_name,
    COUNT(*) as row_count,
    'RLS enabled' as rls_status
FROM public.transactions;

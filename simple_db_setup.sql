-- Simple Database Setup for DigiNum - No Payment System
-- Clean and minimal setup for basic functionality

-- Create user_balances table (for storing user account balances)
CREATE TABLE IF NOT EXISTS public.user_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON public.user_balances(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- User balances policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_balances' AND policyname = 'Users can view their own balance') THEN
        CREATE POLICY "Users can view their own balance" ON public.user_balances
            FOR SELECT USING (auth.uid()::text = user_id::text);
        RAISE NOTICE 'Created policy: Users can view their own balance';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_balances' AND policyname = 'Users can update their own balance') THEN
        CREATE POLICY "Users can update their own balance" ON public.user_balances
            FOR UPDATE USING (auth.uid()::text = user_id::text);
        RAISE NOTICE 'Created policy: Users can update their own balance';
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_balances TO authenticated;

-- Success message
SELECT 'Simple database setup completed! Only user balances table created.' as status;

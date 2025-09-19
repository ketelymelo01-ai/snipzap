-- Disable RLS temporarily to allow insertions
-- This is for development purposes only
-- In production, you should implement proper RLS policies

-- Disable RLS on all tables
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_events DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.clients TO anon, authenticated;
GRANT ALL ON public.sales TO anon, authenticated;
GRANT ALL ON public.facebook_events TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

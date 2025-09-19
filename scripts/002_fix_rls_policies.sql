-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.conversions;

-- Create more permissive policies that allow all operations
-- These policies allow all operations for now - in production you'd want more restrictive policies
CREATE POLICY "Allow all operations on clients" ON public.clients
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on conversions" ON public.conversions
  FOR ALL USING (true);

-- Alternative: Disable RLS temporarily for development
-- ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.conversions DISABLE ROW LEVEL SECURITY;

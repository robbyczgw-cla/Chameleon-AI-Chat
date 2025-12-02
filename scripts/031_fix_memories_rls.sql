-- Fix RLS policies for memories table
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Step 1: Check if the table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'memories'
) AS memories_table_exists;

-- Step 2: Check current RLS policies
SELECT
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'memories';

-- Step 3: Drop existing policies (if they exist but are broken)
DROP POLICY IF EXISTS "Users can view their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can insert their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON public.memories;

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Step 5: Recreate all policies with correct definitions
CREATE POLICY "Users can view their own memories" ON public.memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" ON public.memories
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" ON public.memories
  FOR DELETE USING (auth.uid() = user_id);

-- Step 6: Verify policies are now correct
SELECT
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'memories';

-- If you see 4 policies (SELECT, INSERT, UPDATE, DELETE) with auth.uid() = user_id, you're good!

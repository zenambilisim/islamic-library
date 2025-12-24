-- Fix contact_messages table RLS policies
-- Run this if messages are not being inserted

-- First, drop existing policies
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Users can read their own messages" ON contact_messages;
DROP POLICY IF EXISTS "Service role can manage all messages" ON contact_messages;

-- Recreate policies with better permissions

-- Policy 1: Allow anonymous and authenticated users to INSERT
CREATE POLICY "Enable insert for all users"
  ON contact_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to read their own messages
CREATE POLICY "Enable read for own messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Policy 3: Allow service role to do everything (for admin)
CREATE POLICY "Enable all for service role"
  ON contact_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Test query to verify table exists and is accessible
SELECT COUNT(*) as table_exists FROM contact_messages;

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'contact_messages';

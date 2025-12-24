-- Test contact_messages table
-- Run this to verify table is working correctly

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'contact_messages'
) as table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'contact_messages'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'contact_messages';

-- 4. Check policies
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'contact_messages';

-- 5. Try to insert a test message (will fail if RLS blocks it)
-- This mimics what the frontend does
INSERT INTO contact_messages (name, email, subject, message, status, user_agent)
VALUES (
  'Test User',
  'test@example.com',
  'Test Subject',
  'This is a test message',
  'unread',
  'Test User Agent'
)
RETURNING id, name, email, created_at;

-- 6. View all messages
SELECT id, name, email, subject, status, created_at
FROM contact_messages
ORDER BY created_at DESC
LIMIT 10;

-- 7. Delete test message (cleanup)
DELETE FROM contact_messages
WHERE email = 'test@example.com';

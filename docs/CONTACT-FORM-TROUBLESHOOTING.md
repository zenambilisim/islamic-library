# Contact Form Troubleshooting Guide

## Problem: Message Not Sending

If the contact form is not working, follow these steps:

### Step 1: Check Browser Console

Open browser console (F12) and look for error messages. You should see:

**✅ Success:**
```
🚀 Starting contact form submission...
📝 Attempting to save message to database...
📦 Message data prepared: {...}
✅ Message saved successfully: {...}
✅ Database save successful!
```

**❌ Common Errors:**
```
❌ Database error: new row violates row-level security policy
❌ Database error: relation "contact_messages" does not exist
❌ Failed to save to database
```

### Step 2: Verify Supabase Connection

Check console for Supabase config:
```
🔧 Supabase Config: { url: '...', hasKey: true, isReal: true }
```

**If you see `dummy-url`:**
- Your `.env` file is missing or incorrect
- Add Supabase credentials to `.env`

### Step 3: Check Table Exists

In Supabase Dashboard:
1. Go to **Table Editor**
2. Look for `contact_messages` table
3. If not found, run `create-contact-messages-table.sql`

### Step 4: Fix RLS Policies (Most Common Issue)

The issue is usually Row Level Security (RLS) blocking inserts.

**Solution: Run the fix script**

1. Go to Supabase → **SQL Editor**
2. Run: `fix-contact-messages-rls.sql`
3. This will recreate policies with correct permissions

**What it fixes:**
```sql
-- Old policy (might not work with anon)
TO anon, authenticated

-- New policy (works for everyone)
TO public
```

### Step 5: Test Manually in Supabase

Run `test-contact-messages.sql` in Supabase SQL Editor to verify:
- Table exists ✅
- Columns correct ✅
- RLS enabled ✅
- Policies correct ✅
- Can insert ✅
- Can read ✅

### Step 6: Check Environment Variables

Verify `.env` file has:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Restart dev server after changing `.env`:**
```bash
npm run dev
```

### Step 7: Verify Supabase Project Settings

1. Go to Supabase Dashboard → **Settings** → **API**
2. Verify:
   - Project URL matches `.env`
   - Anon/public key matches `.env`
   - Service role key is different (don't use in frontend!)

## Common Error Messages

### Error: "relation 'contact_messages' does not exist"

**Cause:** Table not created
**Fix:** Run `create-contact-messages-table.sql`

### Error: "new row violates row-level security policy"

**Cause:** RLS policy blocking insert
**Fix:** Run `fix-contact-messages-rls.sql`

### Error: "Failed to save to database"

**Cause:** Generic error, check console for details
**Fix:** 
1. Check browser console for specific error
2. Verify Supabase connection
3. Check table exists
4. Verify RLS policies

### Error: "Cannot find name 'supabase'"

**Cause:** Import issue
**Fix:** Make sure `src/lib/supabase.ts` exists and exports properly

## Quick Fixes

### Fix 1: Recreate RLS Policies
```sql
-- Run in Supabase SQL Editor
-- See: fix-contact-messages-rls.sql
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON contact_messages;
CREATE POLICY "Enable insert for all users"
  ON contact_messages FOR INSERT TO public WITH CHECK (true);
```

### Fix 2: Disable RLS Temporarily (Testing Only!)
```sql
-- ONLY FOR TESTING - NOT FOR PRODUCTION
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable:
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
```

### Fix 3: Check Supabase Client
```typescript
// In browser console
import { supabase } from './src/lib/supabase';
console.log('Supabase client:', supabase);

// Try manual insert
const { data, error } = await supabase
  .from('contact_messages')
  .insert([{ 
    name: 'Test', 
    email: 'test@test.com', 
    subject: 'test', 
    message: 'test' 
  }])
  .select();

console.log('Result:', { data, error });
```

## Verification Checklist

After fixing, verify everything works:

- [ ] Browser console shows success messages
- [ ] No error messages in console
- [ ] Form shows success message
- [ ] Form resets after submission
- [ ] Message appears in Supabase table
- [ ] Test in all 4 languages
- [ ] Test on mobile and desktop

## SQL Scripts Reference

| Script | Purpose |
|--------|---------|
| `create-contact-messages-table.sql` | Create table initially |
| `fix-contact-messages-rls.sql` | Fix RLS policy issues |
| `test-contact-messages.sql` | Test table functionality |

## Debug Mode

The emailService.ts now has extensive logging. Watch console for:

```
🚀 Starting contact form submission...
📝 Attempting to save message to database...
📦 Message data prepared: {...}
✅ Message saved successfully
✅ Database save successful!
⚠️ Email notification failed (optional)
```

## Still Not Working?

1. **Share console error messages** - Screenshot the browser console
2. **Check Supabase logs** - Dashboard → Logs → Error logs
3. **Verify table structure** - Run test-contact-messages.sql
4. **Test with curl** - Verify Supabase API directly:

```bash
curl -X POST 'https://YOUR-PROJECT.supabase.co/rest/v1/contact_messages' \
  -H "apikey: YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@test.com",
    "subject": "test",
    "message": "test"
  }'
```

## Support

- Check browser console first (most info there)
- Review Supabase table editor
- Run test SQL scripts
- Check RLS policies
- Verify environment variables

**Most common fix:** Run `fix-contact-messages-rls.sql` ✅

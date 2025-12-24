# Contact Form Setup Guide - Supabase + Email

This guide explains how to set up the contact form with Supabase database storage and optional email notifications.

## Architecture Overview

```
User fills form
    ↓
Submit to Supabase (Primary - Always happens)
    ↓
Save to contact_messages table
    ↓
Send email notification via EmailJS (Optional - Best effort)
    ↓
Success! Message saved + Admin notified
```

## Benefits

✅ **Message History**: All messages saved in database
✅ **Admin Dashboard**: View and manage messages
✅ **Email Notifications**: Get notified of new messages (optional)
✅ **No Data Loss**: Even if email fails, message is saved
✅ **Free**: Completely free with Supabase free tier
✅ **Status Tracking**: Mark messages as read/replied/archived

## Step 1: Create Supabase Table

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the SQL script: `create-contact-messages-table.sql`

This creates:
- ✅ `contact_messages` table with all fields
- ✅ Indexes for better performance
- ✅ Row Level Security (RLS) policies
- ✅ Auto-update trigger for `updated_at`
- ✅ Statistics function

### Table Structure

```sql
contact_messages (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',  -- unread, read, replied, archived
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_agent TEXT,
  ip_address TEXT
)
```

## Step 2: Verify Supabase Configuration

Make sure your `.env` file has Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: (Optional) Setup Email Notifications

If you want to receive email notifications when users submit the form:

### Option A: EmailJS (Recommended)

1. Create account at [EmailJS.com](https://www.emailjs.com/)
2. Connect your email (Gmail recommended)
3. Create email template (see template below)
4. Add to `.env`:

```bash
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

#### EmailJS Template

```
Subject: New Contact Message from {{from_name}}

Name: {{from_name}}
Email: {{from_email}}
Subject: {{subject}}

Message:
{{message}}

---
Sent from Islamic Library Contact Form
Reply to: {{reply_to}}
```

### Option B: Skip Email Notifications

- Simply don't add EmailJS credentials
- Messages will still be saved to database
- You can check messages directly in Supabase dashboard

## Step 4: Test the Contact Form

1. Start development server:
```bash
npm run dev
```

2. Navigate to Contact page
3. Fill and submit form
4. Verify:
   - ✅ Success message appears
   - ✅ Form resets
   - ✅ Check Supabase dashboard → `contact_messages` table
   - ✅ (Optional) Check your email inbox

## Step 5: View Messages in Supabase

### Via Dashboard
1. Go to Supabase project
2. Navigate to **Table Editor**
3. Select `contact_messages` table
4. View all submitted messages

### Via SQL Query
```sql
-- Get all unread messages
SELECT * FROM contact_messages 
WHERE status = 'unread' 
ORDER BY created_at DESC;

-- Get message statistics
SELECT get_contact_message_stats();

-- Get messages from today
SELECT * FROM contact_messages 
WHERE DATE(created_at) = CURRENT_DATE;
```

## API Functions

The `emailService.ts` provides these functions:

### Submit Contact Form
```typescript
import { submitContactForm } from '../lib/emailService';

const result = await submitContactForm({
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'general-inquiry',
  message: 'Hello...'
});

if (result.success) {
  console.log('Message saved!');
}
```

### Get Messages (Admin)
```typescript
import { getContactMessages } from '../lib/emailService';

// Get all messages
const { data, error } = await getContactMessages();

// Get unread messages only
const { data, error } = await getContactMessages({ 
  status: 'unread',
  limit: 10 
});
```

### Update Message Status (Admin)
```typescript
import { updateMessageStatus } from '../lib/emailService';

await updateMessageStatus(messageId, 'read');
await updateMessageStatus(messageId, 'replied');
await updateMessageStatus(messageId, 'archived');
```

## Security Features

### Row Level Security (RLS)
- ✅ Anyone can submit messages (insert)
- ✅ Users can only read their own messages
- ✅ Service role can manage all (admin)
- ✅ No anonymous reads (security)

### Data Privacy
- ✅ User agent captured (for spam detection)
- ✅ IP address optional (not implemented yet)
- ✅ Email validation on frontend
- ✅ Required fields enforced

## Message Status Workflow

```
unread → read → replied → archived
  ↓       ↓       ↓
  └───────┴───────┘
     (can skip steps)
```

- **unread**: New message (default)
- **read**: Admin has viewed the message
- **replied**: Admin has responded to user
- **archived**: Message is resolved/closed

## Future Enhancements (Optional)

### 1. Admin Dashboard Page
Create a page to view and manage messages:
```typescript
// pages/AdminContactMessages.tsx
- List all messages
- Filter by status
- Mark as read/replied
- Search messages
- Reply to users
```

### 2. Auto-Reply Email
Send automatic confirmation email to users:
```
"Thank you for contacting Islamic Library.
We have received your message and will respond within 24 hours."
```

### 3. Email Notifications via Supabase
Use Supabase Edge Functions instead of EmailJS:
```typescript
// supabase/functions/notify-admin/index.ts
// Trigger on INSERT to contact_messages
// Send email using SendGrid/Resend
```

### 4. Spam Protection
- Add reCAPTCHA
- Rate limiting per IP
- Honeypot fields
- Content filtering

### 5. Message Analytics
- Messages per day chart
- Response time metrics
- Popular subjects
- User locations

## Troubleshooting

### Messages Not Saving
1. Check Supabase connection in browser console
2. Verify table exists in Supabase dashboard
3. Check RLS policies allow insert
4. Verify `.env` has correct credentials

### Email Not Received
1. Check if EmailJS is configured (optional)
2. Message is still saved even if email fails
3. Check EmailJS dashboard for delivery status
4. Verify email template settings

### Permission Errors
1. Run the SQL script to create RLS policies
2. Use service role key for admin operations
3. Anon key is fine for form submissions

## Production Checklist

- [ ] SQL table created in Supabase
- [ ] RLS policies enabled
- [ ] Supabase credentials in Vercel env vars
- [ ] (Optional) EmailJS credentials configured
- [ ] Test form submission on production
- [ ] Verify message appears in Supabase
- [ ] (Optional) Test email notification
- [ ] Monitor message volume
- [ ] Plan admin dashboard (future)

## Support

- Supabase Docs: https://supabase.com/docs
- EmailJS Docs: https://www.emailjs.com/docs/
- Code: `src/lib/emailService.ts`
- Form: `src/pages/ContactPage.tsx`
- SQL: `create-contact-messages-table.sql`

## Status

✅ **PRODUCTION READY**

Contact form fully integrated with Supabase database storage and optional email notifications!

# EmailJS Setup Guide

This guide will help you set up EmailJS for the Islamic Library contact form.

## Prerequisites
- A Gmail account (or any email provider)
- EmailJS account (free tier provides 200 emails/month)

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Add Email Service

1. Go to [Email Services](https://dashboard.emailjs.com/admin)
2. Click "Add New Service"
3. Choose your email provider (Gmail recommended)
4. Click "Connect Account" and authorize EmailJS
5. Copy the **Service ID** (you'll need this)

## Step 3: Create Email Template

1. Go to [Email Templates](https://dashboard.emailjs.com/admin/templates)
2. Click "Create New Template"
3. Use this template structure:

```
Subject: New Contact Form Message from {{from_name}}

From: {{from_name}}
Email: {{from_email}}
Subject: {{subject}}

Message:
{{message}}

---
This message was sent from Islamic Library contact form.
Reply to: {{reply_to}}
```

4. Configure template variables:
   - `from_name` - Sender's name
   - `from_email` - Sender's email
   - `subject` - Message subject
   - `message` - Message content
   - `reply_to` - Reply-to email address

5. Set the "To Email" to your receiving email address
6. Copy the **Template ID** (you'll need this)

## Step 4: Get Public Key

1. Go to [Account Settings](https://dashboard.emailjs.com/admin/account)
2. Find your **Public Key** (also called User ID)
3. Copy it (you'll need this)

## Step 5: Configure Environment Variables

1. Create or edit `.env` file in your project root
2. Add the following variables:

```bash
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

3. Replace the placeholder values with your actual IDs

## Step 6: Test the Contact Form

1. Restart your development server: `npm run dev`
2. Go to the Contact page
3. Fill out and submit the form
4. Check your email for the test message

## Troubleshooting

### "Email service is not configured" Error
- Make sure all three environment variables are set in `.env`
- Restart your development server after adding variables
- Check that variable names start with `VITE_`

### Email Not Received
- Check EmailJS dashboard for failed sends
- Verify your template settings
- Check spam folder
- Ensure you haven't exceeded free tier limit (200/month)

### CORS Errors
- EmailJS should handle CORS automatically
- Make sure you're using the latest version of @emailjs/browser
- Check browser console for specific error messages

## Security Notes

1. **Never commit `.env` file to git**
   - It's already in `.gitignore`
   - Use `.env.example` for documentation

2. **Public Key is Safe**
   - The public key (User ID) can be exposed in frontend code
   - EmailJS rate-limits prevent abuse

3. **For Production**
   - Use Vercel environment variables for deployment
   - Add allowed domains in EmailJS dashboard settings

## Production Deployment (Vercel)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add these three variables:
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`
4. Redeploy your application

## Alternative: Using Supabase Edge Functions

If you prefer to use Supabase for email handling:

1. Create a Supabase Edge Function
2. Use a service like SendGrid or Resend
3. Update `sendContactEmail` in `src/lib/emailService.ts`

## Support

For EmailJS support:
- Documentation: https://www.emailjs.com/docs/
- Support: https://www.emailjs.com/support/

For this project:
- Check the implementation in `src/lib/emailService.ts`
- Contact form: `src/pages/ContactPage.tsx`

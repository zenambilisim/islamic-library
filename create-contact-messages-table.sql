-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (submit contact form)
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to read their own messages
CREATE POLICY "Users can read their own messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Create policy for service role to manage all messages (for admin)
CREATE POLICY "Service role can manage all messages"
  ON contact_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a function to get message statistics
CREATE OR REPLACE FUNCTION get_contact_message_stats()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total', (SELECT COUNT(*) FROM contact_messages),
    'unread', (SELECT COUNT(*) FROM contact_messages WHERE status = 'unread'),
    'read', (SELECT COUNT(*) FROM contact_messages WHERE status = 'read'),
    'replied', (SELECT COUNT(*) FROM contact_messages WHERE status = 'replied'),
    'archived', (SELECT COUNT(*) FROM contact_messages WHERE status = 'archived'),
    'today', (SELECT COUNT(*) FROM contact_messages WHERE DATE(created_at) = CURRENT_DATE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to table
COMMENT ON TABLE contact_messages IS 'Stores contact form submissions from the Islamic Library website';
COMMENT ON COLUMN contact_messages.status IS 'Message status: unread, read, replied, or archived';
COMMENT ON COLUMN contact_messages.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN contact_messages.ip_address IS 'User IP address (optional, for spam prevention)';

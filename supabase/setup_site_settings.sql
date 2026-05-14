-- SQL Script to set up site_settings table
-- Run this in your Supabase SQL Editor

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
-- Allow everyone to read settings
DROP POLICY IF EXISTS "Allow public read access" ON public.site_settings;
CREATE POLICY "Allow public read access" ON public.site_settings
    FOR SELECT USING (true);

-- Allow authenticated users (admins) to manage settings
DROP POLICY IF EXISTS "Allow admin all access" ON public.site_settings;
CREATE POLICY "Allow admin all access" ON public.site_settings
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 4. Enable Realtime for this table
-- Note: This requires the publication 'supabase_realtime' to exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'site_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE site_settings;
  END IF;
END $$;

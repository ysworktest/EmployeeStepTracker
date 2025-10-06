/*
  # Create Global Settings Table

  1. New Tables
    - `global_settings`
      - `id` (uuid, primary key) - Unique identifier for the settings record
      - `dailyStepGoal` (integer, not null) - Daily step goal for all users
      - `charityAmountPerGoal` (numeric, not null) - Charity donation amount per goal achieved
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last updated timestamp

  2. Security
    - Enable RLS on `global_settings` table
    - Add policy for public read access
    - Add policy for authenticated users to update settings (for future admin functionality)

  3. Initial Data
    - Insert one default record with:
      - dailyStepGoal: 10000
      - charityAmountPerGoal: 15.00
*/

-- Create global_settings table
CREATE TABLE IF NOT EXISTS global_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "dailyStepGoal" integer NOT NULL DEFAULT 10000,
  "charityAmountPerGoal" numeric(10, 2) NOT NULL DEFAULT 15.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Global settings policies (public read access)
CREATE POLICY "Anyone can read global settings"
  ON global_settings FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can update settings (for future admin functionality)
CREATE POLICY "Authenticated users can update global settings"
  ON global_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default global settings record
INSERT INTO global_settings ("dailyStepGoal", "charityAmountPerGoal") VALUES
  (10000, 15.00)
ON CONFLICT (id) DO NOTHING;

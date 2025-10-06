/*
  # Create Companies and Employees Tables

  1. New Tables
    - `companies`
      - `id` (uuid, primary key) - Unique identifier for each company
      - `name` (text, unique, not null) - Company name
      - `created_at` (timestamptz) - Record creation timestamp
    
    - `employees`
      - `employeeId` (text, primary key) - Employee identifier (format: K + 6 chars)
      - `company` (text, not null) - Company name
      - `isActive` (boolean, default true) - Active status flag
      - `deviceId` (text, nullable) - Unique device identifier
      - `profileName` (text, nullable) - Employee profile name
      - `registrationDate` (timestamptz, nullable) - Device registration timestamp
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access on companies table
    - Add policies for authenticated and anonymous users to read and insert employees
    - Add unique constraint on deviceId to prevent duplicate device registrations

  3. Initial Data
    - Insert three predefined companies: Tuas, Zoushan, Batam
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  "employeeId" text PRIMARY KEY,
  company text NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "deviceId" text,
  "profileName" text,
  "registrationDate" timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint on deviceId to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS unique_device_id ON employees("deviceId") WHERE "deviceId" IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Companies table policies (public read access)
CREATE POLICY "Anyone can read companies"
  ON companies FOR SELECT
  TO public
  USING (true);

-- Employees table policies (allow read and insert for all users)
CREATE POLICY "Anyone can read employees"
  ON employees FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert employees"
  ON employees FOR INSERT
  TO public
  WITH CHECK (true);

-- Insert predefined companies
INSERT INTO companies (name) VALUES
  ('Tuas'),
  ('Zoushan'),
  ('Batam')
ON CONFLICT (name) DO NOTHING;
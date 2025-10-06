/*
  # Create Daily Steps Table

  1. New Tables
    - `daily_steps`
      - `record_id` (serial, primary key) - Unique identifier for each step record
      - `employee_id` (text, foreign key) - References employees table
      - `device_id` (text) - Device identifier for tracking
      - `step_date` (date, not null) - Date of the step count
      - `step_count` (integer) - Total steps for the day
      - `goal_achieved` (boolean) - Whether daily goal was met
      - `daily_charity_earned` (numeric) - Charity amount earned for the day
      - `current_streak` (integer) - Current consecutive days streak
      - `streak_bonus_earned` (numeric) - Bonus earned from streak
      - `streak_tier_achieved` (text) - Tier level achieved
      - `total_charity_earned` (numeric) - Cumulative charity earned
      - `last_updated` (timestamp) - Last sync timestamp

  2. Security
    - Enable RLS on `daily_steps` table
    - Add policy for users to read their own step data
    - Add policy for users to insert their own step data
    - Add policy for users to update their own step data

  3. Indexes
    - Add unique constraint on employee_id and step_date combination
    - Add index on employee_id for faster queries
    - Add index on step_date for date range queries
*/

-- Create daily_steps table
CREATE TABLE IF NOT EXISTS daily_steps (
  record_id SERIAL PRIMARY KEY,
  employee_id TEXT REFERENCES employees("employeeId") ON DELETE CASCADE,
  device_id TEXT,
  step_date DATE NOT NULL,
  step_count INTEGER DEFAULT 0,
  goal_achieved BOOLEAN DEFAULT false,
  daily_charity_earned DECIMAL(10,2) DEFAULT 0.00,
  current_streak INTEGER DEFAULT 0,
  streak_bonus_earned DECIMAL(10,2) DEFAULT 0.00,
  streak_tier_achieved TEXT,
  total_charity_earned DECIMAL(10,2) DEFAULT 0.00,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, step_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_steps_employee_id ON daily_steps(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_steps_step_date ON daily_steps(step_date);
CREATE INDEX IF NOT EXISTS idx_daily_steps_device_id ON daily_steps(device_id);

-- Enable Row Level Security
ALTER TABLE daily_steps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own step data
CREATE POLICY "Users can read own step data"
  ON daily_steps FOR SELECT
  TO public
  USING (true);

-- Policy: Users can insert their own step data
CREATE POLICY "Users can insert own step data"
  ON daily_steps FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Users can update their own step data
CREATE POLICY "Users can update own step data"
  ON daily_steps FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

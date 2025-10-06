/*
  # Create Streak Tracking System Tables

  1. New Tables
    - `streak_bonus_tiers`
      - `tier_id` (serial, primary key) - Unique identifier for each tier
      - `consecutive_days` (integer, unique, not null) - Number of consecutive days required
      - `bonus_amount` (decimal, not null) - Bonus amount earned at this tier
      - `tier_name` (varchar) - Display name for the tier (e.g., "Bronze Streak")
      - `display_order` (integer) - Order for displaying tiers in UI

    - `employee_streaks`
      - `employee_id` (varchar, primary key, foreign key) - References employees table
      - `current_streak_days` (integer, default 0) - Current consecutive days streak
      - `longest_streak_days` (integer, default 0) - Longest streak ever achieved
      - `last_goal_achieved_date` (date) - Last date the daily goal was achieved
      - `total_streak_bonuses_earned` (decimal, default 0.00) - Cumulative streak bonuses
      - `last_updated` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS on both tables
    - Add public read-only policy for streak_bonus_tiers (reference data)
    - Add public read, insert, and update policies for employee_streaks

  3. Indexes
    - Add indexes on streak_bonus_tiers for consecutive_days and display_order
    - Add indexes on employee_streaks for last_goal_achieved_date and current_streak_days

  4. Initial Data
    - Insert 9 predefined streak bonus tiers with progressive rewards
*/

-- Create streak_bonus_tiers reference table
CREATE TABLE IF NOT EXISTS streak_bonus_tiers (
  tier_id SERIAL PRIMARY KEY,
  consecutive_days INTEGER UNIQUE NOT NULL,
  bonus_amount DECIMAL(10,2) NOT NULL,
  tier_name VARCHAR(50),
  display_order INTEGER,
  CONSTRAINT chk_positive_days CHECK (consecutive_days > 0),
  CONSTRAINT chk_positive_bonus CHECK (bonus_amount >= 0)
);

-- Create indexes for streak_bonus_tiers
CREATE INDEX IF NOT EXISTS idx_streak_tiers_consecutive_days ON streak_bonus_tiers(consecutive_days);
CREATE INDEX IF NOT EXISTS idx_streak_tiers_display_order ON streak_bonus_tiers(display_order);

-- Insert predefined streak bonus tiers
INSERT INTO streak_bonus_tiers (consecutive_days, bonus_amount, tier_name, display_order) VALUES
  (3, 10.00, 'Bronze Streak', 1),
  (7, 30.00, 'Silver Streak', 2),
  (10, 40.00, 'Gold Streak', 3),
  (14, 60.00, 'Platinum Streak', 4),
  (17, 70.00, 'Diamond Streak', 5),
  (21, 100.00, 'Elite Streak', 6),
  (24, 110.00, 'Champion Streak', 7),
  (28, 130.00, 'Legend Streak', 8),
  (31, 150.00, 'Master Streak', 9)
ON CONFLICT (consecutive_days) DO NOTHING;

-- Create employee_streaks tracking table
CREATE TABLE IF NOT EXISTS employee_streaks (
  employee_id VARCHAR(50) PRIMARY KEY REFERENCES employees("employeeId") ON DELETE CASCADE,
  current_streak_days INTEGER DEFAULT 0 NOT NULL,
  longest_streak_days INTEGER DEFAULT 0 NOT NULL,
  last_goal_achieved_date DATE,
  total_streak_bonuses_earned DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_current_streak_positive CHECK (current_streak_days >= 0),
  CONSTRAINT chk_longest_streak_positive CHECK (longest_streak_days >= 0),
  CONSTRAINT chk_longest_gte_current CHECK (longest_streak_days >= current_streak_days),
  CONSTRAINT chk_total_bonuses_positive CHECK (total_streak_bonuses_earned >= 0)
);

-- Create indexes for employee_streaks
CREATE INDEX IF NOT EXISTS idx_employee_streaks_last_goal_date ON employee_streaks(last_goal_achieved_date);
CREATE INDEX IF NOT EXISTS idx_employee_streaks_current_streak ON employee_streaks(current_streak_days);
CREATE INDEX IF NOT EXISTS idx_employee_streaks_longest_streak ON employee_streaks(longest_streak_days);

-- Enable Row Level Security on both tables
ALTER TABLE streak_bonus_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_streaks ENABLE ROW LEVEL SECURITY;

-- Policies for streak_bonus_tiers (reference data - read-only for all)
CREATE POLICY "Anyone can read streak bonus tiers"
  ON streak_bonus_tiers FOR SELECT
  TO public
  USING (true);

-- Policies for employee_streaks (allow read, insert, and update for all users)
CREATE POLICY "Anyone can read employee streaks"
  ON employee_streaks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert employee streaks"
  ON employee_streaks FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update employee streaks"
  ON employee_streaks FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

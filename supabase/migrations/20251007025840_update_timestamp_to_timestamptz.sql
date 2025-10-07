/*
  # Update Daily Steps Table to Use Timezone-Aware Timestamps

  1. Schema Changes
    - Alter `daily_steps.last_updated` from TIMESTAMP to timestamptz
    - This ensures all timestamps are stored with timezone information
    - Existing data will be interpreted as UTC and converted to timestamptz

  2. Benefits
    - Consistent timezone handling across all timestamp columns
    - Proper timezone conversion when querying from different timezones
    - Maintains UTC as the authoritative time source in the database
    - Enables accurate local time display in client applications

  3. Notes
    - PostgreSQL automatically converts TIMESTAMP to timestamptz by assuming UTC
    - No data loss occurs during this conversion
    - All future inserts will include timezone information
*/

-- Alter the last_updated column to use timestamptz
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_steps' AND column_name = 'last_updated'
    AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE daily_steps 
    ALTER COLUMN last_updated TYPE timestamptz 
    USING last_updated AT TIME ZONE 'UTC';
    
    -- Update the default value to use timezone-aware function
    ALTER TABLE daily_steps 
    ALTER COLUMN last_updated SET DEFAULT now();
  END IF;
END $$;

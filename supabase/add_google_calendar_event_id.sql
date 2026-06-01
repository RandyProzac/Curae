-- Migration to add Google Calendar event ID to appointments table
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

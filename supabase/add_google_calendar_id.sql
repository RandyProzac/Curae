-- Añadir columna para vincular a un calendario especifico de Google en la cuenta maestra
ALTER TABLE public.doctors ADD COLUMN google_calendar_id VARCHAR(255) NULL;

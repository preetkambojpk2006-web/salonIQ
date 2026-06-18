ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS online_booking_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.businesses.online_booking_enabled IS 'When false, the public /book/[slug] page hides slots and shows a "booking closed" message with the salon phone number. Controlled by the salon owner from Settings.';

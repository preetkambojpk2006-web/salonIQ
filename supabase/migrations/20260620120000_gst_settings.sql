ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS gst_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gst_number text,
ADD COLUMN IF NOT EXISTS gst_rate numeric DEFAULT 18,
ADD COLUMN IF NOT EXISTS gst_inclusive boolean DEFAULT false;

COMMENT ON COLUMN businesses.gst_enabled IS 'Whether GST is applied on invoices';
COMMENT ON COLUMN businesses.gst_number IS 'GSTIN of the business';
COMMENT ON COLUMN businesses.gst_rate IS 'Total GST percent, split equally into CGST + SGST';
COMMENT ON COLUMN businesses.gst_inclusive IS 'If true, service prices already include GST; if false, GST added on top';

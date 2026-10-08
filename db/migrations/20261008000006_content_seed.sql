-- Migration 006: Content & Settings Seed
-- Seeds site_settings with default operational and public values
-- Sets up initial trust_bar configuration

INSERT INTO site_settings (key, value, is_public) VALUES
  ('whatsapp_number',       '"+2348070822409"'::jsonb,                     false),
  ('business_name',         '"Keraunous Tech Store"'::jsonb,                true),
  ('business_hours',        '"24/7"'::jsonb,                                true),
  ('address',               '"Ondo State, Nigeria"'::jsonb,                 true),
  ('delivery_info',         '"Nationwide delivery available"'::jsonb,       true),
  ('announcement',          'null'::jsonb,                                  true),
  ('whatsapp_channel_url',  'null'::jsonb,                                  false),
  ('socials',               '{}'::jsonb,                                    true),
  ('official_account_name', '"Keraunous Tech Store"'::jsonb,                true),
  ('hold_hours',            '24'::jsonb,                                    false),
  ('orders_enabled',        'true'::jsonb,                                  false),
  ('maintenance_mode',      'false'::jsonb,                                 false),
  ('order_message_template','null'::jsonb,                                  false),
  ('trust_bar',             '[{"icon":"shield","title":"Genuine Products","subtitle":"Every item verified"},{"icon":"truck","title":"Nationwide Delivery","subtitle":"Oyo, Lagos, Ondo, Ekiti, FCT, Kogi, Ogun"},{"icon":"message-circle","title":"WhatsApp Support","subtitle":"Chat with us 24/7"},{"icon":"refresh-cw","title":"Inspect Before You Pay","subtitle":"Pickup available in Ondo State"}]'::jsonb, true)
ON CONFLICT (key) DO NOTHING;

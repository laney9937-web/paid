ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_role text;

UPDATE users SET staff_role = 'SUPPORT' WHERE id = 'user_ops' AND staff_role IS NULL;

INSERT INTO schema_migrations(version, applied_at)
VALUES ('0003_staff', now())
ON CONFLICT (version) DO NOTHING;

-- Additive: refund cap vs captured, used by concurrent refund requests.

CREATE OR REPLACE FUNCTION refunds_must_not_exceed_captured() RETURNS trigger AS $$
DECLARE
  captured bigint;
  reserved bigint;
BEGIN
  PERFORM 1 FROM payments WHERE transaction_id = NEW.transaction_id FOR UPDATE;
  SELECT captured_minor INTO captured FROM payments WHERE transaction_id = NEW.transaction_id;
  IF captured IS NULL THEN
    RAISE EXCEPTION 'refund requires a captured payment';
  END IF;
  SELECT COALESCE(SUM(amount_minor), 0) INTO reserved
    FROM refunds
    WHERE transaction_id = NEW.transaction_id
      AND state IN ('REQUESTED', 'SUBMITTED', 'PROVIDER_PENDING', 'SUCCEEDED');
  IF reserved > captured THEN
    RAISE EXCEPTION 'refund exceeds captured amount';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS refunds_cap_captured_commit ON refunds;
CREATE CONSTRAINT TRIGGER refunds_cap_captured_commit
AFTER INSERT OR UPDATE ON refunds
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION refunds_must_not_exceed_captured();

INSERT INTO schema_migrations(version, applied_at)
VALUES ('0005_refund_cap_inbox_recovery', now())
ON CONFLICT (version) DO NOTHING;

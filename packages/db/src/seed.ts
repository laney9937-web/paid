import postgres from 'postgres';
import { hmacToken } from '@paid/contracts';
import { loadConfig } from '@paid/config';
import { loadLocalEnv } from './load-env';
import {
  LOCAL_DEV_CREATOR_SESSION,
  LOCAL_DEV_MAGIC_TOKEN,
  LOCAL_DEV_OPS_SESSION,
  LOCAL_DEV_OPS_STEPUP_SESSION,
} from './auth-store';
import { newId } from '@paid/domain';

loadLocalEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
const now = new Date().toISOString();

try {
  await sql`
    INSERT INTO users (id, email, email_digest, created_at, updated_at)
    VALUES ('user_maya', 'maya@paid.example', 'digest_maya', ${now}, ${now})
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`
    INSERT INTO creator_profiles (
      id, user_id, handle, display_name, onboarding_state, lane,
      identity_state, age_state, sanctions_state, jurisdiction, member_since,
      restricted, payout_hold, new_checkout_blocked, created_at, updated_at
    ) VALUES (
      'creator_maya', 'user_maya', 'maya', 'Maya', 'ACTIVE', 'ORDINARY',
      'VERIFIED', 'VERIFIED_ADULT', 'CLEAR', 'US-CA', ${now},
      false, false, false, ${now}, ${now}
    )
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`
    INSERT INTO users (id, email, email_digest, created_at, updated_at, staff_role)
    VALUES ('user_ops', 'ops@paid.example', 'digest_ops', ${now}, ${now}, 'SUPPORT')
    ON CONFLICT (id) DO UPDATE SET staff_role = EXCLUDED.staff_role
  `;
  await sql`
    INSERT INTO users (id, email, email_digest, created_at, updated_at, staff_role)
    VALUES ('user_ops_risk', 'ops-risk@paid.example', 'digest_ops_risk', ${now}, ${now}, 'RISK')
    ON CONFLICT (id) DO UPDATE SET staff_role = EXCLUDED.staff_role
  `;
  await sql`UPDATE users SET staff_role = NULL WHERE id = 'user_maya'`;
  await sql`
    INSERT INTO staff_role_grants (user_id, role, granted_at)
    VALUES
      ('user_ops', 'SUPPORT', ${now}),
      ('user_ops_risk', 'RISK', ${now}),
      ('user_ops_risk', 'PAYMENTS', ${now}),
      ('user_ops_risk', 'DISPUTES', ${now})
    ON CONFLICT DO NOTHING
  `;
  const keyring = loadConfig().tokenKeyring;
  const creatorSession = hmacToken(keyring, LOCAL_DEV_CREATOR_SESSION);
  const opsSession = hmacToken(keyring, LOCAL_DEV_OPS_SESSION);
  const opsStepUp = hmacToken(keyring, LOCAL_DEV_OPS_STEPUP_SESSION);
  const magic = hmacToken(keyring, LOCAL_DEV_MAGIC_TOKEN);
  const later = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
  const stepUpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO sessions (
      id, user_id, token_hash, kind, expires_at, created_at, auth_method, auth_strength, authenticated_at
    )
    VALUES (${newId()}, 'user_maya', ${creatorSession.digestHex}, 'CREATOR', ${later}, ${now}, 'EMAIL_LINK', 'EMAIL_LINK', ${now})
    ON CONFLICT (token_hash) DO NOTHING
  `;
  await sql`
    INSERT INTO sessions (
      id, user_id, token_hash, kind, expires_at, created_at, auth_method, auth_strength, authenticated_at
    )
    VALUES (${newId()}, 'user_ops', ${opsSession.digestHex}, 'OPS', ${later}, ${now}, 'EMAIL_LINK', 'EMAIL_LINK', ${now})
    ON CONFLICT (token_hash) DO NOTHING
  `;
  await sql`
    INSERT INTO sessions (
      id, user_id, token_hash, kind, expires_at, created_at, auth_method, auth_strength,
      authenticated_at, step_up_expires_at
    )
    VALUES (
      ${newId()}, 'user_ops_risk', ${opsStepUp.digestHex}, 'OPS', ${later}, ${now},
      'EMAIL_LINK', 'STEP_UP', ${now}, ${stepUpExpiry}
    )
    ON CONFLICT (token_hash) DO NOTHING
  `;
  await sql`
    INSERT INTO auth_tokens (
      id, user_id, email_digest, digest_hex, key_version, purpose, expires_at, consumed_at, created_at
    ) VALUES (
      ${newId()}, 'user_maya', 'digest_maya', ${magic.digestHex}, ${magic.keyVersion},
      'MAGIC_LINK', ${later}, null, ${now}
    )
    ON CONFLICT (digest_hex) DO NOTHING
  `;
  await sql`
    INSERT INTO transaction_links (
      id, creator_id, share_id, state, amount_minor, currency, category, delivery_duration,
      lane, note, terms_hash, activated_at, expires_at, created_at, updated_at, version
    ) VALUES (
      'link_maya_seed', 'creator_maya', 'share_maya_demo', 'ACTIVE', 5000, 'USD',
      'DIGITAL_COMMISSION', 'PT48H', 'ORDINARY', 'Protected digital commission',
      'seed-terms', ${now}, ${later}, ${now}, ${now}, 1
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log('seeded synthetic maya@paid.example');
} finally {
  await sql.end();
}

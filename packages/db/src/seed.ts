import postgres from 'postgres';
import { loadLocalEnv } from './load-env';

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
    INSERT INTO users (id, email, email_digest, created_at, updated_at)
    VALUES ('user_ops', 'ops@paid.example', 'digest_ops', ${now}, ${now})
    ON CONFLICT (id) DO NOTHING
  `;
  console.log('seeded synthetic maya@paid.example');
} finally {
  await sql.end();
}

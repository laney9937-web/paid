import { CreatorNav } from '../../nav';

export default function SecurityPage() {
  return (
    <main className="page">
      <h1>Security</h1>
      <p>
        Passkeys are the preferred sign-in. Magic links are short-lived and used once after you
        confirm.
      </p>
      <ul>
        <li>This browser · current session</li>
      </ul>
      <button className="secondary" type="button">
        Revoke other sessions
      </button>
      <CreatorNav current="/creator/account" />
    </main>
  );
}

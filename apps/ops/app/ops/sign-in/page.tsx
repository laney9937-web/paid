export default function OpsSignIn() {
  return (
    <main>
      <p className="meta">Staff surface · isolated session</p>
      <h1>Paid operations</h1>
      <p>Sign in with a staff passkey. Order codes are not credentials.</p>
      <form>
        <label htmlFor="email">Staff email</label>
        <p>
          <input id="email" name="email" type="email" autoComplete="username" required />
        </p>
        <button type="submit">Continue with passkey</button>
      </form>
    </main>
  );
}

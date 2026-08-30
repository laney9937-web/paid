'use client';

export function MagicContinueForm({ token }: { token: string }) {
  return (
    <form
      method="post"
      action="/creator/sign-in/continue/submit"
      className="stack"
      style={{ marginTop: 24 }}
    >
      <input type="hidden" name="token" value={token} />
      <button className="primary" type="submit" data-testid="magic-continue">
        Sign in
      </button>
    </form>
  );
}

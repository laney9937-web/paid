'use client';

export function OpsMagicContinueForm({ token }: { token: string }) {
  return (
    <form method="post" action="/ops/sign-in/continue/submit">
      <input type="hidden" name="token" value={token} />
      <button type="submit" data-testid="ops-magic-continue">
        Sign in
      </button>
    </form>
  );
}

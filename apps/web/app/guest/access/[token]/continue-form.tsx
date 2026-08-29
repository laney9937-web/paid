'use client';

export function ContinueForm({ token }: { token: string }) {
  return (
    <form
      method="post"
      action={`/guest/access/${encodeURIComponent(token)}/continue`}
      className="stack"
      style={{ marginTop: 24 }}
    >
      <button className="primary" type="submit" data-testid="guest-continue">
        Continue
      </button>
    </form>
  );
}

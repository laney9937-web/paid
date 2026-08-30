export default function DisputePage() {
  return (
    <main className="page">
      <h1>Open a dispute</h1>
      <p className="meta">Buyer protection window is snapshotted on the purchase.</p>
      <form className="stack" method="post" action="/api/guest/dispute">
        <div className="field">
          <label htmlFor="reasonCode">Reason</label>
          <select id="reasonCode" name="reasonCode" defaultValue="NOT_DELIVERED">
            <option value="NOT_DELIVERED">Not delivered</option>
            <option value="NOT_AS_DESCRIBED">Not as described</option>
          </select>
        </div>
        <button className="primary" type="submit" data-testid="open-dispute">
          Open dispute
        </button>
      </form>
    </main>
  );
}

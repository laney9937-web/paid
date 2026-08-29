export default function ReportPage() {
  return (
    <main className="page">
      <h1>Report</h1>
      <form className="stack" method="post" action="/api/ops/reports">
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category">
            <option value="CHILD_SAFETY">Child safety</option>
            <option value="NON_CONSENSUAL">Non-consensual</option>
            <option value="PROSTITUTION_TRAFFICKING">Prostitution / trafficking</option>
            <option value="TRANSACTION_LAUNDERING">Transaction laundering</option>
            <option value="IP_DMCA">IP / DMCA</option>
            <option value="LEGAL_PRIVACY">Legal / privacy</option>
            <option value="SANCTIONS">Sanctions</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="details">Details</label>
          <input id="details" name="details" maxLength={500} />
        </div>
        <button className="primary" type="submit">
          Submit report
        </button>
      </form>
      <p className="meta">Do not upload files. Text only.</p>
    </main>
  );
}

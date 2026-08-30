export default function ReviewPage() {
  return (
    <main className="page">
      <h1>Leave a review</h1>
      <p className="meta">
        One eligible transaction allows at most one review. Creators cannot review themselves.
      </p>
      <form className="stack" method="post" action="/api/guest/review">
        <div className="field">
          <label htmlFor="rating">Rating</label>
          <select id="rating" name="rating" defaultValue="5">
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="body">Comments</label>
          <input id="body" name="body" maxLength={2000} defaultValue="On time." />
        </div>
        <button className="primary" type="submit" data-testid="submit-review">
          Submit review
        </button>
      </form>
    </main>
  );
}

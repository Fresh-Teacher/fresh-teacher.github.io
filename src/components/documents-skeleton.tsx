// Placeholder shown while a documents page loads, so the footer never jumps up under the top bar.
export function DocumentsSkeleton() {
  return (
    <div className="documents-skeleton" role="status" aria-label="Loading documents">
      <div className="documents-skeleton__search" />
      <div className="documents-skeleton__grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="documents-skeleton__card">
            <div className="documents-skeleton__thumb" />
            <div className="documents-skeleton__line" />
            <div className="documents-skeleton__line documents-skeleton__line--short" />
          </div>
        ))}
      </div>
    </div>
  );
}

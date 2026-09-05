export function BootSkeleton() {
  return (
    <div className="app-body boot-skeleton" aria-hidden="true">
      <div className="boot-skeleton-sidebar">
        <div className="boot-skeleton-block is-avatar" />
        <div className="boot-skeleton-block is-nav" />
        <div className="boot-skeleton-block is-nav" />
        <div className="boot-skeleton-block is-nav" />
      </div>
      <div className="boot-skeleton-main">
        <div className="boot-skeleton-card">
          <div className="boot-skeleton-toolbar">
            <div className="boot-skeleton-block is-square" />
            <div className="boot-skeleton-block is-title" />
            <div className="boot-skeleton-block is-square" />
          </div>
          <div className="boot-skeleton-weekdays">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="boot-skeleton-block is-weekday" />
            ))}
          </div>
          <div className="boot-skeleton-grid">
            {Array.from({ length: 35 }, (_, index) => (
              <div key={index} className="boot-skeleton-cell" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

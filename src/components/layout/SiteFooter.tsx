/**
 * SITE FOOTER — UFC.com editorial footer (ported from Manus redesign)
 * Rendered globally from the root layout.
 */

export default function SiteFooter() {
  return (
    <footer style={{ backgroundColor: '#0D0D0D', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: '#D20A0A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  color: '#FFFFFF',
                }}
              >
                UFC
              </span>
            </div>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Predictions — Model Version 1.0.0
            </span>
          </div>
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.25)',
              textAlign: 'center',
            }}
          >
            AI-powered predictions for informational purposes only. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

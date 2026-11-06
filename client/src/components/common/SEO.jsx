// client/src/components/common/SEO.jsx

export default function SEO({
  title = "StockPulse | Realtime Indian Stock Intelligence & Research Terminal",
  description = "Institutional-grade NSE India equity research, proprietary 100-point PulseScore, real-time alert triggers, and multi-year forecasting for retail investors.",
  canonical = null,
  ogType = "website",
  jsonLd = null,
}) {
  const defaultBase = "https://stockpulse-mu-three.vercel.app";
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const canonicalUrl = canonical || `${defaultBase}${currentPath}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="StockPulse" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}

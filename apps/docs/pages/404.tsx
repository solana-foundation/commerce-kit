/* eslint-disable @next/next/no-head-element, @next/next/no-html-link-for-pages */
// Minimal 404 page to avoid SSR context issues
export default function Custom404() {
  return (
    <html>
      <head>
        <title>404 - Page Not Found</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ 
        margin: 0, 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', margin: 0 }}>
            404 - Page Not Found
          </h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <a href="/" style={{
            display: 'inline-block',
            backgroundColor: '#0070f3',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            textDecoration: 'none'
          }}>
            Go Home
          </a>
        </div>
      </body>
    </html>
  );
}
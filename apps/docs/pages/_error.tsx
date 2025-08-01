/* eslint-disable @next/next/no-head-element, @next/next/no-html-link-for-pages */
// Minimal error page to avoid SSR context issues
function CustomError({ statusCode = 500 }: { statusCode?: number }) {
  return (
    <html>
      <head>
        <title>{statusCode} - Error</title>
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
            {statusCode === 404 
              ? '404 - Page Not Found' 
              : `${statusCode} - Server Error`
            }
          </h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            {statusCode === 404 
              ? "The page you're looking for doesn't exist." 
              : 'An error occurred while processing your request.'
            }
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

export default CustomError;
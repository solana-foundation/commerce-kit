const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3456;

// Read the iframe bundle
const iframeBundlePath = path.join(__dirname, '../dist/iframe-app/index.global.js');
const iframeStylesPath = path.join(__dirname, '../dist/iframe-app/index.css');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (pathname === '/' || pathname === '/ck') {
    // Check if bundle exists
    if (!fs.existsSync(iframeBundlePath)) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: sans-serif; padding: 40px; }
            code { background: #f0f0f0; padding: 2px 4px; }
          </style>
        </head>
        <body>
          <h1>Iframe bundle not found!</h1>
          <p>Please build the iframe first by running:</p>
          <pre><code>cd packages/react-sdk && pnpm run build:iframe</code></pre>
        </body>
        </html>
      `);
      return;
    }

    // Read the bundle
    const bundleContent = fs.readFileSync(iframeBundlePath, 'utf8');
    const stylesContent = fs.existsSync(iframeStylesPath) 
      ? fs.readFileSync(iframeStylesPath, 'utf8') 
      : '';

    // Create the HTML with the bundle inlined
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Commerce Kit Tip Frame</title>
  <style>${stylesContent}</style>
</head>
<body>
  <div id="root"></div>
  <script>${bundleContent}</script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } 
  else if (pathname === '/button-demo') {
    // Demo page for the tip button
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Commerce Kit Button Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 40px;
      background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
      min-height: 100vh;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    h1 {
      margin: 0 0 40px 0;
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #0066FF 0%, #5500FF 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-align: center;
    }
    
    .demo-section {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      margin-bottom: 30px;
    }
    
    .demo-section h3 {
      margin: 0 0 20px 0;
      color: #333;
    }
    
    .button-container {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      align-items: center;
    }
    
    .code-block {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 14px;
      overflow-x: auto;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Commerce Kit Button Demo</h1>
    
    <div class="demo-section">
      <h3>Basic Tip Button</h3>
      <div class="button-container">
        <div id="basic-button"></div>
      </div>
      <div class="code-block">CommerceKit.createTipButton({ wallet: 'YourWallet123' })</div>
    </div>
    
    <div class="demo-section">
      <h3>Custom Styled Buttons</h3>
      <div class="button-container">
        <div id="green-button"></div>
        <div id="black-button"></div>
        <div id="custom-button"></div>
      </div>
      <div class="code-block">CommerceKit.createTipButton({
  primaryColor: '#4CAF50',
  borderRadius: 'full',
  text: 'Support Me'
})</div>
    </div>
    
    <div class="demo-section">
      <h3>Custom Configuration</h3>
      <div class="button-container">
        <div id="configured-button"></div>
      </div>
      <div class="code-block">CommerceKit.createTipButton({
  amount: 10,
  currencies: ['USDC', 'SOL'],
  tipPresets: [5, 10, 25, 50],
  merchantName: 'My Business',
  onPayment: (data) => console.log('Payment:', data)
})</div>
    </div>
  </div>

  <script src="/tip-button"></script>
  <script>
    // Create buttons
    document.getElementById('basic-button').appendChild(
      CommerceKit.createTipButton({ 
        wallet: 'YourWallet123',
        onPayment: (data) => alert('Payment received: $' + data.amount)
      })
    );
    
    document.getElementById('green-button').appendChild(
      CommerceKit.createTipButton({ 
        primaryColor: '#4CAF50',
        borderRadius: 'full',
        text: 'Support Me',
        wallet: 'YourWallet123'
      })
    );
    
    document.getElementById('black-button').appendChild(
      CommerceKit.createTipButton({ 
        primaryColor: '#000000',
        text: 'Tip',
        wallet: 'YourWallet123'
      })
    );
    
    document.getElementById('custom-button').appendChild(
      CommerceKit.createTipButton({ 
        primaryColor: '#FF6B6B',
        secondaryColor: '#FFE66D',
        borderRadius: 'lg',
        text: 'Buy Coffee',
        wallet: 'YourWallet123'
      })
    );
    
    document.getElementById('configured-button').appendChild(
      CommerceKit.createTipButton({
        amount: 10,
        currencies: ['USDC', 'SOL'],
        tipPresets: [5, 10, 25, 50],
        merchantName: 'My Business',
        wallet: 'YourWallet123',
        onPayment: (data) => console.log('Payment received:', data)
      })
    );
  </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
  else if (pathname === '/demo') {
    // Demo page that embeds the iframe
    const queryString = parsedUrl.search || '';
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Commerce Kit Demo</title>
  <style>
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
      min-height: 100vh;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    h1 {
      margin: 0 0 40px 0;
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #0066FF 0%, #5500FF 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-align: center;
    }
    
    .main-content {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 30px;
      align-items: start;
    }
    
    @media (max-width: 1024px) {
      .main-content {
        grid-template-columns: 1fr;
      }
    }
    
    .iframe-wrapper {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      min-height: 800px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    iframe {
      width: 100%;
      max-width: 600px;
      height: 700px;
      border: none;
      border-radius: 12px;
      background: transparent;
    }
    
    .sidebar {
      position: sticky;
      top: 40px;
    }
    
    .info-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      margin-bottom: 20px;
    }
    
    .info-card h3 {
      margin: 0 0 16px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .params-display {
      background: #f8f9fa;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 0.875rem;
      color: #495057;
      word-break: break-all;
    }
    
    .examples-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .examples-list li {
      margin-bottom: 12px;
    }
    
    .examples-list a {
      display: block;
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 8px;
      text-decoration: none;
      color: #0066FF;
      font-size: 0.925rem;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    
    .examples-list a:hover {
      background: #e9ecef;
      border-color: #0066FF;
      transform: translateX(4px);
    }
    
    .param-info {
      margin-top: 20px;
      padding: 16px;
      background: #e7f3ff;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #004085;
    }
    
    .param-info h4 {
      margin: 0 0 8px 0;
      font-weight: 600;
    }
    
    .param-info code {
      background: #0066FF20;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Commerce Kit Demo</h1>
    
    <div class="main-content">
      <div class="iframe-wrapper">
        <iframe src="/ck${queryString}" id="commerce-iframe"></iframe>
      </div>
      
      <div class="sidebar">
        <div class="info-card">
          <h3>Current Parameters</h3>
          <div class="params-display">${queryString || 'No parameters set'}</div>
        </div>
        
        <div class="info-card">
          <h3>Try These Examples</h3>
          <ul class="examples-list">
            <li><a href="/demo">Default Settings</a></li>
            <li><a href="/demo?amount=10">Pre-selected $10</a></li>
            <li><a href="/demo?amount=5&wallet=YourWalletAddress">Custom wallet + $5</a></li>
            <li><a href="/demo?currencies=USDC,SOL">USDC + SOL</a></li>
            <li><a href="/demo?currencies=USDC">USDC only</a></li>
            <li><a href="/demo?currencies=USDC_DEVNET,SOL_DEVNET">Devnet tokens</a></li>
            <li><a href="/demo?tipPresets=2,10,20,50,100">Custom tip amounts</a></li>
            <li><a href="/demo?primaryColor=%234CAF50&secondaryColor=%2381C784">Green theme</a></li>
            <li><a href="/demo?primaryColor=%23000000&borderRadius=full">Black + Fully rounded</a></li>
            <li><a href="/demo?merchantName=My%20Store&merchantLogo=https://via.placeholder.com/150">Custom merchant</a></li>
          </ul>
        </div>
        
        <div class="info-card">
          <div class="param-info">
            <h4>Configuration Parameters:</h4>
            <div><strong>Basic:</strong></div>
            <div>• <code>mode</code> - tip, cart, or buyNow</div>
            <div>• <code>amount</code> - Pre-selected amount</div>
            <div>• <code>wallet</code> - Destination wallet</div>
            <div>• <code>currencies</code> - Comma-separated currencies (USDC, SOL, USDT, etc.)</div>
            <div>• <code>tipPresets</code> - Custom amounts (comma-separated)</div>
            
            <div style="margin-top: 10px"><strong>Merchant:</strong></div>
            <div>• <code>merchantName</code> - Business name</div>
            <div>• <code>merchantLogo</code> - Logo URL</div>
            
            <div style="margin-top: 10px"><strong>Theme:</strong></div>
            <div>• <code>primaryColor</code> - Main color</div>
            <div>• <code>secondaryColor</code> - Accent color</div>
            <div>• <code>backgroundColor</code> - Background</div>
            <div>• <code>textColor</code> - Text color</div>
            <div>• <code>borderRadius</code> - none, sm, md, lg, xl, full</div>
            <div>• <code>buttonShadow</code> - none, sm, md, lg, xl</div>
            <div>• <code>buttonBorder</code> - none, black-10</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Configuration for the iframe
    const config = {
      mode: 'tip',
      merchant: {
        name: 'Test Merchant',
        wallet: '11111111111111111111111111111111' // Replace with actual wallet
      },
      allowedMints: ['SOL'], // SOL
      tipPresets: [1, 5, 10, 20],
      tipDefaultAmount: 5
    };

    const theme = {
      primaryColor: '#0066FF',
      secondaryColor: '#F0F4FF', 
      backgroundColor: '#FFFFFF',
      textColor: '#1A1A1A',
      borderRadius: 'medium',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      buttonShadow: true
    };

    const iframe = document.getElementById('commerce-iframe');
    
    window.addEventListener('message', (event) => {
      const data = event.data;
      
      switch (data.type) {
        case 'ready':
          console.log('Iframe ready, sending init');
          iframe.contentWindow.postMessage({
            type: 'init',
            config: config,
            theme: theme
          }, '*');
          break;
          
        case 'payment':
          console.log('Payment event:', data);
          alert(\`Payment initiated: \${data.amount} \${data.currency}\`);
          break;
          
        case 'close':
          console.log('Close event');
          break;
      }
    });
  </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } 
  else if (pathname === '/cktip') {
    // CDN widget that renders the button directly
    const queryString = parsedUrl.search || '';
    const params = new URLSearchParams(queryString);
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }
    
    .commerce-tip-button {
      padding: 0.75rem 1.5rem;
      background: ${params.get('primaryColor') || '#0066FF'};
      color: white;
      border: none;
      border-radius: ${params.get('borderRadius') === 'full' ? '50px' : '8px'};
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      outline: none;
      min-width: 44px;
      text-decoration: none;
    }
    
    .commerce-tip-button:hover {
      background: ${params.get('secondaryColor') || '#5500FF'};
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    .commerce-tip-button:active {
      transform: scale(0.97);
    }
    
    .solana-icon {
      width: 21px;
      height: 16px;
      fill: currentColor;
    }
  </style>
</head>
<body>
  <button class="commerce-tip-button" id="tip-button">
    <svg class="solana-icon" viewBox="0 0 21 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.98967 11.7879C4.10222 11.6755 4.25481 11.6123 4.41392 11.6123H19.0941C19.3615 11.6123 19.4954 11.9357 19.3062 12.1247L16.4054 15.0232C16.2929 15.1356 16.1403 15.1988 15.9812 15.1988H1.30102C1.03359 15.1988 0.899716 14.8754 1.08889 14.6864L3.98967 11.7879Z"/>
      <path d="M3.98937 0.959506C4.10191 0.847047 4.25451 0.783875 4.41361 0.783875H19.0938C19.3612 0.783875 19.4951 1.10726 19.3059 1.29628L16.4051 4.19475C16.2926 4.30721 16.14 4.37038 15.9809 4.37038H1.30071C1.03329 4.37038 0.899411 4.047 1.08859 3.85797L3.98937 0.959506Z"/>
      <path d="M16.4054 6.33924C16.2929 6.22675 16.1403 6.16362 15.9812 6.16362H1.30102C1.03359 6.16362 0.899717 6.48697 1.08889 6.676L3.98967 9.57445C4.10222 9.68694 4.25481 9.75012 4.41392 9.75012H19.0941C19.3615 9.75012 19.4954 9.42673 19.3062 9.23769L16.4054 6.33924Z"/>
    </svg>
    <span>${params.get('text') || 'Tip'}</span>
  </button>

  <script>
    document.getElementById('tip-button').addEventListener('click', function() {
      // Build iframe URL with current page's query params
      const params = new URLSearchParams(window.location.search);
      const iframeUrl = window.parent.location.origin + '/ck' + (params.toString() ? '?' + params.toString() : '');
      
      // Create modal
      const overlay = document.createElement('div');
      overlay.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      \`;
      
      const iframe = document.createElement('iframe');
      iframe.src = iframeUrl;
      iframe.style.cssText = \`
        width: 600px;
        height: 700px;
        min-height: 700px;
        border: none;
        outline: none;
        margin: 0;
        padding: 0;
        display: block;
        background: transparent;
        box-shadow: none;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      \`;
      iframe.frameBorder = "0";
      
      function closeModal() {
        window.removeEventListener('message', handleMessage);
        overlay.style.opacity = '0';
        iframe.style.transform = 'scale(0.9)';
        setTimeout(() => window.parent.document.body.removeChild(overlay), 300);
      }
      
      function handleMessage(event) {
        if (event.source !== iframe.contentWindow) return;
        
        const data = event.data;
        
        if (data.type === 'ready') {
          const config = {
            mode: 'tip',
            merchant: {
              name: '${params.get('merchantName') || 'Commerce Kit'}',
              wallet: '${params.get('wallet') || '11111111111111111111111111111111'}',
              logo: '${params.get('merchantLogo') || ''}'
            },
            allowedMints: '${params.get('currencies') || 'USDC'}'.split(','),
            tipPresets: '${params.get('tipPresets') || '1,5,15,25,50'}'.split(',').map(Number),
            tipDefaultAmount: ${params.get('amount') || '5'}
          };
          
          const theme = {
            primaryColor: '${params.get('primaryColor') || '#0066FF'}',
            secondaryColor: '${params.get('secondaryColor') || '#F0F4FF'}',
            backgroundColor: '${params.get('backgroundColor') || '#FFFFFF'}',
            textColor: '${params.get('textColor') || '#1A1A1A'}',
            borderRadius: '${params.get('borderRadius') || 'medium'}',
            fontFamily: '${params.get('fontFamily') || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}',
            buttonShadow: ${params.get('buttonShadow') !== 'false'},
            buttonBorder: '${params.get('buttonBorder') || 'none'}'
          };
          
          iframe.contentWindow.postMessage({ type: 'init', config, theme }, '*');
        }
        else if (data.type === 'close' || data.type === 'payment') {
          closeModal();
        }
        else if (data.type === 'resize' && data.height) {
          const newHeight = Math.max(Math.min(data.height, window.innerHeight * 0.9), 600);
          iframe.style.height = newHeight + 'px';
        }
      }
      
      window.addEventListener('message', handleMessage);
      overlay.appendChild(iframe);
      window.parent.document.body.appendChild(overlay);
      
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        iframe.style.transform = 'scale(1)';
      });
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
      
      document.addEventListener('keydown', function handleKeydown(e) {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', handleKeydown);
        }
      });
    });
  </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
  else if (pathname === '/tip-button') {
    // Tip button script that can be embedded
    const script = `
(function() {
  // Create tip button with Solana logo
  function createTipButton(options = {}) {
    const button = document.createElement('button');
    button.style.cssText = \`
      background: \${options.primaryColor || '#0066FF'};
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: \${options.borderRadius === 'full' ? '50px' : '8px'};
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      outline: none;
    \`;
    
    // Create Solana logo
    const solanaIcon = document.createElement('svg');
    solanaIcon.setAttribute('width', '21');
    solanaIcon.setAttribute('height', '16');
    solanaIcon.setAttribute('viewBox', '0 0 21 16');
    solanaIcon.setAttribute('fill', 'none');
    solanaIcon.style.fill = 'currentColor';
    solanaIcon.innerHTML = \`
      <path d="M3.98967 11.7879C4.10222 11.6755 4.25481 11.6123 4.41392 11.6123H19.0941C19.3615 11.6123 19.4954 11.9357 19.3062 12.1247L16.4054 15.0232C16.2929 15.1356 16.1403 15.1988 15.9812 15.1988H1.30102C1.03359 15.1988 0.899716 14.8754 1.08889 14.6864L3.98967 11.7879Z" fill="currentColor"/>
      <path d="M3.98937 0.959506C4.10191 0.847047 4.25451 0.783875 4.41361 0.783875H19.0938C19.3612 0.783875 19.4951 1.10726 19.3059 1.29628L16.4051 4.19475C16.2926 4.30721 16.14 4.37038 15.9809 4.37038H1.30071C1.03329 4.37038 0.899411 4.047 1.08859 3.85797L3.98937 0.959506Z" fill="currentColor"/>
      <path d="M16.4054 6.33924C16.2929 6.22675 16.1403 6.16362 15.9812 6.16362H1.30102C1.03359 6.16362 0.899717 6.48697 1.08889 6.676L3.98967 9.57445C4.10222 9.68694 4.25481 9.75012 4.41392 9.75012H19.0941C19.3615 9.75012 19.4954 9.42673 19.3062 9.23769L16.4054 6.33924Z" fill="currentColor"/>
    \`;
    
    // Create text span
    const textSpan = document.createElement('span');
    textSpan.textContent = options.text || 'Tip';
    
    // Add icon and text to button
    button.appendChild(solanaIcon);
    button.appendChild(textSpan);
    
    button.addEventListener('mouseenter', () => {
      button.style.background = options.secondaryColor || '#5500FF';
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = options.primaryColor || '#0066FF';
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    });
    
    button.addEventListener('click', () => openTipModal(options));
    
    return button;
  }
  
  // Open tip modal in iframe
  function openTipModal(options = {}) {
    // Build query string from options
    const params = new URLSearchParams();
    if (options.amount) params.set('amount', options.amount);
    if (options.wallet) params.set('wallet', options.wallet);
    if (options.currencies) params.set('currencies', Array.isArray(options.currencies) ? options.currencies.join(',') : options.currencies);
    if (options.tipPresets) params.set('tipPresets', Array.isArray(options.tipPresets) ? options.tipPresets.join(',') : options.tipPresets);
    if (options.merchantName) params.set('merchantName', options.merchantName);
    if (options.merchantLogo) params.set('merchantLogo', options.merchantLogo);
    if (options.primaryColor) params.set('primaryColor', options.primaryColor);
    if (options.secondaryColor) params.set('secondaryColor', options.secondaryColor);
    if (options.backgroundColor) params.set('backgroundColor', options.backgroundColor);
    if (options.textColor) params.set('textColor', options.textColor);
    if (options.borderRadius) params.set('borderRadius', options.borderRadius);
    if (options.buttonShadow) params.set('buttonShadow', options.buttonShadow);
    if (options.buttonBorder) params.set('buttonBorder', options.buttonBorder);
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    \`;
    
    // Create iframe directly (completely unstyled)
    const iframe = document.createElement('iframe');
    const iframeUrl = \`\${window.location.origin}/ck\${params.toString() ? '?' + params.toString() : ''}\`;
    iframe.src = iframeUrl;
    iframe.style.cssText = \`
      width: 600px;
      height: 700px;
      min-height: 700px;
      border: none;
      outline: none;
      margin: 0;
      padding: 0;
      display: block;
      background: transparent;
      box-shadow: none;
      transform: scale(0.9);
      transition: transform 0.3s ease;
    \`;
    iframe.frameBorder = "0";
    
    // Handle iframe messages
    function handleMessage(event) {
      if (event.source !== iframe.contentWindow) return;
      
      const data = event.data;
      
      if (data.type === 'ready') {
        // Send init message when iframe is ready
        const config = {
          mode: 'tip',
          merchant: {
            name: options.merchantName || 'Commerce Kit',
            wallet: options.wallet || '11111111111111111111111111111111',
            logo: options.merchantLogo
          },
          allowedMints: options.currencies || ['USDC'],
          tipPresets: options.tipPresets || [1, 5, 15, 25, 50],
          tipDefaultAmount: options.amount || 5
        };
        
        const theme = {
          primaryColor: options.primaryColor || '#0066FF',
          secondaryColor: options.secondaryColor || '#F0F4FF',
          backgroundColor: options.backgroundColor || '#FFFFFF',
          textColor: options.textColor || '#1A1A1A',
          borderRadius: options.borderRadius || 'medium',
          fontFamily: options.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          buttonShadow: options.buttonShadow !== undefined ? options.buttonShadow : true,
          buttonBorder: options.buttonBorder || 'none'
        };
        
        iframe.contentWindow.postMessage({
          type: 'init',
          config: config,
          theme: theme
        }, '*');
      }
      else if (data.type === 'close' || data.type === 'payment') {
        closeModal();
        if (data.type === 'payment' && options.onPayment) {
          options.onPayment(data);
        }
      }
      else if (data.type === 'resize' && data.height) {
        // Only resize if the new height is reasonable and larger than minimum
        const newHeight = Math.max(Math.min(data.height, window.innerHeight * 0.9), 600);
        iframe.style.height = newHeight + 'px';
      }
    }
    
    function closeModal() {
      window.removeEventListener('message', handleMessage);
      overlay.style.opacity = '0';
      iframe.style.transform = 'scale(0.9)';
      setTimeout(() => document.body.removeChild(overlay), 300);
    }
    
    // Setup
    window.addEventListener('message', handleMessage);
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
    
    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      iframe.style.transform = 'scale(1)';
    });
    
    // Close on overlay click (but not on iframe)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    
    // Close on escape
    function handleKeydown(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeydown);
      }
    }
    document.addEventListener('keydown', handleKeydown);
  }
  
  // Export to global scope
  window.CommerceKit = { createTipButton, openTipModal };
})();
`;

    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(script);
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`
🚀 Commerce Kit Server Running!

Available endpoints:
  
  📍 Commerce Kit iframe:
     http://localhost:${PORT}/ck
  
  📍 Tip Button Widget:
     http://localhost:${PORT}/cktip?text=Support&primaryColor=%23FF6B6B&wallet=YourWallet
  
  📍 Tip Button JavaScript (CDN):
     http://localhost:${PORT}/tip-button
  
  📍 Button Demo (interactive buttons):
     http://localhost:${PORT}/button-demo
  
  📍 Iframe Demo (embedded iframe):
     http://localhost:${PORT}/demo

Press Ctrl+C to stop the server.
  `);
});
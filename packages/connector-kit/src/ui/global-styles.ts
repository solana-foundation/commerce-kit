let hasInjectedArcConnectorStyles = false

function injectArcConnectorGlobalStyles() {
  if (hasInjectedArcConnectorStyles) return
  if (typeof document === 'undefined') return

  const style = document.createElement('style')
  style.setAttribute('data-arc-connector-styles', 'true')
  style.textContent = `
@keyframes arc-spinner-enter { from { opacity: 0; transform: scale(0.5) } to { opacity: 1; transform: scale(1) } }
@keyframes arc-spinner-rotate { to { transform: rotate(360deg) } }
`
  document.head.appendChild(style)
  hasInjectedArcConnectorStyles = true
}

// Initialize immediately in the browser so animations are available
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  injectArcConnectorGlobalStyles()
}

export { injectArcConnectorGlobalStyles }



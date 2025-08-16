export interface ConnectorTheme {
  primaryColor: string
  secondaryColor: string
  borderRadius: number | string
  fontFamily: string
  buttonShadow: 'none' | 'sm' | 'md' | 'lg' | string
  border: 'none' | string
}

export const defaultConnectorTheme: ConnectorTheme = {
  primaryColor: '#111827',
  secondaryColor: '#374151',
  borderRadius: 8,
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji',
  buttonShadow: 'md',
  border: '1px solid #e5e7eb',
}

export function getBorderRadius(value: ConnectorTheme['borderRadius']): string {
  if (typeof value === 'number') return `${value}px`
  return (typeof value === 'string' && value.trim()) ? value : '8px'
}

export function getButtonShadow(value: ConnectorTheme['buttonShadow']): string {
  if (value === 'none') return 'none'
  if (value === 'sm') return '0 1px 2px rgba(0,0,0,0.04)'
  if (value === 'md') return '0 4px 12px rgba(0,0,0,0.08)'
  if (value === 'lg') return '0 10px 24px rgba(0,0,0,0.12)'
  return String(value)
}

export function getButtonBorder(value: ConnectorTheme['border']): string {
  return value === 'none' ? '1.5px solid transparent' : String(value)
}

export function getAccessibleTextColor(hexColor: string): string {
  try {
    // Validate hex color input
    if (!hexColor || typeof hexColor !== 'string') {
      throw new Error('Invalid hex color input')
    }

    const c = hexColor.replace('#', '')

    // Validate hex string length and characters
    if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(c)) {
      throw new Error('Invalid hex color format')
    }

    const bigint = parseInt(
      c.length === 3 ? c.split('').map(x => x + x).join('') : c,
      16
    )
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    return luminance > 0.55 ? '#111827' : '#ffffff'
  } catch {
    // Return dark text as safer default for unknown backgrounds
    return '#111827'
  }
}



import { defineTheme } from '@astryxdesign/core/theme'
import { neutralTheme } from '@astryxdesign/theme-neutral/built'

export const inventoryTheme = defineTheme({
  name: 'inventory-blue',
  extends: neutralTheme,
  typography: {
    scale: { base: 14, ratio: 1.2 },
    body: {
      family: 'Pretendard',
      fallbacks: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    heading: {
      family: 'Pretendard',
      fallbacks: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      weights: { 3: 'bold', 4: 'bold' },
    },
  },
  radius: { base: 4, multiplier: 1 },
  motion: { tempo: 0.9, character: 'crisp' },
  tokens: {
    '--color-accent': ['#1687F8', '#66B6FF'],
    '--color-accent-muted': ['#DCEEFF', '#123B62'],
    '--color-text-accent': ['#0969C8', '#8CC8FF'],
    '--color-icon-accent': ['#1687F8', '#66B6FF'],
    '--color-background-body': ['#F4F8FC', '#111C27'],
    '--color-background-surface': ['#FFFFFF', '#172533'],
    '--color-background-card': ['#FFFFFF', '#172533'],
    '--color-background-muted': ['#EEF5FB', '#1C2E3E'],
    '--color-text-primary': ['#182230', '#F3F8FC'],
    '--color-text-secondary': ['#637083', '#A9B8C8'],
    '--color-border': ['#DCE6EF', '#2B4052'],
    '--color-border-emphasized': ['#B9CAD9', '#496275'],
    '--color-info': ['#1687F8', '#66B6FF'],
    '--color-info-muted': ['#DCEEFF', '#123B62'],
    '--color-success': ['#159455', '#55CE8C'],
    '--color-warning': ['#E58B16', '#F6BD5B'],
    '--color-error': ['#D64550', '#FF7D86'],
    '--radius-element': '6px',
    '--radius-container': '12px',
    '--radius-full': '9999px',
  },
  components: {
    button: {
      'variant:primary': {
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-on-accent)',
      },
    },
  },
})

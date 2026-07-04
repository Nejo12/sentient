export const colors = {
  paper: '#F5EFE6',
  paperStrong: '#FFFFFF',
  paperSoft: '#F6F1E9',
  paperMuted: '#EFEAE1',
  ink: '#2B2521',
  ink72: 'rgba(43, 37, 33, 0.72)',
  ink55: '#6E655E',
  ink40: '#8A817A',
  oxblood: '#7F3523',
  oxbloodStrong: '#632818',
  oxbloodFg: '#FFFFFF',
  clay: '#9C5A44',
  soft: '#F1E3D6',
  olive: '#7C7838',
  oliveSoft: 'rgba(124, 120, 56, 0.12)',
  border: '#E7DFD3',
  borderStrong: '#D5CBBB',
  destructive: '#C4402E',
} as const;

export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 14: 56, 18: 72 } as const;

export const radii = { sm: 8, md: 12, lg: 16, xl: 22, '2xl': 30, pill: 9999 } as const;

export const shadows = {
  sm: { shadowColor: '#2B2521', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: '#2B2521', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 36, elevation: 8 },
} as const;

export const motion = { easeOut: 'cubic-bezier(0.2, 0.8, 0.2, 1)', duration: { fast: 160, normal: 200, slow: 360 } } as const;

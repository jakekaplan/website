// Theme colors (keep in sync with index.css CSS variables)
export interface ThemeColors {
  bg: string
  ink: string
  inkGrabbed: string
  ground: string
  brushStroke: string
  dustColors: string[] // spectrum of colors for dust particles
}

export const THEME: Record<'light' | 'dark', ThemeColors> = {
  light: {
    bg: '#f8f6f1', // --bg-primary
    ink: '#1c1917', // --ink
    inkGrabbed: '#78716c', // --ink-muted
    ground: 'rgba(28, 25, 23, 0.06)',
    brushStroke: '/warm-brush-stroke.png',
    dustColors: ['#fde047', '#fbbf24', '#f97316'], // yellow → gold → orange
  },
  dark: {
    bg: '#0f172a', // --bg-primary
    ink: '#f8fafc', // --ink
    inkGrabbed: '#94a3b8', // --ink-muted
    ground: 'rgba(248, 250, 252, 0.08)',
    brushStroke: '/cool-brush-stroke.png',
    dustColors: ['#22d3ee', '#67e8f9', '#fde047'], // cyan → light cyan → yellow
  },
}

/** Convert hex color to rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Physics
export const GRAVITY = 0.3
export const FRICTION = 0.98
export const BOUNCE = 0.5
export const HOME_FORCE = 0.008
export const RESTLESSNESS_GROWTH = 0.005
export const MAX_RESTLESSNESS = 1

// Animation
export const DUST_PARTICLE_COUNT = 400
export const DUST_COLORED_RATIO = 0.2 // 20% of dust particles are colored
export const HOVER_SCALE = 1.08
export const SCALE_LERP = 0.15
export const ENTRY_STAGGER = 80
export const ENTRY_DELAY = 300
export const ENTRY_DURATION = 400
export const ENTRY_Y_OFFSET = 20
export const FADE_SPEED = 0.06 // ~280ms fade; keep .about-box animation-delay in sync

// Layout
export const GROUND_OFFSET = 48
export const STACK_THRESHOLD = 0.85 // stack letters vertically when horizontal width exceeds this ratio
export const STACKED_TRACKING = 0.85 // tighter letter spacing in stacked layout
export const STACKED_FONT_SCALE = 1.3 // larger font in stacked layout
export const STACKED_LINE_GAP = -0.15 // gap between lines as ratio of font size

// Grab interaction
export const GRAB_LIFT = 20
export const GRAB_IMPULSE_X = 6
export const GRAB_IMPULSE_Y = -12
export const GRAB_ROTATION = 0.2

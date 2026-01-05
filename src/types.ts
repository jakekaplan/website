export interface Point {
  x: number
  y: number
}

export interface Letter {
  char: string
  x: number
  y: number
  homeX: number
  homeY: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  width: number
  height: number
  active: boolean
  grabbed: boolean
  restlessness: number
  hovered: boolean
  scale: number
  opacity: number
  entered: boolean
  entryDelay: number
  weight: number
}

export interface DustParticle {
  x: number
  y: number
  size: number
  opacity: number
  speedX: number
  speedY: number
  drift: number
}

export interface CollisionParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  life: number
}

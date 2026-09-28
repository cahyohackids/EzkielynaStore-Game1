// PIXELBOUND: Lost Signal — global configuration & constants
window.PB = window.PB || {};

PB.Config = {
  TILE: 32,
  VIEW_W: 640,
  VIEW_H: 360,
  FIXED_DT: 1 / 60,
  MAX_SUBSTEPS: 5,

  GRAVITY: 0.62,
  FALL_GRAVITY_MULT: 1.55,
  MAX_FALL_SPEED: 13.5,
  MAX_FALL_SPEED_FAST: 17,

  RUN_MAX_SPEED: 4.3,
  GROUND_ACCEL: 0.55,
  GROUND_DECEL: 0.62,
  AIR_ACCEL: 0.38,
  AIR_DECEL: 0.28,

  JUMP_VELOCITY: -11.6,
  JUMP_CUT_MULT: 0.45,
  COYOTE_TIME: 0.11,
  JUMP_BUFFER_TIME: 0.13,

  DASH_SPEED: 10.2,
  DASH_DURATION: 0.16,
  DASH_COOLDOWN: 0.75,

  HURT_INVULN_TIME: 1.4,
  HURT_KNOCKBACK_X: 4.5,
  HURT_KNOCKBACK_Y: -6,

  MAX_HEALTH: 3,

  CAMERA_LOOKAHEAD: 46,
  CAMERA_LERP: 0.09,
  CAMERA_LERP_Y: 0.07,
};

PB.Palette = {
  navyDark: '#0b1026',
  navy: '#141b3d',
  navy2: '#1a2450',
  blueMuted: '#2a3a66',
  blueLight: '#4b5f9e',
  teal: '#2fb8a6',
  tealDark: '#17544d',
  orange: '#ff9d4d',
  orangeDeep: '#e0672a',
  cream: '#f3ecd8',
  creamDim: '#c9c2ab',
  neonCyan: '#6df0ff',
  neonPink: '#ff5da2',
  danger: '#ff5d6c',
  black: '#05070f',
  white: '#ffffff',
};

PB.LEVELS_META = [
  { id: 'level1', name: 'SIGNAL MEADOW', theme: 'meadow', order: 0 },
  { id: 'level2', name: 'CIRCUIT CAVERNS', theme: 'cavern', order: 1 },
  { id: 'level3', name: 'GLITCH TOWER', theme: 'tower', order: 2 },
];

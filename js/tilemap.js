// Tilemap: '#' solid, '=' one-way platform (solid from top only), '.' empty.
PB.Tilemap = function (rows, tileSize, theme) {
  this.rows = rows;
  this.tile = tileSize;
  this.theme = theme || 'meadow';
  this.height = rows.length;
  this.width = rows[0].length;
  this.pxW = this.width * tileSize;
  this.pxH = this.height * tileSize;
  this._bgSeed = Math.floor(Math.random() * 1000);
  this._skyline = this._buildSkyline();
};

PB.Tilemap.prototype.charAt = function (tx, ty) {
  if (ty < 0 || ty >= this.height || tx < 0 || tx >= this.width) return '#'; // treat OOB sides/top as solid ceiling/wall guard except bottom
  return this.rows[ty][tx];
};

PB.Tilemap.prototype.isSolid = function (tx, ty) {
  if (ty >= this.height) return false; // open bottom -> pit fallout handled by game logic
  if (ty < 0) return false;
  if (tx < 0 || tx >= this.width) return true;
  return this.rows[ty][tx] === '#';
};

PB.Tilemap.prototype.isOneWay = function (tx, ty) {
  if (ty < 0 || ty >= this.height || tx < 0 || tx >= this.width) return false;
  return this.rows[ty][tx] === '=';
};

PB.Tilemap.prototype.tileToPx = function (t) { return t * this.tile; };

// Move entity horizontally by dx, resolving against solid tiles only.
PB.Tilemap.prototype.moveX = function (e, dx) {
  if (dx === 0) return;
  e.x += dx;
  const t = this.tile;
  const top = Math.floor(e.y / t);
  const bottom = Math.floor((e.y + e.h - 1) / t);
  if (dx > 0) {
    const right = Math.floor((e.x + e.w) / t);
    for (let ty = top; ty <= bottom; ty++) {
      if (this.isSolid(right, ty)) {
        e.x = right * t - e.w;
        e.vx = 0;
        e.touchWallRight = true;
        break;
      }
    }
  } else {
    const left = Math.floor(e.x / t);
    for (let ty = top; ty <= bottom; ty++) {
      if (this.isSolid(left, ty)) {
        e.x = (left + 1) * t;
        e.vx = 0;
        e.touchWallLeft = true;
        break;
      }
    }
  }
};

// Move entity vertically by dy, resolving against solid tiles and one-way platforms.
PB.Tilemap.prototype.moveY = function (e, dy) {
  if (dy === 0) return;
  const t = this.tile;
  const prevBottom = e.y + e.h;
  e.y += dy;
  const left = Math.floor((e.x + 1) / t);
  const right = Math.floor((e.x + e.w - 2) / t);
  if (dy > 0) {
    const bottom = Math.floor((e.y + e.h) / t);
    for (let tx = left; tx <= right; tx++) {
      if (this.isSolid(tx, bottom)) {
        e.y = bottom * t - e.h;
        e.vy = 0;
        e.onGround = true;
        return;
      }
      if (this.isOneWay(tx, bottom) && prevBottom <= bottom * t + 1) {
        e.y = bottom * t - e.h;
        e.vy = 0;
        e.onGround = true;
        return;
      }
    }
  } else {
    const top = Math.floor(e.y / t);
    for (let tx = left; tx <= right; tx++) {
      if (this.isSolid(tx, top)) {
        e.y = (top + 1) * t;
        e.vy = 0;
        e.bonkCeiling = true;
        return;
      }
    }
  }
};

PB.Tilemap.prototype.rectOverlapsSolid = function (x, y, w, h) {
  const t = this.tile;
  const left = Math.floor(x / t), right = Math.floor((x + w - 1) / t);
  const top = Math.floor(y / t), bottom = Math.floor((y + h - 1) / t);
  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (this.isSolid(tx, ty)) return true;
    }
  }
  return false;
};

PB.Tilemap.prototype._buildSkyline = function () {
  const n = 14;
  const arr = [];
  let seed = this._bgSeed;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  for (let i = 0; i < n; i++) {
    arr.push({ h: 0.25 + rnd() * 0.5, w: 0.6 + rnd() * 0.8, lit: rnd() > 0.6 });
  }
  return arr;
};

const BG_THEMES = {
  meadow: {
    sky: ['#1b3a5c', '#2c5f7c'],
    far: '#1f4a5e', mid: '#2a6b74', near: '#1d5f4f',
    accent: PB.Palette && PB.Palette.teal || '#2fb8a6',
  },
  cavern: {
    sky: ['#080b1e', '#101636'],
    far: '#141a3a', mid: '#1c2450', near: '#20265a',
    accent: PB.Palette && PB.Palette.neonCyan || '#6df0ff',
  },
  tower: {
    sky: ['#160a1e', '#2a1030'],
    far: '#241030', mid: '#3a1530', near: '#4a1a28',
    accent: PB.Palette && PB.Palette.orange || '#ff9d4d',
  },
};

PB.Tilemap.prototype.drawBackground = function (ctx, camera, viewW, viewH, t) {
  const theme = BG_THEMES[this.theme] || BG_THEMES.meadow;
  const grad = ctx.createLinearGradient(0, 0, 0, viewH);
  grad.addColorStop(0, theme.sky[0]);
  grad.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, viewW, viewH);

  // distant skyline (parallax factor 0.15)
  const pFar = 0.12;
  ctx.fillStyle = theme.far;
  const skyline = this._skyline;
  const spanW = viewW / 6;
  const offsetFar = -(camera.x * pFar) % (spanW * skyline.length);
  for (let rep = -1; rep <= Math.ceil(viewW / (spanW * skyline.length)) + 1; rep++) {
    for (let i = 0; i < skyline.length; i++) {
      const b = skyline[i];
      const bx = offsetFar + rep * spanW * skyline.length + i * spanW;
      const bw = spanW * b.w;
      const bh = viewH * b.h * 0.6;
      ctx.fillStyle = theme.far;
      ctx.fillRect(bx, viewH * 0.62 - bh, bw, bh + viewH * 0.4);
      if (b.lit) {
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = 0.5 + Math.sin(t * 2 + i) * 0.15;
        ctx.fillRect(bx + bw * 0.3, viewH * 0.62 - bh + bh * 0.3, 2, 2);
        ctx.globalAlpha = 1;
      }
    }
  }

  // midground architecture band (parallax factor 0.35)
  const pMid = 0.32;
  ctx.fillStyle = theme.mid;
  const midOffset = -(camera.x * pMid) % 160;
  for (let x = midOffset - 160; x < viewW + 160; x += 160) {
    ctx.fillRect(x, viewH * 0.72, 90, viewH * 0.3);
    ctx.fillRect(x + 100, viewH * 0.8, 50, viewH * 0.22);
  }

  // near parallax ground haze (0.55)
  const pNear = 0.55;
  ctx.fillStyle = theme.near;
  ctx.globalAlpha = 0.65;
  const nearOffset = -(camera.x * pNear) % 220;
  for (let x = nearOffset - 220; x < viewW + 220; x += 220) {
    ctx.fillRect(x, viewH * 0.86, 140, viewH * 0.2);
  }
  ctx.globalAlpha = 1;
};

PB.Tilemap.prototype.drawTerrain = function (ctx, camera, viewW, viewH) {
  const t = this.tile;
  const startTx = Math.max(0, Math.floor(camera.x / t));
  const endTx = Math.min(this.width - 1, Math.ceil((camera.x + viewW) / t));
  const startTy = Math.max(0, Math.floor(camera.y / t));
  const endTy = Math.min(this.height - 1, Math.ceil((camera.y + viewH) / t));

  const THEME_TILE_COLORS = {
    meadow: { top: '#3fcf9e', body: '#1d5f4f', edge: '#2fb8a6', plat: '#c98a3a' },
    cavern: { top: '#4b5f9e', body: '#1a2450', edge: '#2a3a66', plat: '#8a6a3a' },
    tower: { top: '#e0672a', body: '#3a1030', edge: '#6b2a3a', plat: '#8a6a3a' },
  };
  const themeColors = THEME_TILE_COLORS[this.theme] || THEME_TILE_COLORS.meadow;

  for (let ty = startTy; ty <= endTy; ty++) {
    for (let tx = startTx; tx <= endTx; tx++) {
      const ch = this.rows[ty][tx];
      const px = tx * t - camera.x;
      const py = ty * t - camera.y;
      if (ch === '#') {
        const aboveOpen = ty === 0 || this.rows[ty - 1][tx] === '.' || this.rows[ty-1][tx] === '=';
        ctx.fillStyle = themeColors.body;
        ctx.fillRect(px, py, t, t);
        if (aboveOpen) {
          ctx.fillStyle = themeColors.top;
          ctx.fillRect(px, py, t, 5);
          ctx.fillStyle = themeColors.edge;
          ctx.fillRect(px, py + 5, t, 2);
        }
        // subtle grid texture
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        if ((tx + ty) % 2 === 0) ctx.fillRect(px, py, t, t);
      } else if (ch === '=') {
        ctx.fillStyle = themeColors.plat;
        ctx.fillRect(px, py + t - 8, t, 8);
        ctx.fillStyle = themeColors.top;
        ctx.fillRect(px, py + t - 8, t, 3);
      }
    }
  }
};

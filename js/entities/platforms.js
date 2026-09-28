PB.Platforms = (function () {
  const P = PB.Palette;
  const T = PB.Config.TILE;

  function drawSurface(ctx, sx, sy, w, h, topColor, bodyColor, alpha) {
    ctx.globalAlpha = alpha !== undefined ? alpha : 1;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(sx, sy, w, h);
    ctx.fillStyle = topColor;
    ctx.fillRect(sx, sy, w, 3);
    ctx.globalAlpha = 1;
  }

  // ---------------- Moving Platform ----------------
  function MovingPlatform(x, y, wTiles, path, speed) {
    this.type = 'movingPlatform';
    this.w = wTiles * T; this.h = 12;
    this.x = x; this.y = y;
    this.path = path && path.length ? path : [{ x, y }, { x, y }];
    this.speed = speed || 0.9;
    this.targetIndex = 1;
    this.dx = 0; this.dy = 0;
    this.solid = true;
  }
  MovingPlatform.prototype.update = function (dt) {
    const px = this.x, py = this.y;
    const target = this.path[this.targetIndex];
    const dx = target.x - this.x, dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt * 60;
    if (dist < step || dist < 0.5) {
      this.x = target.x; this.y = target.y;
      this.targetIndex = (this.targetIndex + 1) % this.path.length;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
    this.dx = this.x - px; this.dy = this.y - py;
  };
  MovingPlatform.prototype.getAABB = function () { return { x: this.x, y: this.y, w: this.w, h: this.h }; };
  MovingPlatform.prototype.draw = function (ctx, camera) {
    drawSurface(ctx, this.x - camera.x, this.y - camera.y, this.w, this.h, P.neonCyan, P.blueMuted);
  };

  // ---------------- Falling Platform ----------------
  const SHAKE_TIME = 0.5, FALL_TIME_MAX = 1.4, RESPAWN_DELAY = 2.6;
  function FallingPlatform(x, y, wTiles) {
    this.type = 'fallingPlatform';
    this.origX = x; this.origY = y;
    this.x = x; this.y = y;
    this.w = wTiles * T; this.h = 12;
    this.state = 'idle'; // idle -> shaking -> falling -> gone -> idle
    this.timer = 0;
    this.vy = 0;
    this.solid = true;
    this.dx = 0; this.dy = 0;
  }
  FallingPlatform.prototype.trigger = function () {
    if (this.state === 'idle') { this.state = 'shaking'; this.timer = 0; }
  };
  FallingPlatform.prototype.update = function (dt) {
    this.dx = 0; this.dy = 0;
    if (this.state === 'shaking') {
      this.timer += dt;
      if (this.timer >= SHAKE_TIME) { this.state = 'falling'; this.timer = 0; this.vy = 0; }
    } else if (this.state === 'falling') {
      const py = this.y;
      this.vy = Math.min(this.vy + 0.7, 14);
      this.y += this.vy;
      this.dy = this.y - py;
      this.timer += dt;
      if (this.timer >= FALL_TIME_MAX) { this.state = 'gone'; this.timer = 0; this.solid = false; }
    } else if (this.state === 'gone') {
      this.timer += dt;
      if (this.timer >= RESPAWN_DELAY) {
        this.state = 'idle'; this.x = this.origX; this.y = this.origY; this.solid = true;
      }
    }
  };
  FallingPlatform.prototype.getAABB = function () {
    if (this.state === 'gone') return null;
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  };
  FallingPlatform.prototype.draw = function (ctx, camera) {
    if (this.state === 'gone') return;
    let sx = this.x - camera.x, sy = this.y - camera.y;
    if (this.state === 'shaking') {
      const p = this.timer / SHAKE_TIME;
      sx += Math.sin(this.timer * 60) * 1.6 * p;
    }
    const alpha = this.state === 'falling' ? 1 : 1;
    drawSurface(ctx, sx, sy, this.w, this.h, P.orange, P.orangeDeep, alpha);
  };

  // ---------------- Bounce Pad ----------------
  function BouncePad(x, y) {
    this.type = 'bouncePad';
    this.x = x; this.y = y - 8; this.w = 24; this.h = 10;
    this.squish = 0;
    this.solid = true;
    this.dx = 0; this.dy = 0;
  }
  BouncePad.prototype.update = function (dt) { if (this.squish > 0) this.squish -= dt * 4; };
  BouncePad.prototype.pulse = function () { this.squish = 1; };
  BouncePad.prototype.getAABB = function () { return { x: this.x, y: this.y, w: this.w, h: this.h }; };
  BouncePad.prototype.draw = function (ctx, camera) {
    const sx = this.x - camera.x, sy = this.y - camera.y + Math.max(0, this.squish) * 5;
    const h = this.h - Math.max(0, this.squish) * 5;
    ctx.fillStyle = P.navyDark;
    ctx.fillRect(sx - 2, sy + 2, this.w + 4, h);
    ctx.fillStyle = P.orange;
    ctx.shadowColor = P.orange; ctx.shadowBlur = this.squish > 0 ? 12 : 5;
    ctx.fillRect(sx, sy, this.w, Math.max(3, h - 2));
    ctx.shadowBlur = 0;
  };

  // ---------------- Phase Platform ----------------
  function PhasePlatform(x, y, wTiles, period, onTime, offset) {
    this.type = 'phasePlatform';
    this.x = x; this.y = y; this.w = wTiles * T; this.h = 10;
    this.period = period || 2.4;
    this.onTime = onTime !== undefined ? onTime : 1.4;
    this.t = offset || 0;
    this.dx = 0; this.dy = 0;
  }
  PhasePlatform.prototype.update = function (dt) { this.t = (this.t + dt) % this.period; };
  PhasePlatform.prototype.isSolidNow = function () { return this.t < this.onTime; };
  PhasePlatform.prototype.getAABB = function () {
    if (this.t >= this.onTime) return null;
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  };
  PhasePlatform.prototype.draw = function (ctx, camera) {
    const sx = this.x - camera.x, sy = this.y - camera.y;
    const active = this.t < this.onTime;
    const warning = !active && (this.period - this.t) < 0.5;
    if (active) {
      const flicker = (this.onTime - this.t) < 0.35 ? (Math.sin(this.t * 40) * 0.2 + 0.8) : 1;
      ctx.globalAlpha = flicker;
      drawSurface(ctx, sx, sy, this.w, this.h, P.neonPink, P.blueMuted);
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = P.neonPink;
      ctx.globalAlpha = warning ? (0.3 + Math.sin(this.t * 30) * 0.2) : 0.18;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(sx + 1, sy + 1, this.w - 2, this.h - 2);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  };

  return { MovingPlatform, FallingPlatform, BouncePad, PhasePlatform };
})();

PB.Hazards = (function () {
  const P = PB.Palette;

  // ---------------- Spikes ----------------
  function Spike(x, y, widthTiles) {
    this.type = 'spike';
    this.x = x; this.y = y + PB.Config.TILE - 12;
    this.w = widthTiles * PB.Config.TILE; this.h = 12;
    this.t = 0;
  }
  Spike.prototype.update = function (dt) { this.t += dt; };
  Spike.prototype.isActive = function () { return true; };
  Spike.prototype.getAABB = function () { return { x: this.x + 2, y: this.y + 3, w: this.w - 4, h: this.h - 3 }; };
  Spike.prototype.draw = function (ctx, camera) {
    const sx = this.x - camera.x, sy = this.y - camera.y;
    const count = Math.round(this.w / 12);
    for (let i = 0; i < count; i++) {
      const bx = sx + i * 12;
      ctx.fillStyle = P.navyDark;
      ctx.beginPath();
      ctx.moveTo(bx, sy + this.h);
      ctx.lineTo(bx + 6, sy);
      ctx.lineTo(bx + 12, sy + this.h);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.danger;
      ctx.beginPath();
      ctx.moveTo(bx + 2, sy + this.h);
      ctx.lineTo(bx + 6, sy + 3);
      ctx.lineTo(bx + 10, sy + this.h);
      ctx.closePath(); ctx.fill();
    }
  };

  // ---------------- Laser (toggling beam) ----------------
  function Laser(x, y, length, axis, period, onTime, phase, thickness) {
    this.type = 'laser';
    this.axis = axis || 'x'; // beam extends along this axis from emitter
    this.length = length;
    this.period = period || 2.2;
    this.onTime = onTime !== undefined ? onTime : 1.1;
    this.t = phase || 0;
    const th = thickness || 6;
    if (this.axis === 'x') { this.x = x; this.y = y; this.w = length; this.h = th; }
    else { this.x = x; this.y = y; this.w = th; this.h = length; }
  }
  Laser.prototype.update = function (dt) { this.t = (this.t + dt) % this.period; };
  Laser.prototype.isActive = function () { return this.t < this.onTime; };
  Laser.prototype.isWarning = function () { return !this.isActive() && (this.period - this.t) < 0.4; };
  Laser.prototype.getAABB = function () {
    if (!this.isActive()) return null;
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  };
  Laser.prototype.draw = function (ctx, camera) {
    const sx = this.x - camera.x, sy = this.y - camera.y;
    // emitter nodes
    ctx.fillStyle = P.navyDark;
    if (this.axis === 'x') { ctx.fillRect(sx - 3, sy - 5, 6, this.h + 10); ctx.fillRect(sx + this.w - 3, sy - 5, 6, this.h + 10); }
    else { ctx.fillRect(sx - 5, sy - 3, this.w + 10, 6); ctx.fillRect(sx - 5, sy + this.h - 3, this.w + 10, 6); }

    if (this.isActive()) {
      ctx.save();
      ctx.shadowColor = P.danger;
      ctx.shadowBlur = 10;
      ctx.fillStyle = P.danger;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(sx, sy, this.w, this.h);
      ctx.fillStyle = P.cream;
      ctx.globalAlpha = 0.7;
      if (this.axis === 'x') ctx.fillRect(sx, sy + this.h / 2 - 1, this.w, 2);
      else ctx.fillRect(sx + this.w / 2 - 1, sy, 2, this.h);
      ctx.restore();
    } else if (this.isWarning()) {
      ctx.globalAlpha = 0.35 + Math.sin(this.t * 40) * 0.15;
      ctx.fillStyle = P.orange;
      ctx.fillRect(sx, sy, this.w, this.h);
      ctx.globalAlpha = 1;
    }
  };

  // ---------------- Energy Pit (bottomless hazard strip) ----------------
  function EnergyPit(x, y, widthTiles) {
    this.type = 'energyPit';
    this.x = x; this.y = y; this.w = widthTiles * PB.Config.TILE; this.h = 14;
    this.t = Math.random() * 10;
  }
  EnergyPit.prototype.update = function (dt) { this.t += dt; };
  EnergyPit.prototype.isActive = function () { return true; };
  EnergyPit.prototype.getAABB = function () { return { x: this.x, y: this.y, w: this.w, h: this.h }; };
  EnergyPit.prototype.draw = function (ctx, camera) {
    const sx = this.x - camera.x, sy = this.y - camera.y;
    ctx.fillStyle = P.navyDark;
    ctx.fillRect(sx, sy, this.w, 200);
    const glow = 0.5 + Math.sin(this.t * 3) * 0.3;
    ctx.save();
    ctx.shadowColor = P.danger;
    ctx.shadowBlur = 12;
    ctx.globalAlpha = glow;
    ctx.fillStyle = P.danger;
    ctx.fillRect(sx, sy, this.w, 5);
    ctx.restore();
  };

  return { Spike, Laser, EnergyPit };
})();

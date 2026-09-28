PB.Enemies = (function () {
  function groundStep(e, dt, tilemap) {
    e.touchWallLeft = e.touchWallRight = false;
    e.vy = Math.min((e.vy || 0) + PB.Config.GRAVITY, PB.Config.MAX_FALL_SPEED);
    e.onGround = false;
    tilemap.moveX(e, e.vx * dt * 60);
    tilemap.moveY(e, e.vy);

    // Flip at walls
    if (e.touchWallLeft || e.touchWallRight) e.vx *= -1;

    // Flip at ledges (don't walk off platforms)
    if (e.onGround) {
      const t = tilemap.tile;
      const footX = e.vx > 0 ? e.x + e.w + 2 : e.x - 2;
      const footY = e.y + e.h + 2;
      const tx = Math.floor(footX / t), ty = Math.floor(footY / t);
      if (!tilemap.isSolid(tx, ty) && !tilemap.isOneWay(tx, ty)) e.vx *= -1;
    }
  }

  // ---------------- Glitch Hopper ----------------
  function GlitchHopper(x, y, speed) {
    this.type = 'glitchHopper';
    this.x = x; this.y = y - 14; this.w = 18; this.h = 14;
    this.vx = speed || 0.9;
    this.vy = 0;
    this.alive = true;
    this.popTimer = 0;
    this.hopPhase = Math.random() * 10;
  }
  GlitchHopper.prototype.update = function (dt, tilemap) {
    if (!this.alive) { this.popTimer += dt; return; }
    this.hopPhase += dt;
    groundStep(this, dt, tilemap);
  };
  GlitchHopper.prototype.getAABB = function () { return { x: this.x, y: this.y, w: this.w, h: this.h }; };
  GlitchHopper.prototype.defeat = function () {
    if (!this.alive) return;
    this.alive = false;
    this.popTimer = 0;
    PB.Audio.SFX.enemyDefeat();
    PB.Particles.enemyPop(this.x + this.w / 2, this.y + this.h / 2, PB.Palette.orangeDeep);
  };
  GlitchHopper.prototype.isDone = function () { return !this.alive && this.popTimer > 0.3; };
  GlitchHopper.prototype.draw = function (ctx, camera, t) {
    if (!this.alive) return;
    PB.Sprites.drawGlitchHopper(ctx, this.x + this.w / 2 - camera.x, this.y + this.h - camera.y, 1.6, this.vx < 0 ? -1 : 1, this.hopPhase, false);
  };

  // ---------------- Static Drone ----------------
  function StaticDrone(x, y, path, speed) {
    this.type = 'staticDrone';
    this.x = x; this.y = y; this.w = 22; this.h = 16;
    this.path = path && path.length ? path : [{ x, y }, { x, y }];
    this.speed = speed || 0.8;
    this.targetIndex = 1;
    this.alive = true;
    this.popTimer = 0;
    this.t = Math.random() * 10;
    this.noGravity = true;
  }
  StaticDrone.prototype.update = function (dt, tilemap) {
    this.t += dt;
    if (!this.alive) { this.popTimer += dt; return; }
    const target = this.path[this.targetIndex];
    const dx = target.x - this.x, dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt * 60;
    if (dist < step || dist < 1) {
      this.x = target.x; this.y = target.y;
      this.targetIndex = (this.targetIndex + 1) % this.path.length;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  };
  StaticDrone.prototype.getAABB = function () { return { x: this.x, y: this.y, w: this.w, h: this.h }; };
  StaticDrone.prototype.defeat = function () {
    if (!this.alive) return;
    this.alive = false; this.popTimer = 0;
    PB.Audio.SFX.enemyDefeat();
    PB.Particles.enemyPop(this.x + this.w / 2, this.y + this.h / 2, PB.Palette.danger);
  };
  StaticDrone.prototype.isDone = function () { return !this.alive && this.popTimer > 0.3; };
  StaticDrone.prototype.draw = function (ctx, camera, t) {
    if (!this.alive) return;
    PB.Sprites.drawStaticDrone(ctx, this.x + this.w / 2 - camera.x, this.y + this.h - camera.y, 1.5, this.t);
  };

  // ---------------- Corrupt Bug ----------------
  function CorruptBug(x, y, speed) {
    this.type = 'corruptBug';
    this.x = x; this.y = y - 12; this.w = 20; this.h = 12;
    this.baseSpeed = speed || 1.4;
    this.vx = this.baseSpeed;
    this.vy = 0;
    this.alive = true;
    this.popTimer = 0;
    this.t = Math.random() * 10;
    this.chargeTimer = 0;
    this.chargeCooldown = PB.Utils.rand(0.5, 2);
    this.charging = false;
  }
  CorruptBug.prototype.update = function (dt, tilemap, playerCenter) {
    this.t += dt;
    if (!this.alive) { this.popTimer += dt; return; }

    const myCenter = { x: this.x + this.w / 2, y: this.y + this.h / 2 };
    const dx = playerCenter.x - myCenter.x;
    const sameLevel = Math.abs(playerCenter.y - myCenter.y) < 50;

    if (this.charging) {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) { this.charging = false; this.chargeCooldown = PB.Utils.rand(1.2, 2.4); }
    } else {
      this.chargeCooldown -= dt;
      if (this.chargeCooldown <= 0 && sameLevel && Math.abs(dx) < 160 && Math.abs(dx) > 20) {
        this.charging = true;
        this.chargeTimer = 0.55;
        this.vx = (dx > 0 ? 1 : -1) * this.baseSpeed * 2.6;
      }
    }
    const speedSign = this.vx >= 0 ? 1 : -1;
    if (!this.charging) this.vx = speedSign * this.baseSpeed;
    groundStep(this, dt, tilemap);
  };
  CorruptBug.prototype.getAABB = function () { return { x: this.x, y: this.y, w: this.w, h: this.h }; };
  CorruptBug.prototype.defeat = function () {
    if (!this.alive) return;
    this.alive = false; this.popTimer = 0;
    PB.Audio.SFX.enemyDefeat();
    PB.Particles.enemyPop(this.x + this.w / 2, this.y + this.h / 2, PB.Palette.navyDark);
  };
  CorruptBug.prototype.isDone = function () { return !this.alive && this.popTimer > 0.3; };
  CorruptBug.prototype.draw = function (ctx, camera, t) {
    if (!this.alive) return;
    PB.Sprites.drawCorruptBug(ctx, this.x + this.w / 2 - camera.x, this.y + this.h - camera.y, 1.6, this.vx < 0 ? -1 : 1, this.t, this.charging);
  };

  return { GlitchHopper, StaticDrone, CorruptBug };
})();

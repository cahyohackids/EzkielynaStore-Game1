PB.Player = function (x, y) {
  this.x = x; this.y = y;
  this.w = 20; this.h = 27;
  this.vx = 0; this.vy = 0;
  this.facing = 1;
  this.onGround = false;
  this.touchWallLeft = false;
  this.touchWallRight = false;
  this.bonkCeiling = false;

  this.coyoteTimer = 0;
  this.jumpBufferTimer = 0;
  this.jumpHeld = false;

  this.maxHealth = PB.Config.MAX_HEALTH;
  this.health = this.maxHealth;
  this.invulnTimer = 0;
  this.isDead = false;
  this.deathTimer = 0;

  this.dashTimer = 0;
  this.dashCooldownTimer = 0;
  this.dashDir = 1;
  this.canAirDash = true;

  this.state = 'idle';
  this.stateTimer = 0;
  this.animTime = 0;
  this.landSquashTimer = 0;
  this.victoryMode = false;
  this.frozen = false;

  this.checkpointX = x;
  this.checkpointY = y;

  this.currentPlatform = null; // dynamic platform currently standing on
};

PB.Player.prototype.setCheckpoint = function (x, y) {
  this.checkpointX = x; this.checkpointY = y;
};

PB.Player.prototype.respawn = function () {
  this.x = this.checkpointX; this.y = this.checkpointY;
  this.vx = 0; this.vy = 0;
  this.health = this.maxHealth;
  this.isDead = false;
  this.invulnTimer = 0.6;
  this.dashTimer = 0;
  this.dashCooldownTimer = 0;
  this.frozen = false;
  this.state = 'idle';
};

PB.Player.prototype.getCenter = function () {
  return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
};

PB.Player.prototype.getAABB = function () {
  return { x: this.x, y: this.y, w: this.w, h: this.h };
};

PB.Player.prototype.takeDamage = function (sourceX, kbMult) {
  if (this.invulnTimer > 0 || this.isDead || this.victoryMode) return false;
  this.health -= 1;
  this.invulnTimer = PB.Config.HURT_INVULN_TIME;
  const dir = (this.x + this.w / 2) < sourceX ? -1 : 1;
  const m = kbMult || 1;
  this.vx = dir * PB.Config.HURT_KNOCKBACK_X * m;
  this.vy = PB.Config.HURT_KNOCKBACK_Y * m;
  this.state = 'hurt';
  this.stateTimer = 0;
  this.dashTimer = 0;
  PB.Audio.SFX.hurt();
  if (PB.Game && PB.Game.camera) PB.Game.camera.shake(4, 0.18);
  if (this.health <= 0) this.die();
  return true;
};

PB.Player.prototype.die = function () {
  if (this.isDead) return;
  this.isDead = true;
  this.deathTimer = 0;
  this.state = 'death';
  this.vx = 0;
  this.vy = -3;
  PB.Audio.SFX.death();
  if (PB.Game && PB.Game.camera) PB.Game.camera.shake(6, 0.3);
};

PB.Player.prototype.bounceOffEnemy = function (vy) {
  this.vy = vy;
  this.coyoteTimer = 0;
};

PB.Player.prototype.bouncePad = function (vy) {
  this.vy = vy;
  this.jumpBufferTimer = 0;
  PB.Audio.SFX.bounce();
  if (PB.Game && PB.Game.camera) PB.Game.camera.shake(2, 0.12);
  PB.Particles.burst(this.x + this.w / 2, this.y + this.h, 10, {
    angle: -Math.PI / 2, spread: 0.9, minSpeed: 1, maxSpeed: 2.6,
    color: PB.Palette.orange, gravity: 0.15, minSize: 2, maxSize: 3.5, glow: true,
  });
};

PB.Player.prototype.startVictory = function () {
  this.victoryMode = true;
  this.frozen = true;
  this.vx = 0;
  this.state = 'victory';
  this.stateTimer = 0;
};

PB.Player.prototype.update = function (dt, input, tilemap) {
  const cfg = PB.Config;
  this.animTime += dt;
  this.stateTimer += dt;

  if (this.isDead) {
    this.deathTimer += dt;
    this.vy = Math.min(this.vy + cfg.GRAVITY, cfg.MAX_FALL_SPEED);
    this.y += this.vy;
    return;
  }

  if (this.frozen) {
    this.vx = PB.Utils.approach(this.vx, 0, cfg.GROUND_DECEL);
    if (!this.onGround) this.vy = Math.min(this.vy + cfg.GRAVITY, cfg.MAX_FALL_SPEED);
    else this.vy = 0;
    this.touchWallLeft = this.touchWallRight = this.bonkCeiling = false;
    tilemap.moveX(this, this.vx);
    this.onGround = false;
    tilemap.moveY(this, this.vy);
    return;
  }

  const wasOnGround = this.onGround;
  this.touchWallLeft = this.touchWallRight = this.bonkCeiling = false;

  if (this.invulnTimer > 0) this.invulnTimer -= dt;
  if (this.landSquashTimer > 0) this.landSquashTimer -= dt;

  // --- Dash trigger ---
  if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
  if (input.wasPressed('dash') && this.dashCooldownTimer <= 0 && this.dashTimer <= 0) {
    this.dashTimer = cfg.DASH_DURATION;
    this.dashCooldownTimer = cfg.DASH_COOLDOWN;
    this.dashDir = this.facing;
    this.vy = 0;
    PB.Audio.SFX.dash();
    if (PB.Game && PB.Game.camera) PB.Game.camera.shake(2, 0.1);
  }

  const axis = input.getAxis();
  if (axis !== 0) this.facing = axis;

  if (this.dashTimer > 0) {
    this.dashTimer -= dt;
    this.vx = this.dashDir * cfg.DASH_SPEED;
    if (Math.random() < 0.8) {
      PB.Particles.dashTrail(this.x + this.w / 2, this.y + this.h / 2, PB.Palette.neonCyan);
    }
    if (this.dashTimer <= 0) {
      this.vx = PB.Utils.clamp(this.vx, -cfg.RUN_MAX_SPEED, cfg.RUN_MAX_SPEED);
    }
  } else {
    // --- Horizontal movement ---
    if (axis !== 0) {
      const accel = this.onGround ? cfg.GROUND_ACCEL : cfg.AIR_ACCEL;
      this.vx = PB.Utils.approach(this.vx, axis * cfg.RUN_MAX_SPEED, accel);
    } else {
      const decel = this.onGround ? cfg.GROUND_DECEL : cfg.AIR_DECEL;
      this.vx = PB.Utils.approach(this.vx, 0, decel);
    }

    // --- Gravity ---
    const g = this.vy < 0 ? cfg.GRAVITY : cfg.GRAVITY * cfg.FALL_GRAVITY_MULT;
    this.vy += g;
    const maxFall = axis !== 0 ? cfg.MAX_FALL_SPEED : cfg.MAX_FALL_SPEED;
    this.vy = Math.min(this.vy, maxFall);

    // --- Jump buffering & coyote time ---
    if (this.onGround) this.coyoteTimer = cfg.COYOTE_TIME;
    else this.coyoteTimer -= dt;

    if (input.wasPressed('jump')) this.jumpBufferTimer = cfg.JUMP_BUFFER_TIME;
    else this.jumpBufferTimer -= dt;

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = cfg.JUMP_VELOCITY;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.onGround = false;
      PB.Audio.SFX.jump();
      PB.Particles.jumpPuff(this.x + this.w / 2, this.y + this.h);
    }

    // --- Variable jump height (cut upward velocity on early release) ---
    if (input.wasReleased('jump') && this.vy < cfg.JUMP_VELOCITY * cfg.JUMP_CUT_MULT) {
      this.vy = cfg.JUMP_VELOCITY * cfg.JUMP_CUT_MULT;
    }
  }

  // --- Move & collide ---
  this.onGround = false;
  tilemap.moveX(this, this.vx);
  tilemap.moveY(this, this.vy);

  if (this.bonkCeiling && this.vy < 0) this.vy = 0;
  if ((this.touchWallLeft || this.touchWallRight) && this.dashTimer > 0) this.dashTimer = 0;

  if (this.onGround && !wasOnGround) {
    this.landSquashTimer = 0.14;
    PB.Particles.landDust(this.x + this.w / 2, this.y + this.h);
    if (Math.abs(this.vy) > 2) PB.Audio.SFX.land();
  }

  // running dust
  if (this.onGround && Math.abs(this.vx) > 1.5 && Math.random() < 0.25) {
    PB.Particles.dust(this.x + this.w / 2, this.y + this.h - 2, this.facing);
  }

  // --- Animation state ---
  let newState;
  if (this.dashTimer > 0) newState = 'dash';
  else if (this.invulnTimer > 0.9) newState = 'hurt';
  else if (!this.onGround) newState = this.vy < 0 ? 'jump' : 'fall';
  else if (Math.abs(this.vx) > 0.4) newState = 'run';
  else newState = 'idle';
  if (newState !== this.state) { this.state = newState; this.stateTimer = 0; }
};

PB.Player.prototype.getPose = function () {
  const extra = {};
  if (this.invulnTimer > 0 && !this.isDead && this.state !== 'hurt') {
    extra.blink = Math.floor(this.invulnTimer * 14) % 2 === 0;
  }
  const pose = PB.Sprites.pipPose(this.state, this.animTime, this.facing, extra);
  if (this.landSquashTimer > 0) {
    const p = this.landSquashTimer / 0.14;
    pose.scaleY = (pose.scaleY || 1) * (1 - p * 0.18);
    pose.scaleX = (pose.scaleX || 1) * (1 + p * 0.14);
  }
  return pose;
};

PB.Player.prototype.draw = function (ctx, camera) {
  const sx = this.x + this.w / 2 - camera.x;
  const sy = this.y + this.h - camera.y;
  const pose = this.getPose();
  PB.Sprites.drawPip(ctx, sx, sy, 2.15, this.facing, pose);
};

PB.Player.prototype.dashReadyRatio = function () {
  if (this.dashCooldownTimer <= 0) return 1;
  return 1 - this.dashCooldownTimer / PB.Config.DASH_COOLDOWN;
};

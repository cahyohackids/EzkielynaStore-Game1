PB.LevelManager = function () {
  this.tilemap = null;
  this.player = null;
  this.signalBits = [];
  this.dataCores = [];
  this.enemies = [];
  this.hazards = [];
  this.platforms = [];
  this.checkpoints = [];
  this.tower = null;

  this.levelId = null;
  this.levelName = '';
  this.deaths = 0;
  this.elapsed = 0;
  this.completing = false;
  this.completeTimer = 0;
  this.onComplete = null; // callback(stats)
  this.frameCount = 0;
};

const DEATH_ANIM_DURATION = 1.0;
const VICTORY_DURATION = 2.4;

PB.LevelManager.prototype.load = function (levelId) {
  const def = PB.Levels[levelId].data();
  this.levelId = levelId;
  this.levelName = def.name;
  this.tilemap = new PB.Tilemap(def.rows, def.tileSize, def.theme);

  this.signalBits = [];
  this.dataCores = [];
  this.enemies = [];
  this.hazards = [];
  this.platforms = [];
  this.checkpoints = [];
  this.tower = null;
  this.deaths = 0;
  this.elapsed = 0;
  this.completing = false;
  this.completeTimer = 0;
  this._gameOverShown = false;

  for (const spawn of def.entities) {
    switch (spawn.type) {
      case 'signalBit':
        this.signalBits.push(new PB.Collectibles.SignalBit(spawn.x, spawn.y));
        break;
      case 'dataCore':
        this.dataCores.push(new PB.Collectibles.DataCore(spawn.x, spawn.y));
        break;
      case 'glitchHopper':
        this.enemies.push(new PB.Enemies.GlitchHopper(spawn.x, spawn.y, spawn.speed));
        break;
      case 'staticDrone':
        this.enemies.push(new PB.Enemies.StaticDrone(spawn.x, spawn.y, spawn.path, spawn.speed));
        break;
      case 'corruptBug':
        this.enemies.push(new PB.Enemies.CorruptBug(spawn.x, spawn.y, spawn.speed));
        break;
      case 'spike':
        this.hazards.push(new PB.Hazards.Spike(spawn.x, spawn.y, spawn.w || 1));
        break;
      case 'laser':
        this.hazards.push(new PB.Hazards.Laser(spawn.x, spawn.y, spawn.length, spawn.axis, spawn.period, spawn.onTime, spawn.phase, spawn.thickness));
        break;
      case 'energyPit':
        this.hazards.push(new PB.Hazards.EnergyPit(spawn.x, spawn.y, spawn.w || 1));
        break;
      case 'movingPlatform':
        this.platforms.push(new PB.Platforms.MovingPlatform(spawn.x, spawn.y, spawn.w || 3, spawn.path, spawn.speed));
        break;
      case 'fallingPlatform':
        this.platforms.push(new PB.Platforms.FallingPlatform(spawn.x, spawn.y, spawn.w || 2));
        break;
      case 'bouncePad': {
        const bp = new PB.Platforms.BouncePad(spawn.x, spawn.y);
        bp.customVy = spawn.vy;
        this.platforms.push(bp);
        break;
      }
      case 'phasePlatform':
        this.platforms.push(new PB.Platforms.PhasePlatform(spawn.x, spawn.y, spawn.w || 3, spawn.period, spawn.onTime, spawn.offset));
        break;
      case 'checkpoint':
        this.checkpoints.push(new PB.CheckpointEnt(spawn.x, spawn.y, spawn.id));
        break;
      case 'signalTower':
        this.tower = new PB.SignalTowerEnt(spawn.x, spawn.y);
        break;
    }
  }

  this.bitsTotal = this.signalBits.length;
  this.coresTotal = this.dataCores.length;

  this.player = new PB.Player(def.playerStart.x, def.playerStart.y);
  this.player.setCheckpoint(def.playerStart.x, def.playerStart.y);

  this.tilemap.setBoundsHolder = true;
  PB.Particles.clear();

  if (PB.Game && PB.Game.camera) {
    PB.Game.camera.setBounds(this.tilemap.pxW, this.tilemap.pxH);
    PB.Game.camera.snapTo(this.player.x, this.player.y);
  }
};

PB.LevelManager.prototype.restart = function () {
  this.load(this.levelId);
};

PB.LevelManager.prototype.confirmRespawn = function () {
  this.player.respawn();
  this._gameOverShown = false;
};

// Step 1 (before player.update): carry the player with whatever platform they
// were riding last frame, then advance all platforms to their new position.
PB.LevelManager.prototype._carryAndUpdatePlatforms = function (dt) {
  const player = this.player;
  if (player.currentPlatform) {
    const p = player.currentPlatform;
    if (this.platforms.indexOf(p) !== -1 && p.getAABB && p.getAABB()) {
      player.x += p.dx || 0;
      player.y += p.dy || 0;
    }
    player.currentPlatform = null;
  }
  for (const p of this.platforms) {
    if (p.update) p.update(dt);
  }
};

// Step 2 (after player.update): snap the player onto any platform they've
// landed on. Runs last so it isn't clobbered by the player's own tile collision.
PB.LevelManager.prototype._snapPlatformLanding = function () {
  const player = this.player;
  if (player.isDead || player.frozen) return;

  for (const p of this.platforms) {
    const aabb = p.getAABB ? p.getAABB() : null;
    if (!aabb) continue;
    const feetY = player.y + player.h;
    const withinX = player.x + player.w > aabb.x + 3 && player.x < aabb.x + aabb.w - 3;
    const withinY = player.vy >= 0 && feetY >= aabb.y - 1 && feetY <= aabb.y + Math.max(10, aabb.h) + 2;
    if (withinX && withinY) {
      if (p.type === 'bouncePad') {
        player.y = aabb.y - player.h;
        player.bouncePad(p.customVy || -13.5);
        p.pulse();
      } else {
        const wasOnGround = player.onGround;
        player.y = aabb.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.currentPlatform = p;
        if (!wasOnGround) {
          PB.Particles.landDust(player.x + player.w / 2, player.y + player.h);
        }
        if (p.type === 'fallingPlatform') p.trigger();
      }
    }
  }
};

PB.LevelManager.prototype._checkFalloutAndHazards = function () {
  const player = this.player;
  if (player.isDead) return;

  for (const h of this.hazards) {
    if (h.isActive && h.isActive() && PB.Utils.aabbOverlap(player.getAABB(), h.getAABB())) {
      player.takeDamage(h.getAABB().x + h.getAABB().w / 2);
    }
  }

  const pitY = this.tilemap.pxH;
  if (player.y > pitY + 40 && player.invulnTimer <= 0 && !player.isDead) {
    player.takeDamage(player.x);
  }
  if (player.y > pitY + 160) {
    player.x = player.checkpointX;
    player.y = player.checkpointY;
    player.vx = 0; player.vy = 0;
  }
};

PB.LevelManager.prototype.update = function (dt, input) {
  this.frameCount++;
  if (!this.completing) this.elapsed += dt;

  PB.Particles.update(dt);

  if (this.completing) {
    this.completeTimer += dt;
    this.tower.update(dt);
    this.player.update(dt, input, this.tilemap);
    if (this.completeTimer >= VICTORY_DURATION && this.onComplete) {
      this.onComplete(this.getStats());
    }
    return;
  }

  const player = this.player;

  // Handle death: play the animation, then hand off to the Game Over screen
  // (the player chooses Retry / Level Select rather than auto-respawning).
  if (player.isDead) {
    player.update(dt, input, this.tilemap);
    if (player.deathTimer >= DEATH_ANIM_DURATION) {
      if (!this._gameOverShown) {
        this._gameOverShown = true;
        if (this.onGameOver) this.onGameOver();
      }
      return;
    }
    for (const e of this.enemies) if (e.update) e.update(dt, this.tilemap, player.getCenter());
    for (const h of this.hazards) if (h.update) h.update(dt);
    for (const p of this.platforms) if (p.update) p.update(dt);
    return;
  }

  this._carryAndUpdatePlatforms(dt);
  player.update(dt, input, this.tilemap);
  this._snapPlatformLanding();

  for (const e of this.enemies) {
    if (e.update) e.update(dt, this.tilemap, player.getCenter());
  }
  this.enemies = this.enemies.filter(e => !(e.isDone && e.isDone()));

  for (const h of this.hazards) if (h.update) h.update(dt);
  for (const b of this.signalBits) b.update(dt);
  for (const c of this.dataCores) c.update(dt);
  for (const cp of this.checkpoints) cp.update(dt);
  if (this.tower) this.tower.update(dt);

  this._checkFalloutAndHazards();

  // Enemy interactions (stomp vs damage)
  if (!player.isDead && player.invulnTimer <= 0) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const eb = e.getAABB();
      if (!PB.Utils.aabbOverlap(player.getAABB(), eb)) continue;
      const stomping = player.vy > 0.5 && (player.y + player.h) <= eb.y + eb.h * 0.6 + player.vy;
      if (stomping) {
        e.defeat();
        player.bounceOffEnemy(-8.2);
        if (PB.Game && PB.Game.camera) PB.Game.camera.shake(2, 0.08);
      } else {
        player.takeDamage(eb.x + eb.w / 2);
      }
    }
  }

  // Collectibles
  for (const b of this.signalBits) {
    if (!b.collected && PB.Utils.aabbOverlap(player.getAABB(), b.getAABB())) b.collect();
  }
  for (const c of this.dataCores) {
    if (!c.collected && PB.Utils.aabbOverlap(player.getAABB(), c.getAABB())) c.collect();
  }

  // Checkpoints
  for (const cp of this.checkpoints) {
    if (!cp.active && PB.Utils.aabbOverlap(player.getAABB(), cp.getAABB())) {
      cp.activate();
      player.setCheckpoint(cp.x - player.w / 2 + 4, cp.y + cp.h - player.h);
    }
  }

  // Signal tower
  if (this.tower && !this.tower.active && PB.Utils.aabbOverlap(player.getAABB(), this.tower.getAABB())) {
    this.tower.activate();
    this.player.startVictory();
    this.completing = true;
    this.completeTimer = 0;
    PB.Audio.SFX.levelComplete();
  }

  if (player.isDead) this.deaths++;
};

PB.LevelManager.prototype.getStats = function () {
  return {
    time: this.elapsed,
    bits: this.signalBits.filter(b => b.collected).length,
    bitsTotal: this.bitsTotal,
    cores: this.dataCores.filter(c => c.collected).length,
    coresTotal: this.coresTotal,
    deaths: this.deaths,
  };
};

PB.LevelManager.prototype.draw = function (ctx, camera, t) {
  this.tilemap.drawBackground(ctx, camera, PB.Config.VIEW_W, PB.Config.VIEW_H, t);
  this.tilemap.drawTerrain(ctx, camera, PB.Config.VIEW_W, PB.Config.VIEW_H);

  for (const h of this.hazards) h.draw(ctx, camera);
  for (const cp of this.checkpoints) cp.draw(ctx, camera);
  for (const p of this.platforms) p.draw(ctx, camera);
  for (const b of this.signalBits) b.draw(ctx, camera);
  for (const c of this.dataCores) c.draw(ctx, camera);
  for (const e of this.enemies) e.draw(ctx, camera, t);
  if (this.tower) this.tower.draw(ctx, camera);

  if (!this.player.isDead || this.player.deathTimer < DEATH_ANIM_DURATION) {
    if (!(this.player.isDead && Math.floor(this.player.deathTimer * 10) % 2 === 0 && this.player.deathTimer > 0.3)) {
      this.player.draw(ctx, camera);
    }
  }

  PB.Particles.draw(ctx, camera);
};

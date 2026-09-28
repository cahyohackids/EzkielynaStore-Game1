PB.Particles = (function () {
  let particles = [];
  const MAX_PARTICLES = 240;

  function spawn(opts) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push({
      x: opts.x, y: opts.y,
      vx: opts.vx || 0, vy: opts.vy || 0,
      gravity: opts.gravity !== undefined ? opts.gravity : 0.25,
      life: opts.life || 0.5,
      maxLife: opts.life || 0.5,
      size: opts.size || 3,
      color: opts.color || '#ffffff',
      shape: opts.shape || 'square',
      fade: opts.fade !== undefined ? opts.fade : true,
      drag: opts.drag !== undefined ? opts.drag : 0.96,
      glow: !!opts.glow,
    });
  }

  function burst(x, y, count, opts) {
    opts = opts || {};
    for (let i = 0; i < count; i++) {
      const angle = opts.angle !== undefined
        ? opts.angle + (Math.random() - 0.5) * (opts.spread !== undefined ? opts.spread : Math.PI * 2)
        : Math.random() * Math.PI * 2;
      const speed = PB.Utils.rand(opts.minSpeed || 0.6, opts.maxSpeed || 2.4);
      spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: opts.gravity !== undefined ? opts.gravity : 0.22,
        life: PB.Utils.rand(opts.minLife || 0.25, opts.maxLife || 0.55),
        size: PB.Utils.rand(opts.minSize || 2, opts.maxSize || 4),
        color: opts.color || '#ffffff',
        glow: opts.glow,
        drag: opts.drag,
      });
    }
  }

  function dust(x, y, dir) {
    burst(x, y, 4, {
      angle: Math.PI + (dir > 0 ? -0.4 : 0.4) * 0, spread: Math.PI * 0.9,
      minSpeed: 0.3, maxSpeed: 1.1, minLife: 0.2, maxLife: 0.38,
      color: PB.Palette.creamDim, gravity: 0.05, minSize: 1.5, maxSize: 2.5,
    });
  }

  function landDust(x, y) {
    burst(x, y, 7, {
      angle: -Math.PI / 2, spread: Math.PI * 0.8,
      minSpeed: 0.6, maxSpeed: 1.8, minLife: 0.22, maxLife: 0.4,
      color: PB.Palette.creamDim, gravity: 0.15, minSize: 1.5, maxSize: 3,
    });
  }

  function jumpPuff(x, y) {
    burst(x, y, 5, {
      angle: Math.PI / 2, spread: Math.PI * 0.6,
      minSpeed: 0.5, maxSpeed: 1.4, minLife: 0.2, maxLife: 0.35,
      color: PB.Palette.creamDim, gravity: 0.05, minSize: 1.5, maxSize: 2.5,
    });
  }

  function dashTrail(x, y, color) {
    spawn({
      x, y, vx: 0, vy: 0, gravity: 0, life: 0.22, size: 6,
      color: color || PB.Palette.neonCyan, shape: 'square', drag: 1, glow: true,
    });
  }

  function pickupSparkle(x, y, color) {
    burst(x, y, 10, {
      minSpeed: 0.8, maxSpeed: 2.6, minLife: 0.3, maxLife: 0.55,
      color: color || PB.Palette.orange, gravity: 0.05, minSize: 1.5, maxSize: 3, glow: true,
    });
  }

  function enemyPop(x, y, color) {
    burst(x, y, 12, {
      minSpeed: 1, maxSpeed: 3, minLife: 0.3, maxLife: 0.5,
      color: color || PB.Palette.danger, gravity: 0.3, minSize: 2, maxSize: 4,
    });
  }

  function checkpointFlash(x, y) {
    burst(x, y, 16, {
      minSpeed: 0.8, maxSpeed: 2.2, minLife: 0.4, maxLife: 0.7,
      color: PB.Palette.neonCyan, gravity: -0.02, minSize: 1.5, maxSize: 3, glow: true,
    });
  }

  function towerActivate(x, y) {
    burst(x, y, 40, {
      minSpeed: 1.2, maxSpeed: 4, minLife: 0.6, maxLife: 1.2,
      color: PB.Palette.teal, gravity: -0.03, minSize: 2, maxSize: 4, glow: true,
    });
  }

  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  function draw(ctx, camera) {
    ctx.save();
    for (const p of particles) {
      const alpha = p.fade ? PB.Utils.clamp(p.life / p.maxLife, 0, 1) : 1;
      ctx.globalAlpha = alpha;
      const sx = Math.round(p.x - camera.x);
      const sy = Math.round(p.y - camera.y);
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function clear() { particles = []; }
  function count() { return particles.length; }

  return {
    spawn, burst, dust, landDust, jumpPuff, dashTrail, pickupSparkle, enemyPop,
    checkpointFlash, towerActivate, update, draw, clear, count,
  };
})();

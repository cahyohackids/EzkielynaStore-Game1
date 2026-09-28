// Procedural chunky-pixel-art renderer. Every sprite is built from integer "unit" blocks
// (span lists: [row, xStart, width]) so it reads as deliberate pixel art, not primitives.
PB.Sprites = (function () {
  const P = PB.Palette;

  function fillSpans(ctx, ox, oy, unit, spans, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < spans.length; i++) {
      const s = spans[i];
      ctx.fillRect(Math.round(ox + s[1] * unit), Math.round(oy + s[0] * unit), Math.ceil(s[2] * unit) + 1, Math.ceil(unit) + 1);
    }
  }

  function mirrorSpans(spans, totalWidth) {
    return spans.map(s => [s[0], totalWidth - s[1] - s[2], s[2]]);
  }

  // ---------------- PIP the courier robot ----------------
  // Unit grid ~14 wide x 15 tall. Facing right by default; mirrored for left.
  const PIP_BODY_OUTLINE = [
    [0, 3, 6], [1, 2, 8], [2, 1, 10], [3, 1, 10], [4, 0, 12], [5, 0, 12],
    [6, 0, 12], [7, 0, 12], [8, 1, 10], [9, 1, 10], [10, 2, 8], [11, 3, 6],
  ];
  const PIP_BODY_FILL = [
    [1, 3, 6], [2, 2, 8], [3, 2, 8], [4, 1, 10], [5, 1, 10],
    [6, 1, 10], [7, 1, 10], [8, 2, 8], [9, 2, 8], [10, 3, 6],
  ];
  const PIP_SHADE_BOTTOM = [
    [8, 2, 8], [9, 2, 8], [10, 3, 6],
  ];
  const PIP_VISOR_RECESS = [[3, 3, 7], [4, 3, 7], [5, 3, 7]];
  const PIP_VISOR_GLOW = [[3, 4, 5], [4, 4, 5]];
  const PIP_BACKPACK = [[4, -2, 3], [5, -2, 3], [6, -2, 3], [7, -2, 3]];
  const PIP_BACKPACK_LIGHT = [[5, -2, 1]];

  function drawPip(ctx, x, y, unit, facing, pose) {
    pose = pose || {};
    const sx = facing < 0 ? -1 : 1;
    ctx.save();
    // squash/stretch about the feet
    const footY = y;
    const scaleX = pose.scaleX || 1;
    const scaleY = pose.scaleY || 1;
    ctx.translate(Math.round(x), Math.round(footY));
    ctx.scale(sx * scaleX, scaleY);
    ctx.translate(0, -(11 * unit));

    const ox = -6 * unit;
    const oy = 0;
    const tint = pose.tint || null;
    const blink = pose.blink;

    if (blink) { ctx.restore(); return; }

    // backpack (drawn behind, on the trailing side)
    fillSpans(ctx, ox, oy, unit, PIP_BACKPACK, tint || P.orangeDeep);
    fillSpans(ctx, ox, oy, unit, PIP_BACKPACK_LIGHT, tint || P.orange);

    // legs (behind body slightly, animate via pose.legPhase 0..1 cycling)
    const legLift = pose.legLift || [0, 0];
    ctx.fillStyle = tint || P.navy;
    ctx.fillRect(ox + 2 * unit, oy + (11 - legLift[0]) * unit, 3 * unit, (2 + legLift[0]) * unit);
    ctx.fillRect(ox + 7 * unit, oy + (11 - legLift[1]) * unit, 3 * unit, (2 + legLift[1]) * unit);

    // arms
    const armY = pose.armY !== undefined ? pose.armY : 6;
    ctx.fillStyle = tint || P.tealDark;
    ctx.fillRect(ox - 1 * unit, oy + armY * unit, 2 * unit, 3 * unit);
    ctx.fillRect(ox + 11 * unit, oy + armY * unit, 2 * unit, 3 * unit);

    // outline + body fill
    fillSpans(ctx, ox, oy, unit, PIP_BODY_OUTLINE, tint || P.navyDark);
    fillSpans(ctx, ox, oy, unit, PIP_BODY_FILL, tint || P.teal);
    fillSpans(ctx, ox, oy, unit, PIP_SHADE_BOTTOM, tint || P.tealDark);

    // visor
    fillSpans(ctx, ox, oy, unit, PIP_VISOR_RECESS, P.navyDark);
    const visorColor = pose.visorColor || P.neonCyan;
    fillSpans(ctx, ox, oy, unit, PIP_VISOR_GLOW, tint ? tint : visorColor);
    ctx.fillStyle = tint ? tint : P.white;
    ctx.fillRect(ox + 5 * unit, oy + 3 * unit, unit, unit);

    // antenna
    const bob = pose.antennaBob || 0;
    ctx.fillStyle = tint || P.navyDark;
    ctx.fillRect(ox + 8 * unit, oy + (-3 + bob) * unit, unit, 3 * unit);
    ctx.fillStyle = tint || (pose.antennaLit ? P.neonCyan : P.orange);
    ctx.fillRect(ox + 7.5 * unit, oy + (-4 + bob) * unit, 2 * unit, 1.4 * unit);

    ctx.restore();
  }

  // pose generators for each animation state, driven by a time accumulator (seconds)
  function pipPose(state, t, facing, extra) {
    extra = extra || {};
    const pose = { antennaBob: Math.sin(t * 4) * 0.4, visorColor: P.neonCyan };
    if (state === 'idle') {
      pose.legLift = [0, 0];
      pose.armY = 6 + Math.sin(t * 2.2) * 0.3;
      pose.scaleY = 1 + Math.sin(t * 2.2) * 0.015;
    } else if (state === 'run') {
      const cyc = (t * 9) % (Math.PI * 2);
      pose.legLift = [Math.max(0, Math.sin(cyc)) * 2.4, Math.max(0, Math.sin(cyc + Math.PI)) * 2.4];
      pose.armY = 6;
      pose.scaleY = 1 + Math.sin(cyc) * 0.03;
    } else if (state === 'jump') {
      pose.legLift = [1.6, 1.6];
      pose.armY = 4.5;
      pose.scaleY = 1.08; pose.scaleX = 0.94;
    } else if (state === 'fall') {
      pose.legLift = [0.4, 0.9];
      pose.armY = 6.6;
      pose.scaleY = 0.94; pose.scaleX = 1.04;
    } else if (state === 'dash') {
      pose.legLift = [1, 1];
      pose.armY = 6.2;
      pose.scaleX = 1.22; pose.scaleY = 0.86;
      pose.visorColor = P.orange;
      pose.antennaLit = true;
    } else if (state === 'hurt') {
      pose.legLift = [0.5, 0.5];
      pose.armY = 6;
      pose.tint = (Math.floor(t * 18) % 2 === 0) ? P.danger : null;
    } else if (state === 'death') {
      pose.legLift = [0, 0];
      pose.scaleY = Math.max(0.15, 1 - t * 1.3);
      pose.scaleX = 1 + t * 0.5;
      pose.visorColor = P.danger;
    } else if (state === 'victory') {
      pose.legLift = [0.3, 0.3];
      pose.armY = 2 + Math.sin(t * 6) * 0.6;
      pose.scaleY = 1 + Math.sin(t * 6) * 0.05;
      pose.antennaLit = true;
      pose.visorColor = P.neonCyan;
    }
    if (extra.blink) pose.blink = true;
    return pose;
  }

  // ---------------- Enemies ----------------
  function drawGlitchHopper(ctx, x, y, unit, facing, t, squashed) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing < 0 ? -1 : 1, squashed ? 0.35 : 1);
    const ox = -5 * unit, oy = -8 * unit;
    const bob = squashed ? 0 : Math.sin(t * 8) * 0.5;
    ctx.fillStyle = P.navyDark;
    fillSpans(ctx, ox, oy + bob * unit, unit, [[0,2,6],[1,1,8],[2,1,8],[3,0,10],[4,0,10],[5,1,8],[6,1,8],[7,2,6]], P.navyDark);
    fillSpans(ctx, ox, oy + bob * unit, unit, [[1,2,6],[2,2,6],[3,1,8],[4,1,8],[5,2,6],[6,2,6]], P.orangeDeep);
    ctx.fillStyle = P.navyDark;
    ctx.fillRect(ox + 3*unit, oy + (3+bob)*unit, 1.6*unit, 1.6*unit);
    ctx.fillRect(ox + 5.4*unit, oy + (3+bob)*unit, 1.6*unit, 1.6*unit);
    ctx.fillStyle = P.neonPink;
    ctx.fillRect(ox + 3.3*unit, oy + (3.3+bob)*unit, 1*unit, 1*unit);
    ctx.fillRect(ox + 5.7*unit, oy + (3.3+bob)*unit, 1*unit, 1*unit);
    ctx.fillStyle = P.navyDark;
    ctx.fillRect(ox + 2*unit, oy + 7*unit, 2*unit, 1.4*unit);
    ctx.fillRect(ox + 6*unit, oy + 7*unit, 2*unit, 1.4*unit);
    ctx.restore();
  }

  function drawStaticDrone(ctx, x, y, unit, t) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    const hover = Math.sin(t * 3) * 1.2;
    const ox = -6 * unit, oy = -5 * unit + hover * unit;
    fillSpans(ctx, ox, oy, unit, [[0,1,10],[1,0,12],[2,0,12],[3,0,12],[4,1,10]], P.navyDark);
    fillSpans(ctx, ox, oy, unit, [[1,1,10],[2,1,10],[3,1,10]], P.blueMuted);
    ctx.fillStyle = P.navyDark;
    ctx.fillRect(ox + 3*unit, oy + 1.3*unit, 6*unit, 1.6*unit);
    ctx.fillStyle = P.danger;
    const eyeGlow = 0.6 + Math.sin(t * 6) * 0.4;
    ctx.globalAlpha = eyeGlow;
    ctx.fillRect(ox + 3.5*unit, oy + 1.6*unit, 5*unit, 1*unit);
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.blueLight;
    ctx.fillRect(ox - 1*unit, oy + 2*unit, 1.4*unit, 0.6*unit);
    ctx.fillRect(ox + 11.6*unit, oy + 2*unit, 1.4*unit, 0.6*unit);
    ctx.restore();
  }

  function drawCorruptBug(ctx, x, y, unit, facing, t, charging) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing < 0 ? -1 : 1, 1);
    const ox = -6 * unit, oy = -6 * unit;
    const legPhase = Math.sin(t * (charging ? 20 : 10));
    ctx.fillStyle = charging ? P.danger : P.navyDark;
    fillSpans(ctx, ox, oy, unit, [[1,2,8],[2,1,10],[3,0,12],[4,0,12],[5,1,10],[6,2,8]], charging ? P.danger : P.navyDark);
    fillSpans(ctx, ox, oy, unit, [[2,2,8],[3,1,10],[4,1,10],[5,2,8]], charging ? P.orange : P.blueMuted);
    ctx.fillStyle = P.neonPink;
    ctx.fillRect(ox + 8.5*unit, oy + 2*unit, 1.4*unit, 1.4*unit);
    ctx.fillStyle = P.navyDark;
    const legOff = legPhase * 0.8;
    ctx.fillRect(ox + 2*unit, oy + (6+legOff)*unit, 1.4*unit, 1.6*unit);
    ctx.fillRect(ox + 5*unit, oy + (6-legOff)*unit, 1.4*unit, 1.6*unit);
    ctx.fillRect(ox + 8*unit, oy + (6+legOff)*unit, 1.4*unit, 1.6*unit);
    ctx.restore();
  }

  // ---------------- Collectibles ----------------
  function drawSignalBit(ctx, x, y, unit, t) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y + Math.sin(t * 3) * 2));
    ctx.rotate(Math.sin(t * 2) * 0.15);
    const s = unit;
    ctx.shadowColor = P.orange;
    ctx.shadowBlur = 8;
    ctx.fillStyle = P.orangeDeep;
    ctx.beginPath();
    ctx.moveTo(0, -3.2*s); ctx.lineTo(2.6*s, 0); ctx.lineTo(0, 3.2*s); ctx.lineTo(-2.6*s, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.orange;
    ctx.beginPath();
    ctx.moveTo(0, -1.8*s); ctx.lineTo(1.4*s, 0); ctx.lineTo(0, 1.8*s); ctx.lineTo(-1.4*s, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.cream;
    ctx.fillRect(-0.5*s, -1.6*s, s, s);
    ctx.restore();
  }

  function drawDataCore(ctx, x, y, unit, t) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y + Math.sin(t * 2.2) * 2.5));
    const pulse = 0.7 + Math.sin(t * 4) * 0.3;
    ctx.shadowColor = P.neonCyan;
    ctx.shadowBlur = 10 * pulse;
    const s = unit;
    ctx.strokeStyle = P.neonCyan;
    ctx.lineWidth = s * 0.6;
    ctx.beginPath(); ctx.arc(0, 0, 4*s, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = P.navyDark;
    ctx.beginPath(); ctx.arc(0, 0, 3.2*s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = P.neonCyan;
    ctx.globalAlpha = pulse;
    ctx.beginPath(); ctx.arc(0, 0, 1.6*s, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.rotate(t * 1.5);
    ctx.strokeStyle = P.cream;
    ctx.lineWidth = s * 0.4;
    ctx.beginPath(); ctx.moveTo(-3.6*s, 0); ctx.lineTo(3.6*s, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -3.6*s); ctx.lineTo(0, 3.6*s); ctx.stroke();
    ctx.restore();
  }

  // ---------------- Checkpoint & Tower ----------------
  function drawCheckpoint(ctx, x, y, unit, active, t) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    const ox = -unit, oy = -14 * unit;
    ctx.fillStyle = P.navyDark;
    ctx.fillRect(ox, oy + 8*unit, 2*unit, 6*unit);
    ctx.fillStyle = P.blueMuted;
    ctx.fillRect(ox - 1.5*unit, oy, 5*unit, 8.5*unit);
    ctx.fillStyle = P.navyDark;
    ctx.fillRect(ox - 1.5*unit, oy, 5*unit, 1*unit);
    const glow = active ? (0.6 + Math.sin(t * 5) * 0.4) : 0.15;
    ctx.shadowColor = active ? P.neonCyan : 'transparent';
    ctx.shadowBlur = active ? 10 : 0;
    ctx.fillStyle = active ? P.neonCyan : P.blueLight;
    ctx.globalAlpha = active ? 1 : 0.5;
    ctx.fillRect(ox - 0.5*unit, oy + 1.5*unit, 3*unit, 3*unit);
    ctx.globalAlpha = 1;
    if (active) {
      ctx.fillStyle = P.cream;
      ctx.globalAlpha = glow;
      ctx.fillRect(ox - 2.5*unit, oy - 2*unit, 7*unit, 2*unit);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawSignalTower(ctx, x, y, unit, active, t) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    const ox = -3 * unit;
    const towerH = 26;
    ctx.fillStyle = P.navy;
    ctx.fillRect(ox, -towerH*unit, 6*unit, towerH*unit);
    ctx.fillStyle = P.blueMuted;
    for (let i = 0; i < towerH; i += 3) ctx.fillRect(ox, -towerH*unit + i*unit, 6*unit, 1*unit);
    ctx.fillStyle = P.navyDark;
    ctx.fillRect(ox - 1*unit, -towerH*unit - 2*unit, 8*unit, 3*unit);
    const pulse = active ? (0.5 + Math.sin(t * 4) * 0.5) : 0.1 + Math.sin(t) * 0.05;
    ctx.shadowColor = P.teal;
    ctx.shadowBlur = active ? 22 : 4;
    ctx.fillStyle = active ? P.teal : P.tealDark;
    ctx.globalAlpha = active ? 1 : 0.5;
    ctx.beginPath();
    ctx.arc(3*unit + ox, -towerH*unit - 4*unit, (3 + pulse * 1.5) * unit, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.cream;
    ctx.fillRect(ox + 2.3*unit, -towerH*unit - 4.7*unit, 1.4*unit, 1.4*unit);
    if (active) {
      ctx.strokeStyle = P.teal;
      ctx.globalAlpha = 0.5 * pulse;
      ctx.lineWidth = 2;
      for (let r = 0; r < 3; r++) {
        const rad = (t * 30 + r * 20) % 60;
        ctx.beginPath();
        ctx.arc(3*unit + ox, -towerH*unit - 4*unit, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  return {
    fillSpans, drawPip, pipPose, drawGlitchHopper, drawStaticDrone, drawCorruptBug,
    drawSignalBit, drawDataCore, drawCheckpoint, drawSignalTower,
  };
})();

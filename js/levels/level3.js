PB.Levels = PB.Levels || {};
PB.Levels.level3 = (function () {
  const T = PB.Config.TILE;

  function build() {
    const W = 30, H = 46;
    const g = PB.Utils.createGridBuilder(W, H);

    // tower walls
    g.fillRect(0, 0, 0, H - 1, '#');
    g.fillRect(W - 1, 0, W - 1, H - 1, '#');

    // Chamber 1: entrance floor
    g.fillRect(1, 43, 28, H - 1, '#');
    // Laser-gated corridor chokepoint (walls at 10 & 12, open passage at 11).
    // Only tall enough to prevent jumping over (jump height maxes ~3.4 tiles).
    g.fillRect(10, 37, 10, 42, '#');
    g.fillRect(12, 37, 12, 42, '#');

    // Staircase climb 1 -> chamber 2, entirely past the gate (safe 2-tile rise / 3-tile gap)
    g.platform(14, 16, 41, '=');
    g.platform(20, 22, 39, '=');
    g.platform(14, 16, 37, '=');
    g.platform(20, 22, 35, '=');
    g.platform(7, 18, 33, '='); // chamber 2 floor
    g.platform(1, 5, 33, '='); // hidden alcove (gap at x6, laser-guarded)

    // Phase-platform gauntlet is handled by dynamic entities (kept clear here)
    g.platform(6, 20, 23, '='); // chamber 3 floor + dash runway

    // Mandatory dash gap: cols 21-25 intentionally left open
    g.platform(26, 28, 23, '='); // landing after dash

    // Final ascent
    g.platform(22, 24, 21, '=');
    g.platform(26, 28, 19, '=');
    g.platform(22, 24, 17, '=');
    g.platform(15, 28, 15, '='); // top chamber / tower floor
    g.platform(11, 13, 13, '='); // bonus ledge for data core #3

    return g.toRows();
  }

  function data() {
    const rows = build();
    const entities = [];

    // Chamber 1
    entities.push({ type: 'checkpoint', x: 3 * T, y: 43 * T, id: 'l3_cp1' });
    entities.push({ type: 'signalBit', x: 4 * T, y: 41.4 * T });
    entities.push({ type: 'signalBit', x: 6 * T, y: 41.4 * T });
    entities.push({ type: 'corruptBug', x: 7 * T, y: 43 * T, speed: 1.5 });

    entities.push({
      type: 'laser', x: 11 * T, y: 38 * T, length: 5 * T, axis: 'y',
      period: 2.2, onTime: 1.1, phase: 0, thickness: 20,
    });

    entities.push({ type: 'signalBit', x: 14 * T, y: 41.4 * T });
    entities.push({ type: 'signalBit', x: 16 * T, y: 41.4 * T });

    // Climb 1
    entities.push({ type: 'signalBit', x: 15 * T, y: 40.4 * T });
    entities.push({ type: 'signalBit', x: 21 * T, y: 38.4 * T });
    entities.push({ type: 'signalBit', x: 15 * T, y: 36.4 * T });
    entities.push({ type: 'signalBit', x: 21 * T, y: 34.4 * T });

    // Chamber 2 + hidden alcove
    entities.push({ type: 'checkpoint', x: 9 * T, y: 33 * T, id: 'l3_cp2' });
    entities.push({ type: 'corruptBug', x: 14 * T, y: 33 * T, speed: 1.6 });
    entities.push({
      type: 'laser', x: 6 * T, y: 32.1 * T, length: 1 * T, axis: 'x',
      period: 2, onTime: 1.1, phase: 0.5, thickness: 16,
    });
    entities.push({ type: 'dataCore', x: 3 * T, y: 31.6 * T });
    entities.push({ type: 'signalBit', x: 2 * T, y: 31.8 * T });
    entities.push({ type: 'signalBit', x: 4 * T, y: 31.8 * T });

    // Phase-platform gauntlet
    entities.push({ type: 'phasePlatform', x: 9 * T, y: 31 * T, w: 3, period: 2.4, onTime: 1.4, offset: 0 });
    entities.push({ type: 'phasePlatform', x: 14 * T, y: 29 * T, w: 3, period: 2.4, onTime: 1.4, offset: 0.8 });
    entities.push({ type: 'phasePlatform', x: 9 * T, y: 27 * T, w: 3, period: 2.4, onTime: 1.4, offset: 1.6 });
    entities.push({ type: 'phasePlatform', x: 14 * T, y: 25 * T, w: 3, period: 2.4, onTime: 1.4, offset: 0.4 });

    // Chamber 3 + mandatory dash gap
    entities.push({ type: 'checkpoint', x: 8 * T, y: 23 * T, id: 'l3_cp3' });
    entities.push({ type: 'corruptBug', x: 12 * T, y: 23 * T, speed: 1.8 });
    entities.push({ type: 'signalBit', x: 17 * T, y: 21.4 * T });
    entities.push({ type: 'signalBit', x: 19 * T, y: 21.4 * T });
    entities.push({ type: 'dataCore', x: 27 * T, y: 21.2 * T });

    // Final ascent
    entities.push({ type: 'signalBit', x: 23 * T, y: 19.4 * T });
    entities.push({ type: 'signalBit', x: 27 * T, y: 17.4 * T });
    entities.push({
      type: 'staticDrone', x: 24 * T, y: 21 * T, speed: 0.65,
      path: [{ x: 24 * T, y: 21 * T }, { x: 24 * T, y: 16 * T }],
    });
    entities.push({ type: 'checkpoint', x: 17 * T, y: 15 * T, id: 'l3_cp4' });
    entities.push({ type: 'corruptBug', x: 20 * T, y: 15 * T, speed: 1.7 });
    entities.push({ type: 'dataCore', x: 12 * T, y: 11.2 * T });
    entities.push({ type: 'signalBit', x: 12 * T, y: 12.6 * T });
    entities.push({ type: 'signalBit', x: 22 * T, y: 13.4 * T });
    entities.push({ type: 'signalBit', x: 19 * T, y: 13.4 * T });

    entities.push({ type: 'signalTower', x: 25 * T, y: 15 * T });

    return {
      id: 'level3',
      name: 'GLITCH TOWER',
      theme: 'tower',
      rows,
      tileSize: T,
      playerStart: { x: 3 * T, y: 41 * T },
      entities,
    };
  }

  return { data };
})();

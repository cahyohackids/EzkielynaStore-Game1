PB.Levels = PB.Levels || {};
PB.Levels.level2 = (function () {
  const T = PB.Config.TILE;

  function build() {
    const W = 26, H = 42;
    const g = PB.Utils.createGridBuilder(W, H);

    // cavern walls
    g.fillRect(0, 0, 0, H - 1, '#');
    g.fillRect(W - 1, 0, W - 1, H - 1, '#');

    // Chamber 1: entrance floor (solid — nothing approaches from below)
    g.fillRect(1, 39, 24, H - 1, '#');
    g.fillRect(10, 39, 11, 39, '.'); // teaching gap (safe: solid below at 40-41)

    // Staircase climb 1 -> chamber 2 (2-tile rise, 2-tile gap steps — safe jump math)
    g.platform(5, 7, 37, '=');
    g.platform(10, 12, 35, '=');
    g.platform(5, 7, 33, '=');
    g.platform(10, 12, 31, '=');
    g.platform(8, 17, 29, '='); // chamber 2 floor (one-way: bounce shaft passes through it)

    // Chamber 3 floor (with hidden alcove split off) — one-way so nothing below bonks it
    g.platform(7, 20, 18, '=');
    g.platform(1, 5, 18, '='); // hidden alcove (gap at x6)

    // Falling platform gauntlet is handled by dynamic entities (kept clear here)
    g.platform(18, 20, 13, '='); // permanent bonus ledge for data core #2
    g.platform(7, 18, 10, '='); // chamber 4 floor

    // Final ascent
    g.platform(12, 15, 8, '=');
    g.platform(7, 10, 6, '=');
    g.platform(17, 19, 6, '='); // bonus ledge data core #3
    g.platform(3, 22, 4, '='); // top chamber / tower floor

    return g.toRows();
  }

  function data() {
    const rows = build();
    const entities = [];

    // Chamber 1
    entities.push({ type: 'fallingPlatform', x: 10 * T, y: 39 * T, w: 2 });
    entities.push({ type: 'signalBit', x: 4 * T, y: 37.4 * T });
    entities.push({ type: 'signalBit', x: 7 * T, y: 37.4 * T });
    entities.push({ type: 'glitchHopper', x: 16 * T, y: 39 * T, speed: 0.8 });
    entities.push({ type: 'checkpoint', x: 20 * T, y: 39 * T, id: 'l2_cp1' });

    // Staircase 1
    entities.push({ type: 'signalBit', x: 6 * T, y: 36.4 * T });
    entities.push({ type: 'signalBit', x: 11 * T, y: 34.4 * T });
    entities.push({ type: 'signalBit', x: 6 * T, y: 32.4 * T });
    entities.push({ type: 'signalBit', x: 11 * T, y: 30.4 * T });

    // Chamber 2 + big bounce shaft up to chamber 3
    entities.push({ type: 'bouncePad', x: 12 * T, y: 29 * T, vy: -23 });
    entities.push({ type: 'signalBit', x: 12.5 * T, y: 27.4 * T });
    entities.push({
      type: 'staticDrone', x: 16 * T, y: 26 * T, speed: 0.55,
      path: [{ x: 16 * T, y: 26 * T }, { x: 16 * T, y: 19.5 * T }],
    });

    // Chamber 3
    entities.push({ type: 'checkpoint', x: 9 * T, y: 18 * T, id: 'l2_cp2' });
    entities.push({ type: 'dataCore', x: 3 * T, y: 16.6 * T });
    entities.push({ type: 'signalBit', x: 2 * T, y: 16.8 * T });
    entities.push({
      type: 'staticDrone', x: 10 * T, y: 16 * T, speed: 0.7,
      path: [{ x: 10 * T, y: 16 * T }, { x: 18 * T, y: 16 * T }],
    });
    entities.push({ type: 'signalBit', x: 14 * T, y: 17.4 * T });

    // Falling platform gauntlet (chamber 3 floor is the safety net below)
    entities.push({ type: 'fallingPlatform', x: 9 * T, y: 16 * T, w: 2 });
    entities.push({ type: 'fallingPlatform', x: 14 * T, y: 14 * T, w: 2 });
    entities.push({ type: 'fallingPlatform', x: 9 * T, y: 12 * T, w: 2 });
    entities.push({ type: 'dataCore', x: 19 * T, y: 12.2 * T });
    entities.push({ type: 'checkpoint', x: 10 * T, y: 10 * T, id: 'l2_cp3' });
    entities.push({ type: 'signalBit', x: 15 * T, y: 9.4 * T });

    // Final ascent
    entities.push({ type: 'signalBit', x: 13.5 * T, y: 7.4 * T });
    entities.push({ type: 'signalBit', x: 8.5 * T, y: 5.4 * T });
    entities.push({ type: 'dataCore', x: 18 * T, y: 5.2 * T });
    entities.push({ type: 'glitchHopper', x: 12 * T, y: 4 * T, speed: 0.9 });
    entities.push({ type: 'signalBit', x: 6 * T, y: 3.4 * T });
    entities.push({ type: 'signalBit', x: 9 * T, y: 3.4 * T });

    entities.push({ type: 'signalTower', x: 19 * T, y: 4 * T });

    return {
      id: 'level2',
      name: 'CIRCUIT CAVERNS',
      theme: 'cavern',
      rows,
      tileSize: T,
      playerStart: { x: 3 * T, y: 37 * T },
      entities,
    };
  }

  return { data };
})();

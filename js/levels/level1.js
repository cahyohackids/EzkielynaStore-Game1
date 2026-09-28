PB.Levels = PB.Levels || {};
PB.Levels.level1 = (function () {
  const T = PB.Config.TILE;

  function build() {
    const W = 124, H = 16;
    const g = PB.Utils.createGridBuilder(W, H);
    const GROUND_TOP = 12;

    g.groundFrom(0, 9, GROUND_TOP, '#');
    // pit 10-11
    g.groundFrom(12, 24, GROUND_TOP, '#');
    // pit 25-27
    g.groundFrom(28, 70, GROUND_TOP, '#');
    // secret tunnel carved into 28-70 span
    g.fillRect(49, GROUND_TOP, 50, GROUND_TOP, '.');
    g.fillRect(47, GROUND_TOP + 1, 60, GROUND_TOP + 2, '.');
    // stepping platform above first gap
    g.platform(26, 26, 9, '=');
    // ascending platforms for data core #2
    g.platform(76, 77, 10, '=');
    g.platform(79, 80, 8, '=');
    g.platform(82, 84, 6, '=');
    // pit 71-73
    g.groundFrom(74, 90, GROUND_TOP, '#');
    // raised ledge + dash gap side route for data core #3
    g.platform(98, 100, 9, '=');
    g.platform(106, 109, 9, '=');
    // gap 91-94 for moving platform
    g.groundFrom(95, 123, GROUND_TOP, '#');

    return g.toRows();
  }

  function data() {
    const rows = build();
    const entities = [];

    // --- Tutorial run signal bits ---
    entities.push({ type: 'signalBit', x: 4 * T, y: 9.4 * T });
    entities.push({ type: 'signalBit', x: 6 * T, y: 10.4 * T });
    entities.push({ type: 'signalBit', x: 8 * T, y: 9.4 * T });

    // first pit (obstacle 1)
    entities.push({ type: 'signalBit', x: 15 * T + 16, y: 9 * T });

    // enemy zone 1
    entities.push({ type: 'glitchHopper', x: 16 * T, y: 12 * T, speed: 0.8 });
    entities.push({ type: 'signalBit', x: 14 * T, y: 10.4 * T });
    entities.push({ type: 'signalBit', x: 20 * T, y: 10.4 * T });
    entities.push({ type: 'signalBit', x: 22.5 * T, y: 9.2 * T });

    // gap 25-27 + bonus platform
    entities.push({ type: 'signalBit', x: 26 * T + 6, y: 7.6 * T });

    // checkpoint + second stretch
    entities.push({ type: 'checkpoint', x: 32 * T, y: 12 * T, id: 'l1_cp1' });
    entities.push({ type: 'signalBit', x: 30 * T, y: 10.4 * T });
    entities.push({ type: 'signalBit', x: 36 * T, y: 10.4 * T });
    entities.push({ type: 'signalBit', x: 40 * T, y: 9.2 * T });
    entities.push({ type: 'glitchHopper', x: 38 * T, y: 12 * T, speed: 0.9 });
    entities.push({ type: 'signalBit', x: 44 * T, y: 10.4 * T });

    // secret tunnel contents (data core #1)
    entities.push({ type: 'bouncePad', x: 49 * T, y: 15 * T });
    entities.push({ type: 'signalBit', x: 52 * T, y: 14.2 * T });
    entities.push({ type: 'signalBit', x: 55 * T, y: 14.2 * T });
    entities.push({ type: 'dataCore', x: 58 * T, y: 14 * T });

    // stretch after tunnel
    entities.push({ type: 'signalBit', x: 63 * T, y: 10.4 * T });
    entities.push({ type: 'glitchHopper', x: 65 * T, y: 12 * T, speed: 1 });
    entities.push({ type: 'signalBit', x: 68 * T, y: 9.2 * T });

    // vertical climb for data core #2
    entities.push({ type: 'signalBit', x: 76.5 * T, y: 9.2 * T });
    entities.push({ type: 'signalBit', x: 79.5 * T, y: 7.2 * T });
    entities.push({ type: 'dataCore', x: 83 * T, y: 5.2 * T });

    // moving platform crossing
    entities.push({
      type: 'movingPlatform', x: 91 * T, y: 11 * T, w: 3,
      path: [{ x: 91 * T, y: 11 * T }, { x: 94.5 * T, y: 11 * T }], speed: 0.9,
    });
    entities.push({ type: 'signalBit', x: 92.5 * T, y: 9.4 * T });

    entities.push({ type: 'checkpoint', x: 96 * T, y: 12 * T, id: 'l1_cp2' });

    // dash-only side route for data core #3 (elevated, optional, safe fallback below)
    entities.push({ type: 'signalBit', x: 99 * T, y: 7.4 * T });
    entities.push({ type: 'dataCore', x: 107.5 * T, y: 7.4 * T });

    entities.push({ type: 'glitchHopper', x: 110 * T, y: 12 * T, speed: 0.9 });
    entities.push({ type: 'signalBit', x: 113 * T, y: 10.4 * T });
    entities.push({ type: 'signalBit', x: 116 * T, y: 10.4 * T });
    entities.push({ type: 'signalBit', x: 119 * T, y: 10.4 * T });

    entities.push({ type: 'signalTower', x: 122 * T, y: 12 * T });

    return {
      id: 'level1',
      name: 'SIGNAL MEADOW',
      theme: 'meadow',
      rows,
      tileSize: T,
      playerStart: { x: 2 * T, y: 10 * T },
      entities,
    };
  }

  return { data };
})();

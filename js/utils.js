PB.Utils = (function () {
  function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function approach(current, target, delta) {
    if (current < target) return Math.min(current + delta, target);
    if (current > target) return Math.max(current - delta, target);
    return current;
  }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function aabbOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function formatTime(sec) {
    sec = Math.max(0, sec);
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  function isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  }

  // Small "pixel string art" blitter: array of equal-length strings, each char -> palette color.
  // Draws to a fresh offscreen canvas at given pixel scale. Returns the canvas.
  function drawPixelArt(rows, palette, scale) {
    const h = rows.length;
    const w = rows[0].length;
    const cnv = document.createElement('canvas');
    cnv.width = w * scale;
    cnv.height = h * scale;
    const ctx = cnv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const color = palette[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return cnv;
  }

  function createGridBuilder(w, h) {
    const grid = [];
    for (let y = 0; y < h; y++) grid.push(new Array(w).fill('.'));
    return {
      w, h, grid,
      set(x, y, ch) { if (y >= 0 && y < h && x >= 0 && x < w) grid[y][x] = ch; },
      fillRect(x0, y0, x1, y1, ch) {
        const yA = Math.max(0, Math.min(y0, y1)), yB = Math.min(h - 1, Math.max(y0, y1));
        const xA = Math.max(0, Math.min(x0, x1)), xB = Math.min(w - 1, Math.max(x0, x1));
        for (let y = yA; y <= yB; y++) for (let x = xA; x <= xB; x++) grid[y][x] = ch;
      },
      groundFrom(x0, x1, topY, ch) { this.fillRect(x0, topY, x1, h - 1, ch || '#'); },
      platform(x0, x1, y, ch) { this.fillRect(x0, y, x1, y, ch || '='); },
      toRows() { return grid.map(row => row.join('')); },
    };
  }

  return { clamp, lerp, approach, rand, randInt, pick, aabbOverlap, formatTime, isTouchDevice, drawPixelArt, createGridBuilder };
})();

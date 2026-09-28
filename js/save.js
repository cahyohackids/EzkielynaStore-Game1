PB.Save = (function () {
  const KEY = 'pixelbound_lost_signal_save_v1';

  function defaultData() {
    const levels = {};
    PB.LEVELS_META.forEach((l, i) => {
      levels[l.id] = { unlocked: i === 0, bestTime: null, bits: 0, bitsTotal: 0, cores: 0, completed: false };
    });
    return {
      levels,
      settings: { music: 50, sfx: 70, mute: false, shake: true, reducedMotion: false },
    };
  }

  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      const merged = defaultData();
      Object.assign(merged.settings, parsed.settings || {});
      if (parsed.levels) {
        for (const id in merged.levels) {
          if (parsed.levels[id]) Object.assign(merged.levels[id], parsed.levels[id]);
        }
      }
      return merged;
    } catch (e) {
      return defaultData();
    }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
  }

  function getSettings() { return data.settings; }
  function setSettings(s) { Object.assign(data.settings, s); persist(); }

  function getLevelProgress(id) { return data.levels[id]; }

  function recordLevelResult(id, result) {
    const lvl = data.levels[id];
    if (!lvl) return;
    lvl.completed = true;
    lvl.bits = Math.max(lvl.bits, result.bits);
    lvl.bitsTotal = result.bitsTotal;
    lvl.cores = Math.max(lvl.cores, result.cores);
    if (lvl.bestTime === null || result.time < lvl.bestTime) lvl.bestTime = result.time;
    const meta = PB.LEVELS_META.find(l => l.id === id);
    if (meta) {
      const next = PB.LEVELS_META[meta.order + 1];
      if (next && data.levels[next.id]) data.levels[next.id].unlocked = true;
    }
    persist();
  }

  function resetAll() {
    data = defaultData();
    persist();
  }

  return { getSettings, setSettings, getLevelProgress, recordLevelResult, resetAll };
})();

// All audio is synthesized at runtime via WebAudio — no external assets, fully original.
PB.Audio = (function () {
  let ctx = null;
  let musicGain, sfxGain, masterGain;
  let musicNodes = [];
  let musicTimer = null;
  let musicPlaying = false;
  let settings = { music: 0.5, sfx: 0.7, mute: false };

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.connect(masterGain);
      sfxGain = ctx.createGain();
      sfxGain.connect(masterGain);
      applyVolumes();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function applyVolumes() {
    if (!ctx) return;
    masterGain.gain.value = settings.mute ? 0 : 1;
    musicGain.gain.value = settings.music;
    sfxGain.gain.value = settings.sfx;
  }

  function setMusicVolume(v) { settings.music = v; applyVolumes(); }
  function setSfxVolume(v) { settings.sfx = v; applyVolumes(); }
  function setMute(m) { settings.mute = m; applyVolumes(); }
  function getSettings() { return Object.assign({}, settings); }
  function loadSettings(s) {
    settings = Object.assign(settings, s);
    applyVolumes();
  }

  // --- Low level synth helpers ---
  function tone(freq, dur, opts) {
    opts = opts || {};
    const c = ensureCtx();
    const t0 = c.currentTime + (opts.delay || 0);
    const osc = c.createOscillator();
    osc.type = opts.type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 1), t0 + dur);
    const g = c.createGain();
    const vol = opts.vol !== undefined ? opts.vol : 0.25;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (opts.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
    return osc;
  }

  function noiseBurst(dur, opts) {
    opts = opts || {};
    const c = ensureCtx();
    const t0 = c.currentTime + (opts.delay || 0);
    const bufSize = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = opts.filterType || 'highpass';
    filter.frequency.value = opts.filterFreq || 800;
    const g = c.createGain();
    g.gain.setValueAtTime(opts.vol !== undefined ? opts.vol : 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(sfxGain);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  const SFX = {
    jump() { tone(420, 0.16, { type: 'square', vol: 0.18, freqEnd: 720 }); },
    doubleTap() { tone(300, 0.05, { type: 'square', vol: 0.1 }); },
    land() { noiseBurst(0.07, { vol: 0.12, filterFreq: 400, filterType: 'lowpass' }); },
    dash() {
      tone(200, 0.14, { type: 'sawtooth', vol: 0.16, freqEnd: 900 });
      noiseBurst(0.1, { vol: 0.08, filterFreq: 1500 });
    },
    pickupBit() { tone(880, 0.09, { type: 'sine', vol: 0.2, freqEnd: 1400 }); },
    pickupCore() {
      tone(660, 0.1, { type: 'sine', vol: 0.22, freqEnd: 990, delay: 0 });
      tone(990, 0.14, { type: 'sine', vol: 0.2, freqEnd: 1500, delay: 0.09 });
    },
    hurt() { tone(180, 0.22, { type: 'sawtooth', vol: 0.22, freqEnd: 60 }); },
    enemyDefeat() { tone(500, 0.12, { type: 'square', vol: 0.18, freqEnd: 120 }); },
    checkpoint() {
      tone(520, 0.1, { type: 'sine', vol: 0.18, delay: 0 });
      tone(780, 0.16, { type: 'sine', vol: 0.18, delay: 0.1 });
    },
    death() { tone(300, 0.4, { type: 'sawtooth', vol: 0.2, freqEnd: 40 }); },
    levelComplete() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, { type: 'sine', vol: 0.2, delay: i * 0.11 }));
    },
    uiClick() { tone(340, 0.05, { type: 'square', vol: 0.1 }); },
    uiHover() { tone(220, 0.03, { type: 'sine', vol: 0.05 }); },
    bounce() { tone(260, 0.18, { type: 'sine', vol: 0.2, freqEnd: 640 }); },
    laser() { tone(1200, 0.05, { type: 'sawtooth', vol: 0.05 }); },
  };

  // --- Ambient procedural music: soft evolving pad + sparse arpeggio ---
  function startMusic(themeKey) {
    stopMusic();
    ensureCtx();
    musicPlaying = true;
    const scales = {
      meadow: [261.63, 293.66, 329.63, 392.00, 440.00],
      cavern: [220.00, 246.94, 261.63, 329.63, 349.23],
      tower: [196.00, 233.08, 261.63, 311.13, 349.23],
    };
    const scale = scales[themeKey] || scales.meadow;
    let step = 0;

    function padChord() {
      const c = ctx;
      const base = scale[0] / 2;
      [base, base * 1.5, base * 2].forEach((f, i) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, c.currentTime);
        g.gain.linearRampToValueAtTime(0.05 - i * 0.012, c.currentTime + 2);
        g.gain.linearRampToValueAtTime(0.0001, c.currentTime + 7.5);
        osc.connect(g);
        g.connect(musicGain);
        osc.start();
        osc.stop(c.currentTime + 7.6);
        musicNodes.push(osc);
      });
    }
    function pluck() {
      if (!musicPlaying) return;
      const f = PB.Utils.pick(scale) * (Math.random() < 0.3 ? 2 : 1);
      const c = ctx;
      const osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.045, c.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.1);
      osc.connect(g);
      g.connect(musicGain);
      osc.start();
      osc.stop(c.currentTime + 1.2);
    }
    padChord();
    const padInterval = setInterval(() => { if (musicPlaying) padChord(); }, 6000);
    const pluckInterval = setInterval(() => {
      if (!musicPlaying) return;
      if (Math.random() < 0.6) pluck();
    }, 1400);
    musicTimer = { padInterval, pluckInterval };
  }

  function stopMusic() {
    musicPlaying = false;
    if (musicTimer) {
      clearInterval(musicTimer.padInterval);
      clearInterval(musicTimer.pluckInterval);
      musicTimer = null;
    }
  }

  function unlock() { ensureCtx(); }

  return { SFX, startMusic, stopMusic, unlock, setMusicVolume, setSfxVolume, setMute, getSettings, loadSettings };
})();

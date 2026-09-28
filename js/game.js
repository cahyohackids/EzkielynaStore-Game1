PB.Game = (function () {
  let canvas, ctx;
  let camera;
  let levelManager;
  let state = 'boot'; // boot | menu | playing | paused | gameover | levelcomplete
  let lastTime = 0;
  let accumulator = 0;
  let clockTime = 0;
  let started = false;

  function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    camera = new PB.Camera(PB.Config.VIEW_W, PB.Config.VIEW_H);
    levelManager = new PB.LevelManager();
    levelManager.onComplete = onLevelComplete;
    levelManager.onGameOver = onGameOver;

    const s = PB.Save.getSettings();
    PB.Audio.loadSettings({ music: s.music / 100, sfx: s.sfx / 100, mute: s.mute });
    camera.shakeEnabled = s.shake !== false;

    PB.Input.init();
    PB.UI.init();

    window.addEventListener('resize', resize);
    resize();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state === 'playing') pause();
    });

    simulateLoading();
    requestAnimationFrame(frame);
  }

  function simulateLoading() {
    PB.UI.showLoading(0);
    let p = 0;
    const step = () => {
      p += 0.12 + Math.random() * 0.2;
      PB.UI.showLoading(Math.min(p, 1));
      if (p < 1) {
        setTimeout(step, 90);
      } else {
        setTimeout(() => { PB.UI.show('menu'); state = 'menu'; }, 150);
      }
    };
    step();
  }

  function resize() {
    const viewport = document.getElementById('game-viewport');
    const targetAR = PB.Config.VIEW_W / PB.Config.VIEW_H;
    const maxW = window.innerWidth;
    const maxH = window.innerHeight;
    let w = maxW, h = maxW / targetAR;
    if (h > maxH) { h = maxH; w = maxH * targetAR; }
    viewport.style.width = Math.floor(w) + 'px';
    viewport.style.height = Math.floor(h) + 'px';
  }

  function unlockAudioOnce() {
    if (!started) { PB.Audio.unlock(); started = true; }
  }

  // ---------------- Public flow control ----------------
  function playNextOrFirst() {
    unlockAudioOnce();
    let target = PB.LEVELS_META[0];
    for (const meta of PB.LEVELS_META) {
      const prog = PB.Save.getLevelProgress(meta.id);
      if (prog.unlocked && !prog.completed) { target = meta; break; }
      if (prog.unlocked) target = meta;
    }
    startLevel(target.id);
  }

  function startLevel(id) {
    unlockAudioOnce();
    levelManager.load(id);
    camera.snapTo(levelManager.player.x, levelManager.player.y);
    state = 'playing';
    PB.UI.hideAllScreens();
    PB.UI.showGameplayChrome(true);
    PB.UI.flashLevelName(levelManager.levelName);
    const meta = PB.LEVELS_META.find(m => m.id === id);
    PB.Audio.startMusic(meta ? meta.theme : 'meadow');
  }

  function restartLevel() {
    levelManager.restart();
    camera.snapTo(levelManager.player.x, levelManager.player.y);
    state = 'playing';
    PB.UI.hideAllScreens();
    PB.UI.showGameplayChrome(true);
  }

  function retryFromDeath() {
    levelManager.confirmRespawn();
    state = 'playing';
    PB.UI.hideAllScreens();
    PB.UI.showGameplayChrome(true);
  }

  function nextLevel() {
    const meta = PB.LEVELS_META.find(m => m.id === levelManager.levelId);
    const next = meta ? PB.LEVELS_META[meta.order + 1] : null;
    if (next && PB.Save.getLevelProgress(next.id).unlocked) {
      startLevel(next.id);
    } else {
      quitToMenu();
      PB.UI.showLevelSelect();
    }
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    PB.UI.showPause();
  }
  function resume() {
    if (state !== 'paused') return;
    state = 'playing';
    PB.UI.hideAllScreens();
    PB.UI.showGameplayChrome(true);
  }

  function quitToMenu() {
    PB.Audio.stopMusic();
    state = 'menu';
    PB.UI.showGameplayChrome(false);
    PB.UI.show('menu');
  }

  function onLevelComplete(stats) {
    PB.Audio.stopMusic();
    PB.Save.recordLevelResult(levelManager.levelId, stats);
    state = 'levelcomplete';
    PB.UI.showGameplayChrome(false);
    PB.UI.showLevelComplete(stats);
  }

  function onGameOver() {
    state = 'gameover';
    PB.UI.showGameOver();
  }

  // ---------------- Main loop ----------------
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!lastTime) lastTime = ts;
    let dt = (ts - lastTime) / 1000;
    lastTime = ts;
    if (dt > 0.25) dt = 0.25;
    clockTime += dt;

    if (state === 'playing') {
      accumulator += dt;
      let steps = 0;
      while (accumulator >= PB.Config.FIXED_DT && steps < PB.Config.MAX_SUBSTEPS) {
        stepGame(PB.Config.FIXED_DT);
        accumulator -= PB.Config.FIXED_DT;
        steps++;
      }
      if (steps === PB.Config.MAX_SUBSTEPS) accumulator = 0;
    } else {
      PB.Particles.update(Math.min(dt, 0.05));
    }

    render(clockTime);
    PB.Input.endFrame();
  }

  function stepGame(dt) {
    if (PB.Input.wasPressed('pause')) { pause(); return; }
    if (PB.Input.wasPressed('restart')) { levelManager.restart(); camera.snapTo(levelManager.player.x, levelManager.player.y); return; }
    levelManager.update(dt, PB.Input);
    camera.update(dt, levelManager.player);
    PB.UI.updateHud(levelManager.player, levelManager.getStats());
  }

  function render(t) {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state === 'playing' || state === 'paused' || state === 'gameover' || state === 'levelcomplete') {
      const offset = camera.getRenderOffset();
      const renderCam = { x: offset.x, y: offset.y };
      levelManager.draw(ctx, renderCam, t);
    } else {
      ctx.fillStyle = PB.Palette.navyDark;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  return {
    init, get camera() { return camera; }, get state() { return state; },
    playNextOrFirst, startLevel, restartLevel, retryFromDeath, nextLevel,
    pause, resume, quitToMenu,
  };
})();

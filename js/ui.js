PB.UI = (function () {
  const screens = {};
  let els = {};

  function $(id) { return document.getElementById(id); }

  function init() {
    ['loading', 'menu', 'levelselect', 'howtoplay', 'settings', 'pause', 'gameover', 'levelcomplete'].forEach(name => {
      screens[name] = $('screen-' + name);
    });
    els = {
      hud: $('hud'),
      hudHealth: $('hud-health'),
      hudSignalText: $('hud-signal-text'),
      hudCores: $('hud-cores'),
      hudDashFill: $('hud-dash-fill'),
      hudLevelName: $('hud-level-name'),
      btnPauseIngame: $('btn-pause-ingame'),
      touchControls: $('touch-controls'),
      levelCards: $('level-cards'),
      lcTime: $('lc-time'), lcBits: $('lc-bits'), lcCores: $('lc-cores'), lcDeaths: $('lc-deaths'),
      setMusic: $('set-music'), setSfx: $('set-sfx'), setMute: $('set-mute'),
      setShake: $('set-shake'), setReduced: $('set-reduced'),
      loadingFill: $('loading-fill'),
    };

    document.body.addEventListener('click', onAction);
    document.body.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        const el = document.activeElement;
        if (el && el.dataset && el.dataset.action && el.tagName === 'BUTTON') {
          // native click will fire; nothing extra needed
        }
      }
    });

    bindSettings();
    els.btnPauseIngame.addEventListener('click', () => PB.Game.pause());
  }

  function onAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    PB.Audio.SFX.uiClick();
    switch (action) {
      case 'play': PB.Game.playNextOrFirst(); break;
      case 'level-select': showLevelSelect(); break;
      case 'how-to-play': show('howtoplay'); break;
      case 'settings': show('settings'); break;
      case 'settings-from-pause': show('settings'); PB.UI._returnTo = 'pause'; break;
      case 'back-to-menu':
        if (PB.UI._returnTo === 'pause') { PB.UI._returnTo = null; show('pause'); }
        else show('menu');
        break;
      case 'resume': PB.Game.resume(); break;
      case 'restart-level': PB.Game.restartLevel(); break;
      case 'main-menu-from-pause': PB.Game.quitToMenu(); break;
      case 'retry': PB.Game.retryFromDeath(); break;
      case 'level-select-from-over': PB.Game.quitToMenu(); showLevelSelect(); break;
      case 'next-level': PB.Game.nextLevel(); break;
      case 'replay-level': PB.Game.restartLevel(); break;
      case 'level-select-from-complete': PB.Game.quitToMenu(); showLevelSelect(); break;
      default: break;
    }
  }

  function bindSettings() {
    const s = PB.Save.getSettings();
    els.setMusic.value = s.music;
    els.setSfx.value = s.sfx;
    els.setMute.checked = !!s.mute;
    els.setShake.checked = s.shake !== false;
    els.setReduced.checked = !!s.reducedMotion;

    els.setMusic.addEventListener('input', () => {
      const v = Number(els.setMusic.value) / 100;
      PB.Audio.setMusicVolume(v);
      PB.Save.setSettings({ music: Number(els.setMusic.value) });
    });
    els.setSfx.addEventListener('input', () => {
      const v = Number(els.setSfx.value) / 100;
      PB.Audio.setSfxVolume(v);
      PB.Save.setSettings({ sfx: Number(els.setSfx.value) });
      PB.Audio.SFX.uiHover();
    });
    els.setMute.addEventListener('change', () => {
      PB.Audio.setMute(els.setMute.checked);
      PB.Save.setSettings({ mute: els.setMute.checked });
    });
    els.setShake.addEventListener('change', () => {
      PB.Save.setSettings({ shake: els.setShake.checked });
      if (PB.Game && PB.Game.camera) PB.Game.camera.shakeEnabled = els.setShake.checked;
    });
    els.setReduced.addEventListener('change', () => {
      PB.Save.setSettings({ reducedMotion: els.setReduced.checked });
      document.body.classList.toggle('reduced-motion', els.setReduced.checked);
    });
    document.body.classList.toggle('reduced-motion', !!s.reducedMotion);
  }

  function hideAll() {
    for (const k in screens) screens[k].classList.add('hidden');
  }

  function show(name) {
    hideAll();
    screens[name].classList.remove('hidden');
    const firstBtn = screens[name].querySelector('button, input');
    if (firstBtn) setTimeout(() => firstBtn.focus(), 0);
  }

  function hideAllScreens() { hideAll(); }

  function showLoading(progress) {
    hideAll();
    screens.loading.classList.remove('hidden');
    if (progress !== undefined) els.loadingFill.style.width = Math.round(progress * 100) + '%';
  }

  function showLevelSelect() {
    els.levelCards.innerHTML = '';
    PB.LEVELS_META.forEach((meta, i) => {
      const progress = PB.Save.getLevelProgress(meta.id);
      const def = PB.Levels[meta.id].data();
      const bitsTotal = progress.bitsTotal || def.entities.filter(e => e.type === 'signalBit').length;
      const card = document.createElement('button');
      card.className = 'level-card' + (progress.unlocked ? '' : ' locked');
      card.setAttribute('data-action', progress.unlocked ? 'start-level' : '');
      card.disabled = !progress.unlocked;
      const themeClass = 'theme-' + meta.theme;
      card.innerHTML = `
        <div class="level-card-theme ${themeClass}">${meta.theme.toUpperCase()}</div>
        <div class="level-card-title">${meta.name}</div>
        <div class="level-card-sub">${progress.unlocked ? (progress.completed ? 'COMPLETED' : 'READY') : 'LOCKED'}</div>
        ${progress.unlocked ? `<div class="level-card-stats">
          <span>Best: ${progress.bestTime !== null ? PB.Utils.formatTime(progress.bestTime) : '--:--'}</span>
          <span>Bits: ${progress.bits}/${bitsTotal}</span>
          <span>Cores: ${progress.cores}/3</span>
        </div>` : `<div class="level-card-lock">Complete previous level</div>`}
      `;
      if (progress.unlocked) {
        card.addEventListener('click', () => PB.Game.startLevel(meta.id));
      }
      els.levelCards.appendChild(card);
    });
    show('levelselect');
  }

  function showGameplayChrome(show) {
    els.hud.classList.toggle('hidden', !show);
    els.btnPauseIngame.classList.toggle('hidden', !show);
    if (show && PB.Utils.isTouchDevice()) els.touchControls.classList.remove('hidden');
    else els.touchControls.classList.add('hidden');
  }

  function flashLevelName(name) {
    els.hudLevelName.textContent = name;
    els.hudLevelName.classList.add('show');
    setTimeout(() => els.hudLevelName.classList.remove('show'), 2600);
  }

  function updateHud(player, stats) {
    let healthHtml = '';
    for (let i = 0; i < player.maxHealth; i++) {
      healthHtml += `<div class="cell-icon${i < player.health ? '' : ' empty'}"></div>`;
    }
    els.hudHealth.innerHTML = healthHtml;
    els.hudSignalText.textContent = `${stats.bits} / ${stats.bitsTotal}`;
    let coresHtml = '';
    for (let i = 0; i < stats.coresTotal; i++) {
      coresHtml += `<div class="core-icon${i < stats.cores ? ' filled' : ''}"></div>`;
    }
    els.hudCores.innerHTML = coresHtml;
    const ratio = player.dashReadyRatio();
    els.hudDashFill.style.width = Math.round(ratio * 100) + '%';
    els.hudDashFill.classList.toggle('ready', ratio >= 1);
  }

  function showPause() { show('pause'); }
  function showGameOver() { show('gameover'); }
  function showLevelComplete(stats) {
    els.lcTime.textContent = PB.Utils.formatTime(stats.time);
    els.lcBits.textContent = `${stats.bits} / ${stats.bitsTotal}`;
    els.lcCores.textContent = `${stats.cores} / ${stats.coresTotal}`;
    els.lcDeaths.textContent = stats.deaths;
    show('levelcomplete');
  }

  return {
    init, show, hideAllScreens, showLoading, showLevelSelect, showGameplayChrome,
    flashLevelName, updateHud, showPause, showGameOver, showLevelComplete,
  };
})();

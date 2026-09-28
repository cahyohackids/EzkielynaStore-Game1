(function () {
  function boot() {
    try {
      PB.Game.init();
    } catch (err) {
      console.error('PIXELBOUND failed to start:', err);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

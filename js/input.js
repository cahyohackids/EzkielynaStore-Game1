PB.Input = (function () {
  const keys = Object.create(null);
  const pressedThisFrame = Object.create(null);
  const releasedThisFrame = Object.create(null);

  const touch = { left: false, right: false, jump: false, dash: false };
  const touchPressed = { jump: false, dash: false };
  const touchReleased = { jump: false, dash: false };

  let menuNavCallback = null;

  const CODE_MAP = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
    ShiftLeft: 'dash', ShiftRight: 'dash',
    KeyR: 'restart',
    Escape: 'pause',
  };

  function onKeyDown(e) {
    const action = CODE_MAP[e.code];
    if (action) {
      if (['left','right','jump','dash','restart','pause'].includes(action)) e.preventDefault();
      if (!keys[action]) pressedThisFrame[action] = true;
      keys[action] = true;
    }
  }
  function onKeyUp(e) {
    const action = CODE_MAP[e.code];
    if (action) {
      keys[action] = false;
      releasedThisFrame[action] = true;
    }
  }

  function init() {
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp, { passive: false });
    window.addEventListener('blur', () => {
      for (const k in keys) keys[k] = false;
    });
    setupTouch();
  }

  function bindTouchBtn(el, downFn, upFn) {
    if (!el) return;
    const down = (e) => { e.preventDefault(); el.classList.add('pressed'); downFn(); };
    const up = (e) => { e.preventDefault(); el.classList.remove('pressed'); upFn(); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    el.addEventListener('mousedown', down);
    el.addEventListener('mouseup', up);
    el.addEventListener('mouseleave', up);
  }

  function setupTouch() {
    bindTouchBtn(document.getElementById('touch-left'),
      () => { touch.left = true; }, () => { touch.left = false; });
    bindTouchBtn(document.getElementById('touch-right'),
      () => { touch.right = true; }, () => { touch.right = false; });
    bindTouchBtn(document.getElementById('touch-jump'),
      () => { if (!touch.jump) touchPressed.jump = true; touch.jump = true; },
      () => { touch.jump = false; touchReleased.jump = true; });
    bindTouchBtn(document.getElementById('touch-dash'),
      () => { if (!touch.dash) touchPressed.dash = true; touch.dash = true; },
      () => { touch.dash = false; touchReleased.dash = true; });
  }

  function isDown(action) { return !!keys[action] || !!touch[action]; }
  function wasPressed(action) {
    return !!pressedThisFrame[action] || !!touchPressed[action];
  }
  function wasReleased(action) {
    return !!releasedThisFrame[action] || !!touchReleased[action];
  }

  function endFrame() {
    for (const k in pressedThisFrame) pressedThisFrame[k] = false;
    for (const k in releasedThisFrame) releasedThisFrame[k] = false;
    touchPressed.jump = false; touchPressed.dash = false;
    touchReleased.jump = false; touchReleased.dash = false;
  }

  function getAxis() {
    let a = 0;
    if (isDown('left')) a -= 1;
    if (isDown('right')) a += 1;
    return a;
  }

  return { init, isDown, wasPressed, wasReleased, endFrame, getAxis };
})();

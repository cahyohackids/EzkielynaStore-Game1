PB.Camera = function (viewW, viewH) {
  this.x = 0;
  this.y = 0;
  this.viewW = viewW;
  this.viewH = viewH;
  this.levelW = viewW;
  this.levelH = viewH;
  this.shakeTime = 0;
  this.shakeMag = 0;
  this.shakeEnabled = true;
  this.targetLookahead = 0;
};

PB.Camera.prototype.setBounds = function (w, h) {
  this.levelW = w;
  this.levelH = h;
};

PB.Camera.prototype.snapTo = function (px, py) {
  this.x = PB.Utils.clamp(px - this.viewW / 2, 0, Math.max(0, this.levelW - this.viewW));
  this.y = PB.Utils.clamp(py - this.viewH / 2, 0, Math.max(0, this.levelH - this.viewH));
};

PB.Camera.prototype.update = function (dt, target) {
  const cfg = PB.Config;
  const desiredLookahead = target.facing * cfg.CAMERA_LOOKAHEAD * (Math.abs(target.vx) > 0.5 ? 1 : 0.4);
  this.targetLookahead = PB.Utils.lerp(this.targetLookahead, desiredLookahead, 0.05);

  const targetX = target.x + target.w / 2 + this.targetLookahead - this.viewW / 2;
  let targetY = target.y + target.h / 2 - this.viewH / 2 - 20;
  if (target.vy < -2) targetY -= 12;
  else if (target.vy > 5) targetY += 14;

  this.x = PB.Utils.lerp(this.x, targetX, cfg.CAMERA_LERP);
  this.y = PB.Utils.lerp(this.y, targetY, cfg.CAMERA_LERP_Y);

  this.x = PB.Utils.clamp(this.x, 0, Math.max(0, this.levelW - this.viewW));
  this.y = PB.Utils.clamp(this.y, 0, Math.max(0, this.levelH - this.viewH));

  if (this.shakeTime > 0) {
    this.shakeTime -= dt;
  }
};

PB.Camera.prototype.shake = function (mag, time) {
  if (!this.shakeEnabled) return;
  this.shakeMag = mag;
  this.shakeTime = Math.max(this.shakeTime, time);
};

PB.Camera.prototype.getRenderOffset = function () {
  if (this.shakeTime <= 0) return { x: this.x, y: this.y };
  const t = this.shakeTime;
  const mag = this.shakeMag * (t > 0.15 ? 1 : t / 0.15);
  return {
    x: this.x + (Math.random() - 0.5) * mag,
    y: this.y + (Math.random() - 0.5) * mag,
  };
};

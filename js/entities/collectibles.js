PB.Collectibles = (function () {
  function SignalBit(x, y) {
    this.type = 'signalBit';
    this.x = x; this.y = y; this.w = 14; this.h = 14;
    this.collected = false;
    this.t = Math.random() * 10;
  }
  SignalBit.prototype.getAABB = function () { return { x: this.x, y: this.y, w: this.w, h: this.h }; };
  SignalBit.prototype.update = function (dt) { this.t += dt; };
  SignalBit.prototype.collect = function () {
    if (this.collected) return;
    this.collected = true;
    PB.Audio.SFX.pickupBit();
    PB.Particles.pickupSparkle(this.x + this.w / 2, this.y + this.h / 2, PB.Palette.orange);
  };
  SignalBit.prototype.draw = function (ctx, camera) {
    if (this.collected) return;
    PB.Sprites.drawSignalBit(ctx, this.x + this.w / 2 - camera.x, this.y + this.h / 2 - camera.y, 1.5, this.t);
  };

  function DataCore(x, y) {
    this.type = 'dataCore';
    this.x = x; this.y = y; this.w = 20; this.h = 20;
    this.collected = false;
    this.t = Math.random() * 10;
  }
  DataCore.prototype.getAABB = function () { return { x: this.x, y: this.y, w: this.w, h: this.h }; };
  DataCore.prototype.update = function (dt) { this.t += dt; };
  DataCore.prototype.collect = function () {
    if (this.collected) return;
    this.collected = true;
    PB.Audio.SFX.pickupCore();
    PB.Particles.pickupSparkle(this.x + this.w / 2, this.y + this.h / 2, PB.Palette.neonCyan);
    if (PB.Game && PB.Game.camera) PB.Game.camera.shake(2, 0.15);
  };
  DataCore.prototype.draw = function (ctx, camera) {
    if (this.collected) return;
    PB.Sprites.drawDataCore(ctx, this.x + this.w / 2 - camera.x, this.y + this.h / 2 - camera.y, 1.3, this.t);
  };

  return { SignalBit, DataCore };
})();

PB.CheckpointEnt = function (x, y, id) {
  this.type = 'checkpoint';
  this.id = id;
  this.x = x; this.y = y - 40; this.w = 8; this.h = 40;
  this.active = false;
  this.t = 0;
  this.activatePulse = 0;
};
PB.CheckpointEnt.prototype.getAABB = function () { return { x: this.x - 10, y: this.y, w: this.w + 20, h: this.h }; };
PB.CheckpointEnt.prototype.update = function (dt) {
  this.t += dt;
  if (this.activatePulse > 0) this.activatePulse -= dt;
};
PB.CheckpointEnt.prototype.activate = function () {
  if (this.active) return false;
  this.active = true;
  this.activatePulse = 0.6;
  PB.Audio.SFX.checkpoint();
  PB.Particles.checkpointFlash(this.x, this.y + 10);
  return true;
};
PB.CheckpointEnt.prototype.draw = function (ctx, camera) {
  PB.Sprites.drawCheckpoint(ctx, this.x - camera.x, this.y + this.h - camera.y, 1.6, this.active, this.t);
};

PB.SignalTowerEnt = function (x, y) {
  this.type = 'signalTower';
  this.x = x; this.y = y - 26 * 1.7; this.w = 40; this.h = 26 * 1.7;
  this.active = false;
  this.t = 0;
};
PB.SignalTowerEnt.prototype.getAABB = function () { return { x: this.x, y: this.y, w: this.w, h: this.h }; };
PB.SignalTowerEnt.prototype.update = function (dt) { this.t += dt; };
PB.SignalTowerEnt.prototype.activate = function () {
  if (this.active) return false;
  this.active = true;
  PB.Particles.towerActivate(this.x + this.w / 2, this.y);
  if (PB.Game && PB.Game.camera) PB.Game.camera.shake(5, 0.5);
  return true;
};
PB.SignalTowerEnt.prototype.draw = function (ctx, camera) {
  PB.Sprites.drawSignalTower(ctx, this.x - camera.x, this.y + this.h - camera.y, 1.7, this.active, this.t);
};

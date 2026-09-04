(() => {
  "use strict";

  function expSmooth(cur, target, dt, tau) {
    if (tau <= 0.0001) return target;
    const a = 1 - Math.exp(-Math.max(0, dt) / tau);
    return cur + (target - cur) * a;
  }

  const SwordCamera = {
    followX: 0,
    followY: 110,
    shakeX: 0,
    shakeY: 0,
    shakeAmp: 0,
    shakeStart: 0,
    shakeMs: 0,
    shakeKind: "wave",
    shakeFacing: 1,
    phase: 0,

    reset(x, y, viewW) {
      const vw = viewW > 0 ? viewW : 900;
      /* 镜头是卷轴位置，不是人物世界坐标；用 hero.x 会把左边地形甩出画面 */
      this.followX = Math.max(0, (x || 0) - vw * 0.38);
      this.followY = y || 110;
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeAmp = 0;
      this.shakeMs = 0;
      this.shakeKind = "wave";
    },

    triggerShake(id, now, extra) {
      const base = (window.SwordConfig && SwordConfig.shake[id]) || {};
      const spec = extra ? Object.assign({}, base, extra) : base;
      if (!spec.amp) return;
      this.shakeAmp = spec.amp;
      this.shakeMs = spec.ms || 100;
      this.shakeKind = spec.kind || "wave";
      this.shakeFacing = spec.facing != null ? spec.facing : 1;
      this.shakeStart = now;
      this.phase = Math.random() * Math.PI * 2;
    },

    tick(now, dtSec, ctx) {
      const cfg = (window.SwordConfig && SwordConfig.camera) || {};
      const H = ctx.H || 140;
      const viewW = ctx.viewW || 900;
      const maxCam = Math.max(0, (ctx.arenaW || viewW) - viewW);
      let look = (ctx.facing || 1) * H * (cfg.lookAheadH || 0.35);
      /* 人在左半场时不要再往右看，否则左边地形永远进不了画面 */
      if (!ctx.dashing && ctx.heroX < viewW * 0.5 && look > 0) {
        look *= Math.max(0, ctx.heroX / Math.max(1, viewW * 0.5));
      }
      const tauX = ctx.dashing ? (cfg.dashSmoothX || 0.04) : (cfg.smoothX || 0.08);
      if (ctx.dashing) look += (ctx.facing || 1) * H * (cfg.dashLookH || 0.22);
      const groundY = ctx.groundY != null ? ctx.groundY : 110;
      const hopY = ctx.hopY || 0;
      const hopping = !!ctx.hopping && !ctx.normalJump;
      const landing = !!ctx.landing && !ctx.normalJump;
      const tauY = hopping
        ? (cfg.hopSmoothY || 0.045)
        : landing || Math.abs(this.followY - groundY) > 2
          ? (cfg.landSmoothY || 0.05)
          : (cfg.smoothY || 0.1);

      let targetX = ctx.heroX - viewW * 0.38 + look;
      targetX = Math.min(maxCam, Math.max(0, targetX));
      this.followX = expSmooth(this.followX, targetX, dtSec, tauX);
      if (this.followX < 0) this.followX = 0;
      if (this.followX > maxCam) this.followX = maxCam;

      const follow = cfg.hopFollow != null ? cfg.hopFollow : 0.82;
      const lockGround = !!ctx.lockGroundY || !!ctx.normalJump;
      const targetY = hopping && !lockGround ? groundY + hopY * follow : groundY;
      if (lockGround) this.followY = groundY;
      else this.followY = expSmooth(this.followY, targetY, dtSec, tauY);
      if (!hopping && !landing && Math.abs(this.followY - groundY) < 0.2) this.followY = groundY;

      if (this.shakeAmp > 0 && now < this.shakeStart + this.shakeMs) {
        const t = Math.min(1, (now - this.shakeStart) / this.shakeMs);
        if (this.shakeKind === "impact") {
          const kicks = [1, -0.62, 0.28];
          const seg = Math.min(kicks.length - 1, (t * kicks.length) | 0);
          const local = t * kicks.length - seg;
          const fall = (1 - local) * (1 - t);
          const kick = kicks[seg] * fall;
          this.shakeX = this.shakeFacing * this.shakeAmp * kick;
          this.shakeY = this.shakeAmp * 0.22 * kick;
        } else {
          const damp = (1 - t) * (1 - t);
          this.phase += dtSec * 52;
          this.shakeX = Math.sin(this.phase * 1.7) * this.shakeAmp * damp;
          this.shakeY = Math.cos(this.phase * 2.3) * this.shakeAmp * 0.45 * damp;
        }
      } else {
        this.shakeAmp = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    },

    getX() {
      return this.followX + this.shakeX;
    },

    getY() {
      return this.followY;
    },

    getShake() {
      return { x: this.shakeX, y: this.shakeY };
    },
  };

  window.SwordCamera = SwordCamera;
})();

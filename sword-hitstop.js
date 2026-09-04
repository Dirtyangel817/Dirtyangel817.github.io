(() => {
  "use strict";

  const SwordHitstop = {
    remain: 0,
    fired: Object.create(null),

    reset() {
      this.remain = 0;
      this.fired = Object.create(null);
    },

    resetAttack() {
      this.fired = Object.create(null);
    },

    tick(dtMs, paused) {
      if (paused || this.remain <= 0) return;
      this.remain = Math.max(0, this.remain - Math.max(0, dtMs));
    },

    active() {
      return this.remain > 0;
    },

    /** 每个技能释放帧只顿一次；已在顿帧中则不再叠加 */
    trigger(id) {
      if (this.fired[id]) return false;
      this.fired[id] = true;
      const ms = (window.SwordConfig && SwordConfig.hitstopMs) || 100;
      if (this.remain > 0) return true;
      this.remain = ms;
      return true;
    },

    clearOnScene() {
      this.remain = 0;
    },
  };

  window.SwordHitstop = SwordHitstop;
})();

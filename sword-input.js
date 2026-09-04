(() => {
  "use strict";

  const SwordInput = {
    onConfirm: null,
    canCollect: null,
    isUiEvent: null,

    reset() {},

    pointerDown(e) {
      if (!e || e.button !== 0) return false;
      if (typeof this.isUiEvent === "function" && this.isUiEvent(e)) return false;
      if (typeof this.canCollect === "function" && !this.canCollect()) return false;
      if (typeof this.onConfirm === "function") this.onConfirm(1);
      return true;
    },

    blur() {},
  };

  window.SwordInput = SwordInput;
})();

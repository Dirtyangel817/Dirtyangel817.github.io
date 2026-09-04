(() => {
  "use strict";

  const DIR = "assets/gedoudongzuo/";
  const FRAME_VER = "num5";
  /* 只写数字；加载时先找 png，没有再用 gif */
  const F = (id) => `${DIR}${id}`;

  const SwordConfig = {
    clickWindowMs: 0,
    comboScale: 0.441,
    frameDir: DIR,
    frameVer: FRAME_VER,
    idleId: "08",
    breathAmp: 0.012,
    breathMs: 1600,
    recoverEase: "smooth",
    chainMode: true,

    frames: {
      "08": F("08"),
      "09": F("09"),
      "14": F("14"),
      "15": F("15"),
      "16": F("16"),
      "17": F("17"),
      "20": F("20"),
      "21": F("21"),
      "22": F("22"),
      "26": F("26"),
      "27": F("27"),
      "28": F("28"),
    },
    dashFrame: "dash",
    dashFrames: {
      dash: `${DIR}move.png`,
    },
    airFrames: {
      up: `${DIR}up.png`,
      down: `${DIR}down.png`,
    },
    hitFrames: {
      hurt: "assets/xingzouzhen/beida.png",
      hurtFlash: "assets/xingzouzhen/beida_baishan.png",
    },
    walkHoldMs: 120,
    walkFrames: {
      w08: "assets/xingzouzhen/sword_walk_cycle_transparent_08.png",
      w09: "assets/xingzouzhen/sword_walk_cycle_transparent_09.png",
      w10: "assets/xingzouzhen/sword_walk_cycle_transparent_10.png",
      w11: "assets/xingzouzhen/sword_walk_cycle_transparent_11.png",
    },
    walkOrder: ["w08", "w09", "w10", "w11"],
    /* 走路帧相对待机微调，画面像素 */
    walkShift: { x: 0, y: 0 },
    walkScale: 1,
    /* 画面像素，沿朝向逐渐往前；脚底由程序钉在地面 */
    frameShift: {
      "08": { x: 0 },
      "09": { x: 6 },
      "14": { x: 12 },
      "15": { x: 83 },
      "16": { x: 103 },
      "17": { x: 107 },
      "20": { x: 177 },
      "21": { x: 156 },
      "22": { x: 282 },
      "26": { x: 241 },
      "27": { x: 220 },
      "28": { x: 341 },
    },

    camera: {
      smoothX: 0.08,
      smoothY: 0.10,
      dashSmoothX: 0.018,
      dashLookH: 0.72,
      hopSmoothY: 0.12,
      landSmoothY: 0.14,
      hopFollow: 0.95,
      jumpFollow: 0,
      hopUpMs: 200,
      landFollowMs: 460,
      lookAheadH: 0.35,
      deadzoneYH: 0.05,
    },

    hitstopMs: 100,

    audio: {
      src: "assets/yinxiao/1.mp3",
      swingOrder: ["14", "15", "17", "20", "22", "27", "28"],
      hitOrder: ["15", "20", "22", "28"],
      /* 第几下：1.mp3 / 2.mp3 / 3.mp3 / 4.mp3，±3% 变调；1 轻 4 重 */
      slices: {
        "15": { src: "assets/yinxiao/1.mp3", start: 0, dur: 2, vol: 0.85 },
        "20": { src: "assets/yinxiao/2.mp3", start: 0, dur: 2, vol: 0.90 },
        "22": { src: "assets/yinxiao/3.mp3", start: 0, dur: 2, vol: 0.95 },
        "28": { src: "assets/yinxiao/4.mp3", start: 0, dur: 2, vol: 1.0 },
      },
      "15": { kind: "slash", vol: 0.85 },
      "20": { kind: "heavy", vol: 0.90 },
      "22": { kind: "upper", vol: 0.95 },
      "28": { kind: "thrust", vol: 1.0 },
    },

    shake: {
      "15": { amp: 16, ms: 100, kind: "impact" },
      "20": { amp: 18, ms: 110, kind: "impact" },
      "22": { amp: 20, ms: 120, kind: "impact" },
      "28": { amp: 24, ms: 130, kind: "impact" },
    },

    hits: {
      "15": { damageMul: 1.1, reachMul: 1.35, knockback: 2.6, arc: { min: -28, max: 28 }, crit: true, critMul: 1.5 },
      "20": { damageMul: 1.25, reachMul: 1.28, knockback: 3.2, arc: { min: -10, max: 88 }, crit: true, critMul: 1.55 },
      "22": { damageMul: 1.45, reachMul: 1.32, knockback: 3.8, arc: { min: -8, max: 78 }, crit: true, critMul: 1.6 },
      "28": { damageMul: 1.9, reachMul: 1.85, knockback: 5.6, arc: { min: -16, max: 16 }, pierce: true, crit: true, critMul: 1.7 },
    },

    /**
     * 按几下打几下：
     * 1：08 → 09 → 14 → 15 → 16
     * 2：17 → 20 → 21
     * 3：22 → 26
     * 4：27 → 28 → 08
     */
    attacks: {
      1: {
        id: "attack1",
        recoverMs: 40,
        steps: [
          { from: "08", to: "09", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "linear" },
          { from: "09", to: "14", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "linear" },
          { from: "14", to: "15", holdMs: 100, dx: 0, dy: 0, crouch: 0, ease: "easeOut" },
          { from: "15", to: "16", holdMs: 150, hitstop: true, release: true, dx: 0, dy: 0, crouch: 0, ease: "easeOut" },
          { from: "16", to: "08", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "smooth" },
        ],
      },
      2: {
        id: "attack2",
        recoverMs: 50,
        steps: [
          { from: "17", to: "20", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "easeOut" },
          { from: "20", to: "21", holdMs: 150, hitstop: true, release: true, dx: 0, dy: 0, crouch: 0, ease: "easeIn" },
          { from: "21", to: "22", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "smooth" },
        ],
      },
      3: {
        id: "attack3",
        recoverMs: 50,
        steps: [
          { from: "22", to: "26", holdMs: 200, hitstop: true, release: true, dx: 0, dy: 0, crouch: 0, ease: "easeOut" },
          { from: "26", to: "27", holdMs: 50, dx: 0, dy: 0, crouch: 0, ease: "smooth" },
        ],
      },
      4: {
        id: "attack4",
        recoverMs: 60,
        steps: [
          { from: "27", to: "28", holdMs: 200, dx: 0, dy: 0, crouch: 0, ease: "dash", dash: true, dashMs: 40 },
          { from: "28", to: "08", holdMs: 150, hitstop: true, release: true, dxPx: 40, dy: 0, crouch: 0, ease: "easeOut", dash: true, dashMs: 200 },
        ],
      },
    },
  };

  window.SwordConfig = SwordConfig;
})();

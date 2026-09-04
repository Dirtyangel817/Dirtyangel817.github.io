(() => {
  "use strict";

  const boot = document.getElementById("boot");
  const game = document.getElementById("game");
  const frame = document.getElementById("scene-frame");
  const layers = frame ? [...frame.querySelectorAll(".layer")] : [];
  const cursor = document.getElementById("cursor");
  const startBtn = document.getElementById("start-btn");
  const toast = document.getElementById("toast");
  const loadingPage = document.getElementById("loading-page");
  /* BUILD: click-only-attack — no auto attack */

  function isPhoneUi() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches ||
      Math.min(w, h) <= 920
    );
  }

  function viewportSize() {
    const vv = window.visualViewport;
    if (vv && vv.width > 1 && vv.height > 1) {
      return { w: vv.width, h: vv.height, x: vv.offsetLeft || 0, y: vv.offsetTop || 0 };
    }
    return { w: window.innerWidth, h: window.innerHeight, x: 0, y: 0 };
  }

  function stageFitNodes() {
    const nodes = [];
    if (game && game.isConnected) nodes.push(game);
    if (loadingPage && loadingPage.isConnected && loadingPage.classList.contains("is-show")) {
      nodes.push(loadingPage);
    }
    return nodes;
  }

  function clearStageFit(el) {
    if (!el) return;
    el.style.position = "";
    el.style.width = "";
    el.style.height = "";
    el.style.top = "";
    el.style.left = "";
    el.style.right = "";
    el.style.bottom = "";
    el.style.transform = "";
    el.style.transformOrigin = "";
  }

  function applyStageFit() {
    const phone = isPhoneUi();
    const { w, h, x, y } = viewportSize();
    const portrait = phone && h > w + 12;
    const landW = Math.max(w, h);
    const landH = Math.min(w, h);
    const root = document.documentElement;
    root.classList.toggle("is-phone", phone);
    root.classList.toggle("is-phone-portrait", portrait);
    root.style.setProperty("--stage-w", `${landW}px`);
    root.style.setProperty("--stage-h", `${landH}px`);

    const nodes = stageFitNodes();
    if (loadingPage && !nodes.includes(loadingPage)) clearStageFit(loadingPage);
    if (!phone) {
      nodes.forEach(clearStageFit);
      return;
    }

    nodes.forEach((el) => {
      el.style.position = "fixed";
      el.style.right = "auto";
      el.style.bottom = "auto";
      if (portrait) {
        el.style.width = `${landW}px`;
        el.style.height = `${landH}px`;
        el.style.left = `${x + w}px`;
        el.style.top = `${y}px`;
        el.style.transformOrigin = "0 0";
        el.style.transform = "rotate(90deg)";
      } else {
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transformOrigin = "0 0";
        el.style.transform = "none";
      }
    });
  }

  function lockLandscape() {
    const ori = screen.orientation;
    if (!ori || !ori.lock) return;
    ori.lock("landscape").catch(() => {});
  }

  function forceShowGame() {
    try {
      if (boot && boot.isConnected) boot.remove();
      if (loadingPage) {
        loadingPage.hidden = true;
        loadingPage.classList.remove("is-show");
        clearStageFit(loadingPage);
      }
      if (game) game.hidden = false;
      applyStageFit();
      if (!started) loadDeferredTitleArt();
    } catch (err) {
      console.error("[cangbaoge] forceShowGame failed", err);
      if (boot && boot.isConnected) boot.remove();
      if (game) game.hidden = false;
    }
  }

  /* 防止异常卡死在 LOADING */
  setTimeout(forceShowGame, 2200);

  const runway = document.getElementById("runway");
  const runner = document.getElementById("runner");
  const runnerSprite = document.getElementById("runner-sprite");
  const comboStage = document.getElementById("combo-stage");
  const playerFootLeft = document.getElementById("player-foot-left");
  const playerFootRight = document.getElementById("player-foot-right");
  const playerFeetEl = document.getElementById("player-feet");
  const swordRack = document.getElementById("weapon-rack");
  const weaponRack = swordRack;
  const runBack = document.getElementById("run-back");
  const runMid = document.getElementById("run-mid");
  const runFront = document.getElementById("run-front");
  const trackWorld = document.getElementById("track-world");
  const pauseOverlay = document.getElementById("pause-overlay");
  const gameoverOverlay = document.getElementById("gameover-overlay");
  const gameoverContinueBtn = document.getElementById("gameover-continue");
  const gameoverQuitBtn = document.getElementById("gameover-quit");
  const gameoverTitleEl = document.getElementById("gameover-title");
  const gameoverHintEl = document.getElementById("gameover-hint");
  const stageTimerEl = document.getElementById("stage-timer");
  const stageLabelEl = document.getElementById("stage-label");
  const stageTimeEl = document.getElementById("stage-time");
  const shopEl = document.getElementById("shop");
  const shopGoldEl = document.getElementById("shop-gold");
  const shopNextBtn = document.getElementById("shop-next");
  const shopBuyBtn = document.getElementById("shop-buy");
  const shopRefreshBtn = document.getElementById("shop-refresh");
  const shopRefreshCostEl = document.getElementById("shop-refresh-cost");
  const shopTipEl = document.getElementById("shop-tip");
  const shopTipName = document.getElementById("shop-tip-name");
  const shopTipDesc = document.getElementById("shop-tip-desc");
  const shopTipEffect = document.getElementById("shop-tip-effect");
  let shopSlots = [...document.querySelectorAll(".shop-slot")];
  const bagBtn = document.getElementById("bag-btn");
  const bagPanel = document.getElementById("bag-panel");
  const bagList = document.getElementById("bag-list");
  const bagEmpty = document.getElementById("bag-empty");
  const bagCloseBtn = document.getElementById("bag-close");
  const bagCountEl = document.getElementById("bag-count");
  const gouHudEl = document.getElementById("gou-hud");
  const gouHpBarEl = document.getElementById("gou-hp-bar");

  const runBackArt = runBack && runBack.querySelector(".run-parallax__art");
  const runMidArt = runMid && runMid.querySelector(".run-parallax__art");
  const runFrontArt = runFront && runFront.querySelector(".run-parallax__art");

  const HERO_SRC = {
    red: "assets/juese/little-red.webp?v=fit2",
    blue: "assets/juese/little-blue.webp?v=fit2",
  };
  /** 吕洞宾全身攻击帧（剑+弧光已画进图）；待机已改用连招 GIF，不再用旧身体/脚 */
  const BLUE_BODY_ATK = {
    idle: "assets/gedoudongzuo/08.png",
    2: "assets/renwudongzuo/2.png",
    3: "assets/renwudongzuo/3.png",
    4: "assets/renwudongzuo/4.png",
    5: "assets/renwudongzuo/5.png",
    6: "assets/renwudongzuo/6.png",
  };
  const PLAYER_FOOT_SRC = {
    left: "assets/juese/left foot.png",
    right: "assets/juese/rightfoot.png",
    /** 停止时默认站姿参考（左右脚 local 归零对齐此图） */
    middle: "assets/juese/middlefoot.png",
  };
  const FOOT_STEP_MS = 120; /* 每步 0.10–0.13s */
  const FOOT_FWD_PX = 6; /* 前脚幅度 */
  const FOOT_BACK_PX = 3; /* 后脚幅度 */
  const COIN_SRC = "assets/ui/money.webp?v=icon10";
  const ENEMY_SRC = "assets/tianbing/tianbing1.webp?v=fit2";
  const ENEMY_FLASH_SRC = "assets/tianbing/tianbing-baishan.webp?v=fit2";
  const ENEMY_WEAPON_SRC = "assets/tianbing/wuqi.webp?v=fit2";
  const ZHU_SRC = "assets/zhu/zhu.webp?v=fit2";
  const ZHU_XULI_SRC = "assets/zhu/zhuxuli.webp?v=fit2";
  const ZHU_GONGJI_SRC = "assets/zhu/zhugongji.webp?v=fit2";
  const ZHU_STAGE_FROM = 3;
  const ZHU_LUNGE = 8.6;
  const ZHU_HOVER = 30;
  const ZHU_BOB = 8;
  const ZHU_FLY = 1.35;
  const ZHU_STAND_SINK = 10;
  const ZHU_HP_MUL = 2;
  const ZHU_HIT_DY = 130;
  const GOU_SRC = "assets/gou/zoulu.webp?v=fit2";
  const GOU_XULI_SRC = "assets/gou/xuli.webp?v=fit2";
  const GOU_GONGJI_SRC = "assets/gou/gongji.webp?v=fit2";
  const GOU_FLASH_SRC = "assets/gou/baishan.webp?v=fit2";
  const GOU_ICON_SRC = "assets/gou/tupiao.webp?v=hud2";
  const GOU_STAGE_FROM = 5;
  const GOU_LUNGE = 11.2;
  const GOU_MOVE_MUL = 1.56;
  const GOU_DR = 0.18;
  const GOU_CHARGE_GAP = 80;
  const GOU_SKIP_CHARGE_GAP = 100;
  const GOU_ENGAGE_GAP = 180;
  const GOU_CHARGE_MS = 480;
  const GOU_THRUST_MS = 240;
  const GOU_RECOVER_MS = 480;
  const GOU_PUNISH_RANGE = 240;
  const GOU_PUNISH_CD_MS = 640;
  const GOU_TIME_BONUS = 25;
  const KNIFE_SRC = "assets/shop/bishou.webp?v=icon10";
  const FLOOR_SRC = "assets/main/main_floor1.webp?v=fit3";
  const RUN_BG = {
    back: "assets/main/main_bg1.webp?v=bg10",
    mid: "assets/main/main_bg2.webp?v=bg10",
    front: "assets/main/main_bg3.webp?v=bg10",
  };
  const FLOOR_SRC_W = 276;
  const FLOOR_SRC_H = 597;
  /* 侧面宽度（源图像素），拼接时下一块重叠上去 */
  const FLOOR_SIDE_OVERLAP = 40;
  /* 地形显示宽度 */
  const FLOOR_UNIT_W = 176;
  const FLOOR_UNIT_H = Math.round((FLOOR_UNIT_W * FLOOR_SRC_H) / FLOOR_SRC_W);
  const FLOOR_STEP = FLOOR_UNIT_W * ((FLOOR_SRC_W - FLOOR_SIDE_OVERLAP) / FLOOR_SRC_W);
  /* 地面高度（比上一版略低） */
  const HEIGHTS = [84, 108, 132, 156, 180, 204];
  /* 脚底相对实体顶面下移（只改碰撞，不挪贴图） */
  const SURFACE_NUDGE = 20;
  /* 天兵与主角同高站立，不再额外抬高 */
  const ENEMY_Y_NUDGE = 0;
  const MOVE_SPEED = 4.37; /* 原 9.5 减慢 60% 后为 3.8，再加快 15% */
  const TAP_DASH_MS = 280;
  const DASH_THRUST_PX = 200;
  const DASH_THRUST_SPEED = 20;
  const DASH_RUN_MUL = 1.7;
  const DASH_COOLDOWN_MS = 2000;
  const GRAVITY = 0.88; /* 0.95 落地偏重，略降；高度仍由 JUMP_HEIGHT 决定 */
  /* 物理步进与显示器刷新脱钩，避免高刷重力变大、低刷变飘 */
  const PHYS_FRAME_MS = 1000 / 60;
  let fightDtMs = PHYS_FRAME_MS;
  function physScale(ms) {
    const n = ms == null ? fightDtMs : ms;
    return Math.max(0.2, Math.min(3, n / PHYS_FRAME_MS));
  }
  /* 一段跳顶点高度；与重力解耦，改 GRAVITY 只影响滞空时间 */
  const JUMP_HEIGHT = 13.5 * 13.5 / (0.72 * 2) - 20; /* 原约 126.56，再短 20px */
  const JUMP_V = Math.sqrt(2 * GRAVITY * JUMP_HEIGHT);
  const MAX_JUMPS = 2;
  const LAND_TOL = 14;
  const MAX_WALK_STEP = 3;
  const GAP_SAFE_RATIO = 0.75;
  const FORCE_ZERO_GAP = false;
  /* 关卡地形：按关卡种子生成高低台与缝隙 */
  const FLAT_ARENA = false;
  const MAX_HP = 100;
  const START_LIVES = 3;
  const PLAYER_ATK = 20;
  const BOSS_MOVE = 2.4;
  const BOSS_CHASE = 4.9;
  const BOSS_AGGRO_X = 560;
  const BOSS_AGGRO_Y = 240;
  /** 贴身后再蓄力出枪 */
  const BOSS_ATTACK_GAP = 58;
  const BOSS_HURT_FRAMES = 22;
  const BOSS_JUMP_COOLDOWN = 16;
  /** 各关普通怪：血量 / 攻击 / 本关刷新总数 */
  /* 一套完整连招 15+20+22+28（均暴击）刚好打空 */
  const COMBO_KILL_HP = Math.floor(
    PLAYER_ATK * (1.1 * 1.5 + 1.25 * 1.55 + 1.45 * 1.6 + 1.9 * 1.7)
  );
  /* 关卡表：时间 / 天兵 / 猪 / 血量 / 攻击（恶犬不计入 count） */
  const STAGE_MOB = {
    1: { hp: 118, atk: 4, tianbing: 10, zhu: 0, count: 10, time: 35 },
    2: { hp: 150, atk: 5, tianbing: 14, zhu: 0, count: 14, time: 45 },
    3: { hp: 170, atk: 6, tianbing: 12, zhu: 6, count: 18, time: 60 },
    4: { hp: 182, atk: 7, tianbing: 13, zhu: 9, count: 22, time: 65 },
    5: { hp: 182, atk: 8, tianbing: 13, zhu: 13, count: 26, time: 90 },
    6: { hp: 205, atk: 9, tianbing: 15, zhu: 15, count: 30, time: 70 },
    7: { hp: 230, atk: 10, tianbing: 17, zhu: 17, count: 34, time: 70 },
    8: { hp: 260, atk: 11, tianbing: 19, zhu: 19, count: 38, time: 75 },
    9: { hp: 295, atk: 13, tianbing: 21, zhu: 21, count: 42, time: 75 },
    10: { hp: 335, atk: 15, tianbing: 23, zhu: 23, count: 46, time: 105 },
    11: { hp: 380, atk: 17, tianbing: 25, zhu: 25, count: 50, time: 85 },
    12: { hp: 430, atk: 19, tianbing: 27, zhu: 27, count: 54, time: 90 },
  };
  const KILL_GOLD_TIANBING = 2;
  const KILL_GOLD_ZHU = 3;
  const KILL_GOLD_GOU = 15;
  const STAGE_CLEAR_HEAL = 0.1;
  const ROAD_COIN_PLAN = {
    1: { total: 6, clusters: 3, size: 2, windows: [[6, 12], [16, 24], [26, 32]], ttl: 10 },
    2: { total: 8, clusters: 4, size: 2, windows: [[8, 16], [18, 26], [28, 36], [38, 44]], ttl: 10 },
    3: { total: 10, clusters: 5, size: 2, windows: [[10, 20], [24, 34], [38, 48], [52, 58]], ttl: 12 },
    4: { total: 12, clusters: 4, size: 3, windows: [[10, 22], [26, 38], [42, 54], [58, 64]], ttl: 12 },
    5: { total: 14, clusters: 7, size: 2, windows: [[12, 24], [28, 40], [44, 56], [60, 72], [76, 84]], ttl: 12 },
    6: { total: 14, clusters: 7, size: 2, windows: [[8, 18], [22, 32], [36, 46], [50, 60], [64, 70]], ttl: 12 },
    7: { total: 16, clusters: 4, size: 4, windows: [[8, 20], [24, 36], [40, 52], [56, 68]], ttl: 12 },
    8: { total: 16, clusters: 4, size: 4, windows: [[10, 22], [26, 40], [44, 58], [62, 74]], ttl: 12 },
    9: { total: 18, clusters: 6, size: 3, windows: [[8, 20], [24, 36], [40, 52], [56, 68], [70, 74]], ttl: 14 },
    10: { total: 18, clusters: 6, size: 3, windows: [[12, 28], [34, 50], [56, 72], [78, 94], [96, 104]], ttl: 14 },
    11: { total: 20, clusters: 5, size: 4, windows: [[10, 24], [28, 42], [46, 60], [64, 78], [80, 84]], ttl: 14 },
    12: { total: 20, clusters: 5, size: 4, windows: [[10, 26], [30, 46], [50, 66], [70, 84], [86, 90]], ttl: 14 },
  };
  const ATTACK_FRAMES = 26;
  const HERO_HIT_FLASH_MS = 500;
  const HERO_HIT_FLASH_STEP_MS = 80;
  const HERO_HIT_PROTECT_MS = 650;
  const HERO_HIT_STRIKE_GAP_MS = 700;
  const SPAWN_GRACE_MS = 3000;
  const ATTACK_REACH = 96 * 1.5; /* 原 96*3，缩小一倍 */
  const SWORD_CD_MS = 500; /* 已废弃：宝剑不再自动冷却攻击 */
  const FAN_CD_MS = 1000; /* 已废弃：扇子不再自动冷却攻击 */

  /**
   * 吕洞宾连击：全身帧 assets/renwudongzuo（剑与弧光已合成）
   * 初始站立 dongzuo1；双击→2；三次→3+4 连贯；四次→5+6
   */
  const SWORD_COMBO = {
    resetMs: 700,
    bufferWindowMs: 160,
    damageMul: 1,
    critDamageMul: 1,
    attackSpeedMul: 1,
    /** 连招已改用 gedoudongzuo GIF，不再切旧全身 PNG */
    useBodyFrames: false,
    showSlashVfx: false,
    steps: [
      {
        id: "a1",
        label: "双击斩",
        durationMs: 280,
        chargeMs: 0,
        activeStartMs: 60,
        activeEndMs: 200,
        bodyFrames: [2],
        damageMul: 1,
        reachMul: 1.05,
        arc: { min: -70, max: 20 },
        hitStopMs: 30,
        knockback: 2.4,
        bodyNudgePx: 2,
        lean: 1,
      },
      {
        id: "a2",
        label: "三连",
        durationMs: 360,
        chargeMs: 0,
        activeStartMs: 50,
        activeEndMs: 280,
        bodyFrames: [3, 4],
        damageMul: 1.15,
        reachMul: 1.18,
        arc: { min: -20, max: 90 },
        hitStopMs: 34,
        knockback: 3,
        bodyNudgePx: 2,
        lean: 0,
      },
      {
        id: "a3",
        label: "四连",
        durationMs: 420,
        chargeMs: 40,
        activeStartMs: 80,
        activeEndMs: 340,
        bodyFrames: [5, 6],
        damageMul: 1.9,
        reachMul: 1.4,
        arc: { min: -75, max: 25 },
        hitStopMs: 70,
        knockback: 6.2,
        bodyNudgePx: 3,
        lean: 2,
        shakePx: 3.5,
        isCrit: true,
      },
    ],
  };

  /**
   * 单击：08 → 14 → 15 → 16，回到待机。
   * 两击：08 → … → 16 → 17 → 20 → 21 → 22 → 26 → 27 → 28，回到待机。
   * 08→14 = 0.1s，14→15 = 0.2s，15 维持 0.3s，16→17 = 0.1s，
   * 17→20 = 0.1s，20 维持 0.3s，21→22 = 0.1s，22 维持 0.4s，
   * 26→27 = 0.1s，27 维持 0.4s，28 维持 0.3s。
   */
  const COMBO_CLICK_GAP = 350;
  const COMBO_SCALE = 0.441;
  const comboFrames = [
    { src: "assets/gedoudongzuo/08.png", duration: 100 },
    { src: "assets/gedoudongzuo/14.png", duration: 200 },
    { src: "assets/gedoudongzuo/15.png", duration: 300 },
    { src: "assets/gedoudongzuo/16.png", duration: 100 },
    { src: "assets/gedoudongzuo/17.png", duration: 100 },
    { src: "assets/gedoudongzuo/20.png", duration: 300 },
    { src: "assets/gedoudongzuo/21.png", duration: 100 },
    { src: "assets/gedoudongzuo/22.png", duration: 400 },
    { src: "assets/gedoudongzuo/26.png", duration: 100 },
    { src: "assets/gedoudongzuo/27.png", duration: 400 },
    { src: "assets/gedoudongzuo/28.png", duration: 300 },
  ];
  const comboActions = {
    attack1: { start: 0, end: 3 },
    attack2: { start: 4, end: 10 },
  };
  const COMBO_GIF_FILES = comboFrames.map((f) => f.src);
  const frameDurations = comboFrames.map((f) => f.duration);
  const COMBO_SWING_FRAMES = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1 };
  const COMBO_GIF_HITS = {
    1: { damageMul: 1.1, reachMul: 1.2, knockback: 2.6, hitStopMs: 28, arc: { min: -40, max: 70 } },
    2: { damageMul: 1.2, reachMul: 1.25, knockback: 2.8, hitStopMs: 32, arc: { min: -28, max: 40 } },
    5: { damageMul: 1.25, reachMul: 1.3, knockback: 3.0, hitStopMs: 34, arc: { min: -28, max: 40 } },
    7: { damageMul: 1.6, reachMul: 1.4, knockback: 5.2, hitStopMs: 50, shakePx: 2.4, isCrit: true, arc: { min: -75, max: 30 } },
  };

  const comboGif = {
    ready: false,
    playing: false,
    done: false,
    frame: 0,
    startedAt: 0,
    lastNow: 0,
    raf: 0,
    images: [],
    current: null,
    queue: [],
    locked: { attack1: false, attack2: false },
  };
  const comboClick = {
    count: 0,
    lastAt: 0,
  };

  const swordCombo = {
    nextStep: 0,
    attacking: false,
    stepIndex: -1,
    attackStartedAt: 0,
    attackElapsed: 0,
    lastTickAt: 0,
    lastAttackAt: 0,
    buffered: false,
    hitStopUntil: 0,
    hitIds: null,
    nudgeX: 0,
    shakeAmp: 0,
    shakeUntil: 0,
    stepCfg: null,
    lastPoseFrame: 0,
    slashShown: false,
    slashPoseKey: "",
  };

  const comboArt = {
    ready: false,
    poseFrames: [],
    slashFrames: [],
    bodyFrames: Object.create(null),
    bodyIdle: "",
  };

  const armSocketEl = document.getElementById("arm-socket");
  const armWeaponEl = document.getElementById("arm-weapon");
  const slashVfxEl = document.getElementById("slash-vfx");
  const SHOP_OFFER_COUNT = 3;
  function shopIcon(name) {
    return `assets/shop/${name}.webp?v=icon11`;
  }
  const SHOP_CATALOG = {
    baojian: {
      name: "纯阳剑",
      price: 40,
      tier: 2,
      icon: shopIcon("baojian"),
      desc: "终南山最优秀的弟子才配拥有这把剑",
      effect: "每层最终伤害 +20%",
      apply() {},
    },
    bajiaoshan: {
      name: "芭蕉扇",
      price: 20,
      tier: 1,
      icon: shopIcon("bajiaoshan"),
      desc: "可以cos铁扇公主",
      effect: "攻击范围 +10%，攻击速度 +5%",
      apply() {},
    },
    fenghuolun: {
      name: "风火轮",
      price: 15,
      tier: 1,
      cap: 4,
      icon: shopIcon("fenghuolun"),
      desc: "可以cos哪吒",
      effect: "空中连跳 +1（上限 +4）",
      apply() {},
    },
    caoguojiu: {
      name: "曹国舅",
      price: 40,
      tier: 2,
      cap: 5,
      icon: shopIcon("caoguojiu"),
      desc: "曹国舅能挣很多钱，不过需要稳定的上班环境。",
      effect: "关卡结算时 +4 金币/件，并按当前金币收 2% 利息/件（上限 10%）",
      apply() {},
    },
    guaizhang: {
      name: "铁拐李的拐杖",
      price: 10,
      tier: 1,
      icon: shopIcon("guaizhang"),
      desc: "装瘸神器",
      effect: "移速 -8%（可以和铁拐李组合使用）",
      apply() {},
    },
    tieguaili: {
      name: "铁拐李",
      price: 30,
      tier: 2,
      icon: shopIcon("tieguaili"),
      desc: "铁拐李腿脚虽然不便，但是乞讨多年生命力顽强。",
      effect: "移速低于基础时：生命上限 +8%，攻击伤害 +5%",
      apply() {},
    },
    hulu: {
      name: "紫金葫芦",
      price: 50,
      tier: 3,
      cap: 1,
      icon: shopIcon("hulu"),
      desc: "我叫你一声你敢答应吗？",
      effect: "天兵受到的伤害翻倍，天兵掉落金币 2→1（对其他怪无效）",
      apply() {},
    },
    jiemingqian: {
      name: "换寿的钱",
      price: 0,
      tier: 2,
      cap: 1,
      free: true,
      icon: shopIcon("jiemingqian"),
      desc: "这辈子的财富自由就在眼前了，等等...这钱不对！",
      effect: "少一条命，立刻得到 100 金币",
      apply() {
        gainCoins(100);
        heroLives = Math.max(0, heroLives - 1);
        renderLives();
        flashPortraitOnLifeLost();
        sfxLifeLost();
        if (heroLives <= 0) {
          if (trySunwukongSave()) return;
          openGameOver("lives");
        }
      },
    },
    yujingping: {
      name: "玉净瓶",
      price: 65,
      tier: 4,
      cap: 1,
      icon: shopIcon("yujingping"),
      desc: "可以呼风唤雨",
      effect: "按 K：天兵冻结 7 秒，冷却 20 秒；哮天犬减速 70%",
      apply() {},
    },
    yinyangban: {
      name: "阴阳板",
      price: 10,
      tier: 1,
      weight: 0.6,
      icon: shopIcon("yinyangban"),
      desc: "别问，我也不知道怎么用",
      effect: "",
      apply() {},
    },
    tianma: {
      name: "张果老的驴",
      price: 30,
      tier: 2,
      icon: shopIcon("tianma"),
      desc: "你听说过天龙马爱上灰姑驴的爱情故事吗？",
      effect: "突刺距离翻一倍，间隔缩短为原来的一半，突刺状态下无敌",
      apply() {},
    },
    dijiang: {
      name: "帝江",
      price: 30,
      tier: 2,
      cap: 3,
      icon: shopIcon("dijiang"),
      desc: "客官，要来一场酣畅淋漓的按摩吗？",
      effect: "攻击按伤害 3% 吸血；每十下攻击扣1 金币",
      apply() {},
    },
    caishenye: {
      name: "财神爷",
      price: 45,
      tier: 3,
      cap: 5,
      icon: shopIcon("caishenye"),
      desc: "很贵，但也许投机能赚得更多，少年，你敢不敢赌？",
      effect: "生命上限 -10%，本关击杀掉落金币 ×1.10（多件效果会相乘，关末结算）",
      apply() {},
    },
    hongtuya: {
      name: "红土鸭子",
      price: 10,
      tier: 1,
      cap: 1,
      icon: shopIcon("hongtuya"),
      desc: "保你万事平安！",
      effect: "立刻恢复 20 生命",
      apply() {
        const max = heroMaxHp();
        hero.hp = Math.min(max, hero.hp + 20);
        renderHp();
      },
    },
    kunxiansuo: {
      name: "捆仙索",
      price: 25,
      tier: 2,
      icon: shopIcon("kunxiansuo"),
      desc: "全三界最坚硬的绳索",
      effect: "命中敌人 2 秒：移速 -10%、攻击间隔 +10%（上限60%）；自身攻击间隔 +5%",
      apply() {},
    },
    sunwukong: {
      name: "孙悟空的毛",
      price: 60,
      tier: 4,
      icon: shopIcon("sunwukong"),
      desc: "搬来救兵齐天大圣——的毛",
      effect: "致命时消耗 1 件，回复 40% 生命",
      apply() {},
    },
    qiankundai: {
      name: "乾坤袋",
      price: 25,
      tier: 2,
      cap: 1,
      icon: shopIcon("qiankundai"),
      desc: "无底洞，什么都能装得下",
      effect: "下一关普通怪数量减少20%（哮天犬不受影响）",
      apply() {
        relicFx.qiankundaiArmed = (relicFx.qiankundaiArmed || 0) + 1;
      },
    },
    zhongliquan: {
      name: "一张神秘小名片？",
      price: 15,
      tier: 1,
      icon: shopIcon("zhongliquan"),
      desc: "上面写着熟人凭名片打八折",
      effect: "商店售价 -5%/张，再按 5 金币取整",
      apply() {},
    },
    hanxiangzi: {
      name: "无心昌的迷弟",
      price: 45,
      tier: 3,
      cap: 5,
      icon: shopIcon("hanxiangzi"),
      desc: "听说给他一个无心昌签名，他什么都能给你做",
      effect: "其他法宝的正向战斗数值加8%（不含金币、折扣、换寿与负面）",
      apply() {},
    },
    hexiangu: {
      name: "何仙姑",
      price: 35,
      tier: 2,
      icon: shopIcon("hexiangu"),
      desc: "0基础侠客速成班",
      effect: "伤害 +15%，生命上限减少5%（生命值上限最少20）",
      apply() {},
    },
  };
  const SHOP_COMBAT_IDS = [
    "baojian",
    "bajiaoshan",
    "fenghuolun",
    "guaizhang",
    "tieguaili",
    "kunxiansuo",
    "hexiangu",
    "tianma",
    "dijiang",
    "yujingping",
    "hulu",
    "sunwukong",
  ];
  /* 攻击扇区（相对水平向前，y 轴向上），单位度 */
  const KNIFE_ARC = { min: -22, max: 22 }; /* 旧前刺扇区（保留） */
  const SWORD_SLASH_ARC = { min: -48, max: 52 }; /* 吕洞宾：横向挥砍 */
  const THRUST_FRAMES = 12; /* ≈0.2s，与天兵前刺一致 */
  const FAN_VERT_ARC = { min: 18, max: 112 }; /* 钟离权：纵向弧 */
  const MIN_GAP_SPACING = 420;
  const MIN_BOSS_SPACING = 1400;
  const MIN_COIN_GAP = 110;
  /* 可活动世界宽度 ≈ 1.5 屏：满屏走完后还剩约半屏 */
  const ARENA_SCREEN_RATIO = 1.5;
  const ARENA_EDGE_PAD = 48;
  let arenaWidth = 1350;

  /**
   * 用与游戏相同的逐帧物理，模拟「起跳 + 顶点二连跳 + 落回原高度」的最大滞空帧数。
   * 水平跨距按角色移速估算；缝隙上限再取比例。
   */
  function maxDoubleJumpAirFrames() {
    let y = 0;
    let vy = JUMP_V;
    let jumpsLeft = MAX_JUMPS - 1;
    let usedSecond = false;
    let frames = 0;
    for (let i = 0; i < 600; i++) {
      frames += 1;
      if (!usedSecond && jumpsLeft > 0 && vy <= 0) {
        vy = JUMP_V;
        jumpsLeft -= 1;
        usedSecond = true;
      }
      vy -= GRAVITY;
      y += vy;
      if (frames > 2 && y <= 0 && vy <= 0) return frames;
    }
    return frames;
  }

  const MAX_SAFE_GAP = maxDoubleJumpAirFrames() * MOVE_SPEED * GAP_SAFE_RATIO;

  function maxSafeGap() {
    return MAX_SAFE_GAP;
  }

  function randomGap(minRatio = 0.35) {
    if (FORCE_ZERO_GAP || TEST_ACTIONS) return 0;
    const maxG = maxSafeGap();
    const minG = Math.min(maxG, Math.max(24, maxG * minRatio));
    const gap = minG + terrainRng() * (maxG - minG);
    return Math.min(maxG, gap);
  }

  let runSeed = 1;
  let terrainRng = Math.random;

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function newRunSeed() {
    runSeed = (Date.now() ^ ((Math.random() * 0xffffffff) >>> 0)) >>> 0 || 1;
  }

  function seedTerrain(stageN) {
    terrainRng = mulberry32((runSeed + (stageN | 0) * 9973) >>> 0);
  }

  function terrainProfile(n) {
    const s = Math.max(1, n | 0);
    return {
      gapChance: Math.min(0.36, 0.1 + s * 0.035),
      gapMinRatio: s <= 2 ? 0.28 : 0.34,
      minGapSpacing: Math.max(260, MIN_GAP_SPACING - s * 22),
      maxStep: s <= 2 ? 1 : 2,
      flatForce: s <= 1 ? 2 : 1,
    };
  }

  function stageStartHeight(n) {
    const idx = [2, 1, 3, 2, 4, 1][(Math.max(1, n | 0) - 1) % 6];
    return HEIGHTS[idx];
  }

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const cursorPos = { x: -40, y: -40, tx: -40, ty: -40 };
  /* 开发期直接进格斗；正式游玩保持 false 以显示选人页 */
  const SKIP_INTRO = false;
  /* 开发期：跳过游玩，直接打开关卡间法宝商店；正式游玩改回 false */
  const SKIP_TO_SHOP = false;
  /* 测动作：无限倒计时、不刷怪；测完改回 false */
  const TEST_ACTIONS = false;

  const runScroll = { world: 0 };
  /* 场景视差平滑状态（避免跳跃时背景跟着抖） */
  const viewFx = { x: 0, y: 0 };
  const keys = { w: false, a: false, s: false, d: false };
  const tapDash = { lastKey: "", lastAt: 0, dir: 0, burstDir: 0, burstUntil: 0, readyAt: 0, remainPx: 0, lockDir: 0 };
  const hero = {
    x: 180,
    y: 110,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: true,
    dead: false,
    jumpsLeft: MAX_JUMPS,
    usedAirJumps: 0,
    didGroundJump: false,
    groundFrames: 0,
    jumpLock: 0,
    jumpBufferedUntil: 0,
    coyoteUntil: 0,
    airGroundY: null,
    pendingLandSfx: false,
    hp: MAX_HP,
    swordAnimFrames: 0,
    fanAnimFrames: 0,
    swordReadyAt: 0,
    fanReadyAt: 0,
    hurtFrames: 0,
    iframeLeft: 0,
    strikeGapLeft: 0,
    pendingProtect: false,
    hitFlashLeft: 0,
    hitShakeLeft: 0,
    hitJitterX: 0,
    hitJitterY: 0,
    hitFlashOn: false,
    spawnGraceUntil: 0,
    moveDirX: 0,
    moveDirY: 0,
    rideZhu: null,
  };
  /** 脚部行走：位移只改 local，且始终相对初始位置，禁止累积 */
  const footWalk = {
    enabled: false,
    phase: 0,
    phaseElapsed: 0,
    active: false,
    leftBase: { x: 0, y: 0 },
    rightBase: { x: 0, y: 0 },
    lastOxL: null,
    lastOyL: null,
    lastOxR: null,
    lastOyR: null,
  };
  const platforms = [];
  const coins = [];
  const enemies = [];
  let coinCount = 0;
  let nextX = 0;
  let lastGapAt = -9999;
  let lastBossAt = -9999;
  let flatStreak = 0;
  let selected = "blue";
  let heroLives = START_LIVES;
  let gameOver = false;
  let started = false;
  let running = false;
  let paused = false;
  let stage = 1;
  let stageTimeLeft = 30;
  let stageClock = 0;
  let waveCooldown = 0;
  let stageBusy = false;
  let hudSweep = null;
  let inShop = false;
  let shopFocus = -1;
  let shopOffer = [];
  let shopRefreshCost = 2;
  let shopRefreshN = 0;
  let shopDiscountStacks = 0;
  let roadCoinQueue = [];
  let killGoldThisStage = 0;
  let pendingNextStage = 2;
  let stageSpawned = 0;
  let stageGouSpawned = false;
  let stageEnemyTotal = 0;
  const buffs = { atk: 0, reach: 0, speed: 0 };
  const shopBought = {
    baojian: 0,
    bajiaoshan: 0,
    fenghuolun: 0,
    caoguojiu: 0,
    guaizhang: 0,
    tieguaili: 0,
    hulu: 0,
    jiemingqian: 0,
    yujingping: 0,
    yinyangban: 0,
    tianma: 0,
    dijiang: 0,
    caishenye: 0,
    hongtuya: 0,
    kunxiansuo: 0,
    sunwukong: 0,
    qiankundai: 0,
    zhongliquan: 0,
    hanxiangzi: 0,
    hexiangu: 0,
  };
  const relicFx = {
    tickAt: 0,
    interestAcc: 0,
    goldAcc: 0,
    gourdUsedThisLife: 0,
    vaseUntil: 0,
    vaseReadyAt: 0,
    tianmaUntil: 0,
    dijiangPaid: false,
    dijiangGoldAt: 0,
    dijiangSwings: 0,
    xiaotianArmed: 0,
    xiaotianTrial: false,
    xiaotianDied: false,
    xiaotianTrialStacks: 0,
    xiaotianMaxBonus: 0,
    caishenStages: 0,
    kunxiansuoHit: false,
    sunwukongUsed: 0,
    qiankundaiArmed: 0,
  };
  const KUNXIANSUO_SNARE_MS = 2000;
  const KUNXIANSUO_SLOW = 0.1;
  const KUNXIANSUO_CAP = 0.6;
  const KUNXIANSUO_SELF_INTERVAL = 0.05;
  const HANXIANGZI_BOOST = 0.08;
  const DIJIANG_LEECH = 0.03;
  const DIJIANG_GOLD_GAP_MS = 4000;
  const VASE_FREEZE_MS = 7000;
  const VASE_CD_MS = 20000;
  const VASE_BOSS_SLOW = 0.3;
  let coinImgUrl = COIN_SRC;
  let enemyImgUrl = ENEMY_SRC;
  let enemyWeaponUrl = ENEMY_WEAPON_SRC;
  let knifeImgUrl = KNIFE_SRC;
  let floorImgUrl = FLOOR_SRC;
  /* 顶部透明区对应的显示像素，用于脚底对齐实体顶面 */
  let floorTopPad = 0;
  let audioCtx = null;

  /* 细长、方正点阵字（对照 ref_money） */
  const PIXEL_GLYPHS = {
    x: ["1...1", ".1.1.", "..1..", ".1.1.", "1...1"],
    "0": [
      ".111.",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      "1...1",
      ".111.",
    ],
    "1": [
      "..1..", ".11..", "..1..", "..1..", "..1..", "..1..",
      "..1..", "..1..", "..1..", "..1..", "..1..", "..1..", ".111.",
    ],
    "2": [
      ".111.", "1...1", "....1", "....1", "...1.", "..1..", ".1...",
      "1....", "1....", "1....", "1....", "1....", "11111",
    ],
    "3": [
      ".111.", "1...1", "....1", "....1", "...1.", "..11.", "....1",
      "....1", "....1", "....1", "1...1", "1...1", ".111.",
    ],
    "4": [
      "1...1", "1...1", "1...1", "1...1", "1...1", "1...1", ".1111",
      "....1", "....1", "....1", "....1", "....1", "....1",
    ],
    "5": [
      "11111", "1....", "1....", "1....", "1....", "1111.", "....1",
      "....1", "....1", "....1", "....1", "1...1", ".111.",
    ],
    "6": [
      ".111.", "1...1", "1....", "1....", "1....", "1111.", "1...1",
      "1...1", "1...1", "1...1", "1...1", "1...1", ".111.",
    ],
    "7": [
      "11111", "....1", "....1", "...1.", "...1.", "..1..", "..1..",
      ".1...", ".1...", "1....", "1....", "1....", "1....",
    ],
    "8": [
      ".111.", "1...1", "1...1", "1...1", "1...1", ".111.", "1...1",
      "1...1", "1...1", "1...1", "1...1", "1...1", ".111.",
    ],
    "9": [
      ".111.", "1...1", "1...1", "1...1", "1...1", "1...1", ".1111",
      "....1", "....1", "....1", "....1", "1...1", ".111.",
    ],
  };

  function drawCoinCount(text) {
    const canvas = document.getElementById("coin-count");
    if (!canvas) return;

    const FILL = "#f3ebb0";
    const INNER = "#7eb8e8";
    const OUT = "#2a58b0";
    const SCALE = 4.4;
    const GAP = 4;
    const glyphH = 13;
    const pad = 1;

    const chars = String(text).split("");
    const prepared = chars.map((ch) => {
      let rows = (PIXEL_GLYPHS[ch] || PIXEL_GLYPHS["0"]).slice();
      while (rows.length < glyphH) {
        rows.unshift(".....");
        if (rows.length < glyphH) rows.push(".....");
      }
      if (rows.length > glyphH) {
        const cut = Math.floor((rows.length - glyphH) / 2);
        rows = rows.slice(cut, cut + glyphH);
      }
      return { rows, w: rows[0].length };
    });

    let totalW = prepared.reduce((s, g) => s + g.w, 0) + GAP * (prepared.length - 1);
    const mapW = totalW + pad * 2;
    const mapH = glyphH + pad * 2;
    const map = Array.from({ length: mapH }, () => Array(mapW).fill(0));

    let ox = pad;
    for (const g of prepared) {
      const y0 = pad;
      for (let y = 0; y < g.rows.length; y++) {
        for (let x = 0; x < g.w; x++) {
          if (g.rows[y][x] === "1") map[y0 + y][ox + x] = 1;
        }
      }
      ox += g.w + GAP;
    }

    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        if (map[y][x] !== 1) continue;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (ny < 0 || nx < 0 || ny >= mapH || nx >= mapW) continue;
            if (map[ny][nx] === 0) map[ny][nx] = 2;
          }
        }
      }
    }

    canvas.width = mapW * SCALE;
    canvas.height = mapH * SCALE;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const put = (x, y, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
    };

    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        if (map[y][x] === 2) put(x, y, OUT);
      }
    }
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        if (map[y][x] !== 1) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (ny < 0 || nx < 0 || ny >= mapH || nx >= mapW) continue;
          if (map[ny][nx] === 2) put(nx, ny, INNER);
        }
      }
    }
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        if (map[y][x] === 1) put(x, y, FILL);
      }
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const t = setTimeout(() => {
        img.onload = img.onerror = null;
        reject(new Error("img-timeout"));
      }, 6000);
      img.decoding = "async";
      img.onload = () => {
        clearTimeout(t);
        resolve(img);
      };
      img.onerror = () => {
        clearTimeout(t);
        reject(new Error("img-error"));
      };
      img.src = src;
    });
  }

  function imageSize(img) {
    return {
      w: img.naturalWidth || img.width || 0,
      h: img.naturalHeight || img.height || 0,
    };
  }

  /** 大图先缩小再抠图，避免 1500px+ 立绘卡死主线程 */
  function downsampleImage(img, maxSide = 320) {
    const { w, h } = imageSize(img);
    if (!w || !h) return img;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    if (scale >= 0.999) return img;
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * scale));
    c.height = Math.max(1, Math.round(h * scale));
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c;
  }

  function punchWhite(img, threshold) {
    const { w, h } = imageSize(img);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] >= threshold && px[i + 1] >= threshold && px[i + 2] >= threshold) {
        px[i + 3] = 0;
      }
    }
    ctx.putImageData(data, 0, 0);
    return c;
  }

  function punchSpriteBg(img, whiteThreshold = 248) {
    const { w, h } = imageSize(img);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;

    const isWhite = (i) =>
      px[i] >= whiteThreshold && px[i + 1] >= whiteThreshold && px[i + 2] >= whiteThreshold;
    /* 仅去掉连通到画面边缘的近黑底，保留角色内部黑发 */
    const isEdgeBlack = (i) => px[i] <= 28 && px[i + 1] <= 28 && px[i + 2] <= 28;

    for (let i = 0; i < px.length; i += 4) {
      if (isWhite(i)) px[i + 3] = 0;
    }

    const seen = new Uint8Array(w * h);
    const stack = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (seen[p]) return;
      const i = p * 4;
      if (px[i + 3] === 0) {
        seen[p] = 1;
        return;
      }
      if (!isEdgeBlack(i)) return;
      seen[p] = 1;
      stack.push(p);
    };

    for (let x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }

    while (stack.length) {
      const p = stack.pop();
      const i = p * 4;
      px[i + 3] = 0;
      const x = p % w;
      const y = (p - x) / w;
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }

    ctx.putImageData(data, 0, 0);
    return c;
  }

  function punchNearBlack(img, threshold = 18) {
    const { w, h } = imageSize(img);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] <= threshold && px[i + 1] <= threshold && px[i + 2] <= threshold) {
        px[i + 3] = 0;
      }
    }
    ctx.putImageData(data, 0, 0);
    return c;
  }

  function sliceSheetFrames(img, cols) {
    const { w, h } = imageSize(img);
    const fw = Math.floor(w / cols);
    const frames = [];
    for (let i = 0; i < cols; i++) {
      const c = document.createElement("canvas");
      c.width = fw;
      c.height = h;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, i * fw, 0, fw, h, 0, 0, fw, h);
      frames.push(c.toDataURL("image/png"));
    }
    return frames;
  }

  /** 吕洞宾全身帧已抠好透明底，直接使用原图 */
  function loadBodySprite(src) {
    return src;
  }

  async function setRunnerSprite(heroId) {
    const src = HERO_SRC[heroId] || HERO_SRC.red;
    if (!runnerSprite || !runner) return;
    runner.dataset.hero = heroId;
    heroHalfWCache = 0;
    runnerSprite.src = src;
    runnerSprite.style.opacity = "1";
    runnerSprite.style.visibility = "visible";
    runner.style.opacity = "1";
    runner.style.visibility = "visible";
    footWalk.enabled = false;
    runner.classList.remove("has-foot-walk");
    if (playerFeetEl) playerFeetEl.hidden = true;
    resetFootWalk(true);
    /* 连招层就绪后再藏身体图；没加载成功时至少显示立绘 */
    if (heroId !== "blue") runner.classList.remove("is-combo-gif");
  }

  function initPlayerFeet() {
    if (!playerFootLeft || !playerFootRight || !runner) return;
    playerFootLeft.src = PLAYER_FOOT_SRC.left;
    playerFootRight.src = PLAYER_FOOT_SRC.right;
    footWalk.leftBase = { x: -35, y: 0 };
    footWalk.rightBase = { x: -35, y: 0 };
    footWalk.enabled = true;
    runner.classList.add("has-foot-walk");
    if (playerFeetEl) playerFeetEl.hidden = false;
    resetFootWalk(true);
  }

  function setFootLocal(el, base, ox, oy, side) {
    if (!el) return;
    const x = (base.x + (ox | 0)) | 0;
    const y = (base.y + (oy | 0)) | 0;
    if (side === "L") {
      if (footWalk.lastOxL === x && footWalk.lastOyL === y) return;
      footWalk.lastOxL = x;
      footWalk.lastOyL = y;
    } else {
      if (footWalk.lastOxR === x && footWalk.lastOyR === y) return;
      footWalk.lastOxR = x;
      footWalk.lastOyR = y;
    }
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  function resetFootWalk(force) {
    footWalk.phase = 0;
    footWalk.phaseElapsed = 0;
    footWalk.active = false;
    if (force) {
      footWalk.lastOxL = null;
      footWalk.lastOyL = null;
      footWalk.lastOxR = null;
      footWalk.lastOyR = null;
    }
    setFootLocal(playerFootLeft, footWalk.leftBase, 0, 0, "L");
    setFootLocal(playerFootRight, footWalk.rightBase, 0, 0, "R");
  }

  /** 读取 WASD 轴并 normalize；世界方向 +x 右、+y 上 */
  function readMoveIntent() {
    let ix = 0;
    let iy = 0;
    if (keys.a && tapDash.lockDir >= 0) ix -= 1;
    if (keys.d && tapDash.lockDir <= 0) ix += 1;
    if (keys.w) iy += 1;
    if (keys.s) iy -= 1;
    const len = Math.hypot(ix, iy);
    if (len > 0) {
      ix /= len;
      iy /= len;
    }
    return { ix, iy, moving: len > 0 };
  }

  /**
   * 脚部步进：沿当前移动方向摆动。
   * 本地位移相对初始 base，禁止累积；抵消 scaleX(-1) 镜像。
   */
  function updateFootWalk(dtMs) {
    if (!footWalk.enabled || !playerFootLeft || !playerFootRight) return;
    if (swordCombo.attacking && SWORD_COMBO.useBodyFrames) {
      if (footWalk.active) resetFootWalk(true);
      return;
    }

    const moving =
      (Math.abs(hero.moveDirX) > 0.001 || Math.abs(hero.moveDirY) > 0.001) &&
      !hero.dead &&
      hero.onGround;

    if (!moving) {
      if (footWalk.active) resetFootWalk(true);
      return;
    }

    if (!footWalk.active) {
      footWalk.active = true;
      footWalk.phase = 0;
      footWalk.phaseElapsed = 0;
    }

    footWalk.phaseElapsed += dtMs;
    while (footWalk.phaseElapsed >= FOOT_STEP_MS) {
      footWalk.phaseElapsed -= FOOT_STEP_MS;
      footWalk.phase = (footWalk.phase + 1) % 4;
    }

    const nx = hero.moveDirX;
    const ny = hero.moveDirY;
    const face = hero.facing < 0 ? -1 : 1;
    const fxl = nx * face;
    const fyl = -ny;

    let leftFwd = 0;
    let rightFwd = 0;
    switch (footWalk.phase) {
      case 0:
        leftFwd = FOOT_FWD_PX;
        rightFwd = -FOOT_BACK_PX;
        break;
      case 1:
        leftFwd = 0;
        rightFwd = 0;
        break;
      case 2:
        leftFwd = -FOOT_BACK_PX;
        rightFwd = FOOT_FWD_PX;
        break;
      default:
        leftFwd = 0;
        rightFwd = 0;
        break;
    }

    setFootLocal(
      playerFootLeft,
      footWalk.leftBase,
      Math.round(fxl * leftFwd),
      Math.round(fyl * leftFwd),
      "L"
    );
    setFootLocal(
      playerFootRight,
      footWalk.rightBase,
      Math.round(fxl * rightFwd),
      Math.round(fyl * rightFwd),
      "R"
    );
  }

  async function prepareCoinArt() {
    coinImgUrl = COIN_SRC;
  }

  let zhuArtStarted = false;
  let gouArtStarted = false;

  function warmImage(src) {
    if (!src) return;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    return img;
  }

  function ensureZhuArt() {
    if (zhuArtStarted) return;
    zhuArtStarted = true;
    const zhu = warmImage(ZHU_SRC);
    const armZhuMask = () => {
      if (zhu && zhu.naturalWidth) buildZhuMask(zhu);
    };
    if (zhu) {
      zhu.addEventListener("load", armZhuMask, { once: true });
      if (zhu.complete) armZhuMask();
    }
    warmImage(ZHU_XULI_SRC);
    warmImage(ZHU_GONGJI_SRC);
  }

  function ensureGouArt() {
    if (gouArtStarted) return;
    gouArtStarted = true;
    const gou = warmImage(GOU_SRC);
    const armGouMask = () => {
      if (gou && gou.naturalWidth) buildGouMask(gou);
    };
    if (gou) {
      gou.addEventListener("load", armGouMask, { once: true });
      if (gou.complete) armGouMask();
    }
    warmImage(GOU_XULI_SRC);
    warmImage(GOU_GONGJI_SRC);
    warmImage(GOU_FLASH_SRC);
    const icon = gouHudEl && gouHudEl.querySelector(".gou-hud__icon");
    if (icon && !icon.getAttribute("src")) {
      const src = icon.getAttribute("data-src");
      if (src) icon.src = src;
    }
  }

  async function prepareEnemyArt() {
    enemyImgUrl = ENEMY_SRC;
    enemyWeaponUrl = ENEMY_WEAPON_SRC;
    warmImage(ENEMY_FLASH_SRC);
  }

  async function prepareKnifeArt() {
    knifeImgUrl = KNIFE_SRC;
  }

  async function prepareComboGif() {
    if (!comboStage) {
      comboGif.ready = false;
      return;
    }
    try {
      comboStage.innerHTML = "";
      const imgs = await Promise.all(
        COMBO_GIF_FILES.map((src, i) =>
          loadImage(src).then(async (img) => {
            try {
              if (img.decode) await img.decode();
            } catch (_) {}
            img.className = "combo-stage__frame";
            img.alt = "";
            img.draggable = false;
            img.dataset.frame = String(i);
            comboStage.appendChild(img);
            return img;
          })
        )
      );
      comboGif.images = imgs;
      comboGif.ready = imgs.length === COMBO_GIF_FILES.length;
      drawComboGifFrame(0);
    } catch (err) {
      console.warn("combo gif prepare failed", err);
      comboGif.ready = false;
    }
  }

  function comboActionDuration(id) {
    const a = comboActions[id];
    let t = 0;
    for (let i = a.start; i <= a.end; i++) t += comboFrames[i].duration;
    return t;
  }

  function comboSegmentFrameAt(elapsed, start, end) {
    let t = 0;
    for (let i = start; i <= end; i++) {
      t += comboFrames[i].duration;
      if (elapsed < t) return i;
    }
    return end;
  }

  function drawComboGifFrame(index) {
    const imgs = comboGif.images;
    if (!imgs || !imgs.length) return;
    const idx = Math.max(0, Math.min(imgs.length - 1, index | 0));
    for (let i = 0; i < imgs.length; i++) {
      imgs[i].classList.toggle("is-on", i === idx);
    }
  }

  function stopComboGifRaf() {
    if (comboGif.raf) {
      cancelAnimationFrame(comboGif.raf);
      comboGif.raf = 0;
    }
  }

  function resetComboRoundState() {
    comboGif.current = null;
    comboGif.queue = [];
    comboGif.locked = { attack1: false, attack2: false };
    comboClick.count = 0;
    comboClick.lastAt = 0;
  }

  function groundYAt(x) {
    const s = surfaceAt(x);
    return s != null ? s : hero.y;
  }

  function comboHopping() {
    return !!(window.SwordCombat && SwordCombat.hopping && SwordCombat.state === "attack");
  }

  function comboHoldsGround() {
    if (selected !== "blue" || !window.SwordCombat || !SwordCombat.ready) return false;
    if (SwordCombat.airborne) return false;
    return SwordCombat.state === "attack" || SwordCombat.state === "recover";
  }

  function jumpCamBase() {
    if (hero.airGroundY != null) return hero.airGroundY;
    return groundYAt(hero.x);
  }

  function cameraLookY() {
    const shake = window.SwordCamera ? SwordCamera.getShake() : { x: 0, y: 0 };
    if (!comboHopping() && !hero.onGround) return shake.y;
    const base = groundYAt(hero.x);
    return (window.SwordCamera ? SwordCamera.followY - base : 0) + shake.y;
  }

  function worldLookY() {
    const shake = window.SwordCamera ? SwordCamera.getShake() : { x: 0, y: 0 };
    if (!comboHopping() && !hero.onGround) return shake.y;
    return cameraLookY();
  }

  function snapHeroToGround() {
    if (!hero.onGround) return;
    if (heroRidingZhu()) {
      if (hero.jumpLock > 0 || hero.vy > 0.35) {
        hero.rideZhu = null;
        return;
      }
      const deck = zhuDeckY(hero.rideZhu, hero.x);
      if (deck == null) {
        hero.rideZhu = null;
        hero.onGround = false;
        return;
      }
      hero.y = deck;
      hero.vy = 0;
      hero.onGround = true;
      return;
    }
    if (comboHoldsGround()) {
      hero.vy = 0;
      const stand = window.SwordCombat && SwordCombat.standY;
      const s = surfaceAt(hero.x);
      if (s != null && Math.abs((stand != null ? stand : hero.y) - s) <= 14) {
        hero.y = s;
        if (window.SwordCombat) SwordCombat.standY = s;
      } else if (stand != null) {
        hero.y = stand;
      }
      return;
    }
    const halfW = heroHalfW();
    const feetY = hero.y;
    if (!hasWalkSupport(hero.x, halfW, feetY)) {
      hero.onGround = false;
      return;
    }
    const s = surfaceAt(hero.x);
    if (s == null) {
      hero.onGround = false;
      return;
    }
    hero.y = s;
    hero.vy = 0;
  }

  function syncComboStagePos() {
    if (window.SwordCombat && SwordCombat.ready) {
      const camX = window.SwordCamera ? SwordCamera.getX() : runScroll.world;
      SwordCombat.syncPos(hero, camX, cameraLookY());
      return;
    }
    if (!comboStage || comboStage.hidden) return;
    const scale = COMBO_SCALE;
    const x = (hero._sx != null ? hero._sx : 0) - 510;
    const y = hero._sy != null ? hero._sy : 0;
    const sx = hero.facing < 0 ? -scale : scale;
    comboStage.style.transform = `translate3d(${x}px, ${-y}px, 0) scale(${sx}, ${scale})`;
    comboStage.style.transformOrigin = "510px 569px";
  }

  function showComboGifStage(on) {
    if (!runner || !comboStage) return;
    runner.classList.toggle("is-combo-gif", !!on);
    comboStage.hidden = !on;
    comboStage.classList.toggle("is-on", !!on);
    if (on) {
      setComboPoseMode(true);
      if (playerFeetEl) playerFeetEl.hidden = true;
      resetFootWalk(true);
      syncComboStagePos();
    }
  }

  /** 吕洞宾待机：连招画布第 1 帧，不用旧身体和脚 */
  function showComboIdle() {
    if (selected !== "blue" || !comboStage) return false;
    if (window.SwordCombat && SwordCombat.ready) {
      SwordCombat.showIdle();
      showComboGifStage(true);
      swordCombo.attacking = false;
      if (runner) runner.classList.remove("is-attacking", "is-attacking-sword", "is-thrusting", "combo-charging");
      return true;
    }
    if (!comboGif.ready) return false;
    stopComboGifRaf();
    comboGif.playing = false;
    comboGif.done = false;
    comboGif.frame = 0;
    drawComboGifFrame(0);
    showComboGifStage(true);
    resetComboRoundState();
    swordCombo.attacking = false;
    swordCombo.stepCfg = null;
    swordCombo.hitIds = null;
    if (runner) {
      runner.classList.remove("is-attacking", "is-attacking-sword", "is-thrusting", "combo-charging");
    }
    return true;
  }

  function hideComboGif() {
    if (window.SwordCombat && SwordCombat.ready) {
      SwordCombat.reset();
      window.SwordInput && SwordInput.reset();
      window.SwordHitstop && SwordHitstop.clearOnScene();
    }
    stopComboGifRaf();
    comboGif.playing = false;
    comboGif.done = false;
    comboGif.frame = 0;
    resetComboRoundState();
    swordCombo.attacking = false;
    swordCombo.stepCfg = null;
    if (showComboIdle()) return;
    showComboGifStage(false);
    if (typeof setComboPoseMode === "function") setComboPoseMode(false);
  }

  function beginComboGifCombat() {
    const now = performance.now();
    swordCombo.attacking = true;
    swordCombo.stepIndex = 0;
    swordCombo.stepCfg = {
      id: "gif14",
      durationMs: 2400,
      chargeMs: 0,
      activeStartMs: 0,
      activeEndMs: 2400,
      damageMul: 1,
      reachMul: 1.2,
      arc: { min: -60, max: 40 },
      hitStopMs: 28,
      knockback: 2.6,
    };
    swordCombo.attackStartedAt = now;
    swordCombo.attackElapsed = 0;
    swordCombo.lastTickAt = now;
    swordCombo.lastAttackAt = now;
    swordCombo.buffered = false;
    swordCombo.hitIds = new Set();
    swordCombo.nudgeX = 0;
    swordCombo.slashShown = false;
    if (runner) {
      runner.classList.add("is-attacking", "is-attacking-sword", "combo-a1");
    }
  }

  function resolveComboGifHits(frameIdx) {
    const spec = COMBO_GIF_HITS[frameIdx];
    if (!spec || !running || hero.dead) return;
    const heroW = heroHalfW() / 0.42;
    const { ox, oy } = attackOrigin(heroW);
    const reach = swordReach() * (spec.reachMul || 1);
    const hits = enemiesInArc(ox, oy, hero.facing, reach, spec.arc || SWORD_SLASH_ARC);
    if (!hits.length) return;
    let landed = false;
    const dmgBase = playerAtk() * (spec.damageMul || 1) * (SWORD_COMBO.damageMul || 1);
    const dmg = spec.isCrit ? dmgBase * (SWORD_COMBO.critDamageMul || 1) : dmgBase;
    for (let i = 0; i < hits.length; i++) {
      const e = hits[i];
      if (!e || e.dead) continue;
      const id = e.el || e;
      if (swordCombo.hitIds && swordCombo.hitIds.has(id)) continue;
      if (swordCombo.hitIds) swordCombo.hitIds.add(id);
      hitEnemy(e, dmg, { knockback: spec.knockback || 2.4, facing: hero.facing });
      landed = true;
    }
    if (landed) {
      applyComboHitStop(spec.hitStopMs || 24);
      if (spec.shakePx) triggerComboShake(spec.shakePx, spec.isCrit ? 140 : 90);
    }
  }

  function returnComboToIdle() {
    swordCombo.lastAttackAt = performance.now();
    showComboIdle();
  }

  function startComboAction(id) {
    const a = comboActions[id];
    if (!a) return;
    beginDijiangSwing();
    comboGif.current = id;
    comboGif.playing = true;
    comboGif.done = false;
    comboGif.startedAt = performance.now();
    comboGif.lastNow = comboGif.startedAt;
    comboGif.frame = a.start;
    showComboGifStage(true);
    drawComboGifFrame(a.start);
    beginComboGifCombat();
    swordCombo.hitIds = new Set();
    playComboSwingSfx(a.start);
    if (!comboGif.raf) comboGif.raf = requestAnimationFrame(tickComboGif);
  }

  function enqueueComboAction(id) {
    if (comboGif.locked[id]) return;
    comboGif.locked[id] = true;
    if (!comboGif.current) {
      startComboAction(id);
      return;
    }
    comboGif.queue.push(id);
  }

  function onComboActionComplete() {
    const next = comboGif.queue.shift();
    if (next) {
      startComboAction(next);
      return;
    }
    returnComboToIdle();
  }

  function tickComboGif(now) {
    if (!comboGif.playing || !comboGif.current) return;
    if (paused) {
      comboGif.startedAt += now - comboGif.lastNow;
      comboGif.lastNow = now;
      comboGif.raf = requestAnimationFrame(tickComboGif);
      return;
    }
    comboGif.lastNow = now;
    const a = comboActions[comboGif.current];
    const elapsed = (now - comboGif.startedAt) * heroAttackSpeedMul(now);
    const dur = comboActionDuration(comboGif.current);
    if (elapsed >= dur) {
      onComboActionComplete();
      if (comboGif.playing && comboGif.current) {
        comboGif.raf = requestAnimationFrame(tickComboGif);
      } else {
        comboGif.raf = 0;
      }
      return;
    }
    const idx = comboSegmentFrameAt(elapsed, a.start, a.end);
    if (idx !== comboGif.frame) {
      comboGif.frame = idx;
      drawComboGifFrame(idx);
      swordCombo.hitIds = new Set();
      playComboSwingSfx(idx);
    }
    if (running && !hero.dead && !inShop) {
      resolveComboGifHits(comboGif.frame);
    }
    comboGif.raf = requestAnimationFrame(tickComboGif);
  }

  function playComboSwingSfx(idx) {
    if (COMBO_SWING_FRAMES[idx]) sfxWhoosh();
  }

  function applyComboClickUnlock(count) {
    if (count === 1) enqueueComboAction("attack1");
    else if (count >= 2) enqueueComboAction("attack2");
  }

  function isHeroComboTarget(e) {
    const x = e.clientX;
    const y = e.clientY;
    const hit = (el) => {
      if (!el || el.hidden) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    return hit(runner) || hit(comboStage);
  }

  function updateComboClickWindow() {}

  /**
   * 按几下接几段：1=08→16，2=17→21，3=22→26，4=27→28。
   */
  function handleComboClick() {
    if (window.SwordCombat && SwordCombat.ready) {
      return SwordCombat.requestAttack(1, performance.now());
    }
    return false;
  }

  function playCombo() {
    if (window.SwordCombat && SwordCombat.ready) {
      return SwordCombat.requestAttack(3, performance.now());
    }
    return false;
  }

  function bindSwordSystem() {
    if (!window.SwordCombat || !window.SwordInput) return;
    SwordCombat.bind({
      getHero: () => hero,
      getAttackSpeedMul: () => heroAttackSpeedMul(),
      getThrustDistanceMul: () => tianmaThrustDistanceMul(),
      getView() {
        return {
          camX: window.SwordCamera ? SwordCamera.followX : runScroll.world,
          viewW: viewWidth(),
          pad: 12,
        };
      },
      moveHero(x, y, opts) {
        const prevX = hero.x;
        hero.x = x;
        if (!(opts && opts.keepAir)) {
          hero.y = y;
          hero.vy = 0;
          hero.onGround = true;
        }
        clampActorX(hero);
        clampHeroToView(hero);
        const halfW = heroHalfW();
        resolveEnemySolids(hero, halfW, prevX);
      },
      strike(frameId, hitIds) {
        const spec = SwordConfig.hits[frameId];
        if (!spec || !running || hero.dead) return;
        const hits = enemiesInComboHit(frameId, spec);
        for (let i = 0; i < hits.length; i++) {
          const e = hits[i];
          if (!e || e.dead) continue;
          const id = e.el || e;
          if (hitIds.has(id)) continue;
          hitIds.add(id);
          const crit = !!(spec.crit || (spec.critChance && Math.random() < spec.critChance));
          const dmg = playerAtk() * (spec.damageMul || 1) * (crit ? spec.critMul || 1.5 : 1);
          hitEnemy(e, dmg, {
            knockback: (spec.knockback || 2.4) * (crit ? 1.25 : 1),
            facing: hero.facing,
          });
          if (crit && (frameId === "15" || frameId === "20" || frameId === "22" || frameId === "28") && window.SwordCamera) {
            const shake = (window.SwordConfig && SwordConfig.shake[frameId]) || { amp: 16, ms: 100, kind: "impact" };
            SwordCamera.triggerShake(frameId, performance.now(), {
              amp: (shake.amp || 16) * 1.15,
              ms: shake.ms || 100,
              kind: "impact",
              facing: hero.facing,
            });
          }
          syncBossEl(e);
        }
      },
      onAttackStart() {
        cancelHeroDash();
        beginDijiangSwing();
        swordCombo.attacking = true;
        if (runner) runner.classList.add("is-attacking", "is-attacking-sword");
        applyFanWhirl();
      },
      onAttackEnd() {
        swordCombo.attacking = false;
        if (runner) runner.classList.remove("is-attacking", "is-attacking-sword", "is-thrusting");
        if (window.SwordCombat && SwordCombat.airborne) {
          hero.onGround = false;
          return;
        }
        if (comboHoldsGround()) {
          hero.vy = 0;
          hero.onGround = true;
          if (SwordCombat.standY != null) hero.y = SwordCombat.standY;
          return;
        }
        const halfW = heroHalfW();
        const surface = surfaceAt(hero.x);
        if (surface != null && Math.abs(hero.y - surface) <= 10 && hasWalkSupport(hero.x, halfW, surface)) {
          hero.y = surface;
          hero.vy = 0;
          hero.onGround = true;
          return;
        }
        const landed = findLandingSurface(hero.y + 8, hero.y - 18, hero.x - halfW, hero.x + halfW);
        if (landed != null && hasWalkSupport(hero.x, halfW, landed)) {
          hero.y = landed;
          hero.vy = 0;
          hero.onGround = true;
          return;
        }
        hero.onGround = false;
      },
    });
    SwordInput.onConfirm = (n) => {
      if (!running || paused || hero.dead || inShop || selected !== "blue" || heroStunned()) return;
      SwordCombat.requestAttack(n, performance.now());
    };
    SwordInput.canCollect = () => {
      if (!running || paused || inShop || hero.dead || gameOver) return false;
      if (selected !== "blue" || !SwordCombat.ready) return false;
      if (SwordCombat.isBusy() && SwordCombat.attackId >= SwordCombat.maxAttackId()) return false;
      return document.hasFocus();
    };
    SwordInput.isUiEvent = (e) => isCombatUiTarget(e && e.target);
  }

  async function prepareComboArt() {
    try {
      bindSwordSystem();
      if (window.SwordCombat && comboStage) {
        await SwordCombat.prepare(comboStage);
        if (window.SwordAudio && SwordAudio.prepare) SwordAudio.prepare();
        comboGif.ready = SwordCombat.ready;
        comboArt.ready = SwordCombat.ready;
        if (selected === "blue" && comboArt.ready) showComboIdle();
        return;
      }
      await prepareComboGif();
      comboArt.bodyIdle = BLUE_BODY_ATK.idle;
      comboArt.bodyFrames = Object.create(null);
      comboArt.poseFrames = [];
      comboArt.slashFrames = [];
      comboArt.ready = comboGif.ready;
    } catch (err) {
      console.warn("combo art prepare failed", err);
      comboArt.ready = false;
    }
  }

  async function prepareFloorArt() {
    /* 真透明 PNG，直接使用；测量顶部透明高度以对齐站立面 */
    floorImgUrl = FLOOR_SRC;
    const img = await loadImage(FLOOR_SRC);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, w, h).data;
    let firstY = 0;
    const stepX = Math.max(1, (w / 64) | 0);
    outer: for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x += stepX) {
        if (px[(y * w + x) * 4 + 3] > 16) {
          firstY = y;
          break outer;
        }
      }
    }
    floorTopPad = Math.round((firstY * FLOOR_UNIT_H) / h);
  }

  function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
    preloadSfxClips();
    return audioCtx;
  }

  const SFX_CLIPS = {
    buy: { src: "assets/yinxiao/buy.mp3", part: "full", vol: 0.85 },
    coin: { src: "assets/yinxiao/coin.mp3", part: "full", vol: 0.9 },
    clear: { src: "assets/yinxiao/clear.mp3", part: "full", vol: 0.88 },
    shop: { src: "assets/yinxiao/click.mp3", part: "full", vol: 0.8 },
    dash: { src: "assets/yinxiao/dash.mp3", part: "full", vol: 0.85 },
    land: { src: "assets/yinxiao/sound-landed-on-the-floor-with-his-feet-after-jumping.mp3", part: "full", vol: 0.82 },
    hurtA: { src: "assets/yinxiao/practiced-kill-blow.mp3", part: "full", vol: 0.88 },
    hurtB: { src: "assets/yinxiao/sensitive-lightning-strike-with-melee-weapons.mp3", part: "full", vol: 0.88 },
    hurtC: { src: "assets/yinxiao/a-sharp-retaliatory-brutal-blow-with-a-knife.mp3", part: "full", vol: 0.88 },
    zhuHit: { src: "assets/yinxiao/zhu.mp4", part: "full", vol: 0.95 },
  };
  const SFX_HURT_IDS = ["hurtA", "hurtB", "hurtC"];
  const sfxBuffers = Object.create(null);
  const sfxHtmlPool = Object.create(null);
  let sfxPreloadStarted = false;

  function isHtmlSfxSrc(src) {
    return /\.mp4(?:$|\?)/i.test(src || "");
  }

  function sfxRange(buf, part) {
    const dur = buf.duration;
    if (part === "first") return { start: 0, dur: dur * 0.5 };
    if (part === "second") return { start: dur * 0.5, dur: Math.max(0.05, dur * 0.5) };
    return { start: 0, dur };
  }

  async function loadSfxBuffer(src) {
    if (sfxBuffers[src]) return sfxBuffers[src];
    const ctx = ensureAudio();
    if (!ctx) return null;
    const res = await fetch(src);
    const raw = await res.arrayBuffer();
    const buf = await new Promise((resolve, reject) => {
      const ret = ctx.decodeAudioData(raw.slice(0), resolve, reject);
      if (ret && ret.then) ret.then(resolve, reject);
    });
    sfxBuffers[src] = buf;
    return buf;
  }

  function playSfxHtml(src, vol) {
    if (!src) return;
    if (!sfxHtmlPool[src]) sfxHtmlPool[src] = [];
    const pool = sfxHtmlPool[src];
    let a = pool.find((el) => el.paused || el.ended);
    if (!a) {
      a = new Audio(src);
      a.preload = "auto";
      a.playsInline = true;
      pool.push(a);
    }
    a.volume = Math.min(1, Math.max(0, vol == null ? 1 : vol));
    try {
      a.currentTime = 0;
    } catch (_) {}
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  }

  function preloadSfxClips() {
    if (sfxPreloadStarted) return;
    sfxPreloadStarted = true;
    Object.keys(SFX_CLIPS).forEach((id) => {
      const src = SFX_CLIPS[id].src;
      if (isHtmlSfxSrc(src)) return;
      loadSfxBuffer(src).catch(() => {});
    });
  }

  function playSfxClip(id, vol) {
    const spec = SFX_CLIPS[id];
    if (!spec) return;
    const level = vol != null ? vol : spec.vol == null ? 1 : spec.vol;
    if (isHtmlSfxSrc(spec.src)) {
      playSfxHtml(spec.src, level);
      return;
    }
    const ctx = ensureAudio();
    const playBuf = (buf) => {
      if (!ctx || !buf) return;
      const range = sfxRange(buf, spec.part);
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buf;
      gain.gain.value = level;
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime, range.start, range.dur);
    };
    const ready = sfxBuffers[spec.src];
    if (ready) {
      playBuf(ready);
      return;
    }
    loadSfxBuffer(spec.src).then(playBuf).catch(() => {});
  }

  function playTone({ freq, dur = 0.12, type = "square", vol = 0.07, slide = 0, delay = 0 }) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide > 0) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function sfxJump() {
    playSfxClip("dash", 0.38);
  }

  function sfxLand() {
    playSfxClip("land");
  }

  function sfxHeroHurt() {
    playSfxClip(SFX_HURT_IDS[(Math.random() * SFX_HURT_IDS.length) | 0]);
  }

  function sfxZhuHit() {
    playSfxClip("zhuHit");
  }

  function sfxCoin() {
    playSfxClip("coin");
  }

  function sfxBuy() {
    playSfxClip("buy");
  }

  function sfxStageClear() {
    playSfxClip("clear");
  }

  function sfxShopClick() {
    playSfxClip("shop");
  }

  function sfxDash() {
    playSfxClip("dash");
  }

  function sfxAttack() {
    playTone({ freq: 420, dur: 0.14, type: "sawtooth", vol: 0.045, slide: 140 });
    playTone({ freq: 640, dur: 0.1, type: "square", vol: 0.035, slide: 220, delay: 0.02 });
  }

  /** 挥剑划破空气的破风声 */
  function sfxWhoosh() {
    if (window.SwordAudio) {
      SwordAudio.playSlash("15");
      return;
    }
    const ctx = ensureAudio();
    if (!ctx) return;
    const dur = 0.2;
    const t0 = ctx.currentTime;
    const n = Math.max(1, (ctx.sampleRate * dur) | 0);
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const env = 1 - i / n;
      data[i] = (Math.random() * 2 - 1) * env * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(2200, t0);
    filter.frequency.exponentialRampToValueAtTime(320, t0 + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.2, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
    playTone({ freq: 1100, dur: 0.11, type: "sawtooth", vol: 0.04, slide: 160 });
  }

  /** 天兵出枪前蓄力 */
  function sfxEnemyCharge() {
    playTone({ freq: 240, dur: 0.16, type: "triangle", vol: 0.035, slide: 70 });
  }

  /** 天兵武器划破风声 */
  function sfxEnemySlash() {
    const ctx = ensureAudio();
    if (!ctx) return;
    const dur = 0.14;
    const t0 = ctx.currentTime;
    const n = Math.max(1, (ctx.sampleRate * dur) | 0);
    const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const env = 1 - i / n;
      data[i] = (Math.random() * 2 - 1) * env * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.85;
    filter.frequency.setValueAtTime(2600, t0);
    filter.frequency.exponentialRampToValueAtTime(380, t0 + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
    playTone({ freq: 980, dur: 0.08, type: "sawtooth", vol: 0.022, slide: 180 });
  }

  function sfxHit() {
    playTone({ freq: 180, dur: 0.08, type: "square", vol: 0.07, slide: 90 });
  }

  /** 连招每一击：破风 + 命中顿挫 */
  function sfxComboStrike() {
    sfxWhoosh();
    playTone({ freq: 220, dur: 0.09, type: "square", vol: 0.08, slide: 70 });
    playTone({ freq: 90, dur: 0.11, type: "sawtooth", vol: 0.05, slide: 55, delay: 0.012 });
  }

  /** 掉命：短促偏高两声（类马里奥踩怪，无下滑、不闷） */
  function sfxLifeLost() {
    playTone({ freq: 1175, dur: 0.045, type: "square", vol: 0.085 });
    playTone({ freq: 1568, dur: 0.05, type: "square", vol: 0.08, delay: 0.075 });
  }

  function flashPortraitOnLifeLost() {
    const member = document.querySelector(`.party .member[data-hero="${selected}"]`);
    if (!member) return;
    const portrait = member.querySelector(".portrait");
    if (!portrait) return;
    portrait.classList.remove("is-life-flash");
    void portrait.offsetWidth;
    portrait.classList.add("is-life-flash");
    const clear = () => portrait.classList.remove("is-life-flash");
    portrait.addEventListener("animationend", clear, { once: true });
  }

  function pointInAttackArc(ox, oy, px, py, facing, reach, arc) {
    const dx = (px - ox) * (facing < 0 ? -1 : 1);
    const dy = py - oy;
    const dist = Math.hypot(dx, dy);
    if (dist > reach || dist < 10) return false;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const min = arc && arc.min != null ? arc.min : KNIFE_ARC.min;
    const max = arc && arc.max != null ? arc.max : KNIFE_ARC.max;
    return deg >= min && deg <= max;
  }

  function swordReach() {
    return (ATTACK_REACH + buffs.reach) * bajiaoshanRangeMul();
  }

  function fanReach() {
    return (ATTACK_REACH + buffs.reach) * bajiaoshanRangeMul();
  }

  function attackOrigin(heroW) {
    return {
      ox: hero.x + hero.facing * heroW * 0.12,
      oy: hero.y + 46,
    };
  }

  function enemiesInComboHit(frameId, spec) {
    const shift = (window.SwordConfig && SwordConfig.frameShift && SwordConfig.frameShift[frameId]) || {};
    const facing = hero.facing < 0 ? -1 : 1;
    const shiftX =
      window.SwordCombat && SwordCombat.appliedShiftX != null ? SwordCombat.appliedShiftX : shift.x || 0;
    const reach =
      (swordReach() * ((spec && spec.reachMul) || 1) + shiftX * 0.65 + 48) *
      (frameId === "28" ? tianmaThrustDistanceMul() : 1);
    const hits = [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.dead) continue;
      const dx = (e.x - hero.x) * facing;
      const dy = Math.abs((e.y || 0) - hero.y);
      if (dx < -36 || dx > reach) continue;
      if (dy > (e.kind === "zhu" ? ZHU_HIT_DY : 96)) continue;
      hits.push(e);
    }
    return hits;
  }

  function enemiesInArc(ox, oy, facing, reach, arc) {
    const hits = [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;
      const eCx = e.x;
      const eCy = e.kind === "zhu" ? e.y : e.y + e.h * 0.42;
      if (e.kind === "zhu") {
        const dx = (eCx - ox) * facing;
        const dy = Math.abs((e.y || 0) - (hero.y || 0));
        if (dx > -36 && dx < reach && dy <= ZHU_HIT_DY) hits.push(e);
        continue;
      }
      if (pointInAttackArc(ox, oy, eCx, eCy, facing, reach, arc)) hits.push(e);
    }
    return hits;
  }

  function nearestEnemy(list, ox, oy) {
    let best = null;
    let bestD = Infinity;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      const d = Math.hypot(e.x - ox, e.y + e.h * 0.42 - oy);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  function activeHpBar() {
    const member = document.querySelector(`.party .member[data-hero="${selected}"]`);
    return member ? member.querySelector(".bar") : null;
  }

  function renderHp() {
    const bar = activeHpBar();
    if (!bar) return;
    const pills = bar.querySelectorAll("i");
    const n = pills.length || 1;
    const filled = Math.ceil((Math.max(0, hero.hp) / heroMaxHp()) * n);
    pills.forEach((el, i) => {
      el.classList.toggle("is-empty", i >= filled);
    });
  }

  function renderLives() {
    document.querySelectorAll(".party .member").forEach((member) => {
      const n = member.querySelector(".lives__n");
      if (n) n.textContent = String(Math.max(0, heroLives));
      member.classList.toggle("is-out", heroLives <= 0);
    });
  }

  function syncPartyHud() {
    // 选人/加载中：红蓝头像+血条都显示；真正进入关卡页后才只留出战角色（命数同时出现）
    const single = running || game.classList.contains("is-running");
    document.querySelectorAll(".party .member").forEach((member) => {
      if (!single) {
        member.hidden = false;
        return;
      }
      member.hidden = member.dataset.hero !== selected;
    });
    renderHp();
    renderLives();
  }

  function openGameOver(reason = "lives") {
    gameOver = true;
    paused = true;
    hero.dead = true;
    hero.vx = 0;
    hero.vy = 0;
    stageBusy = true;
    if (toast) {
      toast.hidden = true;
      toast.classList.remove("is-show");
    }
    if (pauseOverlay) pauseOverlay.hidden = true;
    if (shopEl) shopEl.hidden = true;
    inShop = false;
    game.classList.remove("is-shop");
    runway.classList.add("is-paused");
    if (bagBtn) bagBtn.hidden = true;
    setBagOpen(false);
    enableShopFonts();
    if (gameoverTitleEl) {
      gameoverTitleEl.textContent = reason === "timeout" ? "时间到" : "命数耗尽";
    }
    if (gameoverHintEl) {
      gameoverHintEl.textContent =
        reason === "timeout"
          ? "未能在通关时间内消灭全部天兵"
          : "是否再来一局挑战宝阁？";
    }
    if (gameoverContinueBtn) gameoverContinueBtn.textContent = "再来一局";
    if (gameoverOverlay) {
      gameoverOverlay.hidden = false;
      gameoverOverlay.removeAttribute("hidden");
      applyOverlayBg(gameoverOverlay);
    }
    game.classList.add("is-gameover");
    cursor.classList.remove("is-on");
    renderLives();
  }

  /** 再来一局：从第 1 关重新开始 */
  function continueChallenge() {
    if (!gameOver) return;
    gameOver = false;
    if (gameoverOverlay) gameoverOverlay.hidden = true;
    game.classList.remove("is-gameover");
    if (bagBtn) bagBtn.hidden = false;
    inShop = false;
    stageBusy = false;
    if (shopEl) shopEl.hidden = true;
    game.classList.remove("is-shop");
    heroLives = START_LIVES;
    hero.hp = MAX_HP;
    hero.dead = false;
    hero.hurtFrames = 0;
    clearHeroHit();
    resetRunBuffs();
    grantStartingLoadout();
    setBagOpen(false);
    syncBagBtn();
    coinCount = 0;
    drawCoinCount(formatCoins(0));
    renderHp();
    renderLives();
    initTrack();
    running = true;
    setPaused(false);
    syncHeroEl();
    syncPartyHud();
    showToast("再来一局 · 第 1 关", 1100);
  }

  /** 退出游戏：回到初始选人页 */
  function quitGame() {
    window.location.reload();
  }

  function heroScreenX() {
    const raw = getComputedStyle(runway).getPropertyValue("--hero-x").trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 120;
  }

  function formatCoins(n) {
    return `x${String(Math.min(999, Math.max(0, n))).padStart(3, "0")}`;
  }

  function playerAtk() {
    const bao = (shopBought.baojian | 0) * 0.2;
    const hex = hexianguStacks() * 0.15;
    const tie = belowBaseSpeed() ? (shopBought.tieguaili | 0) * 0.05 : 0;
    const bonus = (bao + hex + tie) * combatRelicMul();
    return Math.max(1, Math.round((PLAYER_ATK + buffs.atk) * (1 + bonus)));
  }

  function extraSwordHits() {
    return 0;
  }

  function maxAirJumps() {
    return 1 + Math.min(4, Math.max(0, shopBought.fenghuolun | 0));
  }

  function maxJumps() {
    return 1 + maxAirJumps();
  }

  function shoveBoss(boss, knock, facing) {
    if (!boss || boss.dead) return;
    if (gouFightThroughHit(boss)) {
      if (!gouIsAttacking(boss)) tryGouComboPunish(boss, performance.now());
      return;
    }
    const pushDir = (facing != null ? facing : hero.facing || 1) < 0 ? -1 : 1;
    const force = knock != null ? knock : 3.4;
    boss.hurtFrames = Math.max(boss.hurtFrames || 0, 18 + ((force * 3) | 0));
    boss.stunnedUntil = performance.now() + 320;
    boss.hitDir = pushDir;
    boss.vx = pushDir * (6.4 + force * 1.8);
    boss.vy = 0;
    setBossFacing(boss, -pushDir, true);
    boss.gapLock = 0;
    cancelEnemyThrust(boss);
  }

  function applyFanWhirl() {
    return;
  }

  function hitEnemy(e, dmg, opts) {
    const extra = extraSwordHits();
    const knock = (opts && opts.knockback) || 2.4;
    const facing = opts && opts.facing != null ? opts.facing : hero.facing;
    for (let n = 0; n <= extra; n++) {
      if (!e || e.dead) break;
      hurtBoss(e, dmg, { knockback: knock, facing });
      applyDijiangLifesteal(dmg);
    }
  }

  function spendCoins(amount) {
    const n = Math.max(0, Number(amount) || 0);
    if (n <= 0) return 0;
    const paid = Math.min(coinCount, n);
    if (paid <= 0) return 0;
    coinCount -= paid;
    drawCoinCount(formatCoins(coinCount));
    return paid;
  }

  function noteDijiangAttack() {
    if ((shopBought.dijiang | 0) <= 0) return;
    relicFx.dijiangSwings = (relicFx.dijiangSwings | 0) + 1;
    if (relicFx.dijiangSwings < 10) return;
    relicFx.dijiangSwings = 0;
    spendCoins(1);
  }

  function beginDijiangSwing() {
    relicFx.dijiangPaid = (shopBought.dijiang | 0) > 0;
    noteDijiangAttack();
  }

  function applyDijiangLifesteal(dealt) {
    if (!relicFx.dijiangPaid || dealt <= 0) return;
    const stacks = Math.max(1, shopBought.dijiang | 0);
    const heal = Math.max(1, Math.round(dealt * DIJIANG_LEECH * stacks * combatRelicMul()));
    const max = heroMaxHp();
    if (hero.hp >= max) return;
    hero.hp = Math.min(max, hero.hp + heal);
    renderHp();
  }

  function dashBurstActive() {
    return !!(tapDash.burstDir && tapDash.remainPx > 0);
  }

  function tapDashActive() {
    return dashBurstActive();
  }

  function syncDashHoldLock() {
    if (tapDash.lockDir < 0 && !keys.a) tapDash.lockDir = 0;
    if (tapDash.lockDir > 0 && !keys.d) tapDash.lockDir = 0;
  }

  function endDashBurst() {
    tapDash.dir = 0;
    tapDash.burstDir = 0;
    tapDash.burstUntil = 0;
    tapDash.remainPx = 0;
    hero.sprinting = false;
    hero.dashing = false;
  }

  function cancelHeroDash() {
    endDashBurst();
  }

  function tianmaStacks() {
    return Math.max(0, shopBought.tianma | 0);
  }

  function hasTianma() {
    return tianmaStacks() > 0;
  }

  function tianmaDashMul() {
    return Math.pow(2, tianmaStacks());
  }

  function dashThrustMaxPx() {
    return DASH_THRUST_PX * tianmaDashMul();
  }

  function dashCooldownMs() {
    return DASH_COOLDOWN_MS * Math.pow(0.5, tianmaStacks());
  }

  function tianmaThrustDistanceMul() {
    const n = tianmaStacks();
    return n > 0 ? 1 + n : 1;
  }

  function comboThrustActive() {
    const sc = window.SwordCombat;
    if (sc && sc.ready && sc.state === "attack" && (sc.attackId | 0) === 4) return true;
    const step = swordCombo.stepCfg;
    return !!(swordCombo.attacking && step && step.motion === "thrust");
  }

  function tianmaThrustActive() {
    return hasTianma() && (dashBurstActive() || comboThrustActive());
  }

  function interruptHeroThrust() {
    cancelHeroDash();
    if (window.SwordCombat && SwordCombat.interruptHit) SwordCombat.interruptHit();
  }

  function startHeroDash(dir, now) {
    if (!running || paused || inShop || hero.dead || gameOver) return false;
    if (now < (tapDash.readyAt || 0)) return false;
    if (heroStunned()) return false;
    if (selected === "blue" && window.SwordCombat && SwordCombat.isBusy()) return false;
    tapDash.dir = dir;
    tapDash.burstDir = dir;
    tapDash.lockDir = dir;
    tapDash.remainPx = dashThrustMaxPx();
    tapDash.readyAt = now + dashCooldownMs();
    hero.facing = dir;
    hero.sprinting = true;
    hero.dashing = true;
    sfxDash();
    return true;
  }

  function noteMoveTap(key, now) {
    if (key !== "a" && key !== "d") return;
    const dir = key === "a" ? -1 : 1;
    const windowMs = touchPadActive() ? 420 : TAP_DASH_MS;
    if (tapDash.lastKey === key && now - tapDash.lastAt <= windowMs) {
      startHeroDash(dir, now);
    } else if (tapDash.dir && tapDash.dir !== dir && !dashBurstActive(now)) {
      tapDash.dir = 0;
    }
    tapDash.lastKey = key;
    tapDash.lastAt = now;
  }

  function caneSlowMul() {
    const n = shopBought.guaizhang | 0;
    if (n <= 0) return 1;
    return Math.max(0.35, 1 - 0.08 * n);
  }

  function guaizhangRangeMul() {
    const n = shopBought.guaizhang | 0;
    return n > 0 ? 1 + 0.12 * n * combatRelicMul() : 1;
  }

  function combatRelicMul() {
    const n = shopBought.hanxiangzi | 0;
    return n > 0 ? Math.pow(1 + HANXIANGZI_BOOST, n) : 1;
  }

  function relicBoostMul() {
    return combatRelicMul();
  }

  function boostRelicAmt(n) {
    return n * combatRelicMul();
  }

  function boostRelicKeep(keep) {
    return 1 - (1 - keep) * combatRelicMul();
  }

  function tianmaActive() {
    return false;
  }

  function heroHasteMul() {
    return 1;
  }

  function kunxiansuoStacks() {
    return Math.max(0, shopBought.kunxiansuo | 0);
  }

  function kunxiansuoEnemyMul() {
    const n = kunxiansuoStacks();
    if (n <= 0) return 1;
    return Math.max(1 - KUNXIANSUO_CAP, 1 - KUNXIANSUO_SLOW * n);
  }

  function kunxiansuoSelfAtkMul() {
    const n = kunxiansuoStacks();
    if (n <= 0) return 1;
    return 1 / (1 + KUNXIANSUO_SELF_INTERVAL * n);
  }

  function bajiaoshanStacks() {
    return Math.max(0, shopBought.bajiaoshan | 0);
  }

  function bajiaoshanRangeMul() {
    const n = bajiaoshanStacks();
    return n > 0 ? Math.pow(1 + 0.1 * combatRelicMul(), n) : 1;
  }

  function bajiaoshanAtkSlowMul() {
    const n = bajiaoshanStacks();
    return n > 0 ? Math.pow(1 + 0.05 * combatRelicMul(), n) : 1;
  }

  function hexianguStacks() {
    return Math.max(0, shopBought.hexiangu | 0);
  }

  function hexianguAtkMul() {
    return 1;
  }

  function hexianguHpMul() {
    const n = hexianguStacks();
    return n > 0 ? Math.pow(0.95, n) : 1;
  }

  function caishenyeHpMul() {
    const n = shopBought.caishenye | 0;
    return n > 0 ? Math.pow(0.9, n) : 1;
  }

  function heroAttackSpeedMul(now) {
    return heroHasteMul(now) * kunxiansuoSelfAtkMul() * bajiaoshanAtkSlowMul();
  }

  function applyKunxiansuoOnHit(enemy) {
    if (kunxiansuoStacks() <= 0) return;
    if (enemy) enemy.snareUntil = performance.now() + KUNXIANSUO_SNARE_MS;
    relicFx.kunxiansuoHit = true;
  }

  function vaseActive(now) {
    const t = now != null ? now : performance.now();
    return t < relicFx.vaseUntil;
  }

  function enemyWalkMul(e) {
    let mul = 1;
    if (e && e.kind === "gou") mul *= GOU_MOVE_MUL;
    if (e && e.snareUntil && performance.now() < e.snareUntil) mul *= kunxiansuoEnemyMul();
    if (vaseActive() && e && e.kind === "gou") mul *= VASE_BOSS_SLOW;
    return mul;
  }

  function enemyAtkDurMul(e) {
    if (!(e && e.snareUntil && performance.now() < e.snareUntil)) return 1;
    const n = kunxiansuoStacks();
    if (n <= 0) return 1;
    return 1 + Math.min(KUNXIANSUO_CAP, 0.1 * n);
  }

  function enemyPhaseMs(base, e) {
    let ms = base;
    if (e && e.kind === "gou") {
      if (base === ENEMY_THRUST_MS) ms = GOU_THRUST_MS;
      else if (base === ENEMY_RECOVER_MS) ms = GOU_RECOVER_MS;
      else if (base === ENEMY_CHARGE_MS) ms = GOU_CHARGE_MS;
    }
    return ms * enemyAtkDurMul(e);
  }

  function armTianmaForStage() {
    relicFx.tianmaUntil = 0;
    return false;
  }

  function armXiaotianForStage() {
    relicFx.xiaotianTrial = false;
    relicFx.xiaotianDied = false;
    relicFx.xiaotianTrialStacks = 0;
    const n = relicFx.xiaotianArmed | 0;
    if (n <= 0) return false;
    relicFx.xiaotianArmed = 0;
    relicFx.xiaotianTrial = true;
    relicFx.xiaotianTrialStacks = n;
    const loss = 50 * n;
    hero.hp = Math.max(1, hero.hp - loss);
    renderHp();
    return true;
  }

  function armQiankundaiForStage(baseCount) {
    const n = relicFx.qiankundaiArmed | 0;
    if (n <= 0) return { count: baseCount, on: false };
    relicFx.qiankundaiArmed = 0;
    const count = Math.max(1, Math.ceil(baseCount * Math.pow(0.8, n)));
    return { count, on: true, stacks: n };
  }

  function resolveXiaotianTrial() {
    if (!relicFx.xiaotianTrial) return;
    const stacks = Math.max(1, relicFx.xiaotianTrialStacks | 0);
    relicFx.xiaotianTrial = false;
    relicFx.xiaotianTrialStacks = 0;
    if (relicFx.xiaotianDied) return;
    const bonus = Math.round(boostRelicAmt(30 * stacks));
    relicFx.xiaotianMaxBonus = (relicFx.xiaotianMaxBonus || 0) + bonus;
    refreshHeroVitals();
    showToast(`撑过撕咬 · 生命上限+${bonus}`, 1200);
  }

  function walkSpeedNow() {
    return Math.max(0.05, (MOVE_SPEED + buffs.speed) * caneSlowMul() * heroHasteMul());
  }

  function belowBaseSpeed() {
    return walkSpeedNow() < MOVE_SPEED - 0.01;
  }

  function heroMaxHp() {
    let hp = MAX_HP;
    const tie = shopBought.tieguaili | 0;
    if (tie > 0 && belowBaseSpeed()) {
      hp = Math.round(hp * (1 + 0.08 * tie * combatRelicMul()));
    }
    hp = Math.round((hp + (relicFx.xiaotianMaxBonus || 0)) * hexianguHpMul() * caishenyeHpMul());
    return Math.max(20, hp);
  }

  function enemiesPacified(now, e) {
    const t = now != null ? now : performance.now();
    if (t < (hero.spawnGraceUntil || 0)) {
      /* 开场无敌只挡伤害；恶犬仍要追扑，否则左端叠刷会站着不动 */
      if (e && e.kind === "gou") return false;
      return true;
    }
    if (t < relicFx.vaseUntil) {
      if (e && e.kind === "gou") return false;
      return true;
    }
    return false;
  }

  function refreshHeroVitals() {
    const max = heroMaxHp();
    if (hero.hp > max) hero.hp = max;
    renderHp();
  }

  function playerMoveSpeed() {
    return walkSpeedNow();
  }

  function resetRelicFx() {
    relicFx.tickAt = 0;
    relicFx.interestAcc = 0;
    relicFx.goldAcc = 0;
    relicFx.gourdUsedThisLife = 0;
    relicFx.vaseUntil = 0;
    relicFx.vaseReadyAt = 0;
    relicFx.tianmaUntil = 0;
    relicFx.dijiangPaid = false;
    relicFx.dijiangGoldAt = 0;
    relicFx.dijiangSwings = 0;
    relicFx.xiaotianArmed = 0;
    relicFx.xiaotianTrial = false;
    relicFx.xiaotianDied = false;
    relicFx.xiaotianTrialStacks = 0;
    relicFx.xiaotianMaxBonus = 0;
    relicFx.caishenStages = 0;
    relicFx.kunxiansuoHit = false;
    relicFx.sunwukongUsed = 0;
    relicFx.qiankundaiArmed = 0;
  }

  function resetRunBuffs() {
    buffs.atk = 0;
    buffs.reach = 0;
    buffs.speed = 0;
    Object.keys(shopBought).forEach((id) => {
      shopBought[id] = 0;
    });
    shopOffer = [];
    shopRefreshN = 0;
    shopRefreshCost = 2;
    shopDiscountStacks = 0;
    killGoldThisStage = 0;
    roadCoinQueue = [];
    resetRelicFx();
  }

  function heroStandingStill() {
    return (
      hero.onGround &&
      !dashBurstActive() &&
      Math.abs(hero.vx || 0) < 0.2 &&
      !keys.a &&
      !keys.d &&
      !swordCombo.attacking
    );
  }

  function hasZijinHulu() {
    return (shopBought.hulu | 0) > 0;
  }

  function trySunwukongSave() {
    const owned = shopBought.sunwukong | 0;
    if (owned <= 0) return false;
    shopBought.sunwukong = owned - 1;
    heroLives = 1;
    hero.hp = Math.max(1, Math.round(heroMaxHp() * 0.4));
    renderLives();
    renderHp();
    showToast("孙悟空的毛 · 起死回生", 1200);
    return true;
  }

  function tryUseVase() {
    if (!running || paused || inShop || hero.dead || gameOver || heroStunned()) return false;
    if ((shopBought.yujingping || 0) <= 0) {
      showToast("尚未获得玉净瓶", 800);
      return false;
    }
    const now = performance.now();
    if (now < relicFx.vaseReadyAt) {
      const left = Math.ceil((relicFx.vaseReadyAt - now) / 1000);
      showToast(`玉净瓶冷却中 · ${left}s`, 800);
      return false;
    }
    relicFx.vaseUntil = now + VASE_FREEZE_MS;
    relicFx.vaseReadyAt = now + VASE_CD_MS;
    showToast("玉净瓶 · 天兵停手 7 秒", 1000);
    return true;
  }

  function tickRelics() {}

  function hasSword() {
    return (shopBought.baojian || 0) > 0 || slotsHaveWeaponKind("sword");
  }

  function hasFan() {
    return (shopBought.bajiaoshan || 0) > 0 || slotsHaveWeaponKind("fan");
  }

  function hasMeleeVisual() {
    return hasSword() || hasFan();
  }

  function itemVisualCount(id) {
    return Math.min(6, Math.max(0, shopBought[id] | 0));
  }

  /* ========== Weapon Slot 系统（总数固定 6，锚点可自由分配）========== */
  const ANCHOR_TYPE = {
    LeftHand: "LeftHand",
    RightHand: "RightHand",
    Feet: "Feet",
  };

  /** 身体锚点基准（相对 .runner__body：left%/bottom% + 像素微调） */
  const ANCHOR_BASE = {
    RightHand: { leftPct: 100, bottomPct: 42, ox: -18, oy: -13 },
    LeftHand: { leftPct: 18, bottomPct: 44, ox: 6, oy: -10 },
    Feet: { leftPct: 50, bottomPct: 6, ox: 0, oy: 2 },
  };

  const WEAPON_SLOT_COUNT = 6;
  /** Debug：显示 6 个槽位标记；游戏内按 F9 开关 */
  let WEAPON_SLOT_DEBUG = false;

  function makeEmptySlot(anchorType, localPos, renderOrder) {
    return {
      anchorType: anchorType || ANCHOR_TYPE.RightHand,
      localPosition: {
        x: (localPos && localPos.x) || 0,
        y: (localPos && localPos.y) || 0,
      },
      localRotation: 0,
      localScale: 1,
      renderOrder: renderOrder != null ? renderOrder : 0,
      equippedWeapon: null,
      _el: null,
      _marker: null,
    };
  }

  /** 默认布局：1 右手 + 1 左手 + 4 脚（脚部错开，避免重叠） */
  function createDefaultWeaponSlots() {
    return [
      makeEmptySlot(ANCHOR_TYPE.RightHand, { x: 0, y: 0 }, 5),
      makeEmptySlot(ANCHOR_TYPE.LeftHand, { x: 0, y: 0 }, 4),
      makeEmptySlot(ANCHOR_TYPE.Feet, { x: -14, y: 0 }, 1),
      makeEmptySlot(ANCHOR_TYPE.Feet, { x: 14, y: 0 }, 2),
      makeEmptySlot(ANCHOR_TYPE.Feet, { x: -7, y: 5 }, 3),
      makeEmptySlot(ANCHOR_TYPE.Feet, { x: 7, y: 5 }, 0),
    ];
  }

  const WeaponSlots = createDefaultWeaponSlots();

  function createWeaponInstance(itemId, overrides) {
    const catalog = SHOP_CATALOG[itemId];
    const kind =
      itemId === "baojian" ? "sword" : itemId === "bajiaoshan" ? "fan" : itemId === "fenghuolun" ? "wheel" : "sword";
    return {
      id: itemId,
      kind,
      name: (overrides && overrides.name) || (catalog && catalog.name) || itemId,
      icon:
        (overrides && overrides.icon) ||
        (catalog && catalog.icon) ||
        shopIcon("baojian"),
    };
  }

  function slotsHaveWeaponKind(kind) {
    for (let i = 0; i < WeaponSlots.length; i++) {
      const w = WeaponSlots[i].equippedWeapon;
      if (w && w.kind === kind) return true;
    }
    return false;
  }

  function preferredAnchorsForWeapon(weapon) {
    if (!weapon) return [ANCHOR_TYPE.RightHand];
    if (weapon.kind === "wheel") return [ANCHOR_TYPE.Feet, ANCHOR_TYPE.RightHand, ANCHOR_TYPE.LeftHand];
    if (weapon.kind === "fan") return [ANCHOR_TYPE.LeftHand, ANCHOR_TYPE.RightHand, ANCHOR_TYPE.Feet];
    return [ANCHOR_TYPE.RightHand, ANCHOR_TYPE.LeftHand, ANCHOR_TYPE.Feet];
  }

  function findSlotForEquip(weapon) {
    const prefs = preferredAnchorsForWeapon(weapon);
    for (let p = 0; p < prefs.length; p++) {
      const anchor = prefs[p];
      for (let i = 0; i < WeaponSlots.length; i++) {
        const s = WeaponSlots[i];
        if (s.anchorType === anchor && !s.equippedWeapon) return i;
      }
    }
    for (let i = 0; i < WeaponSlots.length; i++) {
      if (!WeaponSlots[i].equippedWeapon) return i;
    }
    return -1;
  }

  function equipWeapon(slotIndex, weapon) {
    if (slotIndex < 0 || slotIndex >= WEAPON_SLOT_COUNT) return false;
    if (!weapon) return false;
    WeaponSlots[slotIndex].equippedWeapon = {
      id: weapon.id,
      kind: weapon.kind,
      name: weapon.name,
      icon: weapon.icon,
    };
    renderWeaponSlots();
    return true;
  }

  function unequipWeapon(slotIndex) {
    if (slotIndex < 0 || slotIndex >= WEAPON_SLOT_COUNT) return false;
    WeaponSlots[slotIndex].equippedWeapon = null;
    renderWeaponSlots();
    return true;
  }

  function setSlotAnchor(slotIndex, anchorType) {
    if (slotIndex < 0 || slotIndex >= WEAPON_SLOT_COUNT) return false;
    if (!ANCHOR_BASE[anchorType]) return false;
    WeaponSlots[slotIndex].anchorType = anchorType;
    renderWeaponSlots();
    return true;
  }

  function clearAllWeaponSlots() {
    for (let i = 0; i < WeaponSlots.length; i++) {
      WeaponSlots[i].equippedWeapon = null;
    }
  }

  function ensureWeaponSlotElements() {
    if (!weaponRack) return;
    weaponRack.hidden = false;
    if (weaponRack.dataset.slotSystem === "1" && weaponRack.childElementCount >= WEAPON_SLOT_COUNT) {
      return;
    }
    weaponRack.innerHTML = "";
    weaponRack.dataset.slotSystem = "1";
    for (let i = 0; i < WEAPON_SLOT_COUNT; i++) {
      const el = document.createElement("div");
      el.className = "wslot";
      el.dataset.slot = String(i);

      const arm = document.createElement("div");
      arm.className = "weapon-arm";
      const arc = document.createElement("div");
      arc.className = "weapon-arc";
      arc.setAttribute("aria-hidden", "true");
      const img = document.createElement("img");
      img.className = "weapon-sprite";
      img.alt = "";
      img.draggable = false;
      arm.appendChild(arc);
      arm.appendChild(img);
      el.appendChild(arm);

      const marker = document.createElement("div");
      marker.className = "wslot__marker";
      marker.textContent = String(i);
      marker.setAttribute("aria-hidden", "true");
      el.appendChild(marker);

      weaponRack.appendChild(el);
      WeaponSlots[i]._el = el;
      WeaponSlots[i]._marker = marker;
    }
  }

  function renderWeaponSlots() {
    if (!weaponRack || !runner) return;
    ensureWeaponSlotElements();

    let anyWeapon = false;
    let anySword = false;
    let anyFan = false;

    const order = WeaponSlots.map((s, i) => i).sort(
      (a, b) => (WeaponSlots[a].renderOrder | 0) - (WeaponSlots[b].renderOrder | 0)
    );

    for (let o = 0; o < order.length; o++) {
      const i = order[o];
      const slot = WeaponSlots[i];
      let el = slot._el;
      if (!el || !el.isConnected) {
        ensureWeaponSlotElements();
        el = slot._el;
      }
      if (!el) continue;

      const base = ANCHOR_BASE[slot.anchorType] || ANCHOR_BASE.RightHand;
      const lx = (slot.localPosition && slot.localPosition.x) || 0;
      const ly = (slot.localPosition && slot.localPosition.y) || 0;
      const rot = slot.localRotation || 0;
      const scale = slot.localScale != null ? slot.localScale : 1;

      el.style.left = `${base.leftPct}%`;
      el.style.bottom = `${base.bottomPct}%`;
      el.style.zIndex = String(10 + (slot.renderOrder | 0));
      el.style.setProperty("--wx", `${(base.ox || 0) + lx}px`);
      el.style.setProperty("--wy", `${-((base.oy || 0) + ly)}px`);
      el.style.setProperty("--wrot", `${rot}deg`);
      el.style.setProperty("--wscale", String(scale));
      el.dataset.anchor = slot.anchorType;

      const arm = el.querySelector(".weapon-arm");
      const arc = el.querySelector(".weapon-arc");
      const img = el.querySelector(".weapon-sprite");
      const marker = slot._marker || el.querySelector(".wslot__marker");
      const weapon = slot.equippedWeapon;

      if (weapon && img && arm && arc) {
        anyWeapon = true;
        const kind = weapon.kind || "sword";
        if (kind === "sword") anySword = true;
        if (kind === "fan") anyFan = true;
        arm.className = `weapon-arm weapon-arm--${kind}`;
        arc.className = `weapon-arc weapon-arc--${kind}`;
        img.className = `weapon-sprite weapon-sprite--${kind}`;
        img.src = weapon.icon;
        img.hidden = false;
        arm.hidden = false;
      } else if (img && arm) {
        img.removeAttribute("src");
        img.hidden = true;
        arm.className = "weapon-arm";
        if (arc) arc.className = "weapon-arc";
      }

      if (marker) {
        marker.hidden = !WEAPON_SLOT_DEBUG;
        marker.dataset.anchor = slot.anchorType;
        marker.title = `Slot${i} · ${slot.anchorType}${weapon ? ` · ${weapon.name}` : " · empty"}`;
      }
    }

    weaponRack.hidden = !anyWeapon && !WEAPON_SLOT_DEBUG;
    weaponRack.classList.toggle("is-debug", WEAPON_SLOT_DEBUG);
    runner.classList.toggle("has-sword", anySword);
    runner.classList.toggle("has-fan", anyFan);
    runner.classList.toggle("has-melee", anySword || anyFan);
    runner.classList.toggle("is-knife-hero", selected === "blue");
    runner.classList.toggle("is-fan-hero", selected === "red");
  }

  /**
   * 按库存重建 6 槽装备（默认武器 + 商店购入）。
   * 数量上限仍为 6；超出部分只保留数值 buff，不再显示。
   */
  function syncWeaponVisual() {
    clearAllWeaponSlots();

    /* 吕洞宾全身帧已含佩剑，不再叠武器架剑 */
    if (selected === "blue" && SWORD_COMBO.useBodyFrames) {
      renderWeaponSlots();
      if (weaponRack) weaponRack.hidden = true;
      runner.classList.remove("has-sword", "has-fan", "has-melee");
      runner.classList.add("is-knife-hero");
      runner.classList.remove("is-fan-hero");
      return;
    }

    const needSword = Math.max(shopBought.baojian | 0, selected === "blue" ? 1 : 0);
    const needFan = Math.max(shopBought.bajiaoshan | 0, selected === "red" ? 1 : 0);
    const needWheel = shopBought.fenghuolun | 0;

    for (let n = 0; n < needSword; n++) {
      const w =
        selected === "blue" && n === 0
          ? createWeaponInstance("baojian")
          : createWeaponInstance("baojian");
      const idx = findSlotForEquip(w);
      if (idx < 0) break;
      WeaponSlots[idx].equippedWeapon = w;
    }
    for (let n = 0; n < needFan; n++) {
      const w =
        selected === "red" && n === 0
          ? createWeaponInstance("bajiaoshan")
          : createWeaponInstance("bajiaoshan");
      const idx = findSlotForEquip(w);
      if (idx < 0) break;
      WeaponSlots[idx].equippedWeapon = w;
    }
    for (let n = 0; n < needWheel; n++) {
      const w = createWeaponInstance("fenghuolun");
      const idx = findSlotForEquip(w);
      if (idx < 0) break;
      WeaponSlots[idx].equippedWeapon = w;
    }

    renderWeaponSlots();
  }

  /** 开局按角色显示默认兵器外观（不计入商店已购） */
  function grantStartingLoadout() {
    syncWeaponVisual();
  }

  function setWeaponSlotDebug(on) {
    WEAPON_SLOT_DEBUG = !!on;
    renderWeaponSlots();
  }

  function toggleWeaponSlotDebug() {
    setWeaponSlotDebug(!WEAPON_SLOT_DEBUG);
    showToast(WEAPON_SLOT_DEBUG ? "Weapon Slot Debug ON" : "Weapon Slot Debug OFF", 900);
  }

  /* 控制台 / 外部调试用 */
  window.WeaponSlotAPI = {
    slots: WeaponSlots,
    equipWeapon,
    unequipWeapon,
    setSlotAnchor,
    setDebug: setWeaponSlotDebug,
    render: renderWeaponSlots,
    ANCHOR_TYPE,
    ANCHOR_BASE,
  };
  window.playCombo = playCombo;

  function ownedShopSummary() {
    const parts = [];
    Object.keys(SHOP_CATALOG).forEach((id) => {
      const qty = shopBought[id] | 0;
      if (qty > 0) parts.push(`${SHOP_CATALOG[id].name}×${qty}`);
    });
    return parts.join(" · ");
  }

  function ownedRelicCount() {
    let n = 0;
    Object.keys(SHOP_CATALOG).forEach((id) => {
      n += shopBought[id] | 0;
    });
    return n;
  }

  function syncBagBtn() {
    const n = ownedRelicCount();
    if (bagCountEl) {
      bagCountEl.textContent = n > 9 ? "9+" : String(n);
      bagCountEl.hidden = n <= 0;
    }
    if (bagBtn) {
      bagBtn.classList.toggle("has-items", n > 0);
      bagBtn.title = n > 0 ? "点开查看已购法宝" : "背包";
    }
  }

  function pulseBagBtn() {
    if (!bagBtn || ownedRelicCount() <= 0) return;
    bagBtn.classList.remove("is-new");
    void bagBtn.offsetWidth;
    bagBtn.classList.add("is-new");
  }

  function syncShopTip() {
    if (shopFocus < 0 || !shopSlots[shopFocus]) {
      if (shopTipEl) shopTipEl.classList.remove("is-detail");
      if (shopTipName) {
        shopTipName.hidden = false;
        shopTipName.textContent = "点击商品查看详情";
      }
      if (shopTipDesc) {
        shopTipDesc.textContent = previewCatalogFromUrl()
          ? "检查模式：下列出全部法宝。点选查看说明。"
          : "每次只出 3 件宝物。可花金币刷新；备好后点「进入下一关」";
      }
      if (shopTipEffect) {
        shopTipEffect.hidden = true;
        shopTipEffect.textContent = "";
      }
      return;
    }
    const id = shopSlots[shopFocus].dataset.item;
    const item = SHOP_CATALOG[id];
    if (!item) return;
    if (shopTipEl) shopTipEl.classList.add("is-detail");
    if (shopTipName) shopTipName.hidden = true;
    const owned = shopBought[id] || 0;
    if (shopTipDesc) shopTipDesc.textContent = item.desc || "";
    if (shopTipEffect) {
      const effect = item.effect || "";
      shopTipEffect.textContent = owned > 0 ? `${effect}（已拥有 x${owned}）` : effect;
      shopTipEffect.hidden = !effect;
    }
  }

  function syncShopUi() {
    if (shopGoldEl) shopGoldEl.textContent = String(coinCount);
    shopSlots.forEach((btn, i) => {
      const id = btn.dataset.item;
      const item = SHOP_CATALOG[id];
      if (!item) {
        btn.classList.remove("is-focus", "is-broke", "is-owned");
        return;
      }
      const owned = shopBought[id] | 0;
      btn.classList.toggle("is-focus", i === shopFocus);
      btn.classList.toggle("is-broke", coinCount < shopItemPrice(item));
      btn.classList.toggle("is-owned", owned > 0);
      const priceEl = btn.querySelector(".shop-slot__price b");
      if (priceEl) priceEl.textContent = String(shopItemPrice(item));
      const frame = btn.querySelector(".shop-slot__frame");
      let ownedEl = btn.querySelector(".shop-slot__owned");
      if (!ownedEl && frame) {
        ownedEl = document.createElement("span");
        ownedEl.className = "shop-slot__owned";
        frame.appendChild(ownedEl);
      }
      if (ownedEl) {
        ownedEl.textContent = `x${owned}`;
        ownedEl.hidden = owned <= 0;
      }
    });
    if (shopBuyBtn) {
      const sel = shopFocus >= 0 ? shopSlots[shopFocus] : null;
      const item = sel && SHOP_CATALOG[sel.dataset.item];
      shopBuyBtn.disabled = !item || coinCount < shopItemPrice(item);
    }
    if (shopRefreshCostEl) shopRefreshCostEl.textContent = String(shopRefreshPrice());
    if (shopRefreshBtn) {
      shopRefreshBtn.disabled = coinCount < shopRefreshPrice();
      shopRefreshBtn.classList.toggle("is-broke", coinCount < shopRefreshPrice());
    }
    syncShopTip();
  }

  function bindShopSlotClicks() {
    shopSlots.forEach((btn, i) => {
      btn.onclick = () => selectShopItem(i);
    });
  }

  function ensureShopSlotCount(n) {
    const host = document.getElementById("shop-slots");
    if (!host) return;
    const nodes = [...host.querySelectorAll(".shop-slot")];
    const proto = nodes[0];
    if (!proto) return;
    while (nodes.length < n) {
      const copy = proto.cloneNode(true);
      copy.dataset.item = "";
      copy.disabled = false;
      copy.classList.remove("is-empty", "is-focus", "is-broke", "is-owned");
      host.appendChild(copy);
      nodes.push(copy);
    }
    nodes.forEach((btn, i) => {
      btn.hidden = i >= n;
    });
    shopSlots = nodes.slice(0, n);
    bindShopSlotClicks();
  }

  function catalogIds() {
    return Object.keys(SHOP_CATALOG);
  }

  function shopStageW() {
    return Math.max(1, (pendingNextStage | 0) - 1);
  }

  function shopDiscountMul() {
    return Math.max(0, 1 - 0.05 * (shopBought.zhongliquan | 0));
  }

  function roundShopPrice(p) {
    return 5 * Math.max(1, Math.floor(p / 5 + 0.5));
  }

  function shopItemCap(id) {
    const item = SHOP_CATALOG[id];
    if (!item || item.cap == null) return Infinity;
    return item.cap;
  }

  function shopItemAtCap(id) {
    return (shopBought[id] | 0) >= shopItemCap(id);
  }

  function shopPriceMul() {
    return shopDiscountMul();
  }

  function shopItemPrice(item) {
    if (!item) return 0;
    if (item.free || item.price === 0) return 0;
    if (previewCatalogFromUrl()) return item.price;
    const w = shopStageW();
    const p = (item.price + w + 0.1 * item.price * w) * shopDiscountMul();
    return roundShopPrice(p);
  }

  function shopRefreshStepFee() {
    return Math.max(1, Math.floor(0.4 * shopStageW()));
  }

  function shopRefreshPrice() {
    const w = shopStageW();
    const d = shopRefreshStepFee();
    return Math.floor(0.75 * w) + d + shopRefreshN * d;
  }

  function shopRarityWeights(w) {
    if (w <= 1) return [0, 80, 18, 2, 0];
    if (w <= 2) return [0, 65, 25, 10, 5];
    if (w <= 4) return [0, 55, 30, 10, 5];
    if (w <= 7) return [0, 45, 35, 16, 4];
    if (w <= 10) return [0, 35, 35, 22, 8];
    return [0, 25, 35, 27, 13];
  }

  function paintShopOffer() {
    shopSlots.forEach((btn, i) => {
      const id = shopOffer[i];
      const item = id && SHOP_CATALOG[id];
      const img = btn.querySelector(".shop-slot__frame img");
      const nameEl = btn.querySelector(".shop-slot__name");
      const priceWrap = btn.querySelector(".shop-slot__price");
      const ownedEl = btn.querySelector(".shop-slot__owned");
      btn.hidden = false;
      if (!item) {
        btn.dataset.item = "";
        btn.disabled = true;
        btn.classList.add("is-empty");
        btn.classList.remove("is-focus", "is-broke", "is-owned");
        if (img) {
          img.removeAttribute("src");
          img.alt = "";
          img.hidden = true;
        }
        if (nameEl) nameEl.textContent = "";
        if (priceWrap) priceWrap.hidden = true;
        if (ownedEl) ownedEl.hidden = true;
        return;
      }
      btn.disabled = false;
      btn.classList.remove("is-empty");
      btn.dataset.item = id;
      if (img) {
        img.hidden = false;
        img.src = item.icon;
        img.alt = item.name;
      }
      if (nameEl) nameEl.textContent = item.name;
      if (priceWrap) priceWrap.hidden = false;
      const priceEl = btn.querySelector(".shop-slot__price b");
      if (priceEl) priceEl.textContent = String(shopItemPrice(item));
    });
  }

  function rollShopOffer() {
    if (previewCatalogFromUrl()) {
      const ids = catalogIds();
      ensureShopSlotCount(ids.length);
      shopOffer = ids.slice();
      paintShopOffer();
      return;
    }
    ensureShopSlotCount(SHOP_OFFER_COUNT);
    const w = shopStageW();
    const weights = shopRarityWeights(w);
    const picked = [];
    let yinyangUsed = 0;

    function eligible(id) {
      if (!SHOP_CATALOG[id]) return false;
      if (shopItemAtCap(id)) return false;
      if (picked.indexOf(id) >= 0) return false;
      if (id === "yinyangban" && yinyangUsed >= 1) return false;
      if (id === "jiemingqian" && (heroLives <= 1 || (shopBought.jiemingqian | 0) > 0)) return false;
      return true;
    }

    function pickOne() {
      const pool = catalogIds().filter(eligible);
      if (!pool.length) return "";
      const byTier = { 1: [], 2: [], 3: [], 4: [] };
      for (let i = 0; i < pool.length; i++) {
        const id = pool[i];
        const t = SHOP_CATALOG[id].tier || 1;
        const bag = byTier[t] || byTier[1];
        const copies = id === "yinyangban" ? 6 : 10;
        for (let k = 0; k < copies; k++) bag.push(id);
      }
      const parts = [];
      let total = 0;
      for (let t = 1; t <= 4; t++) {
        if (byTier[t].length && weights[t] > 0) {
          parts.push({ t, w: weights[t] });
          total += weights[t];
        }
      }
      let tier = 1;
      if (total > 0) {
        let r = Math.random() * total;
        for (let i = 0; i < parts.length; i++) {
          r -= parts[i].w;
          if (r <= 0) {
            tier = parts[i].t;
            break;
          }
          tier = parts[i].t;
        }
      }
      const list = byTier[tier].length ? byTier[tier] : pool;
      const id = list[(Math.random() * list.length) | 0];
      if (id === "yinyangban") yinyangUsed += 1;
      return id;
    }

    while (picked.length < SHOP_OFFER_COUNT) {
      const id = pickOne();
      if (!id) break;
      picked.push(id);
    }

    const shopIndex = (pendingNextStage | 0) - 1;
    if (shopIndex >= 1 && shopIndex <= 2) {
      const gold = coinCount;
      const hasAffordCombat = picked.some(
        (id) => SHOP_COMBAT_IDS.indexOf(id) >= 0 && shopItemPrice(SHOP_CATALOG[id]) <= gold
      );
      if (!hasAffordCombat) {
        const cheap = catalogIds()
          .filter(
            (id) =>
              SHOP_COMBAT_IDS.indexOf(id) >= 0 &&
              eligible(id) &&
              shopItemPrice(SHOP_CATALOG[id]) <= gold
          )
          .sort((a, b) => shopItemPrice(SHOP_CATALOG[a]) - shopItemPrice(SHOP_CATALOG[b]));
        if (cheap.length) picked[0] = cheap[0];
      }
    }

    shopOffer = picked;
    shopFocus = -1;
    paintShopOffer();
  }

  function refreshShopOffer() {
    if (!inShop) return false;
    const fee = shopRefreshPrice();
    if (coinCount < fee) {
      showToast("金币不足", 900);
      syncShopUi();
      return false;
    }
    coinCount -= fee;
    drawCoinCount(formatCoins(coinCount));
    shopRefreshN += 1;
    shopRefreshCost = shopRefreshPrice();
    rollShopOffer();
    sfxShopClick();
    showToast("宝物已刷新", 800);
    syncShopUi();
    return true;
  }

  let bagPausedRun = false;

  function renderBagPanel() {
    if (!bagList) return;
    bagList.innerHTML = "";
    let total = 0;
    Object.keys(SHOP_CATALOG).forEach((id) => {
      const qty = shopBought[id] | 0;
      if (qty <= 0) return;
      total += qty;
      const item = SHOP_CATALOG[id];
      const row = document.createElement("div");
      row.className = "bag-item";
      row.innerHTML = `
        <img src="${item.icon}" alt="${item.name}" draggable="false" />
        <div class="bag-item__meta">
          <strong>${item.name}</strong>
          <span>${item.effect || item.desc || ""}</span>
        </div>
        <span class="bag-item__qty">×${qty}</span>
      `;
      bagList.appendChild(row);
    });
    if (bagEmpty) bagEmpty.hidden = total > 0;
    syncBagBtn();
  }

  function setBagOpen(on) {
    if (!bagPanel) return;
    if (on) {
      if (!running || inShop || gameOver) return;
      enableShopFonts();
      renderBagPanel();
      bagPanel.hidden = false;
      if (game) game.classList.add("is-bag");
      document.body.classList.add("is-bag-open");
      if (cursor) cursor.classList.remove("is-on");
      if (!paused) {
        paused = true;
        bagPausedRun = true;
        runway.classList.add("is-paused");
      }
    } else {
      bagPanel.hidden = true;
      if (game) game.classList.remove("is-bag");
      document.body.classList.remove("is-bag-open");
      if (bagPausedRun) {
        bagPausedRun = false;
        if (paused && running && !gameOver && !inShop) {
          paused = false;
          runway.classList.remove("is-paused");
          stageClock = performance.now();
        }
      }
    }
  }

  function toggleBag() {
    if (!running || inShop || gameOver) return;
    setBagOpen(bagPanel && bagPanel.hidden);
  }

  function openShop(nextStage) {
    inShop = true;
    enableShopFonts();
    applyOverlayBg(shopEl);
    stageBusy = true;
    pendingNextStage = nextStage;
    shopFocus = -1;
    shopRefreshN = 0;
    shopRefreshCost = shopRefreshPrice();
    rollShopOffer();
    preloadShopIcons();
    setBagOpen(false);
    if (shopEl) {
      shopEl.classList.toggle("is-catalog", previewCatalogFromUrl());
      shopEl.hidden = false;
      shopEl.removeAttribute("hidden");
    }
    if (stageTimerEl) stageTimerEl.hidden = true;
    if (bagBtn) bagBtn.hidden = true;
    if (shopNextBtn) shopNextBtn.innerHTML = `进入第 <span class="shop__next-n">${nextStage}</span> 关`;
    game.classList.add("is-shop");
    cursor.classList.remove("is-on");
    syncShopUi();
    showToast("宝阁商店开张", 1000);
  }

  function closeShopAndContinue() {
    if (!inShop) return;
    const next = pendingNextStage;
    inShop = false;
    if (shopEl) shopEl.hidden = true;
    game.classList.remove("is-shop");
    setBagOpen(false);
    if (bagBtn) bagBtn.hidden = false;
    showToast(`第 ${next} 关 · 开始！`, 1200);
    beginStage(next, false);
    syncBagBtn();
    pulseBagBtn();
  }

  function selectShopItem(index) {
    if (!inShop || index < 0 || index >= shopSlots.length) return;
    if (!shopSlots[index].dataset.item) return;
    const changed = shopFocus !== index;
    shopFocus = index;
    syncShopUi();
    if (changed) sfxShopClick();
  }

  function nextFilledShopSlot(from, dir) {
    const n = shopSlots.length;
    const start = from < 0 ? (dir > 0 ? -1 : 0) : from;
    for (let k = 1; k <= n; k++) {
      const i = ((start + dir * k) % n + n) % n;
      if (shopSlots[i].dataset.item) return i;
    }
    return -1;
  }

  function buySelectedShopItem() {
    if (!inShop || shopFocus < 0) {
      showToast("请先选择商品", 900);
      return false;
    }
    const id = shopSlots[shopFocus] && shopSlots[shopFocus].dataset.item;
    return buyShopItem(id);
  }

  function buyShopItem(id) {
    const item = SHOP_CATALOG[id];
    if (!item || !inShop) return false;
    if (shopItemAtCap(id)) {
      showToast("已达持有上限", 900);
      syncShopUi();
      return false;
    }
    const price = shopItemPrice(item);
    if (coinCount < price) {
      showToast("金币不足", 900);
      syncShopUi();
      return false;
    }
    coinCount -= price;
    drawCoinCount(formatCoins(coinCount));
    const hpBefore = heroMaxHp();
    shopBought[id] = (shopBought[id] || 0) + 1;
    item.apply();
    const hpAfter = heroMaxHp();
    if (hpAfter > hpBefore) {
      hero.hp = Math.min(hpAfter, hero.hp + (hpAfter - hpBefore));
    }
    const slot = shopFocus >= 0 ? shopFocus : shopOffer.indexOf(id);
    if (slot >= 0) shopOffer[slot] = "";
    shopFocus = -1;
    paintShopOffer();
    refreshHeroVitals();
    sfxBuy();
    showToast(`购得${item.name}`, 1000);
    syncWeaponVisual();
    syncShopUi();
    syncBagBtn();
    if (bagPanel && !bagPanel.hidden) renderBagPanel();
    return true;
  }

  function stageDuration(n) {
    return stageMobStats(n).time;
  }

  function stageMobStats(n) {
    const s = Math.max(1, n | 0);
    if (STAGE_MOB[s]) return STAGE_MOB[s];
    const extra = s - 12;
    const hp = Math.round(430 * Math.pow(1.12, extra));
    const atk = 19 + extra * 2;
    const count = 54 + extra * 4;
    const zhu = Math.round(count * 0.5);
    return { hp, atk, tianbing: count - zhu, zhu, count, time: 90 };
  }

  function stageHasGou(n) {
    return (n | 0) >= GOU_STAGE_FROM && (n | 0) % 5 === 0;
  }

  function gouHpMul(n) {
    return (n | 0) >= 10 ? 3 : 2.5;
  }

  function waveEliteCount(n) {
    if ((n | 0) >= 13) return 2;
    if ((n | 0) >= 8) return 1;
    return 0;
  }

  function bossHpForStage(n) {
    return stageMobStats(n).hp;
  }

  function bossAtkForStage(n) {
    return stageMobStats(n).atk;
  }

  /** 单波刷怪数量（不超过本关剩余配额） */
  function waveSizeForStage(n) {
    const total = stageMobStats(n).count;
    return Math.min(10, Math.max(4, Math.ceil(total / 4)));
  }

  function livingEnemyCount() {
    let n = 0;
    for (let i = 0; i < enemies.length; i++) {
      if (!enemies[i].dead) n += 1;
    }
    return n;
  }

  function clearEnemies() {
    while (enemies.length) {
      const e = enemies.pop();
      if (e.el && e.el.isConnected) e.el.remove();
    }
    renderGouHud(null);
  }

  let hudStageKey = "";
  function updateStageHud() {
    const label = TEST_ACTIONS ? "测试" : `第 ${stage} 关`;
    const time = TEST_ACTIONS ? "∞" : String(Math.max(0, Math.ceil(stageTimeLeft)));
    const urgent = !TEST_ACTIONS && stageTimeLeft <= 5 && stageTimeLeft > 0;
    const key = `${label}|${time}|${urgent ? 1 : 0}`;
    if (key === hudStageKey) return;
    hudStageKey = key;
    if (stageLabelEl) stageLabelEl.textContent = label;
    if (stageTimeEl) stageTimeEl.textContent = time;
    if (stageTimerEl) stageTimerEl.classList.toggle("is-urgent", urgent);
  }

  function enemyCoinValue() {
    return 1;
  }

  function killDropGold(boss) {
    if (boss && boss.kind === "gou") return KILL_GOLD_GOU;
    if (boss && boss.kind === "zhu") return KILL_GOLD_ZHU;
    let n = KILL_GOLD_TIANBING;
    if (hasZijinHulu()) n = 1;
    if (boss && boss.elite) n *= 2;
    return n;
  }

  function dropCoinsFromBoss(boss) {
    const drops = killDropGold(boss);
    killGoldThisStage += drops;
    for (let i = 0; i < drops; i++) {
      const ox = (Math.random() - 0.5) * 56;
      const oy = 36 + Math.random() * 48;
      addCoin(boss.x + ox, Math.max(18, boss.y + oy), true, 1);
    }
  }

  function spawnWave(count) {
    const plats = platforms.filter((p) => p.w >= 120);
    const left = Math.max(0, stageEnemyTotal - stageSpawned);
    count = Math.min(count | 0, left);
    if (!plats.length || count <= 0) return;
    for (let i = 0; i < count; i++) {
      const plat = plats[i % plats.length];
      const span = Math.max(24, plat.w - 100);
      let x = plat.x + 50 + ((i / Math.max(1, count)) + Math.random() * 0.18) * span;
      x = Math.min(arenaMaxX(), Math.max(arenaMinX(), x));
      if (Math.abs(x - hero.x) < 90) {
        x = Math.min(arenaMaxX(), Math.max(arenaMinX(), hero.x + (i % 2 === 0 ? 140 : -140)));
      }
      const elite = i >= count - waveEliteCount(stage);
      addBoss(x, plat.h, null, elite);
      stageSpawned += 1;
    }
    waveCooldown = 55 + ((Math.random() * 35) | 0);
  }

  function beginStage(n, resetCoins) {
    stage = Math.max(1, n | 0);
    stageBusy = false;
    inShop = false;
    if (shopEl) shopEl.hidden = true;
    clearEnemies();
    if (resetCoins) {
      coinCount = 0;
      drawCoinCount(formatCoins(0));
      resetRunBuffs();
      grantStartingLoadout();
    }
    const mob = stageMobStats(stage);
    if ((mob.zhu | 0) > 0) ensureZhuArt();
    if (stageHasGou(stage) || previewGouFromUrl()) ensureGouArt();
    const bag = armQiankundaiForStage(TEST_ACTIONS ? 0 : mob.count);
    stageEnemyTotal = TEST_ACTIONS ? 0 : bag.count;
    stageSpawned = 0;
    stageGouSpawned = false;
    killGoldThisStage = 0;
    stageTimeLeft = TEST_ACTIONS ? Infinity : stageDuration(stage);
    stageClock = performance.now();
    armRoadCoins(stage);
    waveCooldown = 20;
    if (stageTimerEl) stageTimerEl.hidden = false;
    if (bagBtn) bagBtn.hidden = false;
    setBagOpen(false);
    syncBagBtn();
    updateStageHud();
    rebuildArenaForStage();
    resetHeroOnTrack();
    if (window.SwordCamera) SwordCamera.reset(hero.x, hero.y, viewWidth());
    if (!TEST_ACTIONS) {
      if (previewGouFromUrl()) {
        stageSpawned = stageEnemyTotal;
        spawnGouMiniBoss();
      } else {
        spawnWave(waveSizeForStage(stage));
      }
    }
    const dogOn = armXiaotianForStage();
    let stageMsg = TEST_ACTIONS
      ? "动作测试 · 无倒计时 · 无天兵"
      : (() => {
          const kinds = plannedKindCounts(stageEnemyTotal, stage);
          return kinds.zhu > 0
            ? `第 ${stage} 关 · 天兵×${kinds.tianbing} · 猪×${kinds.zhu}`
            : `第 ${stage} 关 · 天兵×${stageEnemyTotal}`;
        })();
    if (!TEST_ACTIONS && stageHasGou(stage)) stageMsg += " · 清场后恶犬";
    if (dogOn) stageMsg += " · 哮天犬撕咬-50";
    if (hasTianma()) stageMsg += " · 突刺加长并无敌";
    if (bag.on) stageMsg += " · 乾坤袋少两成天兵";
    if ((shopBought.caishenye | 0) > 0) {
      const pct = Math.round((Math.pow(1.1, shopBought.caishenye | 0) - 1) * 100);
      if (pct > 0) stageMsg += ` · 击杀金币+${pct}%`;
    }
    if (!resetCoins && ownedRelicCount() > 0) stageMsg += " · 点锦囊查看法宝";
    showToast(stageMsg, 1400);
  }

  function rebuildArenaForStage() {
    for (let i = 0; i < platforms.length; i++) {
      const el = platforms[i] && platforms[i].el;
      if (el && el.isConnected) el.remove();
    }
    for (let i = 0; i < coins.length; i++) {
      const el = coins[i] && coins[i].el;
      if (el && el.isConnected) el.remove();
    }
    platforms.length = 0;
    coins.length = 0;
    nextX = 0;
    lastGapAt = -9999;
    lastBossAt = -9999;
    flatStreak = 0;
    seedTerrain(stage);
    const startH = TEST_ACTIONS || FLAT_ARENA ? HEIGHTS[2] : stageStartHeight(stage);
    const start = addPlatform(0, 3, startH);
    advanceNextX(start);
    buildArena();
  }

  function updateStageSystem() {
    if (!running || paused || hero.dead || stageBusy || inShop || gameOver) return;
    if (TEST_ACTIONS) {
      updateStageHud();
      return;
    }
    const now = performance.now();
    if (!stageClock) stageClock = now;
    const dt = Math.min(0.05, (now - stageClock) / 1000);
    stageClock = now;
    stageTimeLeft -= dt;
    tickRoadCoins(dt);

    if (stageTimeLeft <= 0) {
      stageTimeLeft = 0;
      finishStage("time");
      return;
    }

    if (stageEnemyTotal > 0 && stageSpawned >= stageEnemyTotal && livingEnemyCount() <= 0) {
      if (stageHasGou(stage) && !stageGouSpawned) {
        spawnGouMiniBoss();
        return;
      }
      finishStage("wipe");
      return;
    }

    updateStageHud();
    if (waveCooldown > 0) waveCooldown -= 1;
    else if (stageSpawned < stageEnemyTotal && livingEnemyCount() < Math.ceil(waveSizeForStage(stage) * 0.5)) {
      spawnWave(waveSizeForStage(stage));
    }
  }

  function finishStage(reason) {
    if (stageBusy || inShop || gameOver) return;
    stageBusy = true;
    updateStageHud();
    resolveXiaotianTrial();
    settleStageRewards();
    if (reason === "time") {
      clearEnemies();
      showToast("时间到 · 进入宝阁商店", 1100);
    } else {
      showToast(stageGouSpawned ? "恶犬已除 · 进入宝阁商店" : "天兵肃清 · 进入宝阁商店", 1100);
    }
    sfxStageClear();
    sweepCoinsToHud(() => {
      if (gameOver || inShop) return;
      openShop(stage + 1);
    });
  }

  function leftoverCoins() {
    return coins.filter((c) => c && !c.got && !c.hudFly && c.el && c.el.isConnected);
  }

  function flushHudCbs(c) {
    const cbs = c && c._hudCbs;
    if (!c) return;
    c._hudCbs = null;
    if (cbs) {
      for (let i = 0; i < cbs.length; i++) cbs[i]();
    }
  }

  function settleStageRewards() {
    const stacks = shopBought.caishenye | 0;
    if (stacks > 0 && killGoldThisStage > 0) {
      const extra = Math.round(killGoldThisStage * (caishenGoldMul() - 1));
      if (extra > 0) gainCoins(extra);
    }
    const uncle = shopBought.caoguojiu | 0;
    if (uncle > 0) {
      const cap = 15 + 2 * stage;
      const flat = 4 * uncle;
      const rate = Math.min(0.1, 0.02 * uncle);
      const interest = Math.round(coinCount * rate);
      const gain = Math.min(cap, flat + interest);
      if (gain > 0) gainCoins(gain);
    }
    const max = heroMaxHp();
    const heal = Math.ceil(max * STAGE_CLEAR_HEAL);
    if (heal > 0 && hero.hp < max) {
      hero.hp = Math.min(max, hero.hp + heal);
      renderHp();
    }
  }

  function caishenGoldMul() {
    const stacks = shopBought.caishenye | 0;
    if (stacks <= 0) return 1;
    return Math.pow(1.1, stacks);
  }

  function gainCoins(amount) {
    const n = Math.max(0, Number(amount) || 0);
    if (n <= 0) return 0;
    coinCount += n;
    drawCoinCount(formatCoins(coinCount));
    return n;
  }

  function creditCoin(c) {
    if (!c || c.got) return;
    c.got = true;
    c.hudFly = false;
    gainCoins(c.value || 1);
    sfxCoin();
    if (c.el && c.el.isConnected) c.el.remove();
    flushHudCbs(c);
  }

  function flyCoinToHud(c, delayMs, onDone) {
    if (!c) {
      if (onDone) onDone();
      return;
    }
    if (onDone) {
      if (!c._hudCbs) c._hudCbs = [];
      c._hudCbs.push(onDone);
    }
    if (c.got) {
      flushHudCbs(c);
      return;
    }
    if (c.hudFly) return;
    const el = c.el;
    if (!el || !el.isConnected) {
      creditCoin(c);
      return;
    }
    const hud = document.querySelector(".hud .coin-icon") || document.getElementById("coin-count");
    const host = game || document.body;
    const r = el.getBoundingClientRect();
    c.magnet = false;
    c.hudFly = true;
    el.classList.remove("is-got");
    el.classList.add("is-hud-fly");
    el.style.transition = "none";
    el.style.left = `${r.left + r.width * 0.5}px`;
    el.style.top = `${r.top + r.height * 0.5}px`;
    el.style.transform = "translate(-50%, -50%) scale(1)";
    host.appendChild(el);

    const start = () => {
      if (!el.isConnected || c.got) {
        flushHudCbs(c);
        return;
      }
      const hr = hud ? hud.getBoundingClientRect() : { left: 36, top: 28, width: 72, height: 72 };
      const dur = 520 + Math.min(180, (delayMs || 0) * 0.35);
      el.style.transition = `left ${dur}ms cubic-bezier(.18,.86,.22,1), top ${dur}ms cubic-bezier(.18,.86,.22,1), transform ${dur}ms ease`;
      el.style.left = `${hr.left + hr.width * 0.42}px`;
      el.style.top = `${hr.top + hr.height * 0.5}px`;
      el.style.transform = "translate(-50%, -50%) scale(0.28)";
      const finish = () => {
        if (c.got) {
          flushHudCbs(c);
          return;
        }
        creditCoin(c);
      };
      el.addEventListener("transitionend", finish, { once: true });
      setTimeout(finish, dur + 90);
    };
    setTimeout(start, Math.max(0, delayMs || 0));
  }

  function sweepCoinsToHud(done) {
    const leftover = leftoverCoins();
    const flying = coins.filter((c) => c && !c.got && c.hudFly);
    const total = leftover.length + flying.length;
    if (!total) {
      setTimeout(done, 450);
      return;
    }
    let left = total;
    let finished = false;
    const one = () => {
      if (finished) return;
      left -= 1;
      if (left > 0) return;
      finished = true;
      hudSweep = null;
      done();
    };
    hudSweep = { left, done, startedAt: performance.now() };
    leftover.forEach((c, i) => flyCoinToHud(c, 20 + i * 26, one));
    flying.forEach((c) => flyCoinToHud(c, 0, one));
    setTimeout(() => {
      if (finished) return;
      leftover.concat(flying).forEach((c) => creditCoin(c));
      finished = true;
      hudSweep = null;
      done();
    }, 1700);
  }

  function clearTrack() {
    platforms.length = 0;
    coins.length = 0;
    enemies.length = 0;
    surfaceMap = null;
    trackWorld.innerHTML = "";
    nextX = 0;
    lastGapAt = -9999;
    lastBossAt = -9999;
    flatStreak = 0;
    runScroll.world = 0;
    viewFx.x = 0;
    viewFx.y = 0;
    trackWorld.style.transform = "translate3d(0,0,0)";
    runner.style.transform = "";
    [runBackArt, runMidArt, runFrontArt].forEach((el) => {
      if (el) el.style.transform = "translate3d(0,0,0)";
    });
  }

  function addPlatform(x, unitCount, h) {
    const units = Math.max(1, unitCount | 0);
    /* 步进 = 整宽 - 侧面重叠，下一块叠在上一块侧面之上 */
    const totalW = FLOOR_UNIT_W + Math.max(0, units - 1) * FLOOR_STEP;
    const surfaceH = h - SURFACE_NUDGE;
    const el = document.createElement("div");
    el.className = "plat";
    el.style.setProperty("--floor-unit-w", `${FLOOR_UNIT_W}px`);
    el.style.left = `${x}px`;
    el.style.width = `${totalW}px`;
    el.style.height = `${FLOOR_UNIT_H}px`;
    /* 贴图按实体顶对齐；碰撞面再低 60px 到跑道中线 */
    el.style.bottom = `${h - FLOOR_UNIT_H + floorTopPad}px`;
    /* 右边永远盖住左边（只按 x，不按高度） */
    el.style.zIndex = String(10 + Math.floor(x));

    const row = document.createElement("div");
    row.className = "plat__row";
    for (let i = 0; i < units; i++) {
      const tile = document.createElement("img");
      tile.className = "plat__tile";
      tile.src = floorImgUrl;
      tile.alt = "";
      tile.decoding = "async";
      tile.draggable = false;
      tile.style.left = `${i * FLOOR_STEP}px`;
      /* 段内同样：右侧单元压左侧 */
      tile.style.zIndex = String(i + 1);
      row.appendChild(tile);
    }
    el.appendChild(row);
    trackWorld.appendChild(el);
    const plat = { x, w: totalW, h: surfaceH, visualH: h, units, el };
    platforms.push(plat);
    return plat;
  }

  /** 下一段与上一段侧面重叠衔接（非整段并排） */
  function advanceNextX(plat) {
    nextX = plat.x + plat.units * FLOOR_STEP;
  }

  function addCoin(x, y, magnet, value, extra) {
    const el = document.createElement("img");
    el.className = "pickup-coin";
    el.src = coinImgUrl;
    el.alt = "";
    el.draggable = false;
    const ix = (x + 0.5) | 0;
    const iy = (y + 0.5) | 0;
    el.style.transform = `translate3d(${ix}px, ${-iy}px, 0)`;
    trackWorld.appendChild(el);
    coins.push({
      x,
      y,
      el,
      got: false,
      magnet: !!magnet,
      value: Math.max(1, value | 0),
      road: !!(extra && extra.road),
      expireLeft: extra && extra.ttl != null ? extra.ttl : 0,
    });
  }

  function spawnCoinsOnPlat() {
    return;
  }

  function roadCoinPlan(n) {
    if (ROAD_COIN_PLAN[n]) return ROAD_COIN_PLAN[n];
    const extra = Math.max(0, (n | 0) - 12);
    const total = Math.min(32, 20 + 2 * extra);
    const clusters = Math.ceil(total / 4);
    const dur = stageMobStats(n).time;
    const windows = [];
    for (let i = 0; i < clusters; i++) {
      const a = 8 + Math.floor(((dur - 16) * i) / Math.max(1, clusters));
      windows.push([a, Math.min(dur - 2, a + 12)]);
    }
    return { total, clusters, size: 4, windows, ttl: 14 };
  }

  function armRoadCoins(n) {
    roadCoinQueue = [];
    if (TEST_ACTIONS) return;
    const plan = roadCoinPlan(n);
    const nCl = plan.clusters;
    for (let i = 0; i < nCl; i++) {
      const win = plan.windows[i % plan.windows.length];
      const span = Math.max(0.1, win[1] - win[0]);
      const at = win[0] + Math.random() * span;
      roadCoinQueue.push({ at, size: plan.size, ttl: plan.ttl, done: false });
    }
  }

  function spawnRoadCoinCluster(size, ttl) {
    const body = 80;
    const ahead = (1.5 + Math.random() * 3.5) * body;
    const dir = hero.facing || 1;
    const baseX = Math.min(arenaMaxX() - 24, Math.max(arenaMinX() + 24, hero.x + dir * ahead));
    const g = surfaceAt(baseX);
    const y = (g != null ? g : hero.y) + 22;
    for (let i = 0; i < size; i++) {
      const x = baseX + (i - (size - 1) / 2) * 28;
      addCoin(x, y, false, 1, { road: true, ttl });
    }
  }

  function tickRoadCoins(dt) {
    const elapsed = stageDuration(stage) - stageTimeLeft;
    for (let i = 0; i < roadCoinQueue.length; i++) {
      const c = roadCoinQueue[i];
      if (c.done || elapsed < c.at) continue;
      c.done = true;
      spawnRoadCoinCluster(c.size, c.ttl);
    }
    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      if (!coin || !coin.road || coin.got || coin.hudFly) continue;
      coin.expireLeft -= dt;
      if (coin.expireLeft <= 0) {
        coin.got = true;
        if (coin.el && coin.el.isConnected) coin.el.remove();
      } else if (coin.expireLeft <= 2 && coin.el) {
        coin.el.classList.add("is-blink");
      }
    }
  }

  function syncBossEl(boss) {
    const x = (boss.x + 0.5) | 0;
    const y = (boss.y + 0.5) | 0;
    if (boss._sx !== x || boss._sy !== y) {
      boss._sx = x;
      boss._sy = y;
      boss.el.style.transform = `translate3d(${x}px, ${-y}px, 0)`;
    }
    const faceLeft = boss.facing < 0;
    if (boss._faceLeft !== faceLeft) {
      boss._faceLeft = faceLeft;
      boss.el.classList.toggle("is-facing-left", faceLeft);
    }
    const hurt = boss.hurtFrames > 0 && boss.kind !== "gou";
    if (boss._hurt !== hurt) {
      boss._hurt = hurt;
      boss.el.classList.toggle("is-hurt", hurt);
    }
    const air = !boss.onGround;
    if (boss._air !== air) {
      boss._air = air;
      boss.el.classList.toggle("is-air", air);
    }
  }

  function enemyHalfW(e) {
    if (e && e.kind === "gou") return 36;
    return Math.max(24, (e && e.w ? e.w : 135) * 0.28);
  }

  function bossClimbReach(e) {
    return Math.ceil(enemyHalfW(e) + 48);
  }

  function tryBossJump(boss) {
    if (boss.dead || boss.jumpsLeft <= 0 || (boss.jumpCd || 0) > 0) return false;
    boss.vy = JUMP_V;
    boss.jumpsLeft -= 1;
    boss.onGround = false;
    boss.jumpCd = BOSS_JUMP_COOLDOWN;
    return true;
  }

  /** 前方是否空洞（含脚边） */
  function bossGapDist(e, facing) {
    const half = enemyHalfW(e);
    const reach = Math.max(64, Math.ceil(half + 24));
    for (let d = 2; d <= reach; d += 2) {
      if (surfaceAt(e.x + facing * (half * 0.35 + d)) == null) return d;
    }
    return 0;
  }

  function bossGapWidth(e, facing) {
    const start = bossGapDist(e, facing);
    if (start <= 0) return 0;
    const half = enemyHalfW(e);
    let w = 0;
    for (let d = start; d <= 240; d += 4) {
      if (surfaceAt(e.x + facing * (half * 0.35 + d)) != null) return w;
      w += 4;
    }
    return w;
  }

  const BOSS_FACE_TURN_MS = 400;

  function setBossFacing(e, dir, force) {
    if (!e || !dir) return e && e.facing;
    const want = dir < 0 ? -1 : 1;
    if (e.facing === want) return e.facing;
    const now = performance.now();
    if (!force && e.faceTurnAt && now - e.faceTurnAt < BOSS_FACE_TURN_MS) {
      return e.facing;
    }
    e.facing = want;
    e.faceTurnAt = now;
    return e.facing;
  }

  function tryBossLeapToward(e, dir) {
    const width = bossGapWidth(e, dir);
    if (e && e.kind !== "gou" && (width <= 0 || width > maxSafeGap() * 0.92)) return false;
    setBossFacing(e, dir, true);
    if (!tryBossJump(e) && e.jumpsLeft <= 0) return false;
    e.vx = dir * BOSS_CHASE * (e.kind === "gou" ? 1.35 : 1.15);
    const land = width > 0 ? e.x + dir * (width + 40) : e.x + dir * 72;
    if (e.kind === "gou") {
      e.targetX = land;
      e.gapCrossDir = dir < 0 ? -1 : 1;
      e.gapLock = 40;
    } else {
      e.targetX = hero.x;
      e.gapLock = 0;
    }
    return true;
  }

  function nearestSolidX(x) {
    let best = x;
    let bestD = Infinity;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const cx = Math.min(p.x + p.w - 12, Math.max(p.x + 12, x));
      const d = Math.abs(cx - x);
      if (d < bestD) {
        bestD = d;
        best = cx;
      }
    }
    return best;
  }

  function keepGouOnFloor(e) {
    if (!e || e.kind !== "gou" || e.dead) return;
    if (e.y >= -80) return;
    e.x = nearestSolidX(e.x);
    const s = surfaceAt(e.x);
    if (s == null) return;
    e.y = s + ENEMY_Y_NUDGE;
    e.vy = 0;
    e.vx = 0;
    e.onGround = true;
  }

  function gouVoidAhead(e, dir, maxD) {
    for (let d = 2; d <= maxD; d += 2) {
      if (surfaceAt(e.x + dir * d) == null) return true;
    }
    return false;
  }

  function gouRiseAhead(e, dir) {
    const mapped = surfaceAt(e.x);
    if (mapped == null && !e.onGround) return 0;
    /* 重叠段 surfaceMap 仍是矮台，贴地时以脚底为准，避免站上高台还当有坎 */
    const here = e.onGround ? Math.max(e.y - 2, mapped == null ? e.y : mapped) : mapped;
    if (here == null) return 0;
    let rise = 0;
    const look = 160;
    const half = enemyHalfW(e);
    const bodyL = e.x - half;
    const bodyR = e.x + half;
    for (let d = 4; d <= look; d += 4) {
      const h = surfaceAt(e.x + dir * d);
      if (h == null) continue;
      if (h > here + MAX_WALK_STEP) rise = Math.max(rise, h - here);
    }
    /* 拼接重叠时 surfaceMap 仍是矮台，要用更高台的立面来认坎 */
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.h <= here + MAX_WALK_STEP) continue;
      if (bodyR > p.x && bodyL < p.x + p.w) {
        rise = Math.max(rise, p.h - here);
        continue;
      }
      if (dir > 0) {
        if (p.x >= e.x - 6 && p.x <= e.x + look) rise = Math.max(rise, p.h - here);
      } else if (p.x + p.w <= e.x + 6 && p.x + p.w >= e.x - look) {
        rise = Math.max(rise, p.h - here);
      }
    }
    return rise;
  }

  function gouShouldLeap(e, dir) {
    const here = surfaceAt(e.x);
    if (here == null) return false;
    let voidAt = 0;
    for (let d = 2; d <= 120; d += 2) {
      const h = surfaceAt(e.x + dir * d);
      if (h == null) {
        if (!voidAt) voidAt = d;
        continue;
      }
      if (voidAt) return voidAt <= 36;
      if (h < here - MAX_WALK_STEP) return d <= 36;
      if (h > here + MAX_WALK_STEP) return false;
      if (d >= 24) break;
    }
    return voidAt > 0 && voidAt <= 36;
  }

  function gouNextStep(e, dir, look) {
    const half = enemyHalfW(e);
    const bodyL = e.x - half;
    const bodyR = e.x + half;
    let best = null;
    let bestDist = Infinity;
    const d = dir < 0 ? -1 : 1;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const overlap = bodyR > p.x && bodyL < p.x + p.w;
      const ahead =
        d > 0
          ? p.x <= e.x + look && p.x + p.w >= e.x - 90
          : p.x + p.w >= e.x - look && p.x <= e.x + 90;
      if (!overlap && !ahead) continue;
      if (p.h <= e.y + 2) continue;
      const land =
        d > 0
          ? Math.min(p.x + Math.min(48, p.w * 0.4), p.x + p.w - 10)
          : Math.max(p.x + p.w - Math.min(48, p.w * 0.4), p.x + 10);
      const dist = Math.abs(land - e.x);
      if (best == null || p.h < best.h - 0.5 || (Math.abs(p.h - best.h) <= 0.5 && dist < bestDist)) {
        best = { h: p.h, x: land };
        bestDist = dist;
      }
    }
    return best;
  }

  function gouAirPeakY(e) {
    if (!e) return 0;
    if (e.vy <= 0) return e.y;
    return e.y + (e.vy * e.vy) / (2 * GRAVITY);
  }

  function gouSteerToX(e, destX) {
    const lock = e.gapCrossDir || 0;
    const dead = 12;
    let to = lock || e.facing || 1;
    if (destX > e.x + dead) to = 1;
    else if (destX < e.x - dead) to = -1;
    if (lock && !e.onGround) to = lock;
    setBossFacing(e, to);
    const dist = Math.abs(destX - e.x);
    e.vx = to * Math.min(BOSS_CHASE * 1.55, Math.max(2.4, dist / 20));
    return to;
  }

  function gouLandAheadX(e, dir) {
    const d = dir < 0 ? -1 : 1;
    let best = null;
    let bestD = Infinity;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const cx =
        d > 0
          ? Math.min(p.x + Math.min(40, p.w * 0.35), p.x + p.w - 10)
          : Math.max(p.x + p.w - Math.min(40, p.w * 0.35), p.x + 10);
      if (d > 0 && cx < e.x - 16) continue;
      if (d < 0 && cx > e.x + 16) continue;
      const dist = Math.abs(cx - e.x);
      if (dist < bestD) {
        bestD = dist;
        best = cx;
      }
    }
    return best != null ? best : nearestSolidX(e.x);
  }

  const GOU_AIR_CATCH_MAX = 2;

  function tryGouAirCatch(e, dir) {
    if (!e || e.kind !== "gou" || e.dead || e.onGround) return false;
    const used = e.airCatchUsed | 0;
    if (used >= GOU_AIR_CATCH_MAX) return false;
    if (e.atkPhase === "thrust") return false;
    const falling = e.vy <= 1.4;
    const under = surfaceAt(e.x);
    const travel = e.gapCrossDir || dir;
    const step = gouNextStep(e, travel, 260);
    const overVoid = under == null;
    const peak = gouAirPeakY(e);
    const belowStep = step != null && peak < step.h - 2;
    /* 跨缝只平移落地，不为脚下空洞再叠高跳，否则会在缝上悬停甩头 */
    if (overVoid && !belowStep) return false;
    if (!overVoid && step != null && under >= step.h - MAX_WALK_STEP) return false;
    if (!belowStep) return false;
    if (used > 0 && !falling) return false;
    e.jumpsLeft = Math.max(1, e.jumpsLeft | 0);
    e.jumpCd = 0;
    if (!tryBossJump(e)) return false;
    e.airCatchUsed = used + 1;
    const sameWay = !e.gapCrossDir || (step.x - e.x) * e.gapCrossDir >= 0;
    const dest = sameWay ? step.x : e.targetX != null ? e.targetX : gouLandAheadX(e, travel);
    e.targetX = dest;
    if (!e.gapCrossDir) e.gapCrossDir = dest >= e.x ? 1 : -1;
    gouSteerToX(e, dest);
    return true;
  }

  function gouNearStepFace(e, dir) {
    if (!e || !e.onGround) return false;
    const d = dir < 0 ? -1 : 1;
    if (gouRiseAhead(e, d) > 0) return true;
    const mapped = surfaceAt(e.x);
    const here = Math.max(e.y - 2, mapped == null ? e.y : mapped);
    if (here == null) return false;
    const half = enemyHalfW(e);
    const bodyL = e.x - half;
    const bodyR = e.x + half;
    const look = 56;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.h <= here + MAX_WALK_STEP) continue;
      if (bodyR > p.x && bodyL < p.x + p.w) return true;
      if (d > 0 && p.x >= e.x - 8 && p.x <= e.x + look) return true;
      if (d < 0 && p.x + p.w <= e.x + 8 && p.x + p.w >= e.x - look) return true;
    }
    return false;
  }

  function gouProbeRiseAt(e, px, py, dir) {
    const savedX = e.x;
    const savedY = e.y;
    const savedG = e.onGround;
    e.x = px;
    e.y = py;
    e.onGround = true;
    const rise = gouRiseAhead(e, dir);
    e.x = savedX;
    e.y = savedY;
    e.onGround = savedG;
    return rise;
  }

  function gouFlatLandX(e, dir) {
    const look = 560;
    const minDist = 180;
    let fallback = e.x + dir * 80;
    for (let d = 24; d <= look; d += 12) {
      const px = e.x + dir * d;
      const sh = surfaceAt(px);
      if (sh == null) continue;
      fallback = px;
      if (d < minDist) continue;
      if (gouProbeRiseAt(e, px, sh, dir) > 0) continue;
      let flat = true;
      for (let extra = 24; extra <= 96; extra += 24) {
        const qx = px + dir * extra;
        const qh = surfaceAt(qx);
        if (qh == null || gouProbeRiseAt(e, qx, qh, dir) > 0) {
          flat = false;
          break;
        }
      }
      if (flat) return px + dir * 24;
    }
    if (surfaceAt(fallback) == null) fallback = nearestSolidX(e.x + dir * 48);
    return fallback;
  }

  const GOU_STAIR_HOPS = 2;

  function tryGouClimbOrLeap(e, dir) {
    if (!e || !e.onGround) return false;
    if (!gouNearStepFace(e, dir)) {
      e.stairHops = 0;
      e.stairLeap = false;
      return false;
    }
    const heroClose = gouCanPlantForAttack(e) || Math.abs(hero.x - e.x) < GOU_ENGAGE_GAP;
    if (heroClose) e.stairHops = Math.max(e.stairHops | 0, GOU_STAIR_HOPS);
    const hops = e.stairHops | 0;
    if (hops >= GOU_STAIR_HOPS) {
      const step = gouNextStep(e, dir, 220);
      let dest = gouFlatLandX(e, dir);
      if (surfaceAt(dest) == null && step) dest = step.x;
      if (surfaceAt(dest) == null) dest = nearestSolidX(e.x + dir * 64);
      setBossFacing(e, dir, true);
      if (!e.stairLeap) e.jumpCd = 0;
      e.stairLeap = true;
      e.targetX = dest;
      e.gapCrossDir = dir < 0 ? -1 : 1;
      gouSteerToX(e, dest);
      if ((e.jumpCd || 0) > 0) return true;
      e.jumpsLeft = Math.max(1, e.jumpsLeft | 0);
      if (!tryBossJump(e)) return true;
      gouSteerToX(e, dest);
      e.vx = dir * Math.min(BOSS_CHASE * 2.1, Math.max(Math.abs(e.vx), Math.abs(dest - e.x) / 22));
      return true;
    }
    const step = gouNextStep(e, dir, 200);
    const hopX = step ? step.x : e.x + dir * 56;
    if (!tryBossJump(e)) {
      gouSteerToX(e, hopX);
      return true;
    }
    e.stairHops = hops + 1;
    gouSteerToX(e, hopX);
    e.targetX = hopX;
    e.gapCrossDir = dir < 0 ? -1 : 1;
    return true;
  }

  function gouSkipLedges(e) {
    return (
      e &&
      e.kind === "gou" &&
      (e.atkPhase === "thrust" || (!e.onGround && (e.stairLeap || (e.stairHops | 0) > 0)))
    );
  }

  function steerGou(e, chaseDir, aggro) {
    if (!aggro) {
      e.vx *= 0.82;
      if (Math.abs(e.vx) < 0.12) e.vx = 0;
      return;
    }
    const toward = chaseDir < 0 ? -1 : 1;
    const blocked = e.onGround && gouNearStepFace(e, toward);
    if (gouFacingHero(e) && gouNoseGapToHero(e) > GOU_SKIP_CHARGE_GAP) e._gouNeedCharge = true;
    /* 台阶没走完先落到平地，不在坎前对主角停步连跳 */
    if (e.onGround && gouCanPlantForAttack(e) && !blocked) {
      e.stairHops = 0;
      e.stairLeap = false;
      setBossFacing(e, toward, true);
      e.vx = 0;
      if (gouNoseGapToHero(e) > GOU_SKIP_CHARGE_GAP) e._gouPlantX = e.x;
      return;
    }
    if (!e.onGround) {
      if (tryGouAirCatch(e, toward)) return;
      if (surfaceAt(e.x) == null) {
        const dest =
          e.targetX != null ? e.targetX : gouLandAheadX(e, e.gapCrossDir || toward);
        gouSteerToX(e, dest);
        return;
      }
      if (e.stairLeap || (e.stairHops | 0) > 0 || (e.airCatchUsed | 0) > 0) {
        const dest = e.targetX != null ? e.targetX : gouLandAheadX(e, e.gapCrossDir || toward);
        gouSteerToX(e, dest);
      } else {
        setBossFacing(e, toward);
        e.vx = toward * Math.min(Math.abs(e.vx) || BOSS_CHASE, BOSS_CHASE);
      }
      return;
    }
    setBossFacing(e, toward);
    e.targetX = hero.x;
    e.vx = toward * BOSS_CHASE;
    if (!blocked && (e.gapLock || 0) <= 0 && gouShouldLeap(e, toward)) {
      tryBossLeapToward(e, toward);
      return;
    }
    if (tryGouClimbOrLeap(e, toward)) return;
  }

  /** 两点之间水平路径上是否有空洞 */
  function pathHasGapBetween(x0, x1) {
    const dir = x1 >= x0 ? 1 : -1;
    const span = Math.abs(x1 - x0);
    for (let d = 4; d <= span; d += 6) {
      if (surfaceAt(x0 + dir * d) == null) return true;
    }
    return false;
  }

  /** 碰到 gap：立刻掉头并退回实心地面，锁定朝向（优先于追击主角） */
  function turnBossFromGap(e, useChase) {
    setBossFacing(e, -(e.facing || 1), true);
    for (let i = 0; i < 12; i++) {
      const nx = e.x + e.facing * 8;
      if (surfaceAt(nx) == null) break;
      e.x = nx;
    }
    e.targetX = e.x + e.facing * 220;
    e.vx = e.facing * (useChase ? BOSS_CHASE : BOSS_MOVE);
    e.gapLock = 70;
    e.think = 50;
  }

  function pickBossTargetX(boss) {
    const pad = 50;
    const nearby = platforms.filter(
      (p) => Math.abs(p.x + p.w * 0.5 - boss.x) < 520 && p.w > 120
    );
    const pool = nearby.length ? nearby : platforms;
    if (!pool.length) return boss.x;
    const plat = pool[(Math.random() * pool.length) | 0];
    const lo = Math.max(arenaMinX(), plat.x + pad);
    const hi = Math.min(arenaMaxX(), plat.x + plat.w - pad);
    if (hi <= lo) return Math.min(arenaMaxX(), Math.max(arenaMinX(), plat.x + plat.w * 0.5));
    return lo + Math.random() * (hi - lo);
  }

  function zhuShareForStage(n) {
    const mob = stageMobStats(n);
    return mob.count > 0 ? mob.zhu / mob.count : 0;
  }

  function pickEnemyKind() {
    const share = zhuShareForStage(stage);
    if (share <= 0) return "tianbing";
    const i = stageSpawned;
    return Math.round((i + 1) * share) > Math.round(i * share) ? "zhu" : "tianbing";
  }

  function plannedKindCounts(total, n) {
    const all = Math.max(0, total | 0);
    const mob = stageMobStats(n);
    if (!mob.count) return { tianbing: 0, zhu: 0 };
    const zhu = Math.round(all * (mob.zhu / mob.count));
    return { tianbing: all - zhu, zhu };
  }

  function addBoss(x, groundY, forcedKind, elite) {
    const kind = forcedKind || pickEnemyKind();
    const isZhu = kind === "zhu";
    const isGou = kind === "gou";
    const y = isZhu ? groundY + ZHU_HOVER : groundY + ENEMY_Y_NUDGE;
    const mob = stageMobStats(stage);
    let maxHp = isGou ? Math.max(1, Math.round(mob.hp * gouHpMul(stage))) : mob.hp;
    if (isZhu) maxHp = Math.max(1, Math.round(mob.hp * ZHU_HP_MUL));
    let atk = isGou ? Math.round(mob.atk * 1.35) : mob.atk;
    const isElite = !!elite && !isGou && !isZhu;
    if (isElite) {
      maxHp = Math.max(1, Math.round(maxHp * 2));
      atk = Math.round(atk * 1.25);
    }
    const wrap = document.createElement("div");
    wrap.className = isGou ? "enemy boss is-gou" : isZhu ? "enemy boss is-zhu" : "enemy boss";
    if (isZhu) wrap.classList.add("is-hover");
    if (isElite) wrap.classList.add("is-elite");
    wrap.style.transform = `translate3d(${(x + 0.5) | 0}px, ${-((y + 0.5) | 0)}px, 0)`;
    wrap.style.zIndex = "8000";
    const img = document.createElement("img");
    img.className = "enemy__sprite";
    img.src = isGou ? GOU_SRC : isZhu ? ZHU_SRC : enemyImgUrl;
    img.alt = isGou ? "恶犬" : isZhu ? "猪" : "天兵";
    img.draggable = false;
    const weapon = document.createElement("img");
    weapon.className = "enemy-weapon";
    weapon.src = enemyWeaponUrl;
    weapon.alt = "";
    weapon.draggable = false;
    const arc = document.createElement("div");
    arc.className = "enemy-weapon-arc";
    arc.setAttribute("aria-hidden", "true");
    const hold = document.createElement("div");
    hold.className = "enemy-weapon-hold";
    hold.appendChild(weapon);
    hold.appendChild(arc);
    const body = document.createElement("div");
    body.className = "enemy__body";
    const flash = document.createElement("img");
    flash.className = "enemy__flash";
    flash.src = isGou ? GOU_FLASH_SRC : ENEMY_FLASH_SRC;
    flash.alt = "";
    flash.draggable = false;
    body.appendChild(img);
    body.appendChild(flash);
    body.appendChild(hold);
    const hpBar = document.createElement("div");
    hpBar.className = "boss-hp is-thicker";
    hpBar.innerHTML = "<i></i>";
    if (!isGou) wrap.appendChild(hpBar);
    wrap.appendChild(body);
    trackWorld.appendChild(wrap);
    const boss = {
      kind,
      x,
      y,
      vy: 0,
      vx: 0,
      facing: isGou ? (x >= hero.x ? -1 : 1) : isZhu ? 1 : Math.random() < 0.5 ? -1 : 1,
      faceTurnAt: 0,
      w: isGou ? 320 : isZhu ? 150 : 135,
      h: isGou ? 260 : isZhu ? 150 : 229,
      el: wrap,
      spriteEl: img,
      flashEl: flash,
      weaponEl: weapon,
      weaponHoldEl: hold,
      arcEl: arc,
      thrustAt: 0,
      atkPhase: "idle",
      atkPhaseAt: 0,
      atkHit: false,
      hpBar: isGou ? null : hpBar.querySelector("i"),
      dead: false,
      hp: maxHp,
      maxHp,
      atk,
      elite: isElite,
      hurtFrames: 0,
      flashLeft: 0,
      flashPlaying: false,
      think: 20 + ((Math.random() * 40) | 0),
      targetX: x,
      onGround: !isZhu,
      jumpsLeft: MAX_JUMPS,
      jumpCd: 20 + ((Math.random() * 30) | 0),
      stairHops: 0,
      stairLeap: false,
      airCatchUsed: false,
      gapCrossDir: 0,
      gapLock: 0,
      walkFrame: 0,
      walkAt: 0,
      hoverBase: isZhu ? y : 0,
      patrolDir: isZhu ? 1 : 0,
      _sx: (x + 0.5) | 0,
      _sy: (y + 0.5) | 0,
      _faceLeft: null,
      _hurt: null,
      _air: null,
    };
    enemies.push(boss);
    lastBossAt = x;
    renderBossHp(boss);
    syncBossEl(boss);
  }

  function gouSpawnNearLedge(x, feetY) {
    const look = 112;
    const here = feetY != null ? feetY : surfaceAt(x);
    if (here == null) return true;
    for (let d = 8; d <= look; d += 8) {
      const hl = surfaceAt(x - d);
      const hr = surfaceAt(x + d);
      if (hl == null || hr == null) return true;
      if (Math.abs(hl - here) > MAX_WALK_STEP || Math.abs(hr - here) > MAX_WALK_STEP) return true;
    }
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.h <= here + MAX_WALK_STEP) continue;
      if (x > p.x && x < p.x + p.w) return true;
      if (Math.abs(p.x - x) <= look || Math.abs(p.x + p.w - x) <= look) return true;
    }
    return false;
  }

  function gouSpawnX() {
    const dir = (hero.facing || 1) >= 0 ? 1 : -1;
    const hx = hero.x;
    let best = null;
    let bestScore = -Infinity;
    let fallback = null;
    let fallbackScore = -Infinity;
    const consider = (cx, p, requireFlat) => {
      if (Math.abs(cx - hx) < 240) return;
      const sh = surfaceAt(cx);
      if (sh == null) return;
      if (requireFlat && gouSpawnNearLedge(cx, p.h)) return;
      const ahead = (cx - hx) * dir;
      const score =
        800 -
        Math.abs((ahead > 0 ? ahead : -ahead) - 360) +
        Math.min(180, p.w) * 0.12 +
        (ahead >= 240 ? 80 : 0);
      if (score > (requireFlat ? bestScore : fallbackScore)) {
        if (requireFlat) {
          bestScore = score;
          best = cx;
        } else {
          fallbackScore = score;
          fallback = cx;
        }
      }
    };
    for (let pass = 0; pass < 2; pass++) {
      const pad = pass === 0 ? 100 : 64;
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (p.w < pad * 2 + 24) continue;
        const lo = p.x + pad;
        const hi = p.x + p.w - pad;
        if (hi < lo) continue;
        for (let cx = lo; cx <= hi; cx += 16) consider(cx, p, true);
      }
      if (best != null) return best;
    }
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.w < 80) continue;
      consider(p.x + p.w * 0.55, p, false);
    }
    if (fallback != null) return fallback;
    return hx + dir * 360;
  }

  function spawnGouMiniBoss() {
    if (stageGouSpawned || TEST_ACTIONS) return false;
    let x = gouSpawnX();
    if (Math.abs(x - hero.x) < 220) x = hero.x + ((hero.facing || 1) >= 0 ? 360 : -360);
    let groundY = surfaceAt(x);
    if (groundY == null) {
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (x >= p.x && x < p.x + p.w) {
          groundY = p.h;
          break;
        }
      }
    }
    if (groundY == null) groundY = hero.y;
    stageGouSpawned = true;
    addBoss(x, groundY, "gou");
    stageTimeLeft = Math.max(stageTimeLeft, 0) + GOU_TIME_BONUS;
    showToast("守关恶犬出现", 1400);
    return true;
  }

  function renderGouHud(boss) {
    if (!gouHudEl || !gouHpBarEl) return;
    const gou =
      boss && boss.kind === "gou" && !boss.dead
        ? boss
        : enemies.find((e) => e && e.kind === "gou" && !e.dead);
    if (!gou) {
      gouHudEl.hidden = true;
      return;
    }
    gouHudEl.hidden = false;
    const pills = gouHpBarEl.querySelectorAll("i");
    const n = pills.length || 1;
    const filled = Math.ceil((Math.max(0, gou.hp) / (gou.maxHp || 1)) * n);
    pills.forEach((el, i) => {
      el.classList.toggle("is-empty", i >= filled);
    });
  }

  function renderBossHp(boss) {
    if (boss && boss.kind === "gou") {
      renderGouHud(boss);
      return;
    }
    if (!boss || !boss.hpBar) return;
    const pct = Math.max(0, boss.hp / (boss.maxHp || 1));
    boss.hpBar.style.transform = `scaleX(${pct})`;
  }

  function placeGap(minRatio) {
    nextX += randomGap(minRatio);
    lastGapAt = nextX;
  }

  function pickNextHeight(lastVisualH) {
    let idx = HEIGHTS.indexOf(lastVisualH);
    if (idx < 0) {
      idx = 1;
      let best = Infinity;
      for (let i = 0; i < HEIGHTS.length; i++) {
        const d = Math.abs(HEIGHTS[i] - lastVisualH);
        if (d < best) {
          best = d;
          idx = i;
        }
      }
    }
    const profile = terrainProfile(stage);
    const forceChange = flatStreak >= profile.flatForce;
    const roll = terrainRng();
    let next = idx;
    if (!forceChange && roll < 0.16) {
      next = idx;
    } else if (roll < 0.52) {
      next = Math.min(HEIGHTS.length - 1, idx + 1);
    } else if (roll < 0.84) {
      next = Math.max(0, idx - 1);
    } else {
      const step = profile.maxStep >= 2 && terrainRng() < 0.55 ? 2 : 1;
      next = Math.max(0, Math.min(HEIGHTS.length - 1, idx + (terrainRng() < 0.5 ? step : -step)));
    }
    if (forceChange && next === idx) {
      next = idx >= HEIGHTS.length - 1 ? idx - 1 : idx + 1;
    }
    return HEIGHTS[next];
  }

  let viewWCache = 0;
  let viewWCacheAt = 0;
  function viewWidth() {
    const t = performance.now();
    if (viewWCache > 0 && t - viewWCacheAt < 200) return viewWCache;
    viewWCacheAt = t;
    viewWCache = (runway && runway.clientWidth) || 900;
    return viewWCache;
  }

  function invalidateViewCache() {
    viewWCache = 0;
    viewWCacheAt = 0;
    heroHalfWCache = 0;
  }

  function refreshArenaWidth() {
    arenaWidth = Math.max(640, viewWidth() * ARENA_SCREEN_RATIO);
  }

  function arenaMinX() {
    if (platforms.length) return platforms[0].x + 12;
    return 12;
  }

  function arenaMaxX() {
    return Math.max(arenaMinX() + 80, arenaWidth - ARENA_EDGE_PAD);
  }

  function resolveEnemySolids(actor, halfW, prevX) {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.dead || e.kind === "zhu") continue;
      if (Math.abs((e.y || 0) - actor.y) > 56) continue;
      const eHalf = (e.w || 80) * 0.28;
      const bodyL = actor.x - halfW;
      const bodyR = actor.x + halfW;
      const eL = e.x - eHalf;
      const eR = e.x + eHalf;
      if (bodyR <= eL || bodyL >= eR) continue;
      const prevL = prevX - halfW;
      const prevR = prevX + halfW;
      if (prevR <= eL + 0.5 && bodyR > eL) {
        actor.x = eL - halfW;
        if (actor.vx > 0) actor.vx = 0;
      } else if (prevL >= eR - 0.5 && bodyL < eR) {
        actor.x = eR + halfW;
        if (actor.vx < 0) actor.vx = 0;
      }
    }
    resolveZhuGate(actor, prevX);
  }

  let zhuMask = null;
  let gouMask = null;

  function buildOpaqueMask(img) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!(w > 8 && h > 8)) return null;
    const step = w > 800 ? 3 : 2;
    const cw = Math.max(1, Math.floor(w / step));
    const ch = Math.max(1, Math.floor(h / step));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, cw, ch);
    let data = null;
    try {
      data = ctx.getImageData(0, 0, cw, ch).data;
    } catch (_) {
      return null;
    }
    const left = new Int16Array(ch);
    const right = new Int16Array(ch);
    left.fill(-1);
    right.fill(-1);
    for (let y = 0; y < ch; y++) {
      const row = y * cw;
      for (let x = 0; x < cw; x++) {
        if (data[(row + x) * 4 + 3] <= 24) continue;
        if (left[y] < 0) left[y] = x;
        right[y] = x;
      }
    }
    return { w, h, step, cw, ch, left, right };
  }

  function buildZhuMask(img) {
    const m = buildOpaqueMask(img);
    if (m) zhuMask = m;
  }

  function buildGouMask(img) {
    const m = buildOpaqueMask(img);
    if (m) gouMask = m;
  }

  function zhuDrawW(e) {
    const w = e && e.el && e.el.offsetWidth;
    return w > 8 ? w : 176;
  }

  function gouDrawW(e) {
    const w = e && e.el && e.el.offsetWidth;
    return w > 8 ? w : 376;
  }

  function heroBodyH() {
    return Math.max(64, Math.round(((runner && runner.offsetHeight) || 88) * 0.88));
  }

  function spriteOpaqueEdges(mask, e, y0, y1, dispW) {
    if (!e || !mask || !(dispW > 8)) return null;
    const scale = dispW / mask.w;
    const dispH = mask.h * scale;
    const boxL = e.x - dispW * 0.5;
    const boxR = e.x + dispW * 0.5;
    const boxB = e.y;
    const boxT = e.y + dispH;
    const lo = Math.max(y0, boxB);
    const hi = Math.min(y1, boxT);
    if (hi <= lo) return null;
    const flipped = (e.facing || 1) > 0;
    const srcFromWorldY = (worldY) => (mask.h - (worldY - boxB) / scale) / mask.step;
    let yA = Math.floor(srcFromWorldY(hi));
    let yB = Math.ceil(srcFromWorldY(lo));
    if (yA > yB) {
      const t = yA;
      yA = yB;
      yB = t;
    }
    yA = Math.max(0, yA);
    yB = Math.min(mask.ch - 1, yB);
    let edgeL = Infinity;
    let edgeR = -Infinity;
    for (let sy = yA; sy <= yB; sy++) {
      const sl = mask.left[sy];
      if (sl < 0) continue;
      const sr = mask.right[sy];
      const x0 = sl * mask.step;
      const x1 = sr * mask.step;
      let wL;
      let wR;
      if (flipped) {
        wL = boxR - x1 * scale;
        wR = boxR - x0 * scale;
      } else {
        wL = boxL + x0 * scale;
        wR = boxL + x1 * scale;
      }
      if (wL < edgeL) edgeL = wL;
      if (wR > edgeR) edgeR = wR;
    }
    if (!Number.isFinite(edgeL) || edgeR < edgeL) return null;
    return { left: edgeL, right: edgeR };
  }

  function zhuOpaqueEdges(e, y0, y1) {
    return spriteOpaqueEdges(zhuMask, e, y0, y1, zhuDrawW(e));
  }

  function gouOpaqueEdges(e, y0, y1) {
    return spriteOpaqueEdges(gouMask, e, y0, y1, gouDrawW(e));
  }

  function resolveZhuGate(actor, prevX) {
    const skin = 12;
    const feet = actor.y;
    const head = actor.y + heroBodyH();
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.dead || e.kind !== "zhu") continue;
      if (actor === hero && hero.rideZhu === e) continue;
      const edges = zhuOpaqueEdges(e, feet, head);
      if (!edges) continue;
      const hL = actor.x - skin;
      const hR = actor.x + skin;
      if (hR <= edges.left || hL >= edges.right) continue;
      if (prevX <= e.x) {
        actor.x = edges.left - skin;
        if (actor.vx > 0) actor.vx = 0;
      } else {
        actor.x = edges.right + skin;
        if (actor.vx < 0) actor.vx = 0;
      }
    }
  }

  function heroRidingZhu() {
    const e = hero.rideZhu;
    return !!(e && !e.dead && e.kind === "zhu");
  }

  function zhuDeckY(e, x) {
    if (!e) return null;
    const mask = zhuMask;
    const dispW = zhuDrawW(e);
    const scale = mask ? dispW / mask.w : 1;
    const dispH = mask ? mask.h * scale : dispW;
    const boxL = e.x - dispW * 0.5;
    const boxR = e.x + dispW * 0.5;
    const boxB = e.y;
    if (!(dispW > 8) || x < boxL + 6 || x > boxR - 6) return null;
    if (!mask) return boxB + dispH * 0.55 - ZHU_STAND_SINK;
    const flipped = (e.facing || 1) > 0;
    const srcX = flipped ? (boxR - x) / scale : (x - boxL) / scale;
    const col = srcX / mask.step;
    for (let sy = 0; sy < mask.ch; sy++) {
      const sl = mask.left[sy];
      if (sl < 0) continue;
      if (col >= sl && col <= mask.right[sy]) {
        return boxB + (mask.h - sy * mask.step) * scale - ZHU_STAND_SINK;
      }
    }
    return null;
  }

  function findZhuLanding(prevY, nextY, xLeft, xRight) {
    let best = null;
    let bestY = -Infinity;
    const mid = (xLeft + xRight) * 0.5;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.dead || e.kind !== "zhu") continue;
      let deck = zhuDeckY(e, mid);
      if (deck == null) deck = zhuDeckY(e, hero.x);
      if (deck == null) continue;
      const stayOn = Math.abs(prevY - deck) <= 12 && nextY <= deck + 18;
      const crossed =
        prevY >= deck - LAND_TOL &&
        nextY <= deck + 16 &&
        prevY >= nextY;
      if (!stayOn && !crossed) continue;
      if (deck >= bestY) {
        bestY = deck;
        best = { y: deck, e };
      }
    }
    return best;
  }

  function clampHeroToView(actor) {
    const viewW = viewWidth();
    const camX = window.SwordCamera ? SwordCamera.followX : runScroll.world;
    const pad = 12;
    /* 左侧不按镜头夹紧，否则画面左边的缝会被卡在 camX+pad 上掉不下去 */
    const lo = arenaMinX();
    const hi = Math.min(arenaMaxX(), camX + viewW - pad);
    if (hi <= lo) return;
    if (actor.x < lo) {
      actor.x = lo;
      if (actor.vx < 0) actor.vx = 0;
    } else if (actor.x > hi) {
      actor.x = hi;
      if (actor.vx > 0) actor.vx = 0;
    }
  }

  function clampActorX(actor) {
    const lo = arenaMinX();
    const hi = arenaMaxX();
    if (actor.x < lo) {
      actor.x = lo;
      if (actor.vx < 0) actor.vx = 0;
    } else if (actor.x > hi) {
      actor.x = hi;
      if (actor.vx > 0) actor.vx = 0;
    }
  }

  function generateSegment() {
    if (nextX >= arenaWidth) return;
    const profile = terrainProfile(stage);
    if (FLAT_ARENA || TEST_ACTIONS) {
      const h = HEIGHTS[2];
      const gapAt = arenaWidth * 0.52;
      const gapW = Math.max(72, Math.min(100, maxSafeGap() * 0.45));
      if (!TEST_ACTIONS && lastGapAt < 0 && nextX >= gapAt && nextX < arenaWidth - 220) {
        nextX += gapW;
        lastGapAt = nextX;
        return;
      }
      let units = 2;
      const remain = arenaWidth - nextX;
      if (remain < FLOOR_UNIT_W * 1.2) units = 1;
      const plat = addPlatform(nextX, units, h);
      spawnCoinsOnPlat(plat);
      advanceNextX(plat);
      return;
    }
    const roll = terrainRng();
    const canOptionalGap =
      !FORCE_ZERO_GAP &&
      nextX > 220 &&
      nextX < arenaWidth - 220 &&
      nextX - lastGapAt >= profile.minGapSpacing;
    if (canOptionalGap && roll < profile.gapChance) {
      const gap = Math.min(randomGap(profile.gapMinRatio), arenaWidth - nextX - 160);
      if (gap > 24) {
        nextX += gap;
        lastGapAt = nextX;
        flatStreak = 0;
      }
      return;
    }
    const lastVisual = platforms.length
      ? platforms[platforms.length - 1].visualH
      : stageStartHeight(stage);
    const h = platforms.length ? pickNextHeight(lastVisual) : stageStartHeight(stage);
    /* 格斗场略宽一些，方便与 Boss 周旋 */
    const unitRoll = terrainRng();
    let units = unitRoll < 0.55 ? 2 : unitRoll < 0.82 ? 1 : 3;
    /* 末段尽量接到场地右缘 */
    const remain = arenaWidth - nextX;
    if (remain < FLOOR_UNIT_W * 1.2) units = 1;
    const plat = addPlatform(nextX, units, h);
    if (platforms.length > 1 && h === lastVisual) flatStreak += 1;
    else flatStreak = 0;
    spawnCoinsOnPlat(plat);
    advanceNextX(plat);
  }

  /** 一次性铺满约 1.5 屏的有限场地，不再无限延伸 */
  function buildArena() {
    refreshArenaWidth();
    let guard = 0;
    while (nextX < arenaWidth && guard++ < 120) generateSegment();
    if (!platforms.length) {
      addPlatform(0, 3, HEIGHTS[2]);
    } else {
      const last = platforms[platforms.length - 1];
      const end = last.x + last.w;
      if (end < arenaWidth - 40) {
        addPlatform(Math.max(nextX, end - FLOOR_STEP), 2, last.visualH);
      }
    }
    rebuildSurfaceMap();
  }

  let surfaceMap = null;
  let surfaceMapX0 = 0;
  const SURFACE_MAP_STEP = 8;

  function rebuildSurfaceMap() {
    if (!platforms.length) {
      surfaceMap = null;
      return;
    }
    let minX = platforms[0].x;
    let maxX = platforms[0].x + platforms[0].w;
    for (let i = 1; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.x < minX) minX = p.x;
      const r = p.x + p.w;
      if (r > maxX) maxX = r;
    }
    surfaceMapX0 = Math.floor(minX) - 32;
    const n = Math.max(1, (((maxX + 32 - surfaceMapX0) / SURFACE_MAP_STEP) | 0) + 2);
    const map = new Float32Array(n);
    map.fill(NaN);
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const a = Math.max(0, ((p.x - surfaceMapX0) / SURFACE_MAP_STEP) | 0);
      const b = Math.min(n, ((p.x + p.w - surfaceMapX0) / SURFACE_MAP_STEP) | 0);
      for (let k = a; k < b; k++) {
        if (Number.isNaN(map[k])) map[k] = p.h;
      }
    }
    surfaceMap = map;
  }

  function surfaceAt(worldX) {
    if (surfaceMap) {
      const i = ((worldX - surfaceMapX0) / SURFACE_MAP_STEP) | 0;
      if (i < 0 || i >= surfaceMap.length) return null;
      const v = surfaceMap[i];
      return Number.isNaN(v) ? null : v;
    }
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (worldX >= p.x && worldX < p.x + p.w) return p.h;
    }
    return null;
  }

  function terrainAtHeight(worldX, feetY) {
    const tol = 10;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (worldX < p.x || worldX >= p.x + p.w) continue;
      if (Math.abs(p.h - feetY) <= tol) return true;
    }
    return false;
  }

  /** 脚底与当前高度地形的重叠比例 */
  function bodyGroundSupport(x, halfW, feetY) {
    const L = x - halfW;
    const R = x + halfW;
    const w = Math.max(1, R - L);
    const n = 9;
    let hits = 0;
    for (let i = 0; i < n; i++) {
      const px = L + (w * i) / (n - 1);
      if (terrainAtHeight(px, feetY)) hits += 1;
    }
    return { frac: hits / n };
  }

  /** 七成面积已在地形外则掉落；中心踩空也掉，避免往左跨缝时被两边台面托住 */
  const HERO_LEDGE_MIN_SUPPORT = 0.3;

  function hasWalkSupport(x, halfW, feetY) {
    if (!terrainAtHeight(x, feetY)) return false;
    return bodyGroundSupport(x, halfW, feetY).frac >= HERO_LEDGE_MIN_SUPPORT;
  }

  let heroHalfWCache = 0;
  function heroHalfW() {
    if (heroHalfWCache > 0) return heroHalfWCache;
    heroHalfWCache = ((runner && runner.offsetWidth) || 90) * 0.42;
    return heroHalfWCache;
  }

  /**
   * 脚底区间与台面有任意水平重叠即算接触。
   * 只能从上落下或站稳，禁止步行自动走上更高台阶。
   */
  function findLandingSurface(prevY, nextY, xLeft, xRight) {
    let best = null;
    let bestDist = Infinity;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      const overlap = Math.min(xRight, p.x + p.w) - Math.max(xLeft, p.x);
      if (overlap <= 0) continue;

      const top = p.h;
      /* 人明显低于该台面 → 立面，不能当地板 */
      if (prevY < top - MAX_WALK_STEP && nextY < top - MAX_WALK_STEP) continue;

      const stayOn = Math.abs(prevY - top) <= 6 && nextY <= top + 16;
      /* 下落落到台面即可（含跳高台）；步行上台仍由 resolveLedgeWalls 挡住 */
      const crossed =
        prevY >= top - LAND_TOL &&
        nextY <= top + 16 &&
        prevY >= nextY;
      if (!stayOn && !crossed) continue;

      const dist = Math.abs(top - prevY);
      if (dist < bestDist) {
        bestDist = dist;
        best = top;
      }
    }
    return best;
  }

  /** 贴地走进更高台阶时当墙挡住，必须跳上去 */
  function resolveLedgeWalls(actor, halfW, yNudge, prevX) {
    const feetY = actor.y - yNudge;
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.h <= feetY + MAX_WALK_STEP) continue;

      const left = p.x;
      const right = p.x + p.w;
      const bodyL = actor.x - halfW;
      const bodyR = actor.x + halfW;
      if (bodyR <= left || bodyL >= right) continue;

      const prevL = prevX - halfW;
      const prevR = prevX + halfW;
      if (prevR <= left + 0.5 && bodyR > left) {
        actor.x = left - halfW;
        if (actor.vx > 0) actor.vx = 0;
      } else if (prevL >= right - 0.5 && bodyL < right) {
        actor.x = right + halfW;
        if (actor.vx < 0) actor.vx = 0;
      }
    }
  }

  function syncHeroEl() {
    const camX = window.SwordCamera ? SwordCamera.getX() : runScroll.world;
    const lookY = cameraLookY();
    const sx = ((hero.x - camX) + 0.5) | 0;
    const sy = ((hero.y - lookY) + 0.5) | 0;
    const visX = sx;
    const visY = sy;
    if (
      hero._sx !== visX ||
      hero._sy !== visY ||
      swordCombo.shakeAmp > 0 ||
      hero.hitShakeLeft > 0 ||
      hero.hitJitterX ||
      hero.hitJitterY
    ) {
      hero._sx = visX;
      hero._sy = visY;
      runner.style.transform = `translate3d(${visX + (hero.hitJitterX || 0)}px, ${-(visY + (hero.hitJitterY || 0))}px, 0)`;
    }
    const faceLeft = hero.facing < 0;
    if (hero._faceLeft !== faceLeft) {
      hero._faceLeft = faceLeft;
      runner.classList.toggle("is-facing-left", faceLeft);
    }
    const moving =
      (Math.abs(hero.vx) > 0.15 || Math.abs(hero.moveDirY) > 0.001) &&
      hero.onGround &&
      !swordCombo.attacking;
    if (hero._moving !== moving) {
      hero._moving = moving;
      runner.classList.toggle("is-moving", moving);
    }
    const dashing = !!hero.dashing && !swordCombo.attacking;
    if (hero._dashing !== dashing) {
      hero._dashing = dashing;
      runner.classList.toggle("is-dashing", dashing);
    }
    syncComboStagePos();
  }

  function updateParallax() {
    /* 背景水平移动距离 = 人物/镜头世界位移的一半；远中近略做层次差 */
    const cam = runScroll.world;
    const place = (el, rate, depthY) => {
      if (!el) return;
      const x = ((-cam * rate) + 0.5) | 0;
      const y = ((-viewFx.y * depthY) * 2 + 0.5) | 0;
      if (el._px === x && el._py === y) return;
      el._px = x;
      el._py = y;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    place(runBackArt, 0.14, 0.12);
    place(runMidArt, 0.28, 0.42);
    place(runFrontArt, 0.44, 0.86);
  }

  function updateCamera() {
    const viewW = viewWidth();
    const now = performance.now();
    if (!hero._camTickAt) hero._camTickAt = now;
    const dtSec = Math.min(0.05, Math.max(0, (now - hero._camTickAt) / 1000));
    hero._camTickAt = now;

    if (window.SwordCamera) {
      const combo = window.SwordCombat;
      const comboHop = comboHopping();
      const comboLand = !!(combo && combo.landing && !comboHop);
      const normalJump = !hero.onGround && !comboHop;
      SwordCamera.tick(now, dtSec, {
        heroX: hero.x,
        groundY: normalJump ? jumpCamBase() : groundYAt(hero.x),
        hopY: comboHop ? combo.poseY || 0 : 0,
        lockGroundY: !!(combo && combo.currentFrame === "16") || normalJump,
        facing: hero.facing,
        H: (combo && combo.H) || 140,
        viewW,
        arenaW: arenaWidth,
        dashing: !!(combo && combo.dashing) || dashBurstActive(now),
        hopping: comboHop,
        landing: comboLand && !normalJump,
        normalJump,
      });
      runScroll.world = SwordCamera.followX;
    } else {
      const maxCam = Math.max(0, arenaWidth - viewW);
      const focus = Math.min(maxCam, Math.max(0, hero.x - viewW * 0.38));
      runScroll.world += (focus - runScroll.world) * 0.48;
      if (runScroll.world < 0) runScroll.world = 0;
      if (runScroll.world > maxCam) runScroll.world = maxCam;
    }

    const maxCam = Math.max(0, arenaWidth - viewW);
    const maxCamSafe = Math.max(1, maxCam);
    const camT = runScroll.world / maxCamSafe;
    const span = Math.max(1, arenaMaxX() - arenaMinX());
    const heroT = Math.min(1, Math.max(0, (hero.x - arenaMinX()) / span));
    const targetX = camT * 0.35 + heroT * 0.65 - 0.5;
    const yBase = 110;
    const targetY =
      !hero.onGround && !comboHopping()
        ? 0
        : Math.min(12, Math.max(-8, (hero.y - yBase) * 0.12));
    viewFx.x += (targetX - viewFx.x) * 0.22;
    viewFx.y += (targetY - viewFx.y) * 0.12;

    const shake = window.SwordCamera ? SwordCamera.getShake() : { x: 0, y: 0 };
    const lookY = window.SwordCamera ? worldLookY() - shake.y : 0;
    const camX = ((window.SwordCamera ? SwordCamera.getX() : runScroll.world) + 0.5) | 0;
    const camY = (lookY + shake.y + 0.5) | 0;
    if (trackWorld._camX !== camX || trackWorld._camY !== camY) {
      trackWorld._camX = camX;
      trackWorld._camY = camY;
      trackWorld.style.transform = `translate3d(${-camX}px, ${camY}px, 0)`;
    }
    updateParallax();
  }

  function resetHeroOnTrack() {
    hero.vy = 0;
    hero.vx = 0;
    hero.dashing = false;
    hero.sprinting = false;
    cancelHeroDash();
    tapDash.lockDir = 0;
    tapDash.readyAt = 0;
    hero.onGround = true;
    hero.dead = false;
    hero.jumpsLeft = maxJumps();
    hero.usedAirJumps = 0;
    hero.didGroundJump = false;
    hero.groundFrames = 0;
    hero.jumpLock = 0;
    hero.jumpBufferedUntil = 0;
    hero.coyoteUntil = 0;
    hero.airGroundY = null;
    hero.pendingLandSfx = false;
    hero.rideZhu = null;
    hero.swordAnimFrames = 0;
    hero.fanAnimFrames = 0;
    hero.swordReadyAt = 0;
    hero.fanReadyAt = 0;
    hero.hurtFrames = 0;
    clearHeroHit();
    hero.facing = 1;
    endSwordComboAttack();
    hideComboGif();
    if (window.SwordCamera) SwordCamera.reset(hero.x, hero.y, viewWidth());
    resetSwordComboChain();
    swordCombo.lastAttackAt = 0;
    swordCombo.hitStopUntil = 0;
    swordCombo.shakeAmp = 0;
    swordCombo.shakeUntil = 0;
    runner.classList.remove(
      "is-air",
      "is-attacking",
      "is-attacking-sword",
      "is-attacking-fan",
      "is-thrusting",
      "is-hurt",
      "is-hit-flash",
      "is-spawn-grace",
      "is-moving"
    );
    if (comboStage) comboStage.classList.remove("is-hurt", "is-hit-flash", "is-stun", "is-spawn-grace");
    if (!platforms.length) {
      hero.x = 180;
      hero.y = 110;
    } else {
      const rescue =
        platforms.find((p) => p.x + p.w > hero.x - 40) || platforms[0];
      hero.x = rescue.x + Math.min(120, rescue.w * 0.35);
      hero.y = rescue.h;
    }
    updateCamera();
    syncHeroEl();
    stageClock = performance.now();
    beginSpawnGrace();
  }

  function beginSpawnGrace() {
    hero.spawnGraceUntil = performance.now() + SPAWN_GRACE_MS;
    if (runner) runner.classList.add("is-spawn-grace");
    if (comboStage) comboStage.classList.add("is-spawn-grace");
  }

  function tickSpawnGrace(now) {
    if (!(hero.spawnGraceUntil > 0)) return;
    if (now < hero.spawnGraceUntil) return;
    hero.spawnGraceUntil = 0;
    if (runner) runner.classList.remove("is-spawn-grace");
    if (comboStage) comboStage.classList.remove("is-spawn-grace");
  }

  function setPaused(on) {
    if (!running || gameOver) return;
    paused = !!on;
    runway.classList.toggle("is-paused", paused);
    if (pauseOverlay) pauseOverlay.hidden = !paused;
    if (!paused) stageClock = performance.now();
  }

  function isCombatUiTarget(t) {
    return !!(
      t &&
      t.closest &&
      (t.closest(".bag-btn") ||
        t.closest(".bag-panel") ||
        t.closest(".shop") ||
        t.closest(".gameover-overlay") ||
        t.closest(".hud") ||
        t.closest(".touch-pad") ||
        t.closest("button") ||
        t.closest("a"))
    );
  }

  function touchPadActive() {
    return !!(game && game.classList.contains("has-touch-pad"));
  }

  function syncTouchPadMode() {
    const on =
      isPhoneUi() ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(max-width: 900px)").matches;
    if (game) game.classList.toggle("has-touch-pad", on);
  }

  function bindTouchPad() {
    const pad = document.getElementById("touch-pad");
    if (!pad) return;
    const byPointer = new Map();
    let atkTimer = 0;

    const stopAtkRepeat = () => {
      if (atkTimer) {
        clearInterval(atkTimer);
        atkTimer = 0;
      }
    };

    const press = (act) => {
      if (act === "left") {
        keys.d = false;
        const was = keys.a;
        keys.a = true;
        if (!was && running) noteMoveTap("a", performance.now());
      } else if (act === "right") {
        keys.a = false;
        const was = keys.d;
        keys.d = true;
        if (!was && running) noteMoveTap("d", performance.now());
      } else if (act === "jump") {
        tryJump();
      } else if (act === "attack") {
        tryHeroAttack();
        stopAtkRepeat();
        atkTimer = setInterval(() => tryHeroAttack(), 170);
      } else if (act === "vase") {
        tryUseVase();
      } else if (act === "pause") {
        togglePause();
      }
    };

    const release = (act) => {
      if (act === "left") {
        keys.a = false;
        if (tapDash.dir < 0 && !dashBurstActive()) tapDash.dir = 0;
        if (tapDash.lockDir < 0) tapDash.lockDir = 0;
      } else if (act === "right") {
        keys.d = false;
        if (tapDash.dir > 0 && !dashBurstActive()) tapDash.dir = 0;
        if (tapDash.lockDir > 0) tapDash.lockDir = 0;
      } else if (act === "attack") {
        stopAtkRepeat();
      }
    };

    pad.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest("[data-pad]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      ensureAudio();
      lockLandscape();
      if (window.SwordAudio) SwordAudio.unlock();
      const act = btn.dataset.pad;
      byPointer.set(e.pointerId, { act, btn });
      btn.classList.add("is-held");
      try {
        btn.setPointerCapture(e.pointerId);
      } catch (_) {}
      press(act);
    });

    const onEnd = (e) => {
      const rec = byPointer.get(e.pointerId);
      if (!rec) return;
      byPointer.delete(e.pointerId);
      rec.btn.classList.remove("is-held");
      release(rec.act);
    };
    pad.addEventListener("pointerup", onEnd);
    pad.addEventListener("pointercancel", onEnd);
    pad.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("blur", () => {
      stopAtkRepeat();
      byPointer.forEach((rec) => {
        rec.btn.classList.remove("is-held");
        release(rec.act);
      });
      byPointer.clear();
    });
  }

  function shouldTogglePause(e) {
    if (!e || (e.button != null && e.button !== 0)) return false;
    const t = e.target;
    if (isCombatUiTarget(t)) return false;
    if (paused) return !!(t && t.closest && t.closest(".pause-overlay"));
    return false;
  }

  function togglePause() {
    if (!running || inShop || gameOver) return;
    if (bagPanel && !bagPanel.hidden) {
      setBagOpen(false);
      return;
    }
    setPaused(!paused);
  }

  function beginHeroJump() {
    if (hero.airGroundY == null) hero.airGroundY = hero.y;
    hero.vy = JUMP_V;
    hero.onGround = false;
    hero.rideZhu = null;
    hero.jumpLock = 16;
    hero.coyoteUntil = 0;
    hero.jumpBufferedUntil = 0;
    hero.didGroundJump = true;
    hero.groundFrames = 0;
    hero.jumpsLeft = Math.max(0, maxJumps() - 1 - (hero.usedAirJumps | 0));
    runner.classList.add("is-air");
    hero.pendingLandSfx = true;
    sfxJump();
  }

  function tryJump() {
    if (!running || paused || hero.dead || heroStunned()) return;
    const now = performance.now();
    const coyote = now < (hero.coyoteUntil || 0);
    if (comboHoldsGround()) {
      hero.jumpBufferedUntil = now + 140;
      return;
    }
    const usedAir = hero.usedAirJumps | 0;
    const groundedStart =
      (hero.onGround && (hero.groundFrames || 0) >= 3 && hero.jumpLock <= 0) ||
      (coyote && !hero.didGroundJump && usedAir <= 0);
    if (groundedStart) {
      hero.usedAirJumps = 0;
      beginHeroJump();
      return;
    }
    if (usedAir >= maxAirJumps()) {
      hero.jumpBufferedUntil = now + 140;
      return;
    }
    hero.usedAirJumps = usedAir + 1;
    beginHeroJump();
  }

  function playWeaponAnim(kind) {
    const cls = kind === "fan" ? "is-attacking-fan" : "is-attacking-sword";
    const haste = heroAttackSpeedMul();
    if (kind === "fan") hero.fanAnimFrames = Math.max(1, Math.round(ATTACK_FRAMES / haste));
    else hero.swordAnimFrames = Math.max(1, Math.round((kind === "thrust" ? THRUST_FRAMES : ATTACK_FRAMES) / haste));
    runner.classList.remove(cls, "is-thrusting");
    void runner.offsetWidth;
    runner.classList.add("is-attacking", cls);
    if (kind === "thrust") {
      runner.classList.add("is-thrusting");
      sfxWhoosh();
    } else if (kind === "sword") sfxWhoosh();
    else sfxAttack();
  }

  function clearSwordComboClasses() {
    if (!runner) return;
    runner.classList.remove(
      "combo-a1",
      "combo-a2",
      "combo-a3",
      "combo-a4",
      "combo-a5",
      "combo-a6",
      "combo-charging",
      "combo-body-mode",
      "is-thrusting"
    );
    runner.style.removeProperty("--combo-dur");
    runner.style.removeProperty("--slash-scale");
    runner.style.removeProperty("--combo-lean");
  }

  function resetSwordComboChain() {
    swordCombo.nextStep = 0;
    swordCombo.buffered = false;
  }

  function hideSlashVfx() {
    if (!slashVfxEl) return;
    slashVfxEl.hidden = true;
    slashVfxEl.classList.remove("is-show");
    slashVfxEl.style.backgroundImage = "";
    swordCombo.slashPoseKey = "";
  }

  function resolveSlashCfg(poseIdx, step) {
    if (step && step.slashOverride) return step.slashOverride;
    const base =
      (SWORD_COMBO.poseSlash && SWORD_COMBO.poseSlash[poseIdx]) || null;
    if (!base) return null;
    if (!step || !step.slashBoost) return base;
    return {
      frame: base.frame,
      rot: step.slashBoost.rot != null ? step.slashBoost.rot : base.rot,
      scale: (base.scale || 1) * (step.slashBoost.scale || 1),
      ox: (base.ox || 0) + (step.slashBoost.ox || 0),
      oy: (base.oy || 0) + (step.slashBoost.oy || 0),
    };
  }

  function setArmPoseFrame(frameIndex) {
    if (!armWeaponEl || !comboArt.poseFrames.length) return;
    const idx = Math.max(0, Math.min(comboArt.poseFrames.length - 1, frameIndex | 0));
    const pivot = (SWORD_COMBO.posePivots && SWORD_COMBO.posePivots[idx]) || { x: 0.5, y: 0.5 };
    const ox = (pivot.x * 100).toFixed(2);
    const oy = (pivot.y * 100).toFixed(2);
    const gx = (SWORD_COMBO.gripOffsetPx && SWORD_COMBO.gripOffsetPx.x) || 0;
    const gy = (SWORD_COMBO.gripOffsetPx && SWORD_COMBO.gripOffsetPx.y) || 0;
    armWeaponEl.src = comboArt.poseFrames[idx];
    armWeaponEl.style.transformOrigin = `${ox}% ${oy}%`;
    /* 握点对准 WeaponSocket，再整体右下偏移 */
    armWeaponEl.style.transform = `translate(calc(-${ox}% + ${gx}px), calc(-${oy}% + ${gy}px))`;
    swordCombo.lastPoseFrame = idx;
  }

  function setArmSocketPose(localX, localY, leanPx) {
    if (!armSocketEl) return;
    const base = ANCHOR_BASE.RightHand || { leftPct: 100, bottomPct: 42, ox: -18, oy: -13 };
    const sx = (base.ox || 0) + ((SWORD_COMBO.socketBase && SWORD_COMBO.socketBase.x) || 0) + (localX || 0);
    const sy = (base.oy || 0) + ((SWORD_COMBO.socketBase && SWORD_COMBO.socketBase.y) || 0) + (localY || 0);
    armSocketEl.style.left = `${base.leftPct}%`;
    armSocketEl.style.bottom = `${base.bottomPct}%`;
    armSocketEl.style.transform = `translate3d(${sx}px, ${-sy}px, 0)`;
    if (runner) {
      runner.style.setProperty("--combo-lean", `${leanPx || 0}px`);
    }
  }

  /** 弧光贴合当前姿态剑尖（zuhefangfa：内侧对准剑尖，剑压在弧上） */
  function showSlashVfx(poseIdx, step) {
    if (!SWORD_COMBO.showSlashVfx) {
      hideSlashVfx();
      return;
    }
    if (!slashVfxEl || !comboArt.slashFrames.length) return;
    const cfg = resolveSlashCfg(poseIdx, step);
    if (!cfg) {
      hideSlashVfx();
      return;
    }
    const fi = Math.max(0, Math.min(comboArt.slashFrames.length - 1, cfg.frame | 0));
    const tip = (SWORD_COMBO.poseTips && SWORD_COMBO.poseTips[poseIdx]) || { x: 0.85, y: 0.45 };
    const pivot = (SWORD_COMBO.posePivots && SWORD_COMBO.posePivots[poseIdx]) || { x: 0.5, y: 0.5 };
    const gx = (SWORD_COMBO.gripOffsetPx && SWORD_COMBO.gripOffsetPx.x) || 0;
    const gy = (SWORD_COMBO.gripOffsetPx && SWORD_COMBO.gripOffsetPx.y) || 0;
    const dw = (armWeaponEl && armWeaponEl.offsetWidth) || 110;
    const dh = (armWeaponEl && armWeaponEl.offsetHeight) || 110;
    const tipX = (tip.x - pivot.x) * dw + gx + (cfg.ox || 0);
    const tipY = (tip.y - pivot.y) * dh + gy + (cfg.oy || 0);
    const key = `${poseIdx}:${fi}:${tipX.toFixed(1)}:${tipY.toFixed(1)}:${cfg.rot || 0}:${cfg.scale || 1}`;
    const durMs = Math.max(
      160,
      ((step && step.activeEndMs) || 160) - ((step && step.activeStartMs) || 0) + 40
    );

    slashVfxEl.style.setProperty("--svfx-x", `${tipX.toFixed(1)}px`);
    slashVfxEl.style.setProperty("--svfx-y", `${tipY.toFixed(1)}px`);
    slashVfxEl.style.setProperty("--svfx-rot", `${cfg.rot || 0}deg`);
    slashVfxEl.style.setProperty("--svfx-scale", String(cfg.scale || 1));
    slashVfxEl.style.setProperty("--svfx-dur", `${durMs}ms`);
    slashVfxEl.style.backgroundImage = `url("${comboArt.slashFrames[fi]}")`;
    slashVfxEl.hidden = false;
    if (swordCombo.slashPoseKey !== key) {
      slashVfxEl.classList.remove("is-show");
      void slashVfxEl.offsetWidth;
      slashVfxEl.classList.add("is-show");
      swordCombo.slashPoseKey = key;
    }
  }

  function setBlueBodyFrame(frameKey) {
    if (!runnerSprite || !comboArt.bodyFrames) return;
    const url =
      frameKey == null || frameKey === "idle"
        ? comboArt.bodyIdle
        : comboArt.bodyFrames[frameKey];
    if (url) runnerSprite.src = url;
  }

  function setComboPoseMode(on) {
    if (!runner) return;
    runner.classList.toggle("combo-pose-mode", !!on);
    runner.classList.toggle("combo-body-mode", !!(on && SWORD_COMBO.useBodyFrames));
    if (SWORD_COMBO.useBodyFrames) {
      /* 全身帧已含剑与弧光，隐藏手臂层与武器架 */
      if (armSocketEl) armSocketEl.hidden = true;
      hideSlashVfx();
      if (weaponRack) {
        weaponRack.classList.toggle("is-combo-hidden", !!on);
        if (on) weaponRack.hidden = true;
        else if (selected === "blue") weaponRack.hidden = true;
      }
      if (!on) setBlueBodyFrame("idle");
      return;
    }
    if (armSocketEl) armSocketEl.hidden = !on;
    if (weaponRack) {
      weaponRack.classList.toggle("is-combo-hidden", !!on);
    }
    if (!on) {
      hideSlashVfx();
      if (armSocketEl) armSocketEl.hidden = true;
    }
  }

  function endSwordComboAttack() {
    swordCombo.attacking = false;
    swordCombo.stepIndex = -1;
    swordCombo.stepCfg = null;
    swordCombo.hitIds = null;
    swordCombo.nudgeX = 0;
    swordCombo.slashShown = false;
    hero.swordAnimFrames = 0;
    if (comboGif.playing) hideComboGif();
    else if (!comboGif.done) hideComboGif();
    clearSwordComboClasses();
    setComboPoseMode(false);
    if (runner) {
      runner.classList.remove(
        "is-attacking",
        "is-attacking-sword",
        "is-thrusting",
        "combo-body-mode"
      );
      runner.style.removeProperty("--combo-lean");
    }
  }

  function comboStepDuration(step) {
    const spd = Math.max(0.35, (SWORD_COMBO.attackSpeedMul || 1) * heroAttackSpeedMul());
    return Math.max(80, (step.durationMs || 280) / spd);
  }

  function easeOutCubic(t) {
    const u = 1 - Math.min(1, Math.max(0, t));
    return 1 - u * u * u;
  }

  function updateComboPoseVisual() {
    const step = swordCombo.stepCfg;
    if (!step || !swordCombo.attacking) return;
    const dur = comboStepDuration(step);
    const charge = step.chargeMs || 0;
    let t = 0;
    if (swordCombo.attackElapsed <= charge) {
      t = 0;
      runner.classList.add("combo-charging");
    } else {
      runner.classList.remove("combo-charging");
      t = easeOutCubic((swordCombo.attackElapsed - charge) / Math.max(1, dur - charge));
    }

    if (SWORD_COMBO.useBodyFrames) {
      const frames = step.bodyFrames || [];
      if (frames.length) {
        const rawT =
          swordCombo.attackElapsed <= charge
            ? 0
            : (swordCombo.attackElapsed - charge) / Math.max(1, dur - charge);
        const idx =
          frames.length === 1
            ? 0
            : Math.min(frames.length - 1, Math.floor(Math.min(0.999, Math.max(0, rawT)) * frames.length));
        setBlueBodyFrame(frames[idx]);
      }
      if (runner) {
        runner.style.setProperty("--combo-lean", `${(step.lean || 0) * t}px`);
      }
      return;
    }

    const fromPose =
      step.poseFrom != null ? step.poseFrom : swordCombo.lastPoseFrame | 0;
    const toPose = step.poseTo != null ? step.poseTo : step.poseFrame || 0;
    const poseIdx = t < 0.3 ? fromPose : toPose;
    setArmPoseFrame(poseIdx);

    const from = step.socketFrom || { x: 0, y: 0 };
    const to = step.socketTo || { x: 0, y: 0 };
    const lx = from.x + (to.x - from.x) * t;
    const ly = from.y + (to.y - from.y) * t;
    const lean = (step.lean || 0) * t;
    setArmSocketPose(lx, ly, lean);

    const activeAt = charge + (step.activeStartMs || 0);
    if (swordCombo.attackElapsed >= activeAt) {
      const slashCfg = resolveSlashCfg(poseIdx, step);
      if (slashCfg) {
        swordCombo.slashShown = true;
        showSlashVfx(poseIdx, step);
      } else {
        hideSlashVfx();
      }
    } else {
      hideSlashVfx();
    }
  }

  function beginSwordComboStep(stepIndex) {
    const steps = SWORD_COMBO.steps;
    if (!steps || !steps.length) return false;
    const idx = ((stepIndex % steps.length) + steps.length) % steps.length;
    const step = steps[idx];
    const now = performance.now();
    const dur = comboStepDuration(step);

    beginDijiangSwing();
    swordCombo.attacking = true;
    swordCombo.stepIndex = idx;
    swordCombo.stepCfg = step;
    swordCombo.attackStartedAt = now;
    swordCombo.attackElapsed = 0;
    swordCombo.lastTickAt = now;
    swordCombo.lastAttackAt = now;
    swordCombo.buffered = false;
    swordCombo.hitIds = new Set();
    swordCombo.nudgeX = step.bodyNudgePx || 0;
    swordCombo.slashShown = false;
    swordCombo.nextStep = (idx + 1) % steps.length;

    clearSwordComboClasses();
    runner.classList.add("is-attacking", "is-attacking-sword", `combo-${step.id}`);
    runner.style.setProperty("--slash-scale", "1");
    runner.style.setProperty("--combo-dur", `${dur}ms`);

    const frames = Math.max(8, Math.round(dur / 16.67));
    hero.swordAnimFrames = frames;
    hero.fanAnimFrames = 0;

    if (comboArt.ready) {
      setComboPoseMode(true);
      if (SWORD_COMBO.useBodyFrames) {
        const bf = step.bodyFrames && step.bodyFrames[0];
        if (bf != null) setBlueBodyFrame(bf);
      } else {
        const fromPose =
          step.poseFrom != null ? step.poseFrom : swordCombo.lastPoseFrame | 0;
        setArmPoseFrame(fromPose);
        const sock = step.socketFrom || { x: 0, y: 0 };
        setArmSocketPose(sock.x, sock.y, 0);
      }
    }

    if (step.motion === "thrust") {
      runner.classList.add("is-thrusting");
      sfxWhoosh();
    } else if (step.isCrit) {
      sfxWhoosh();
      playTone({ freq: 180, dur: 0.08, type: "square", vol: 0.05, slide: 90 });
    } else {
      sfxWhoosh();
    }

    if (step.chargeMs > 0) runner.classList.add("combo-charging");

    const nudge = (step.bodyNudgePx || 0) * hero.facing * (step.motion === "thrust" ? tianmaThrustDistanceMul() : 1);
    if (nudge) {
      hero.x += nudge;
      clampActorX(hero);
    }

    updateComboPoseVisual();
    return true;
  }

  function requestSwordCombo() {
    if (!running || paused || hero.dead || inShop) return false;
    if (selected === "blue" && window.SwordCombat && SwordCombat.ready) return false;
    const now = performance.now();

    if (swordCombo.attacking) {
      const step = swordCombo.stepCfg;
      const dur = step ? comboStepDuration(step) : 280;
      const remain = dur - swordCombo.attackElapsed;
      if (remain <= (SWORD_COMBO.bufferWindowMs || 160) || swordCombo.attackElapsed >= dur * 0.45) {
        swordCombo.buffered = true;
      }
      return true;
    }

    if (swordCombo.lastAttackAt && now - swordCombo.lastAttackAt > SWORD_COMBO.resetMs) {
      resetSwordComboChain();
    }

    return beginSwordComboStep(swordCombo.nextStep);
  }

  function applyComboHitStop(ms) {
    if (!ms || ms <= 0) return;
    const now = performance.now();
    swordCombo.hitStopUntil = Math.max(swordCombo.hitStopUntil, now + ms);
  }

  function triggerComboShake(px, ms) {
    if (!px || px <= 0) return;
    swordCombo.shakeAmp = px;
    swordCombo.shakeUntil = performance.now() + (ms || 120);
  }

  function resolveSwordComboHits() {
    const step = swordCombo.stepCfg;
    if (!step || !swordCombo.hitIds) return;
    const elapsed = swordCombo.attackElapsed;
    const charge = step.chargeMs || 0;
    if (elapsed >= charge) runner.classList.remove("combo-charging");
    if (elapsed < charge + (step.activeStartMs || 0)) return;
    if (elapsed > charge + (step.activeEndMs || step.durationMs)) return;

    const heroW = heroHalfW() / 0.42;
    const { ox, oy } = attackOrigin(heroW);
    const reach =
      swordReach() * (step.reachMul || 1) * (step.motion === "thrust" ? tianmaThrustDistanceMul() : 1);
    const hits = enemiesInArc(ox, oy, hero.facing, reach, step.arc || SWORD_SLASH_ARC);
    if (!hits.length) return;

    let landed = false;
    const dmgBase = playerAtk() * (step.damageMul || 1) * (SWORD_COMBO.damageMul || 1);
    const dmg = step.isCrit
      ? dmgBase * (SWORD_COMBO.critDamageMul || 1)
      : dmgBase;

    for (let i = 0; i < hits.length; i++) {
      const e = hits[i];
      if (!e || e.dead) continue;
      const id = e.el || e;
      if (swordCombo.hitIds.has(id)) continue;
      swordCombo.hitIds.add(id);
      hitEnemy(e, dmg, { knockback: step.knockback || 2.4, facing: hero.facing });
      landed = true;
    }

    if (landed) {
      applyComboHitStop(step.hitStopMs || 30);
      if (step.shakePx) triggerComboShake(step.shakePx, step.isCrit ? 140 : 90);
    }
  }

  function updateSwordCombo(now) {
    if (window.SwordCombat && SwordCombat.ready) return;
    if (selected !== "blue") return;
    if (comboGif.playing || comboGif.current || comboGif.done) return;

    if (swordCombo.shakeUntil && now >= swordCombo.shakeUntil) {
      swordCombo.shakeAmp = 0;
      swordCombo.shakeUntil = 0;
    }

    if (!swordCombo.attacking) {
      if (swordCombo.lastAttackAt && now - swordCombo.lastAttackAt > SWORD_COMBO.resetMs) {
        resetSwordComboChain();
      }
      return;
    }

    const inHitStop = now < swordCombo.hitStopUntil;
    if (!swordCombo.lastTickAt) swordCombo.lastTickAt = now;
    if (!inHitStop) {
      swordCombo.attackElapsed += now - swordCombo.lastTickAt;
    }
    swordCombo.lastTickAt = now;

    const step = swordCombo.stepCfg;
    const dur = step ? comboStepDuration(step) : 280;

    if (!inHitStop) {
      updateComboPoseVisual();
      resolveSwordComboHits();
    }

    if (swordCombo.attackElapsed >= dur) {
      const buffered = swordCombo.buffered;
      const finishedIdx = swordCombo.stepIndex;
      if (step && step.poseTo != null) swordCombo.lastPoseFrame = step.poseTo;
      swordCombo.lastAttackAt = now;
      if (buffered) {
        swordCombo.attacking = false;
        swordCombo.stepCfg = null;
        swordCombo.hitIds = null;
        swordCombo.slashShown = false;
        hideSlashVfx();
        if (finishedIdx >= SWORD_COMBO.steps.length - 1) resetSwordComboChain();
        beginSwordComboStep(swordCombo.nextStep);
      } else {
        endSwordComboAttack();
        if (finishedIdx >= SWORD_COMBO.steps.length - 1) resetSwordComboChain();
      }
    }
  }

  function tickWeaponAnims() {
    if (selected === "blue" && swordCombo.attacking) {
      return;
    }
    if (hero.swordAnimFrames > 0) {
      hero.swordAnimFrames -= 1;
      if (hero.swordAnimFrames <= 0) {
        runner.classList.remove("is-attacking-sword", "is-thrusting");
      }
    }
    if (hero.fanAnimFrames > 0) {
      hero.fanAnimFrames -= 1;
      if (hero.fanAnimFrames <= 0) runner.classList.remove("is-attacking-fan");
    }
    if (hero.swordAnimFrames <= 0 && hero.fanAnimFrames <= 0) {
      runner.classList.remove("is-attacking");
    }
  }

  function tryHeroAttack() {
    if (!running || paused || hero.dead || inShop || gameOver) return false;
    cancelHeroDash();
    if (selected === "blue") {
      if (window.SwordCombat && SwordCombat.ready) {
        if (window.SwordInput && SwordInput.canCollect && !SwordInput.canCollect()) return false;
        return !!SwordCombat.requestAttack(1, performance.now());
      }
    }
    return tryPlayerAttack();
  }

  /** 点击攻击：吕洞宾六段剑连击；钟离权扇子纵向弧 */
  function tryPlayerAttack() {
    if (!running || paused || hero.dead || inShop) return false;

    if (selected === "blue") {
      return requestSwordCombo();
    }

    if (hero.swordAnimFrames > 0 || hero.fanAnimFrames > 0) return false;

    const heroW = heroHalfW() / 0.42;
    const { ox, oy } = attackOrigin(heroW);
    const hits = enemiesInArc(ox, oy, hero.facing, fanReach(), FAN_VERT_ARC);
    applyFanWhirl();
    beginDijiangSwing();
    for (let i = 0; i < hits.length; i++) hitEnemy(hits[i], playerAtk(), { knockback: 2.2, facing: hero.facing });
    playWeaponAnim("fan");
    return true;
  }

  function loseLifeAndRespawn(delay = 450) {
    if (gameOver || hero.dead) return;
    hero.dead = true;
    if (relicFx.xiaotianTrial) relicFx.xiaotianDied = true;
    heroLives = Math.max(0, heroLives - 1);
    renderLives();
    flashPortraitOnLifeLost();
    sfxLifeLost();
    if (heroLives <= 0) {
      if (trySunwukongSave()) {
        setTimeout(() => {
          if (gameOver) return;
          relicFx.gourdUsedThisLife = 0;
          renderHp();
          resetHeroOnTrack();
        }, delay);
        return;
      }
      /* 立刻弹出全屏结算页，不用底部 toast */
      openGameOver("lives");
      return;
    }
    showToast(`剩余命数 x${heroLives}`, 900);
    setTimeout(() => {
      if (gameOver) return;
      relicFx.gourdUsedThisLife = 0;
      hero.hp = heroMaxHp();
      renderHp();
      resetHeroOnTrack();
    }, delay);
  }

  /** 已关闭自动攻击：保留空函数以免旧调用报错 */
  function tryAutoAttacks() {
    return;
  }

  function takeDamage(amount, opts) {
    if (hero.dead) return;
    if (performance.now() < (hero.spawnGraceUntil || 0)) return;
    if ((hero.iframeLeft || 0) > 0) return;
    if (tianmaThrustActive()) return;
    if (dashBurstActive() || comboThrustActive()) interruptHeroThrust();
    if ((hero.strikeGapLeft || 0) > 0) return;
    hero.hp = Math.max(0, hero.hp - amount);
    hero.strikeGapLeft = HERO_HIT_STRIKE_GAP_MS;
    const stunned = (hero.hitFlashLeft || 0) > 0;
    if (stunned) {
      hero.hitShakeLeft = Math.max(hero.hitShakeLeft || 0, 180);
    } else {
      beginHeroHit();
    }
    renderHp();
    if (opts && opts.hitSfx === "zhuHit") sfxZhuHit();
    else sfxHeroHurt();
    if (hero.hp <= 0) {
      loseLifeAndRespawn(450);
    }
  }

  function clearHeroHit() {
    hero.hurtFrames = 0;
    hero.iframeLeft = 0;
    hero.strikeGapLeft = 0;
    hero.pendingProtect = false;
    hero.hitFlashLeft = 0;
    hero.hitShakeLeft = 0;
    hero.hitJitterX = 0;
    hero.hitJitterY = 0;
    if (runner) runner.classList.remove("is-hurt", "is-hit-flash");
    if (comboStage) comboStage.classList.remove("is-hurt", "is-hit-flash", "is-stun");
  }

  function heroStunned() {
    return (hero.hitFlashLeft || 0) > 0;
  }

  function beginHeroHit() {
    const now = performance.now();
    hero.iframeLeft = 0;
    hero.strikeGapLeft = HERO_HIT_STRIKE_GAP_MS;
    hero.pendingProtect = true;
    hero.hitFlashLeft = HERO_HIT_FLASH_MS;
    hero.hitShakeLeft = HERO_HIT_FLASH_MS;
    hero.hitFlashOn = true;
    hero.hurtFrames = 1;
    cancelHeroDash();
    hero.vx = 0;
    hero.moveDirX = 0;
    hero.moveDirY = 0;
    if (runner) {
      runner.classList.add("is-hurt");
      runner.classList.remove("is-hit-flash");
    }
    if (comboStage) {
      comboStage.classList.add("is-hurt", "is-stun");
      comboStage.classList.remove("is-hit-flash");
    }
    if (window.SwordCombat && SwordCombat.interruptHit) SwordCombat.interruptHit();
    if (window.SwordCamera) {
      SwordCamera.triggerShake("hurt", now, {
        amp: 16,
        ms: HERO_HIT_FLASH_MS,
        kind: "wave",
        facing: -(hero.facing || 1),
      });
    }
  }

  function tickHeroHit(dtMs) {
    const dt = Math.max(0, dtMs || 0);
    if (hero.strikeGapLeft > 0) {
      hero.strikeGapLeft -= dt;
      if (hero.strikeGapLeft < 0) hero.strikeGapLeft = 0;
    }
    if (hero.hitFlashLeft > 0) {
      hero.hitFlashLeft -= dt;
      const elapsed = HERO_HIT_FLASH_MS - Math.max(0, hero.hitFlashLeft);
      hero.hitFlashOn = heroHitFlashOn(elapsed);
      if (hero.hitFlashLeft <= 0) {
        hero.hitFlashLeft = 0;
        hero.hitFlashOn = false;
        if (runner) runner.classList.remove("is-hit-flash");
        if (comboStage) comboStage.classList.remove("is-hit-flash", "is-stun");
        if (hero.pendingProtect) {
          hero.pendingProtect = false;
          hero.iframeLeft = HERO_HIT_PROTECT_MS;
        }
      }
    }
    if (hero.iframeLeft > 0) {
      hero.iframeLeft -= dt;
      if (hero.iframeLeft <= 0) {
        hero.iframeLeft = 0;
        hero.hurtFrames = 0;
        if (runner) runner.classList.remove("is-hurt");
        if (comboStage) comboStage.classList.remove("is-hurt");
      }
    }
    if (hero.hitShakeLeft > 0) {
      hero.hitShakeLeft -= dt;
      const t = 1 - Math.max(0, hero.hitShakeLeft) / HERO_HIT_FLASH_MS;
      const damp = (1 - t) * (1 - t);
      const w = (HERO_HIT_FLASH_MS - Math.max(0, hero.hitShakeLeft)) * 0.074;
      hero.hitJitterX = Math.sin(w * 1.7) * 11 * damp;
      hero.hitJitterY = Math.cos(w * 2.15) * 6 * damp;
      if (hero.hitShakeLeft <= 0) {
        hero.hitShakeLeft = 0;
        hero.hitJitterX = 0;
        hero.hitJitterY = 0;
      }
    } else {
      hero.hitJitterX = 0;
      hero.hitJitterY = 0;
    }
  }

  function defeatBoss(boss) {
    if (boss.dead) return;
    if (hero.rideZhu === boss) {
      hero.rideZhu = null;
      if (hero.jumpLock <= 0) hero.onGround = false;
    }
    boss.dead = true;
    boss.el.classList.add("is-dead");
    if (boss.kind === "gou") renderGouHud(null);
    dropCoinsFromBoss(boss);
    sfxHit();
    setTimeout(() => {
      if (boss.el.isConnected) boss.el.remove();
    }, 360);
  }

  const HIT_FLASH_ON_MS = 140;
  const HIT_FLASH_GAP_MS = 50;

  function setEnemyFlashSprite(boss, on) {
    if (!boss || !boss.el) return;
    boss.el.classList.toggle("is-hit-flash", !!on);
  }

  function playNextEnemyFlash(boss) {
    const el = boss && boss.el;
    if (!el || !el.isConnected || (boss.flashLeft || 0) <= 0) {
      if (boss) {
        boss.flashPlaying = false;
        boss.flashLeft = 0;
        setEnemyFlashSprite(boss, false);
      }
      return;
    }
    boss.flashPlaying = true;
    boss.flashLeft -= 1;
    setEnemyFlashSprite(boss, false);
    void el.offsetWidth;
    setEnemyFlashSprite(boss, true);
    if (boss._flashTimer) clearTimeout(boss._flashTimer);
    boss._flashTimer = setTimeout(() => {
      setEnemyFlashSprite(boss, false);
      boss._flashTimer = setTimeout(() => playNextEnemyFlash(boss), HIT_FLASH_GAP_MS);
    }, HIT_FLASH_ON_MS);
  }

  function heroHitFlashOn(elapsedMs) {
    return Math.floor(elapsedMs / HERO_HIT_FLASH_STEP_MS) % 2 === 0;
  }

  function flashGouHit(boss) {
    if (!boss || !boss.el) return;
    if (boss.flashEl && GOU_FLASH_SRC) boss.flashEl.src = GOU_FLASH_SRC;
    if (boss._flashTimer) clearTimeout(boss._flashTimer);
    boss.flashPlaying = true;
    boss.flashAt = performance.now();
    const step = () => {
      if (!boss.el || !boss.el.isConnected) {
        boss.flashPlaying = false;
        return;
      }
      const elapsed = performance.now() - boss.flashAt;
      if (elapsed >= HERO_HIT_FLASH_MS) {
        boss.flashPlaying = false;
        setEnemyFlashSprite(boss, false);
        return;
      }
      setEnemyFlashSprite(boss, heroHitFlashOn(elapsed));
      boss._flashTimer = setTimeout(step, 16);
    };
    step();
  }

  function flashEnemyHit(boss) {
    if (!boss || !boss.el) return;
    if (boss.kind === "gou") {
      flashGouHit(boss);
      return;
    }
    boss.flashLeft = (boss.flashLeft || 0) + 1;
    if (!boss.flashPlaying) playNextEnemyFlash(boss);
  }

  function clearEnemyAttackVisual(boss) {
    if (!boss) return;
    if (boss._thrustClear) {
      clearTimeout(boss._thrustClear);
      boss._thrustClear = 0;
    }
    if (boss.el) boss.el.classList.remove("is-thrusting", "is-charging");
    if (boss.weaponHoldEl) {
      boss.weaponHoldEl.classList.remove("is-thrusting", "is-charging");
      boss.weaponHoldEl.style.removeProperty("animation-duration");
    }
  }

  function cancelEnemyThrust(boss) {
    if (!boss) return;
    clearEnemyAttackVisual(boss);
    boss.thrustAt = 0;
    boss.atkPhase = "idle";
    boss.atkPhaseAt = 0;
    boss.chargeUntil = 0;
    boss.atkHit = false;
    boss._gouPunish = false;
    boss.lungeFromX = null;
    boss.lungeToX = null;
    syncZhuAttackSprite(boss);
  }

  function heroIsComboing() {
    if (window.SwordCombat && SwordCombat.ready && SwordCombat.isBusy && SwordCombat.isBusy()) {
      return true;
    }
    if (swordCombo && swordCombo.attacking) return true;
    if ((hero.swordAnimFrames || 0) > 0) return true;
    return !!(runner && runner.classList.contains("is-attacking"));
  }

  function gouIsAttacking(e) {
    return !!(e && (e.atkPhase === "charge" || e.atkPhase === "thrust"));
  }

  function gouFightThroughHit(e) {
    return !!(e && e.kind === "gou" && !e.dead && (gouIsAttacking(e) || heroIsComboing()));
  }

  function tryGouComboPunish(e, now) {
    if (!e || e.kind !== "gou" || e.dead || e.hp <= 0) return false;
    if (hero.dead || !running || paused || inShop) return false;
    if (loadingPage && !loadingPage.hidden) return false;
    if (!heroIsComboing() || gouIsAttacking(e)) return false;
    const t = now != null ? now : performance.now();
    if (t < (e.gouPunishUntil || 0)) return false;
    if (Math.abs((hero.y || 0) - (e.y || 0)) > 100) return false;
    if (Math.abs(hero.x - e.x) > GOU_PUNISH_RANGE) return false;
    e.hurtFrames = 0;
    e.stunnedUntil = 0;
    e.hitDir = 0;
    e.vx = 0;
    e.gouPunishUntil = t + GOU_PUNISH_CD_MS;
    e._gouPunish = true;
    e._gouNeedCharge = false;
    e._gouPlantX = null;
    setBossFacing(e, hero.x >= e.x ? 1 : -1, true);
    beginEnemyThrust(e, t);
    return true;
  }

  function hurtBoss(boss, amount, opts) {
    if (boss.dead) return;
    const knock = opts && opts.knockback != null ? opts.knockback : 1.2;
    const pushDir = (opts && opts.facing != null ? opts.facing : hero.facing || 1) < 0 ? -1 : 1;
    let dmg = amount;
    if (hasZijinHulu() && boss.kind === "tianbing") dmg *= 2;
    if (boss.kind === "gou") dmg = Math.max(1, dmg * (1 - GOU_DR));
    boss.hp = Math.max(0, boss.hp - dmg);
    applyKunxiansuoOnHit(boss);
    flashEnemyHit(boss);
    sfxHit();
    renderBossHp(boss);
    if (boss.hp <= 0) {
      cancelEnemyThrust(boss);
      defeatBoss(boss);
      return;
    }
    if (boss.kind === "gou" && gouFightThroughHit(boss)) {
      boss.hurtFrames = 0;
      boss.stunnedUntil = 0;
      boss.hitDir = 0;
      if (!gouIsAttacking(boss)) {
        boss.vx *= 0.35;
        tryGouComboPunish(boss, performance.now());
      }
      return;
    }
    boss.hurtFrames = Math.max(BOSS_HURT_FRAMES, 28 + ((knock * 4) | 0));
    boss.stunnedUntil = performance.now() + 480;
    boss.hitDir = pushDir;
    boss.vx = pushDir * (5.2 + knock * 1.4);
    boss.vy = 0;
    setBossFacing(boss, -pushDir, true);
    boss.gapLock = 0;
    const surface = surfaceAt(boss.x);
    if (surface != null) {
      boss.y = surface + ENEMY_Y_NUDGE;
      boss.onGround = true;
    }
    cancelEnemyThrust(boss);
  }

  function applyActorPhysics(actor, halfW, yNudge = 0, opts) {
    const prevY = actor.y;
    const prevX = actor.x;
    const wasGrounded = actor.onGround;
    const dt = physScale(opts && opts.dtMs);
    actor.vy -= GRAVITY * dt;
    actor.y += actor.vy * dt;
    /* vxSnap：本帧位移已按目标点算好（恶犬扑咬插值），不再乘 dt */
    actor.x += actor.vx * (opts && opts.vxSnap ? 1 : dt);
    clampActorX(actor);

    /* 人物贴地走、Y 跟台面；台阶墙只留给敌人，否则走下一级就回不去左边 */
    if (wasGrounded && actor.vy <= 0 && !(opts && opts.skipLedges)) {
      resolveLedgeWalls(actor, halfW, yNudge, prevX);
    }

    const feetLeft = actor.x - halfW;
    const feetRight = actor.x + halfW;
    if (actor.jumpLock > 0) actor.jumpLock -= dt;
    actor.onGround = false;
    if (actor === hero && hero.jumpLock <= 0) hero.rideZhu = null;
    if (actor.vy <= 0 && !(actor.jumpLock > 0)) {
      const surface = findLandingSurface(
        prevY - yNudge,
        actor.y - yNudge,
        feetLeft,
        feetRight
      );
      const zhuLand = actor === hero ? findZhuLanding(prevY, actor.y, feetLeft, feetRight) : null;
      let landY = null;
      let onZhu = null;
      if (zhuLand && (surface == null || zhuLand.y >= surface - 1)) {
        landY = zhuLand.y;
        onZhu = zhuLand.e;
      } else if (surface != null && !(actor === hero && !hasWalkSupport(actor.x, halfW, surface))) {
        landY = surface + yNudge;
      }
      if (landY != null) {
        actor.y = landY;
        actor.vy = 0;
        actor.onGround = true;
        if (onZhu) hero.rideZhu = onZhu;
        if (actor === hero && !wasGrounded && hero.pendingLandSfx) {
          hero.pendingLandSfx = false;
          sfxLand();
        }
      }
    }
  }

  function zhuHoverY(e) {
    const g = surfaceAt(e.x);
    if (g != null) return g + ZHU_HOVER;
    if (e.hoverBase != null) return e.hoverBase;
    return e.y;
  }

  function tickZhu(e) {
    if (!e || e.dead || e.kind !== "zhu") return;
    e.atkPhase = "idle";
    e.vy = 0;
    e.onGround = false;
    e.jumpsLeft = 0;
    const dt = physScale();
    if (e.hurtFrames > 0) e.hurtFrames -= dt;
    if (!e.patrolDir) e.patrolDir = 1;
    const prevX = e.x;
    e.vx = e.patrolDir * ZHU_FLY;
    e.x += e.vx * dt;
    const pad = Math.max(32, zhuDrawW(e) * 0.28);
    const lo = arenaMinX() + pad;
    const hi = arenaMaxX() - pad;
    if (e.x >= hi) {
      e.x = hi;
      e.patrolDir = -1;
    } else if (e.x <= lo) {
      e.x = lo;
      e.patrolDir = 1;
    }
    setBossFacing(e, e.patrolDir, true);
    e.y = e.hoverBase != null ? e.hoverBase : zhuHoverY(e);
    e.targetX = e.x;
    if (hero.rideZhu === e && !hero.dead && hero.jumpLock <= 0) {
      hero.x += e.x - prevX;
      clampActorX(hero);
      const deck = zhuDeckY(e, hero.x);
      if (deck != null) {
        hero.y = deck;
        hero.vy = 0;
        hero.onGround = true;
      } else {
        hero.rideZhu = null;
        hero.onGround = false;
      }
    }
    syncZhuAttackSprite(e);
    syncBossEl(e);
  }

  function tickAllZhu() {
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e && !e.dead && e.kind === "zhu") tickZhu(e);
    }
  }

  function updateBosses(opts) {
    const gouOnly = opts && opts.gouOnly;
    const camX = window.SwordCamera ? SwordCamera.getX() : runScroll.world;
    const viewW = viewWidth();
    const cullL = camX - 260;
    const cullR = camX + viewW + 260;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead) continue;

      if (e.kind === "zhu") continue;
      if (gouOnly && e.kind !== "gou") continue;

      const busy =
        e.atkPhase === "charge" ||
        e.atkPhase === "thrust" ||
        e.hurtFrames > 0;
      const onScreen = busy || (e.x > cullL && e.x < cullR);
      if (e.el) {
        if (!onScreen) {
          if (!e._culled) {
            e._culled = true;
            e.el.style.visibility = "hidden";
          }
          continue;
        }
        if (e._culled) {
          e._culled = false;
          e.el.style.visibility = "";
        }
      }

      const dxHero = hero.x - e.x;
      const dyHero = hero.y - e.y;
      const distX = Math.abs(dxHero);
      const aggro =
        !hero.dead &&
        running &&
        !paused &&
        !inShop &&
        !(loadingPage && !loadingPage.hidden);

      const dt = physScale();
      if (e.gapLock > 0) e.gapLock -= dt;
      if (e.jumpCd > 0) e.jumpCd -= dt;

      const chaseDir = dxHero < 0 ? -1 : 1;
      const gapAheadFace = e.onGround ? bossGapDist(e, e.facing) : 0;
      const gapTowardHero =
        e.onGround && aggro ? bossGapDist(e, chaseDir) : 0;
      const heroAcrossGap =
        aggro && distX < 380 && pathHasGapBetween(e.x, hero.x);

      if (e.hurtFrames > 0 || performance.now() < (e.stunnedUntil || 0)) {
        if (gouFightThroughHit(e)) {
          if (e.hurtFrames > 0) e.hurtFrames -= dt;
          e.stunnedUntil = 0;
          e.hitDir = 0;
        } else {
          if (e.hurtFrames > 0) e.hurtFrames -= dt;
          if (e.hitDir) e.vx = e.hitDir * Math.max(0, Math.abs(e.vx)) * Math.pow(0.9, dt);
          else e.vx *= Math.pow(0.88, dt);
          if (Math.abs(e.vx) < 0.12) e.vx = 0;
          const hurtPrevX = e.x;
          applyActorPhysics(e, enemyHalfW(e), ENEMY_Y_NUDGE, gouSkipLedges(e) ? { skipLedges: true, vxSnap: e.atkPhase === "thrust" } : undefined);
          keepGouOnFloor(e, hurtPrevX);
          if (e.onGround) {
            e.jumpsLeft = MAX_JUMPS;
            e.airCatchUsed = false;
            e.gapCrossDir = 0;
            const planted = surfaceAt(e.x);
            if (planted != null) {
              e.y = planted + ENEMY_Y_NUDGE;
              e.vy = 0;
            }
          }
          tickGouWalk(e);
          syncBossEl(e);
          continue;
        }
      }
      if (e.atkPhase === "charge") {
        e.vx = 0;
        e.targetX = e.x;
      } else if (e.atkPhase === "thrust") {
        if (e.kind === "gou") {
          tickGouLunge(e);
          e.targetX = e.lungeToX != null ? e.lungeToX : hero.x;
        } else if (e.kind === "zhu") {
          e.vx = (e.facing || 1) * ZHU_LUNGE;
          e.targetX = e.x + (e.facing || 1) * 96;
        } else {
          e.vx = 0;
          e.targetX = e.x;
        }
      } else if (e.kind === "gou") {
        steerGou(e, chaseDir, aggro);
      } else if (e.gapLock > 0) {
        setBossFacing(e, chaseDir);
        e.vx = e.facing * BOSS_CHASE;
        e.targetX = hero.x;
        if (e.onGround) tryBossLeapToward(e, chaseDir);
      } else if (
        e.onGround &&
        ((gapAheadFace > 0 && gapAheadFace <= 56) ||
          (gapTowardHero > 0 && gapTowardHero <= 72) ||
          heroAcrossGap)
      ) {
        if (!tryBossLeapToward(e, chaseDir)) {
          setBossFacing(e, chaseDir);
          e.vx = e.facing * BOSS_CHASE;
          e.targetX = hero.x;
        }
      } else if (aggro) {
        setBossFacing(e, chaseDir);
        e.think = 6;
        const needClimb = hero.y > e.y + 8;
        e.targetX = hero.x;
        const attackGap = e.kind === "gou" ? enemyHalfW(e) : BOSS_ATTACK_GAP;
        if (e.kind === "gou" && !needClimb && gouCanPlantForAttack(e)) {
          setBossFacing(e, hero.x >= e.x ? 1 : -1, true);
          e.vx = 0;
        } else if (distX > attackGap || needClimb) {
          e.vx = e.facing * BOSS_CHASE;
        } else {
          e.vx = e.facing * BOSS_CHASE * 0.35;
        }
      } else {
        e.think -= 1;
        if (e.think <= 0) {
          const roll = Math.random();
          if (roll < 0.28) {
            e.vx = 0;
            e.think = 25 + ((Math.random() * 35) | 0);
          } else {
            e.targetX = pickBossTargetX(e);
            e.think = 45 + ((Math.random() * 55) | 0);
          }
        }
        const dx = e.targetX - e.x;
        if (Math.abs(dx) > 8) {
          setBossFacing(e, dx < 0 ? -1 : 1);
          e.vx = e.facing * BOSS_MOVE;
        } else {
          e.vx = 0;
        }
      }

      /* 前方更高台阶：跳上去（gap 已在上方优先处理） */
      if (
        e.kind !== "gou" &&
        e.onGround &&
        e.hurtFrames <= 0 &&
        e.gapLock <= 0 &&
        e.atkPhase !== "charge" &&
        e.atkPhase !== "thrust"
      ) {
        const here = surfaceAt(e.x);
        let rise = 0;
        const climb = bossClimbReach(e);
        if (here != null && bossGapDist(e, e.facing) <= 0) {
          for (let d = 6; d <= climb; d += 6) {
            const next = surfaceAt(e.x + e.facing * d);
            if (next == null) break;
            if (next > here + MAX_WALK_STEP) rise = Math.max(rise, next - here);
          }
          for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            if (p.h <= here + MAX_WALK_STEP) continue;
            if (e.facing > 0) {
              const edge = p.x;
              if (edge >= e.x - 2 && edge <= e.x + climb) {
                rise = Math.max(rise, p.h - here);
              }
            } else {
              const edge = p.x + p.w;
              if (edge <= e.x + 2 && edge >= e.x - climb) {
                rise = Math.max(rise, p.h - here);
              }
            }
          }
          if (rise > 0) {
            tryBossJump(e);
            if (Math.abs(e.vx) < 0.4) e.vx = e.facing * BOSS_CHASE;
          }
        }
      }

      const walkMul = enemyWalkMul(e);
      if (walkMul !== 1 && !((e.kind === "zhu" || e.kind === "gou") && e.atkPhase === "thrust")) e.vx *= walkMul;
      const movePrevX = e.x;
      applyActorPhysics(
        e,
        enemyHalfW(e),
        ENEMY_Y_NUDGE,
        gouSkipLedges(e) ? { skipLedges: true, vxSnap: e.atkPhase === "thrust" } : undefined
      );
      keepGouOnFloor(e, movePrevX);
      if (e.kind === "gou") {
        if (!gouCanPlantForAttack(e) || gouNearStepFace(e, e.facing || chaseDir)) e._gouPlantX = null;
      }
      if (
        e.kind === "gou" &&
        e.onGround &&
        e.atkPhase === "idle" &&
        !gouNearStepFace(e, e.facing || chaseDir) &&
        e._gouPlantX != null &&
        gouCanPlantForAttack(e) &&
        gouNoseGapToHero(e) > GOU_SKIP_CHARGE_GAP
      ) {
        e.x = e._gouPlantX;
        e.vx = 0;
      }
      if (e.kind === "gou" && !e.onGround) tryGouAirCatch(e, chaseDir);
      if (e.onGround) {
        e.jumpsLeft = MAX_JUMPS;
        e.airCatchUsed = false;
        e.gapCrossDir = 0;
      }
      if (e.kind === "gou" && e.onGround && !gouNearStepFace(e, e.facing || chaseDir)) {
        e.stairHops = 0;
        e.stairLeap = false;
      }

      /* 贴地撞上更高立面 → 跳；脚前空洞 → gap 优先掉头 */
      if (
        e.kind !== "gou" &&
        e.onGround &&
        e.hurtFrames <= 0 &&
        e.atkPhase !== "charge" &&
        e.atkPhase !== "thrust"
      ) {
        const here = surfaceAt(e.x);
        const nose = e.x + e.facing * (enemyHalfW(e) + 20);
        const next = surfaceAt(nose);
        if (here != null && next != null && next > here + MAX_WALK_STEP) {
          tryBossJump(e);
          e.vx = e.facing * BOSS_CHASE;
        } else if (here != null && (next == null || bossGapDist(e, e.facing) > 0)) {
          if (!tryBossLeapToward(e, chaseDir)) {
            setBossFacing(e, chaseDir);
            e.vx = e.facing * BOSS_CHASE;
          }
        }
      }

      if (e.y < -120) {
        defeatBoss(e);
        continue;
      }

      tickGouWalk(e);
      syncBossEl(e);
    }
  }

  const ENEMY_CHARGE_MS = 480;
  const ENEMY_THRUST_MS = 320;
  const ENEMY_RECOVER_MS = 720;
  const ENEMY_STRIKE_RANGE = 236;
  const ENEMY_STRIKE_Y = 86;
  const ZHU_STRIKE_RANGE = 118;

  function enemyStrikeRange(enemy) {
    if (enemy && enemy.kind === "gou") return GOU_CHARGE_GAP;
    return enemy && enemy.kind === "zhu" ? ZHU_STRIKE_RANGE : ENEMY_STRIKE_RANGE;
  }

  function weaponOverlapsHero(enemy) {
    if (!enemy || !runner) return false;
    const dx = (hero.x - enemy.x) * (enemy.facing || 1);
    const dy = Math.abs((hero.y || 0) - (enemy.y || 0));
    return dx > -28 && dx < enemyStrikeRange(enemy) && dy < ENEMY_STRIKE_Y;
  }

  function weaponStrikeHitsHero(enemy) {
    if (!enemy) return false;
    const dx = (hero.x - enemy.x) * (enemy.facing || 1);
    const dy = Math.abs((hero.y || 0) - (enemy.y || 0));
    if (enemy.kind === "gou") {
      const reach = enemy._gouPunish ? 88 : 56;
      return Math.abs(hero.x - enemy.x) < reach && dy < ENEMY_STRIKE_Y;
    }
    if (enemy.kind === "zhu") {
      return dx > -40 && dx < enemyStrikeRange(enemy) + 36 && dy < ENEMY_STRIKE_Y;
    }
    return dx > 28 && dx < enemyStrikeRange(enemy) && dy < ENEMY_STRIKE_Y;
  }

  function gouFacingHero(e) {
    const facing = e.facing || 1;
    return facing === (hero.x >= e.x ? 1 : -1);
  }

  function gouSpriteDispH(e) {
    const dispW = gouDrawW(e);
    if (gouMask && gouMask.w) return gouMask.h * (dispW / gouMask.w);
    return (e && e.h) || 260;
  }

  function gouNoseFrontX(e) {
    if (!e) return null;
    const facing = e.facing || 1;
    const edges = gouOpaqueEdges(e, e.y - 2, e.y + gouSpriteDispH(e) + 2);
    if (edges) return facing > 0 ? edges.right : edges.left;
    if (!gouMask) {
      const dispW = gouDrawW(e);
      const inset = dispW * (247 / 1254);
      return facing > 0 ? e.x + dispW * 0.5 - inset : e.x - dispW * 0.5 + inset;
    }
    return null;
  }

  function gouNoseGapToHero(e) {
    const front = gouNoseFrontX(e);
    if (front == null) return Infinity;
    if ((e.facing || 1) > 0) return hero.x - front;
    return front - hero.x;
  }

  function gouCanPlantForAttack(e) {
    if (!e || hero.dead || !gouFacingHero(e)) return false;
    /* 贴图很宽，只用鼻尖会在整屏外就判定可贴身，从而一出生直接扑到左端 */
    if (Math.abs(hero.x - e.x) > 150) return false;
    return gouNoseGapToHero(e) <= GOU_ENGAGE_GAP;
  }

  function enemyInStrikeRange(enemy) {
    if (hero.dead || !running || paused || inShop) return false;
    if (loadingPage && !loadingPage.hidden) return false;
    const dx = (hero.x - enemy.x) * (enemy.facing || 1);
    const dy = Math.abs((hero.y || 0) - (enemy.y || 0));
    if (enemy.kind === "gou") {
      if (!enemy.onGround) return false;
      const toward = hero.x >= enemy.x ? 1 : -1;
      if (gouNearStepFace(enemy, toward)) return false;
      return gouCanPlantForAttack(enemy);
    }
    return dx > -16 && dx < enemyStrikeRange(enemy) && dy < ENEMY_STRIKE_Y;
  }

  function tickGouLunge(e) {
    if (!e) return;
    const from = e.lungeFromX;
    const to = e.lungeToX;
    if (from == null || to == null) {
      e.vx = (e.facing || 1) * GOU_LUNGE;
      return;
    }
    const dur = Math.max(1, enemyPhaseMs(ENEMY_THRUST_MS, e));
    const t = Math.min(1, Math.max(0, (performance.now() - (e.atkPhaseAt || 0)) / dur));
    const u = 1 - (1 - t) * (1 - t);
    e.vx = from + (to - from) * u - e.x;
  }

  function tickGouWalk(e) {
    if (!e || e.kind !== "gou" || e.dead) return;
    syncZhuAttackSprite(e);
  }

  function syncZhuAttackSprite(enemy) {
    if (!enemy || !enemy.spriteEl) return;
    let src = "";
    if (enemy.kind === "zhu") {
      src = ZHU_SRC;
    } else if (enemy.kind === "gou") {
      if (enemy.atkPhase === "charge") src = GOU_XULI_SRC;
      else if (enemy.atkPhase === "thrust") src = GOU_GONGJI_SRC;
      else src = GOU_SRC;
    } else {
      return;
    }
    const cur = enemy.spriteEl.getAttribute("src") || enemy.spriteEl.src || "";
    const name = (u) => String(u).split("?")[0].split("/").pop();
    if (name(cur) !== name(src)) enemy.spriteEl.src = src;
  }

  function playEnemyCharge(enemy) {
    if (!enemy || !enemy.el) return;
    clearEnemyAttackVisual(enemy);
    enemy.el.classList.add("is-charging");
    if (enemy.kind === "zhu" || enemy.kind === "gou") {
      syncZhuAttackSprite(enemy);
    } else if (enemy.weaponHoldEl) {
      const hold = enemy.weaponHoldEl;
      void hold.offsetWidth;
      hold.classList.add("is-charging");
      hold.style.animationDuration = `${enemyPhaseMs(ENEMY_CHARGE_MS, enemy)}ms`;
    }
    sfxEnemyCharge();
  }

  function playEnemyThrust(enemy) {
    if (!enemy || !enemy.el) return;
    clearEnemyAttackVisual(enemy);
    enemy.el.classList.add("is-thrusting");
    const thrustMs = enemyPhaseMs(ENEMY_THRUST_MS, enemy);
    if (enemy.kind === "zhu" || enemy.kind === "gou") {
      syncZhuAttackSprite(enemy);
      enemy.vx = (enemy.facing || 1) * (enemy.kind === "gou" ? GOU_LUNGE : ZHU_LUNGE);
    } else if (enemy.weaponHoldEl) {
      const hold = enemy.weaponHoldEl;
      void hold.offsetWidth;
      hold.classList.add("is-thrusting");
      hold.style.animationDuration = `${thrustMs}ms`;
      if (enemy._thrustClear) clearTimeout(enemy._thrustClear);
      enemy._thrustClear = setTimeout(() => {
        if (enemy.el) enemy.el.classList.remove("is-thrusting");
        hold.classList.remove("is-thrusting");
        enemy._thrustClear = 0;
      }, thrustMs);
    }
    sfxEnemySlash();
  }

  function beginEnemyCharge(enemy, now) {
    if (enemy && enemy.kind === "gou") {
      const gap = gouNoseGapToHero(enemy);
      const skip = gap <= GOU_SKIP_CHARGE_GAP && !enemy._gouNeedCharge;
      enemy._gouNeedCharge = false;
      enemy._gouPlantX = null;
      if (skip) {
        beginEnemyThrust(enemy, now);
        return;
      }
    }
    enemy.atkPhase = "charge";
    enemy.atkPhaseAt = now;
    enemy.chargeUntil = now + Math.max(1, enemyPhaseMs(ENEMY_CHARGE_MS, enemy));
    enemy.thrustAt = now;
    enemy.atkHit = false;
    playEnemyCharge(enemy);
    syncZhuAttackSprite(enemy);
  }

  function beginEnemyThrust(enemy, now) {
    enemy.atkPhase = "thrust";
    enemy.atkPhaseAt = now;
    enemy.thrustAt = now;
    enemy.atkHit = false;
    if (enemy.kind === "gou") {
      const face = hero.x >= enemy.x ? 1 : -1;
      setBossFacing(enemy, face, true);
      enemy.lungeFromX = enemy.x;
      let dest = hero.x;
      const span = dest - enemy.x;
      const maxSpan = enemy._gouPunish ? 200 : 140;
      const minSpan = enemy._gouPunish ? 96 : 80;
      if (Math.abs(span) > maxSpan) dest = enemy.x + (span > 0 ? maxSpan : -maxSpan);
      if (Math.abs(dest - enemy.x) < minSpan) dest = enemy.x + face * minSpan;
      enemy.lungeToX = dest;
    }
    playEnemyThrust(enemy);
    syncZhuAttackSprite(enemy);
  }

  function beginEnemyRecover(enemy, now) {
    enemy.atkPhase = "recover";
    enemy.atkPhaseAt = now;
    enemy._gouPunish = false;
    clearEnemyAttackVisual(enemy);
    syncZhuAttackSprite(enemy);
  }

  function updateEnemyAttacks(now, opts) {
    const gouOnly = opts && opts.gouOnly;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.dead || e.kind === "zhu") continue;
      if (gouOnly && e.kind !== "gou") continue;
      if (e._culled && e.atkPhase !== "charge" && e.atkPhase !== "thrust") continue;
      if (enemiesPacified(now, e)) {
        if (e.atkPhase === "charge" || e.atkPhase === "thrust") cancelEnemyThrust(e);
        continue;
      }
      if (e.kind === "gou" && tryGouComboPunish(e, now)) continue;
      if ((e.hurtFrames > 0 || now < (e.stunnedUntil || 0)) && !gouFightThroughHit(e)) continue;
      const phase = e.atkPhase || "idle";
      const elapsed = now - (e.atkPhaseAt || 0);
      if (phase === "charge") {
        const chargeDone =
          e.chargeUntil != null
            ? now >= e.chargeUntil
            : elapsed >= enemyPhaseMs(ENEMY_CHARGE_MS, e);
        if (chargeDone) beginEnemyThrust(e, now);
        continue;
      }
      if (phase === "thrust") {
        if (!e.atkHit && weaponStrikeHitsHero(e)) {
          e.atkHit = true;
          takeDamage(e.atk || bossAtkForStage(stage), e.kind === "zhu" ? { hitSfx: "zhuHit" } : null);
        }
        if (elapsed >= enemyPhaseMs(ENEMY_THRUST_MS, e)) beginEnemyRecover(e, now);
        continue;
      }
      if (phase === "recover") {
        if (elapsed >= enemyPhaseMs(ENEMY_RECOVER_MS, e)) {
          e.atkPhase = "idle";
          e.atkPhaseAt = 0;
        }
        continue;
      }
      if (enemyInStrikeRange(e)) beginEnemyCharge(e, now);
    }
  }

  function knifeTouchesEnemy(enemy) {
    if (selected !== "blue" || !enemy || enemy.dead) return false;
    if (hero.swordAnimFrames <= 0 || !runner.classList.contains("is-thrusting")) {
      return false;
    }
    const dx = (enemy.x - hero.x) * (hero.facing || 1);
    const dy = Math.abs((enemy.y || 0) - (hero.y || 0));
    return dx > 8 && dx < swordReach() && dy < (enemy.kind === "zhu" ? ZHU_HIT_DY : 80);
  }

  function updateCombat(heroW) {
    const now = performance.now();
    updateSwordCombo(now);
    tickWeaponAnims();
    tickHeroHit(Math.min(48, now - (hero._hitTickAt || now)));
    hero._hitTickAt = now;
    tickSpawnGrace(now);

    tryAutoAttacks(heroW);

    const frozen =
      (window.SwordHitstop && SwordHitstop.active()) || now < swordCombo.hitStopUntil;
    if (frozen) updateEnemyAttacks(now, { gouOnly: true });
    else updateEnemyAttacks(now);
  }

  function collectCoins() {
    const hx = hero.x;
    const hy = hero.y + 44;
    for (const c of coins) {
      if (c.got || c.hudFly) continue;
      if (c.magnet) {
        const dx = hx - c.x;
        const dy = hy - c.y;
        const dist = Math.hypot(dx, dy) || 1;
        const step = Math.min(dist, Math.max(18, dist * 0.42));
        c.x += (dx / dist) * step;
        c.y += (dy / dist) * step;
        c.el.style.transform = `translate3d(${(c.x + 0.5) | 0}px, ${-((c.y + 0.5) | 0)}px, 0)`;
      }
      if (Math.abs(c.x - hx) < 52 && Math.abs(c.y - hy) < 62) {
        flyCoinToHud(c, 0);
      }
    }
  }

  function startStageFromUrl() {
    try {
      const n = new URLSearchParams(location.search).get("stage") | 0;
      return n > 0 ? n : 1;
    } catch (_) {
      return 1;
    }
  }

  function previewGouFromUrl() {
    try {
      return new URLSearchParams(location.search).has("gou");
    } catch (_) {
      return false;
    }
  }

  function previewShopFromUrl() {
    try {
      return new URLSearchParams(location.search).has("shop");
    } catch (_) {
      return false;
    }
  }

  function previewCatalogFromUrl() {
    try {
      return new URLSearchParams(location.search).has("catalog");
    } catch (_) {
      return false;
    }
  }

  function initTrack() {
    newRunSeed();
    clearTrack();
    hero.hp = MAX_HP;
    hero.x = 180;
    renderHp();
    beginStage(startStageFromUrl(), true);
  }

  async function replacePunched(imgEl) {
    const threshold = Number(imgEl.dataset.punch);
    if (!threshold) return;
    try {
      const src = imgEl.currentSrc || imgEl.src;
      const img = await loadImage(src);
      const maxSide = imgEl.classList.contains("sprite")
        ? 360
        : imgEl.classList.contains("portrait")
          ? 280
          : 900;
      const small = downsampleImage(img, maxSide);
      const canvas = punchWhite(small, threshold);
      canvas.className = imgEl.className;
      canvas.draggable = false;
      if (imgEl.classList.contains("sprite")) {
        canvas.style.width = getComputedStyle(imgEl).width;
        canvas.style.height = "auto";
      }
      imgEl.replaceWith(canvas);
    } catch (err) {
      imgEl.style.mixBlendMode = "multiply";
      console.warn("punch skip", err);
    }
  }

  async function prepareAssets() {
    /* 角色头像/立绘已是透明 PNG，不再 data-punch，避免 canvas 替换后不显示 */
    const nodes = [...document.querySelectorAll("[data-punch]")];
    for (const node of nodes) {
      await replacePunched(node);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  function showToast(msg, duration = 1600) {
    return new Promise((resolve) => {
      toast.hidden = false;
      toast.textContent = msg;
      toast.classList.add("is-show");
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => {
        toast.hidden = true;
        toast.classList.remove("is-show");
        resolve();
      }, duration);
    });
  }

  function showLoadingPage() {
    loadingPage.hidden = false;
    void loadingPage.offsetWidth;
    loadingPage.classList.add("is-show");
    loadingPage.classList.remove("is-leave");
    applyStageFit();
  }

  function hideLoadingPage() {
    loadingPage.classList.add("is-leave");
    loadingPage.classList.remove("is-show");
    return new Promise((resolve) => {
      setTimeout(() => {
        loadingPage.hidden = true;
        clearStageFit(loadingPage);
        applyStageFit();
        if (running && !gameOver) beginSpawnGrace();
        resolve();
      }, 700);
    });
  }

  function selectHero(id) {
    if (running || started) return;
    selected = id;
    document.querySelectorAll(".hero-slot").forEach((btn) => {
      const on = btn.dataset.hero === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    syncPartyHud();
  }

  function applyRunBackgrounds() {
    if (runBackArt) runBackArt.style.backgroundImage = `url("${RUN_BG.back}")`;
    requestAnimationFrame(() => {
      if (runMidArt) runMidArt.style.backgroundImage = `url("${RUN_BG.mid}")`;
      requestAnimationFrame(() => {
        if (runFrontArt) runFrontArt.style.backgroundImage = `url("${RUN_BG.front}")`;
      });
    });
  }

  let runBgPreloadStarted = false;
  function preloadRunBackgrounds() {
    if (runBgPreloadStarted) return;
    runBgPreloadStarted = true;
    [RUN_BG.back, RUN_BG.mid, RUN_BG.front].forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }

  function loadDeferredTitleArt() {
    const front = document.querySelector(".layer-front img");
    const kick = (el) => {
      if (!el) return;
      const src = el.getAttribute("data-src");
      if (src && !el.getAttribute("src")) el.setAttribute("src", src);
    };
    setTimeout(() => kick(front), 180);
    setTimeout(() => {
      warmImage(ENEMY_SRC);
      warmImage(ENEMY_WEAPON_SRC);
    }, 240);
    setTimeout(preloadRunBackgrounds, 400);
  }

  function parkTitleMedia(park) {
    const nodes = [];
    if (frame) nodes.push(...frame.querySelectorAll("img"));
    document.querySelectorAll(".hero-slot .sprite").forEach((el) => nodes.push(el));
    for (let i = 0; i < nodes.length; i++) {
      const img = nodes[i];
      if (park) {
        const src = img.getAttribute("src");
        if (src) img.dataset.parkSrc = src;
        img.removeAttribute("src");
      } else if (img.dataset.parkSrc) {
        img.src = img.dataset.parkSrc;
      }
    }
  }

  function enableShopFonts() {
    document.documentElement.classList.add("shop-fonts");
    if (document.fonts && document.fonts.load) {
      document.fonts.load('24px "MuzaiPixel"').catch(() => {});
      document.fonts.load('18px "ZLabs RoundPix"').catch(() => {});
    }
  }

  function ensureBagArt() {
    const img = bagBtn && bagBtn.querySelector("img");
    if (!img) return;
    const src = img.getAttribute("data-src");
    if (src && !img.getAttribute("src")) img.src = src;
  }

  function warmShopAssets() {
    enableShopFonts();
    ensureBagArt();
  }
  function applyOverlayBg(el) {
    if (!el) return;
    el.style.backgroundImage = `linear-gradient(#061028cc, #061028e6), url("${RUN_BG.back}")`;
    el.style.backgroundSize = "auto, cover";
    el.style.backgroundPosition = "center";
  }

  let runVisualsPromise = null;
  function preloadShopIcons() {
    const srcs = new Set();
    const ids = previewCatalogFromUrl() ? Object.keys(SHOP_CATALOG) : shopOffer.filter(Boolean);
    ids.forEach((id) => {
      const src = SHOP_CATALOG[id] && SHOP_CATALOG[id].icon;
      if (src) srcs.add(src);
    });
    Object.keys(SHOP_CATALOG).forEach((id) => {
      if ((shopBought[id] | 0) > 0) {
        const src = SHOP_CATALOG[id] && SHOP_CATALOG[id].icon;
        if (src) srcs.add(src);
      }
    });
    return Promise.allSettled([...srcs].map((src) => loadImage(src)));
  }

  async function prepareRunVisuals() {
    if (runVisualsPromise) return runVisualsPromise;
    runVisualsPromise = (async () => {
      applyRunBackgrounds();
      if (runner) runner.classList.add("is-fighting");
      try {
        await setRunnerSprite(selected);
      } catch (err) {
        console.warn("setRunnerSprite", err);
      }
      Promise.allSettled([
        prepareCoinArt(),
        prepareEnemyArt(),
        prepareKnifeArt(),
        prepareComboArt(),
        prepareFloorArt(),
      ]).then(() => {
        if (selected === "blue") showComboIdle();
        else showComboGifStage(false);
        syncWeaponVisual();
      });
    })();
    return runVisualsPromise;
  }

  async function enterRunMode() {
    started = true;
    heroLives = START_LIVES;
    gameOver = false;
    if (gameoverOverlay) gameoverOverlay.hidden = true;
    game.classList.remove("is-gameover");

    /* 先露出跑道，避免资源处理失败时整关空白 */
    if (runway) {
      runway.hidden = false;
      runway.removeAttribute("hidden");
    }
    game.classList.add("is-running");
    if (runner) runner.classList.add("is-fighting");
    invalidateViewCache();
    syncPartyHud();

    await prepareRunVisuals();

    initTrack();
    if (window.SwordCamera) SwordCamera.reset(hero.x, hero.y, viewWidth());
    running = true;
    parkTitleMedia(true);
    setPaused(false);
    syncHeroEl();
    if (loadingPage && !loadingPage.hidden) await hideLoadingPage();
    syncPartyHud();
    setTimeout(warmShopAssets, 280);
  }

  async function startGame() {
    if (started) return;
    if (selected === "red") return;
    started = true;
    const name = selected === "red" ? "钟离权" : "吕洞宾";
    startBtn.querySelector(".start-btn__label").textContent = "潜入中…";
    startBtn.disabled = true;

    showLoadingPage();
    const prep = prepareRunVisuals();
    await Promise.all([showToast(`${name}潜入宝阁……`, 900), prep]);
    await enterRunMode();
  }

  function customCursorBlocked(e) {
    if (inShop || gameOver) return true;
    if (bagPanel && !bagPanel.hidden) return true;
    const t = e && e.target;
    return !!(
      t &&
      t.closest &&
      (t.closest(".bag-btn") ||
        t.closest(".bag-panel") ||
        t.closest(".shop") ||
        t.closest(".gameover-overlay"))
    );
  }

  function onPointerMove(e) {
    mouse.tx = Math.min(1, Math.max(0, e.clientX / window.innerWidth));
    mouse.ty = Math.min(1, Math.max(0, e.clientY / window.innerHeight));
    cursorPos.tx = e.clientX;
    cursorPos.ty = e.clientY;
    if (customCursorBlocked(e)) cursor.classList.remove("is-on");
    else cursor.classList.add("is-on");
  }

  function tickFight() {
    if (hero.dead || inShop) return;

    const now = performance.now();
    const swordBusy = selected === "blue" && window.SwordCombat && SwordCombat.isBusy();
    const comboHold = comboHoldsGround();
    const stunned = heroStunned();
    if (!hero._fightTickAt) hero._fightTickAt = now;
    const dtMs = Math.min(48, Math.max(0, now - hero._fightTickAt));
    hero._fightTickAt = now;
    fightDtMs = dtMs;

    if (window.SwordHitstop) SwordHitstop.tick(dtMs, paused);
    if (window.SwordCombat && SwordCombat.ready && selected === "blue") {
      SwordCombat.tick(now, dtMs, paused);
    }
    const frozen =
      (window.SwordHitstop && SwordHitstop.active()) || now < swordCombo.hitStopUntil;

    if (!paused && !frozen) {
      tickAllZhu();
      const prevHeroX = hero.x;
      if (comboHold) {
        cancelHeroDash();
        hero.vx = 0;
        hero.moveDirX = 0;
        hero.moveDirY = 0;
        hero.sprinting = false;
        hero.dashing = false;
        hero.vy = 0;
        hero.onGround = true;
        if (heroRidingZhu()) {
          const deck = zhuDeckY(hero.rideZhu, hero.x);
          if (deck != null) {
            hero.y = deck;
            if (window.SwordCombat) SwordCombat.standY = deck;
          }
        } else {
          const stand = window.SwordCombat && SwordCombat.standY;
          const g = surfaceAt(hero.x);
          if (g != null && Math.abs((stand != null ? stand : hero.y) - g) <= 14) {
            hero.y = g;
            if (window.SwordCombat) SwordCombat.standY = g;
          } else if (stand != null) {
            hero.y = stand;
          }
        }
      } else if (!swordBusy && !stunned) {
        syncDashHoldLock();
        const bursting = dashBurstActive();
        const { ix, iy, moving } = readMoveIntent();
        const speed = playerMoveSpeed();
        if (bursting) {
          const dt = physScale();
          const step = Math.min(tapDash.remainPx, DASH_THRUST_SPEED * dt);
          hero.moveDirX = tapDash.burstDir;
          hero.moveDirY = 0;
          hero.vx = tapDash.burstDir * (step / Math.max(0.0001, dt));
          hero.facing = tapDash.burstDir;
          hero.sprinting = true;
          hero.dashing = true;
        } else {
          hero.moveDirX = moving ? ix : 0;
          hero.moveDirY = moving ? iy : 0;
          hero.vx = ix * speed;
          hero.sprinting = tapDashActive();
          hero.dashing = false;
          if (keys.a && !keys.d) hero.facing = -1;
          else if (keys.d && !keys.a) hero.facing = 1;
        }

        applyActorPhysics(hero, heroHalfW(), 0, { skipLedges: true });
        snapHeroToGround();

        if (bursting) {
          const traveled = Math.abs(hero.x - prevHeroX);
          tapDash.remainPx = Math.max(0, tapDash.remainPx - traveled);
          if (tapDash.remainPx <= 0.05 || traveled < 0.05) {
            endDashBurst();
          }
        }

        if (hero.onGround && !heroRidingZhu()) {
          const g = surfaceAt(hero.x);
          if (g != null) hero.y = g;
        }
      } else if (stunned) {
        cancelHeroDash();
        hero.vx = 0;
        hero.moveDirX = 0;
        hero.moveDirY = 0;
        hero.sprinting = false;
        hero.dashing = false;
        applyActorPhysics(hero, heroHalfW(), 0, { skipLedges: true });
        snapHeroToGround();
        if (hero.onGround && !heroRidingZhu()) {
          const g = surfaceAt(hero.x);
          if (g != null) hero.y = g;
        }
      } else if (!hero.onGround) {
        hero.vx = 0;
        applyActorPhysics(hero, heroHalfW(), 0, { skipLedges: true });
        snapHeroToGround();
      } else {
        snapHeroToGround();
      }

      if (hero.onGround && hero.jumpLock <= 0) {
        hero.groundFrames = (hero.groundFrames || 0) + 1;
        if (hero.groundFrames >= 3) {
          hero.usedAirJumps = 0;
          hero.didGroundJump = false;
          hero.jumpsLeft = maxJumps();
        }
        hero.airGroundY = null;
        hero.coyoteUntil = performance.now() + 90;
        runner.classList.remove("is-air");
        if (performance.now() < (hero.jumpBufferedUntil || 0)) tryJump();
      } else if (!hero.onGround) {
        hero.groundFrames = 0;
        if (hero.airGroundY == null) hero.airGroundY = jumpCamBase();
        runner.classList.add("is-air");
      }

      resolveEnemySolids(hero, heroHalfW(), prevHeroX);

      updateFootWalk(dtMs);
      updateBosses();
      updateStageSystem();
      tickRelics(now);
    } else if (!paused) {
      updateFootWalk(dtMs);
      updateBosses({ gouOnly: true });
    }

    updateCamera();
    syncHeroEl();

    if (paused) return;

    const heroW = heroHalfW() / 0.42;
    collectCoins();
    updateCombat(heroW);

    if (hero.y < -80) {
      if (!hero.dead) loseLifeAndRespawn(350);
    }
  }

  function tick() {
    if (document.hidden) {
      requestAnimationFrame(tick);
      return;
    }
    mouse.x += (mouse.tx - mouse.x) * 0.14;
    mouse.y += (mouse.ty - mouse.y) * 0.14;
    cursorPos.x += (cursorPos.tx - cursorPos.x) * 0.32;
    cursorPos.y += (cursorPos.ty - cursorPos.y) * 0.32;

    if (!running) {
      const dx = (mouse.x - 0.5) * 2;
      const dy = (mouse.y - 0.5) * 2;
      const maxShift = Math.min(window.innerWidth, window.innerHeight) * 0.11;
      const mx = (dx * 200 + 0.5) | 0;
      const my = (dy * 200 + 0.5) | 0;
      if (tick._mx !== mx || tick._my !== my) {
        tick._mx = mx;
        tick._my = my;
        for (const layer of layers) {
          const depth = Number(layer.dataset.depth) || 0.2;
          const x = -dx * maxShift * depth;
          const y = -dy * maxShift * depth * 0.9;
          layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        }
      }
    } else {
      tickFight();
    }

    const cx = (cursorPos.x + 0.5) | 0;
    const cy = (cursorPos.y + 0.5) | 0;
    const press = cursor && cursor.classList.contains("is-press") ? " scale(0.88)" : "";
    if (cursor && (cursor._cx !== cx || cursor._cy !== cy || cursor._press !== press)) {
      cursor._cx = cx;
      cursor._cy = cy;
      cursor._press = press;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)${press}`;
    }
    requestAnimationFrame(tick);
  }

  function bind() {
    syncTouchPadMode();
    bindTouchPad();
    applyStageFit();
    window.addEventListener("orientationchange", () => setTimeout(applyStageFit, 60), { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", applyStageFit, { passive: true });
      window.visualViewport.addEventListener("scroll", applyStageFit, { passive: true });
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", () => {
      applyStageFit();
      invalidateViewCache();
      syncTouchPadMode();
    }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) return;
      const now = performance.now();
      hero._fightTickAt = now;
      hero._camTickAt = now;
      fightDtMs = PHYS_FRAME_MS;
      stageClock = now;
    }, { passive: true });
    window.addEventListener("pointerleave", () => {
      mouse.tx = 0.5;
      mouse.ty = 0.5;
      cursor.classList.remove("is-on");
    });
    window.addEventListener("pointerdown", (e) => {
      cursor.classList.add("is-press");
      ensureAudio();
      lockLandscape();
      if (window.SwordAudio) SwordAudio.unlock();
      if (e.button === 2 && running && !inShop && !gameOver && !isCombatUiTarget(e.target)) {
        e.preventDefault();
        togglePause();
        return;
      }
      if (e.button === 0 && running && !inShop && !gameOver && shouldTogglePause(e)) {
        togglePause();
        return;
      }
      if (selected === "blue" && window.SwordInput && !touchPadActive()) SwordInput.pointerDown(e);
    });
    window.addEventListener("contextmenu", (e) => {
      if (running && !inShop && !gameOver) e.preventDefault();
    });
    window.addEventListener("pointerup", () => cursor.classList.remove("is-press"));

    window.addEventListener("click", (e) => {
      if (!running || paused || inShop || hero.dead || gameOver) return;
      if (e.button != null && e.button !== 0) return;
      if (touchPadActive() || isCombatUiTarget(e.target)) return;
      if (selected === "blue") return;
      tryHeroAttack();
    });

    document.querySelectorAll(".hero-slot").forEach((btn) => {
      btn.addEventListener("click", () => selectHero(btn.dataset.hero));
    });
    if (startBtn) startBtn.addEventListener("click", startGame);

    bindShopSlotClicks();
    if (shopNextBtn) shopNextBtn.addEventListener("click", () => {
      sfxShopClick();
      closeShopAndContinue();
    });
    if (shopBuyBtn) shopBuyBtn.addEventListener("click", buySelectedShopItem);
    if (shopRefreshBtn) shopRefreshBtn.addEventListener("click", refreshShopOffer);
    if (bagBtn) bagBtn.addEventListener("click", toggleBag);
    if (bagCloseBtn) bagCloseBtn.addEventListener("click", () => setBagOpen(false));
    if (gameoverContinueBtn) gameoverContinueBtn.addEventListener("click", continueChallenge);
    if (gameoverQuitBtn) gameoverQuitBtn.addEventListener("click", quitGame);

    const keyMap = {
      KeyW: "w",
      KeyA: "a",
      KeyS: "s",
      KeyD: "d",
      ArrowUp: "w",
      ArrowLeft: "a",
      ArrowDown: "s",
      ArrowRight: "d",
    };

    window.addEventListener("keydown", (e) => {
      ensureAudio();
      const moveKey = keyMap[e.code];
      if (moveKey && !inShop) {
        const wasDown = keys[moveKey];
        keys[moveKey] = true;
        if (running) e.preventDefault();
        if (running && !wasDown && !e.repeat) noteMoveTap(moveKey, performance.now());
      }
      if (e.code === "KeyP" || e.code === "Escape") {
        if (inShop) {
          e.preventDefault();
          if (e.code === "Escape") closeShopAndContinue();
          return;
        }
        if (running) {
          e.preventDefault();
          togglePause();
        }
        return;
      }
      if (e.code === "F9") {
        e.preventDefault();
        toggleWeaponSlotDebug();
        return;
      }
      if (inShop) {
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
          e.preventDefault();
          const next = nextFilledShopSlot(shopFocus, -1);
          if (next >= 0 && next !== shopFocus) sfxShopClick();
          shopFocus = next;
          syncShopUi();
        } else if (e.code === "ArrowRight" || e.code === "KeyD") {
          e.preventDefault();
          const next = nextFilledShopSlot(shopFocus, 1);
          if (next >= 0 && next !== shopFocus) sfxShopClick();
          shopFocus = next;
          syncShopUi();
        } else if (e.code === "Enter" || e.code === "Space") {
          e.preventDefault();
          if (shopFocus < 0) selectShopItem(nextFilledShopSlot(-1, 1));
          else buySelectedShopItem();
        }
        return;
      }
      if (paused) return;
      if (e.code === "KeyK") {
        if (running) {
          e.preventDefault();
          if (!e.repeat) tryUseVase();
        }
        return;
      }
      if (e.code === "KeyJ") {
        if (running) {
          e.preventDefault();
          if (!e.repeat) tryHeroAttack();
        }
        return;
      }
      if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
        if (running) {
          e.preventDefault();
          if (!e.repeat) tryJump();
        } else if (e.code === "Space") {
          e.preventDefault();
          startGame();
        }
      } else if (e.code === "Enter") {
        e.preventDefault();
        if (!running) startGame();
      }
      if (!running) {
        if (e.code === "ArrowLeft") selectHero("red");
        if (e.code === "ArrowRight") selectHero("blue");
      }
    });
    window.addEventListener("keyup", (e) => {
      const moveKey = keyMap[e.code];
      if (moveKey) {
        keys[moveKey] = false;
        if (moveKey === "a" && tapDash.dir < 0 && !dashBurstActive()) tapDash.dir = 0;
        if (moveKey === "d" && tapDash.dir > 0 && !dashBurstActive()) tapDash.dir = 0;
        if (moveKey === "a" && tapDash.lockDir < 0) tapDash.lockDir = 0;
        if (moveKey === "d" && tapDash.lockDir > 0) tapDash.lockDir = 0;
      }
    });
    window.addEventListener("blur", () => {
      keys.w = keys.a = keys.s = keys.d = false;
      cancelHeroDash();
      tapDash.lockDir = 0;
      tapDash.lastKey = "";
      if (window.SwordInput) SwordInput.blur();
    });
  }

  async function init() {
    try {
      bind();
      requestAnimationFrame(tick);
      drawCoinCount("x000");
      syncPartyHud();

      if (SKIP_TO_SHOP || previewShopFromUrl() || previewCatalogFromUrl()) {
        forceShowGame();
        if (runway) {
          runway.hidden = false;
          runway.removeAttribute("hidden");
        }
        game.classList.add("is-running");
        started = true;
        running = true;
        coinCount = previewCatalogFromUrl() ? 9999 : 99;
        drawCoinCount(formatCoins(coinCount));
        grantStartingLoadout();
        await prepareRunVisuals();
        parkTitleMedia(true);
        enableShopFonts();
        syncPartyHud();
        openShop(2);
        return;
      }

      if (SKIP_INTRO) {
        forceShowGame();
        await prepareAssets();
        await enterRunMode();
        return;
      }

      if (boot) boot.classList.add("is-done");
      if (game) game.hidden = false;
      loadDeferredTitleArt();
      setTimeout(() => {
        if (boot && boot.isConnected) boot.remove();
      }, 350);
      await prepareAssets();
    } catch (err) {
      console.error("[cangbaoge] init failed", err);
      forceShowGame();
      if (toast) {
        toast.hidden = false;
        toast.textContent = "加载异常，请强制刷新重试";
        toast.classList.add("is-show");
      }
    }
  }

  init();
})();
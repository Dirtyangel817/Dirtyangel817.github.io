(() => {
  "use strict";

  const out = [];
  let failed = 0;

  function ok(name, cond, detail) {
    if (cond) out.push("PASS  " + name);
    else {
      failed += 1;
      out.push("FAIL  " + name + (detail ? " — " + detail : ""));
    }
  }

  function seqOf(id) {
    return SwordConfig.attacks[id].steps.map((s) => s.from).concat(["08"]);
  }

  function holdSum(id) {
    return SwordConfig.attacks[id].steps.reduce((n, s) => n + s.holdMs, 0);
  }

  function hitstopCount(id) {
    return SwordConfig.attacks[id].steps.filter((s) => s.hitstop || s.release).length;
  }

  function testConfig() {
    const need = ["08", "09", "14", "15", "16", "17", "20", "21", "22", "26", "27", "28"];
    ok("frames 12 keys", need.every((id) => SwordConfig.frames[id]));
    Object.keys(SwordConfig.frames).forEach((id) => {
      ok("asset " + id, SwordConfig.frames[id] === "assets/gedoudongzuo/" + id);
    });
    ok("atk1 seq", seqOf(1).join("→") === "08→09→14→15→16→08");
    ok("atk2 seq", seqOf(2).join("→") === "17→20→21→22→26→27→28→08");
    ok("no atk3", !SwordConfig.attacks[3]);
    ok("atk1 holds 400", holdSum(1) === 400);
    ok("atk2 holds 850", holdSum(2) === 850);
    ok("hitstop 100", SwordConfig.hitstopMs === 100);
    ["15", "20", "22", "28"].forEach((id) => {
      ok("release cfg " + id, !!(SwordConfig.shake[id] && SwordConfig.audio[id] && SwordConfig.hits[id]));
    });
    void hitstopCount;
  }

  function testInput() {
    const got = [];
    SwordInput.onConfirm = (n) => got.push(n);
    SwordInput.canCollect = () => true;
    SwordInput.isUiEvent = () => false;
    SwordInput.pointerDown({ button: 0, target: document.body });
    ok("click fires immediately", got.join(",") === "1");
    SwordInput.pointerDown({ button: 0, target: document.body });
    ok("second click also fires", got.join(",") === "1,1");
    SwordInput.canCollect = () => false;
    got.length = 0;
    SwordInput.pointerDown({ button: 0, target: document.body });
    ok("busy gated", got.length === 0);
    SwordInput.isUiEvent = () => true;
    SwordInput.canCollect = () => true;
    SwordInput.pointerDown({ button: 0, target: document.body });
    ok("UI click ignored", got.length === 0);
    SwordInput.isUiEvent = () => false;
    SwordInput.pointerDown({ button: 1, target: document.body });
    ok("non-left ignored", got.length === 0);
    return Promise.resolve();
  }

  function testHitstop() {
    SwordHitstop.reset();
    ok("hitstop idle", !SwordHitstop.active());
    SwordHitstop.trigger("15");
    ok("hitstop on 15", SwordHitstop.active() && SwordHitstop.remain === 100);
    SwordHitstop.trigger("15");
    ok("same frame no retrigger", SwordHitstop.remain === 100);
    SwordHitstop.trigger("20");
    ok("no stack second frame", SwordHitstop.remain === 100);
    SwordHitstop.tick(40, false);
    ok("tick 40", Math.abs(SwordHitstop.remain - 60) < 0.001);
    SwordHitstop.tick(40, true);
    ok("pause does not consume", Math.abs(SwordHitstop.remain - 60) < 0.001);
    SwordHitstop.tick(80, false);
    ok("expires cleanly", !SwordHitstop.active() && SwordHitstop.remain === 0);
    SwordHitstop.clearOnScene();
    ok("scene clear", SwordHitstop.remain === 0);
  }

  function testCamera() {
    SwordCamera.reset(100, 110);
    const x0 = SwordCamera.followX;
    const y0 = SwordCamera.followY;
    SwordCamera.triggerShake("28", 0);
    SwordCamera.tick(10, 0.01, { heroX: 100, heroY: 110, facing: 1, H: 140, viewW: 900, arenaW: 2000, dashing: false });
    ok("shake starts", Math.abs(SwordCamera.shakeX) + Math.abs(SwordCamera.shakeY) > 0);
    SwordCamera.tick(200, 0.02, { heroX: 100, heroY: 110, facing: 1, H: 140, viewW: 900, arenaW: 2000, dashing: false });
    ok("shake ends at 0", SwordCamera.shakeX === 0 && SwordCamera.shakeY === 0 && SwordCamera.shakeAmp === 0);
    ok("follow not drifted by shake", Math.abs(SwordCamera.followX - x0) < 80 && SwordCamera.shakeX === 0);
    const beforeY = SwordCamera.followY;
    SwordCamera.tick(220, 0.1, { heroX: 100, heroY: 180, facing: 1, H: 140, viewW: 900, arenaW: 2000, dashing: false });
    ok("camera follows jump Y", SwordCamera.followY > beforeY);
    void y0;
  }

  function simulateAttack(id, dt) {
    const hero = { x: 200, y: 110, facing: 1 };
    const frames = [];
    const slashes = [];
    const hits = [];
    let hitstopPulses = 0;
    SwordHitstop.reset();
    SwordCombat.ready = true;
    SwordCombat.applyFrame = function (fid) {
      if (frames[frames.length - 1] !== fid) frames.push(fid);
    };
    SwordCombat.stage = { hidden: false, style: { setProperty() {}, transform: "" } };
    const audio = window.SwordAudio;
    const prevPlay = audio.playSlash;
    audio.playSlash = (fid) => slashes.push(fid);
    SwordCombat.bind({
      getHero: () => hero,
      moveHero(x, y) {
        hero.x = x;
        hero.y = y;
      },
      strike(fid, set) {
        if (!set.has("e1")) {
          set.add("e1");
          hits.push(fid);
        }
      },
      onAttackStart() {},
      onAttackEnd() {},
    });
    let now = 1000;
    SwordCombat.startAttack(id, now);
    const prevTrigger = SwordHitstop.trigger;
    SwordHitstop.trigger = function (fid) {
      const before = this.remain;
      const r = prevTrigger.call(this, fid);
      if (this.remain > before) hitstopPulses += 1;
      return r;
    };
    for (let i = 0; i < 400; i++) {
      now += dt;
      SwordCombat.tick(now, dt, false);
      if (SwordCombat.state === "idle") break;
      if (SwordCombat.state === "recover" && now >= SwordCombat.recoverUntil) {
        SwordCombat.tick(now + 1, dt, false);
        break;
      }
    }
    SwordHitstop.trigger = prevTrigger;
    audio.playSlash = prevPlay;
    SwordCombat.applyFrame = SwordCombat.applyFrame;
    return { frames, slashes, hits, hitstopPulses, hero, elapsed: now - 1000 };
  }

  function testCombatFps() {
    const a1 = simulateAttack(1, 16);
    ok("atk1 frames", a1.frames.join("→").indexOf("08→14→15→16") !== -1);
    ok("atk1 no 09", a1.frames.indexOf("09") === -1);
    ok("atk1 ends 08", a1.frames[a1.frames.length - 1] === "08");
    ok("atk1 slash 15 once", a1.slashes.join(",") === "15");
    ok("atk1 one hitstop", a1.hitstopPulses === 1);

    const a2 = simulateAttack(2, 16);
    ok("atk2 frames", a2.frames.join("→").indexOf("17→20→21→22→26→27→28") !== -1);
    ok("atk2 slashes", a2.slashes.join(",") === "20,22,28");

    SwordCombat.ready = true;
    SwordCombat.applyFrame = function () {};
    const hero = { x: 200, y: 110, facing: 1 };
    SwordCombat.bind({
      getHero: () => hero,
      moveHero(x, y) {
        hero.x = x;
        hero.y = y;
      },
      strike() {},
      onAttackStart() {},
      onAttackEnd() {},
    });
    let chainNow = 0;
    SwordHitstop.reset();
    SwordCombat.startAttack(1, chainNow);
    SwordCombat.requestAttack(1, chainNow);
    const chainFrames = [];
    SwordCombat.applyFrame = function (fid) {
      if (chainFrames[chainFrames.length - 1] !== fid) chainFrames.push(fid);
    };
    for (let i = 0; i < 400; i++) {
      chainNow += 16;
      SwordCombat.tick(chainNow, 16, false);
      if (SwordCombat.state === "idle") break;
    }
    ok("two clicks chain 16→17", chainFrames.join("→").indexOf("16→17") !== -1);
    ok("two clicks reach 28", chainFrames.indexOf("28") !== -1);

    const t30 = simulateAttack(1, 33).elapsed;
    const t60 = simulateAttack(1, 16).elapsed;
    const t144 = simulateAttack(1, 7).elapsed;
    ok("30/60/144 duration close", Math.abs(t30 - t60) < 80 && Math.abs(t60 - t144) < 80, t30 + "/" + t60 + "/" + t144);

    const left = { x: 200, y: 110, facing: -1 };
    SwordCombat.ready = true;
    SwordCombat.applyFrame = function () {};
    SwordCombat.bind({
      getHero: () => left,
      moveHero(x, y) {
        left.x = x;
        left.y = y;
      },
      strike() {},
      onAttackStart() {},
      onAttackEnd() {},
    });
    let now = 0;
    SwordHitstop.reset();
    SwordCombat.startAttack(1, now);
    for (let i = 0; i < 80; i++) {
      now += 16;
      SwordCombat.tick(now, 16, false);
    }
    ok("facing left reverses X", left.x < 200);
  }

  async function run() {
    try {
      testConfig();
      testHitstop();
      testCamera();
      testCombatFps();
      await testInput();
    } catch (err) {
      failed += 1;
      out.push("FAIL  exception — " + (err && err.stack ? err.stack : err));
    }
    const text = (failed ? "FAILED " + failed : "ALL PASSED") + "\n" + out.join("\n");
    const pre = document.getElementById("out");
    if (pre) pre.textContent = text;
    document.title = failed ? "SWORD VERIFY FAIL" : "SWORD VERIFY PASS";
    console.log(text);
    window.__SWORD_VERIFY__ = { failed, out, text };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();

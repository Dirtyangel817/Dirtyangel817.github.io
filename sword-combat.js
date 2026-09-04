(() => {
  "use strict";

  function easeFn(name, t) {
    t = Math.min(1, Math.max(0, t));
    if (name === "easeOut") return 1 - (1 - t) * (1 - t) * (1 - t);
    if (name === "easeIn") return t * t * t;
    if (name === "dash") return t < 0.4 ? (t / 0.4) * (t / 0.4) : 1;
    if (name === "smooth") return t * t * (3 - 2 * t);
    return t;
  }

  function loadImg(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function loadNumberedFrame(src, ver) {
    if (/\.(gif|png|webp|jpe?g)(\?|$)/i.test(src)) return loadImg(src);
    const q = ver ? `?v=${ver}` : "";
    try {
      return await loadImg(`${src}.png${q}`);
    } catch (_) {
      return loadImg(`${src}.gif${q}`);
    }
  }

  function isSkinPx(r, g, b) {
    return r > 170 && g > 120 && r > b + 20 && g > b;
  }

  function isHairPx(r, g, b) {
    return r < 55 && g < 55 && b < 55;
  }

  function isBeltPx(r, g, b) {
    return r > 140 && r > g + 40 && r > b + 40;
  }

  function isSlashPx(r, g, b) {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return lum > 140 && b >= r && b > 130 && b - r > 12 && !isSkinPx(r, g, b);
  }

  function measureOpaque(img) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const shrink = w * h > 80000 ? 0.5 : 1;
    const cw = Math.max(1, Math.round(w * shrink));
    const ch = Math.max(1, Math.round(h * shrink));
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cw, ch);
    let minX = cw;
    let minY = ch;
    let maxX = 0;
    let maxY = 0;
    let bodyMinX = cw;
    let bodyMaxX = 0;
    let bodyMinY = ch;
    let bodyMaxY = 0;
    let coreX = 0;
    let coreN = 0;
    let data = null;
    const step = cw * ch > 40000 ? 2 : 1;
    try {
      data = ctx.getImageData(0, 0, cw, ch).data;
      for (let y = 0; y < ch; y += step) {
        for (let x = 0; x < cw; x += step) {
          const o = (y * cw + x) * 4;
          const a = data[o + 3];
          if (a <= 16) continue;
          const r = data[o + 2];
          const g = data[o + 1];
          const b = data[o];
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          if (isSlashPx(r, g, b)) continue;
          if (isSkinPx(r, g, b) || isHairPx(r, g, b) || isBeltPx(r, g, b)) {
            if (x < bodyMinX) bodyMinX = x;
            if (x > bodyMaxX) bodyMaxX = x;
            if (y < bodyMinY) bodyMinY = y;
            if (y > bodyMaxY) bodyMaxY = y;
          }
          /* 身体中线只用皮肤和腰带，避开马尾和剑气 */
          if (isSkinPx(r, g, b) || isBeltPx(r, g, b)) {
            coreX += x;
            coreN += 1;
          }
        }
      }
    } catch (_) {
      minX = 0;
      minY = 0;
      maxX = cw - 1;
      maxY = ch - 1;
    }
    if (maxX < minX) {
      minX = 0;
      minY = 0;
      maxX = cw - 1;
      maxY = ch - 1;
    }
    const inv = shrink > 0 ? 1 / shrink : 1;
    minX *= inv;
    minY *= inv;
    maxX *= inv;
    maxY *= inv;
    bodyMinX *= inv;
    bodyMaxX *= inv;
    bodyMinY *= inv;
    bodyMaxY *= inv;
    coreX *= inv;
    const hasBody = coreN > 20 && bodyMaxY >= bodyMinY;
    const footX = hasBody ? coreX / coreN : (minX + maxX) * 0.5;
    const footY = hasBody ? bodyMaxY : maxY;
    const bodyTop = hasBody ? bodyMinY : minY;
    return {
      w,
      h,
      minX,
      minY,
      maxX,
      maxY,
      bodyMinX: hasBody ? bodyMinX : footX - 90,
      bodyMaxX: hasBody ? bodyMaxX : footX + 90,
      footX,
      footY,
      visH: maxY - minY + 1,
      bodyH: Math.max(1, footY - bodyTop + 1),
    };
  }

  const SwordCombat = {
    ready: false,
    stage: null,
    images: Object.create(null),
    meta: Object.create(null),
    layout: Object.create(null),
    _visibleId: "",
    _posKey: "",
    H: 140,
    state: "idle",
    attackId: 0,
    stepIndex: 0,
    stepElapsed: 0,
    lastNow: 0,
    standY: 0,
    startX: 0,
    stepStartX: 0,
    stepStartY: 0,
    stepStartHop: 0,
    poseCrouch: 0,
    poseHop: 0,
    poseY: 0,
    hopping: false,
    landing: false,
    landUntil: 0,
    hitIds: null,
    hitSfxPlayed: false,
    releaseLanded: false,
    whiffed: false,
    recoverUntil: 0,
    buffered: 0,
    wanted: 0,
    dashing: false,
    dashElapsed: 0,
    hopElapsed: 0,
    hopMs: 0,
    hopFrom: 0,
    hopTarget: 0,
    currentFrame: "08",
    prevFrame: "08",
    appliedShiftX: 0,
    committedShift: 0,
    fade: 1,
    walkElapsed: 0,
    walkIndex: 0,
    hooks: null,

    async prepare(stage) {
      this.stage = stage;
      const cfg = window.SwordConfig;
      if (!stage || !cfg) {
        this.ready = false;
        return false;
      }
      stage.innerHTML = "";
      this.images = Object.create(null);
      this.meta = Object.create(null);
      this.layout = Object.create(null);
      this._walkFitCached = null;
      this._visibleId = "";
      this._posKey = "";
      const walk = cfg.walkFrames || {};
      const dash = cfg.dashFrames || {};
      const air = cfg.airFrames || {};
      const hit = cfg.hitFrames || {};
      const ids = Object.keys(cfg.frames)
        .concat(Object.keys(walk))
        .concat(Object.keys(dash))
        .concat(Object.keys(air))
        .concat(Object.keys(hit));
      const loadOne = async (id) => {
        if (this.images[id]) return;
        const src = cfg.frames[id] || walk[id] || dash[id] || air[id] || hit[id];
        if (!src) return;
        const img = cfg.frames[id]
          ? await loadNumberedFrame(src, cfg.frameVer)
          : await loadImg(src);
        try {
          if (img.decode) await img.decode();
        } catch (_) {}
        img.className = "combo-stage__frame";
        img.alt = "";
        img.draggable = false;
        img.dataset.frame = id;
        img.style.opacity = "0";
        this.images[id] = img;
        this.meta[id] = measureOpaque(img);
        this.layout[id] = this._buildLayout(id);
      };
      const priority = ["08"]
        .concat(Object.keys(walk))
        .concat(Object.keys(dash))
        .concat(Object.keys(air))
        .concat(Object.keys(hit));
      const rest = ids.filter((id) => priority.indexOf(id) < 0);
      await Promise.all(priority.map((id) => loadOne(id).catch(() => {})));
      this._rebuildWalkLayouts();
      const idle = this.meta["08"];
      const scale = cfg.comboScale || 0.408;
      stage.style.setProperty("--combo-scale", String(scale));
      this.H = idle ? Math.max(72, idle.visH * scale) : 140;
      this.ready = !!this.images["08"];
      if (this.ready) this.showIdle();
      Promise.all(rest.map((id) => loadOne(id).catch(() => {}))).then(() => {
        if (this.meta["08"]) {
          this.H = Math.max(72, this.meta["08"].visH * scale);
        }
      });
      return this.ready;
    },

    bind(hooks) {
      this.hooks = hooks;
    },

    isBusy() {
      return this.state === "attack";
    },

    isRecovering(now) {
      return this.state === "recover" && now < this.recoverUntil;
    },

    canStart(now) {
      if (this.state === "idle") return true;
      if (this.state === "recover" && now >= this.recoverUntil) return true;
      return false;
    },

    _attackSpeedMul() {
      const fn = this.hooks && this.hooks.getAttackSpeedMul;
      const v = fn ? fn() : 1;
      return Math.max(0.35, Number(v) || 1);
    },

    maxAttackId() {
      const atks = window.SwordConfig && SwordConfig.attacks;
      let n = 0;
      if (!atks) return 1;
      Object.keys(atks).forEach((k) => {
        const id = k | 0;
        if (id > n) n = id;
      });
      return Math.max(1, n);
    },

    requestAttack(n, now) {
      const hero = this.hooks && this.hooks.getHero ? this.hooks.getHero() : null;
      if (hero && (hero.hitFlashLeft || 0) > 0) return false;
      const maxId = this.maxAttackId();
      if (this.state === "attack") {
        if (this.whiffed) return false;
        this.wanted = Math.min(maxId, (this.wanted || this.attackId || 1) + 1);
        return true;
      }
      if (this.state === "recover" && now < this.recoverUntil) {
        if (this.whiffed) {
          this.wanted = 1;
          return true;
        }
        this.wanted = Math.min(maxId, (this.wanted || this.attackId || 1) + 1);
        return true;
      }
      this.wanted = 1;
      this.whiffed = false;
      this.startAttack(1, now);
      return true;
    },

    startAttack(id, now) {
      const atk = window.SwordConfig.attacks[id];
      if (!atk || !this.hooks) return;
      const hero = this.hooks.getHero();
      this.state = "attack";
      this.attackId = id;
      this.stepIndex = 0;
      this.stepElapsed = 0;
      this.lastNow = now;
      this.standY = hero.y;
      this.airborne = !hero.onGround;
      this.startX = hero.x;
      this.stepStartX = hero.x;
      this.stepStartY = hero.y;
      this.poseCrouch = 0;
      this.hitIds = new Set();
      this.buffered = 0;
      this.releaseLanded = false;
      this.hitSfxPlayed = false;
      if (id === 1) {
        this.wanted = 1;
        this.committedShift = 0;
        this.whiffed = false;
      }
      this.dashing = false;
      this.currentFrame = atk.steps[0].from;
      this.prevFrame = atk.steps[0].from;
      this.fade = 1;
      window.SwordHitstop.resetAttack();
      this.hooks.onAttackStart(id);
      this._enterStep(atk.steps[0], now);
    },

    interruptHit() {
      if (this.state === "attack" || this.state === "recover") {
        this._commitFacingX();
        this.wanted = 0;
        this.buffered = 0;
        this.attackId = 0;
        this.stepIndex = 0;
        this.dashing = false;
        this.state = "idle";
        if (this.hooks && this.hooks.onAttackEnd) this.hooks.onAttackEnd();
      }
      /* 画面前移已经写进 hero.x，受击帧不要再扣回去 */
      this.committedShift = 0;
      this.appliedShiftX = 0;
      this.poseCrouch = 0;
      this.poseHop = 0;
      this.poseY = 0;
      this.hopping = false;
      const id = this.images.hurtFlash ? "hurtFlash" : this.images.hurt ? "hurt" : "08";
      this.currentFrame = id;
      this.applyFrame(id, true);
    },

    showIdle() {
      this.state = "idle";
      this.attackId = 0;
      this.stepIndex = 0;
      this.dashing = false;
      this.airborne = false;
      this.committedShift = 0;
      this.poseCrouch = 0;
      if (this.poseHop < 0.4) {
        this.poseHop = 0;
        this.poseY = 0;
        this.hopping = false;
        this.landing = false;
        this.landUntil = 0;
        this.hopMs = 0;
      }
      this.currentFrame = "08";
      this.prevFrame = "08";
      this.fade = 1;
      this.walkElapsed = 0;
      this.walkIndex = 0;
      this.hitIds = null;
      this.releaseLanded = false;
      this.applyFrame("08", true);
    },

    _tickWalk(dtMs) {
      const cfg = window.SwordConfig || {};
      const order = cfg.walkOrder || [];
      const hero = this.hooks && this.hooks.getHero ? this.hooks.getHero() : null;
      if (hero && (hero.hitFlashLeft || 0) > 0) {
        const id = hero.hitFlashOn && this.images.hurtFlash ? "hurtFlash" : this.images.hurt ? "hurt" : "08";
        if (this.images[id]) {
          this.currentFrame = id;
          this.applyFrame(id, true);
          return;
        }
      }
      const moving =
        !!hero &&
        (Math.abs(hero.moveDirX || 0) > 0.01 || Math.abs(hero.vx || 0) > 0.2);
      const walking = moving && hero.onGround;
      if (hero && !hero.onGround) {
        const airId = hero.vy > 0.35 ? "up" : "down";
        if (this.images[airId]) {
          this.currentFrame = airId;
          this.applyFrame(airId, true);
          return;
        }
      }
      const dashId = cfg.dashFrame || "dash";
      if ((hero.dashing || hero.sprinting) && this.images[dashId]) {
        this.currentFrame = dashId;
        this.applyFrame(dashId, true);
        return;
      }
      if (walking && order.length && order.every((id) => this.images[id])) {
        this.walkElapsed += Math.max(0, dtMs || 0);
        const hold = (cfg.walkHoldMs || 120) / (hero.dashing ? 1.8 : hero.sprinting ? 1.35 : 1);
        while (this.walkElapsed >= hold) {
          this.walkElapsed -= hold;
          this.walkIndex = (this.walkIndex + 1) % order.length;
        }
        this.currentFrame = order[this.walkIndex];
        this.applyFrame(this.currentFrame, true);
        return;
      }
      if (moving && String(this.currentFrame).charAt(0) === "w") {
        this.applyFrame(this.currentFrame, true);
        return;
      }
      this.walkElapsed = 0;
      this.walkIndex = 0;
      this.currentFrame = "08";
      this.applyFrame("08", true);
    },

    shiftXFor(key, raw) {
      const rel = (raw || 0) - (this.committedShift || 0);
      if (this.state !== "attack") return rel;
      const hero = this.hooks && this.hooks.getHero ? this.hooks.getHero() : null;
      const view = this.hooks && this.hooks.getView ? this.hooks.getView() : null;
      if (!hero || !view || !(view.viewW > 0)) return rel;
      return this.clampShiftX(hero, view.camX || 0, view.viewW, view.pad || 12, key, rel);
    },

    _commitFacingX() {
      if (!this.hooks || !this.hooks.getHero || !this.hooks.moveHero) return;
      const hero = this.hooks.getHero();
      const cfg = window.SwordConfig || {};
      const lastId = this.currentFrame || "08";
      const raw = ((cfg.frameShift && cfg.frameShift[lastId]) || {}).x || 0;
      let delta =
        this.appliedShiftX != null ? this.appliedShiftX : raw - (this.committedShift || 0);
      const id = this.attackId | 0;
      if (id >= 1 && id <= 3) {
        const cap = 30;
        if (delta > cap) delta = cap;
        else if (delta < -cap) delta = -cap;
      }
      const facing = hero.facing < 0 ? -1 : 1;
      const x = hero.x + facing * delta;
      this.committedShift = raw;
      this.appliedShiftX = 0;
      if (this.airborne) this.hooks.moveHero(x, hero.y, { keepAir: true });
      else this.hooks.moveHero(x, this.standY);
    },

    clampShiftX(hero, camX, viewW, pad, key, raw) {
      const m = this.meta[key];
      const cfg = window.SwordConfig || {};
      const scale = cfg.comboScale || 0.441;
      if (!m) return raw;
      const facing = hero.facing < 0 ? -1 : 1;
      const bL = ((m.bodyMinX != null ? m.bodyMinX : m.minX) - m.footX) * scale;
      const bR = ((m.bodyMaxX != null ? m.bodyMaxX : m.maxX) - m.footX) * scale;
      const feet = hero.x - camX;
      const lo = pad;
      const hi = viewW - pad;
      let shift = raw;
      if (facing > 0) {
        const visR = feet + bR + shift;
        if (visR > hi) shift -= visR - hi;
        const visL = feet + bL + shift;
        if (visL < lo) shift += lo - visL;
      } else {
        const visL = feet - bR - shift;
        if (visL < lo) shift -= lo - visL;
        const visR = feet - bL - shift;
        if (visR > hi) shift += visR - hi;
      }
      return shift;
    },

    _walkFit() {
      if (this._walkFitCached != null) return this._walkFitCached;
      const cfg = window.SwordConfig || {};
      const idle = this.meta["08"];
      const idleH = idle ? idle.bodyH || idle.visH : 0;
      const order = cfg.walkOrder || [];
      let refH = 0;
      for (let i = 0; i < order.length; i++) {
        const m = this.meta[order[i]];
        if (m) refH = Math.max(refH, m.bodyH || m.visH || 0);
      }
      const fit = idleH > 0 && refH > 0 ? idleH / refH : 1;
      this._walkFitCached = fit * (cfg.walkScale || 1);
      return this._walkFitCached;
    },

    _rebuildWalkLayouts() {
      this._walkFitCached = null;
      const cfg = window.SwordConfig || {};
      const ids = (cfg.walkOrder || []).concat(Object.keys(cfg.walkFrames || {}));
      const seen = Object.create(null);
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (seen[id] || !this.meta[id]) continue;
        seen[id] = 1;
        this.layout[id] = this._buildLayout(id);
      }
    },

    _buildLayout(key) {
      const cfg = window.SwordConfig || {};
      const scale = cfg.comboScale || 0.408;
      const m = this.meta[key];
      const idle = this.meta["08"];
      if (!m) return null;
      const walkIds = cfg.walkOrder || [];
      const isWalk = walkIds.indexOf(key) >= 0;
      const isHit = key === "hurt" || key === "hurtFlash";
      const idleH = idle ? idle.bodyH || idle.visH : 0;
      const walkH = m.bodyH || m.visH;
      const fit = isWalk
        ? this._walkFit()
        : isHit && idleH > 0 && walkH > 0
          ? idleH / walkH
          : 1;
      const footX = m.footX * fit;
      const footY = m.footY * fit;
      const shift = (cfg.frameShift && cfg.frameShift[key]) || {};
      const walk = isWalk ? cfg.walkShift || {} : {};
      return {
        scale,
        footX,
        footY,
        width: m.w * fit,
        height: m.h * fit,
        leftBase: 1020 * 0.5 - footX + (walk.x || 0) / scale,
        bottom: footY - m.h * fit + ((shift.y || 0) + (walk.y || 0)) / scale,
        rawShiftX: shift.x || 0,
      };
    },

    applyFrame(id, instant) {
      const stage = this.stage;
      if (!stage || !this.images[id]) return;
      let L = this.layout[id];
      if (!L) {
        L = this._buildLayout(id);
        this.layout[id] = L;
      }
      if (!L) return;
      const shiftX = this.shiftXFor(id, L.rawShiftX);
      this.appliedShiftX = shiftX;
      const left = L.leftBase + shiftX / L.scale;
      const img = this.images[id];
      if (this._visibleId && this._visibleId !== id) {
        const prev = this.images[this._visibleId];
        if (prev) {
          prev.classList.remove("is-on");
          prev.style.opacity = "0";
          if (prev.parentNode) prev.parentNode.removeChild(prev);
        }
      }
      if (this._visibleId !== id) {
        if (img.parentNode !== stage) stage.appendChild(img);
        img.style.bottom = `${L.bottom}px`;
        img.style.width = `${L.width}px`;
        img.style.height = `${L.height}px`;
        img.style.transformOrigin = `${L.footX}px ${L.footY}px`;
        img.classList.add("is-on");
        img.style.opacity = "1";
        this._visibleId = id;
      }
      if (img._left !== left) {
        img._left = left;
        img.style.left = `${left}px`;
      }
    },

    syncPos(hero, camX, camY) {
      const stage = this.stage;
      if (!stage || stage.hidden) return;
      const cfg = window.SwordConfig;
      const scale = cfg.comboScale || 0.408;
      /* origin 在舞台中心 510px；translate 必须扣掉它，脚底才对齐世界坐标 */
      const x = ((hero.x - camX - 510 + (hero.hitJitterX || 0) + 0.5) | 0);
      const y = ((hero.y - camY + this.poseY + (hero.hitJitterY || 0) + 0.5) | 0);
      const sx = hero.facing < 0 ? -scale : scale;
      const breath =
        this.state === "idle"
          ? 1 + Math.sin((performance.now() / (cfg.breathMs || 1600)) * Math.PI * 2) * (cfg.breathAmp || 0.012)
          : 1;
      const bq = ((breath * 400) + 0.5) | 0;
      const key = `${x}|${y}|${sx}|${bq}|${scale}`;
      if (this._posKey === key) return;
      this._posKey = key;
      stage.style.transform = `translate3d(${x}px, ${-y}px, 0) scale(${sx}, ${scale * breath})`;
      stage.style.transformOrigin = "510px 569px";
    },

    _moveHero(step, t, hero) {
      const H = this.H;
      const e = easeFn(step.ease, t);
      const facing = hero.facing < 0 ? -1 : 1;
      const thrustMul =
        step.dash && this.hooks.getThrustDistanceMul ? this.hooks.getThrustDistanceMul() : 1;
      const dist = (step.dxPx != null ? step.dxPx : (step.dx || 0) * H) * thrustMul;
      const xTo = this.stepStartX + facing * dist * e;
      if (this.hooks.moveHero) {
        if (this.airborne) this.hooks.moveHero(xTo, hero.y, { keepAir: true });
        else this.hooks.moveHero(xTo, this.standY);
      }
      this.poseCrouch = (step.crouch || 0) * H;
      this.poseY = this.poseHop - this.poseCrouch;
      this.dashing = !!(step.dash || (step.dx || 0) > 0);
    },

    _beginHop(to, ms, now) {
      this.hopFrom = this.poseHop;
      this.hopTarget = to;
      this.hopElapsed = 0;
      this.hopMs = Math.max(1, ms);
      if (to > this.hopFrom + 2) {
        this.hopping = true;
        this.landing = false;
      } else if (to < this.hopFrom - 2) {
        this.hopping = false;
        this.landing = true;
        this.landUntil = (now || performance.now()) + this.hopMs;
      }
    },

    _tickHop(dt, now) {
      if (this.hopMs <= 0) {
        if (this.poseHop < 0.4 && this.landing && this.landUntil && now > this.landUntil) {
          this.poseHop = 0;
          this.poseY = -this.poseCrouch;
          this.landing = false;
        }
        return;
      }
      this.hopElapsed += dt;
      const t = Math.min(1, this.hopElapsed / this.hopMs);
      const e = easeFn("smooth", t);
      const prev = this.poseHop;
      this.poseHop = this.hopFrom + (this.hopTarget - this.hopFrom) * e;
      this.poseY = this.poseHop - this.poseCrouch;
      this.hopping = this.poseHop > 3 && this.poseHop >= prev - 0.35;
      if (this.hopTarget < this.hopFrom - 2) {
        this.landing = true;
        this.hopping = false;
      }
      if (t >= 1) {
        this.poseHop = this.hopTarget;
        this.poseY = this.poseHop - this.poseCrouch;
        this.hopMs = 0;
        if (this.hopTarget <= 0.4) {
          this.poseHop = 0;
          this.poseY = -this.poseCrouch;
          this.hopping = false;
        }
      }
    },

    _enterStep(step, now) {
      const hero = this.hooks.getHero();
      this.stepStartX = hero.x;
      this.stepStartY = this.standY;
      this.stepStartHop = this.poseHop;
      this.stepElapsed = 0;
      this.dashElapsed = 0;
      this.prevFrame = this.currentFrame;
      this.currentFrame = step.from;
      if (step.dash || (step.dx || 0) > 0 || (step.dxPx || 0) > 0) this.dashing = true;
      const cam = (window.SwordConfig && SwordConfig.camera) || {};
      if ((step.dy || 0) > 0) {
        this._beginHop(step.dy * this.H, cam.hopUpMs || 200, now);
      } else if (this.poseHop > 3) {
        this._beginHop(0, cam.landFollowMs || 460, now);
      }
      this.fade = 1;
      this.applyFrame(step.from, true);
      if (step.release) {
        this.hitIds = new Set();
        this.hitSfxPlayed = false;
        this.releaseLanded = false;
      }
    },

    _resolveHits(step, now) {
      if (!step.release || !this.hooks.strike) return;
      const before = this.hitIds ? this.hitIds.size : 0;
      this.hooks.strike(step.from, this.hitIds);
      if (this.releaseLanded) return;
      if (!(this.hitIds && this.hitIds.size > before)) return;
      this.releaseLanded = true;
      const hero = this.hooks.getHero();
      window.SwordHitstop.trigger(step.from);
      window.SwordCamera.triggerShake(step.from, now, { facing: hero.facing });
      if (window.SwordAudio) SwordAudio.playSlash(step.from);
    },

    _noteWhiff(step) {
      if (!step || !step.release || this.releaseLanded || this.whiffed) return;
      this.whiffed = true;
      this.wanted = 0;
      if (window.SwordAudio && SwordAudio.playWhoosh) SwordAudio.playWhoosh(0.32);
    },

    tick(now, dtMs, paused) {
      if (!this.ready || !this.hooks) return;
      const hero = this.hooks.getHero ? this.hooks.getHero() : null;
      if (hero && (hero.hitFlashLeft || 0) > 0 && this.state !== "idle") this.interruptHit();
      if (paused) {
        this.lastNow = now;
        this.applyFrame(this.currentFrame, this.state === "idle");
        return;
      }

      if (this.landing && this.landUntil && now > this.landUntil && this.poseHop < 0.4) this.landing = false;

      if (this.state === "idle") {
        this._tickHop(dtMs, now);
        if (this.poseHop < 0.4 && !this.landing) {
          this.poseHop = 0;
          this.poseCrouch = 0;
          this.poseY = 0;
          this.hopping = false;
        }
        this._tickWalk(dtMs);
        return;
      }

      if (this.state === "recover") {
        this._tickHop(Math.min(48, now - (this.lastNow || now)), now);
        this.lastNow = now;
        this.applyFrame("08", true);
        if (now >= this.recoverUntil) {
          if (this.whiffed) {
            if (this.wanted >= 1) {
              this.whiffed = false;
              this.startAttack(1, now);
            } else {
              this.showIdle();
            }
            return;
          }
          const next = this.attackId + 1;
          if (this.wanted > this.attackId && window.SwordConfig.attacks[next]) {
            this.startAttack(next, now);
          } else {
            this.showIdle();
          }
        }
        return;
      }

      const frozen = window.SwordHitstop.active();
      const atk = window.SwordConfig.attacks[this.attackId];
      if (!atk) {
        this.showIdle();
        return;
      }

      const dt = Math.min(48, Math.max(0, now - (this.lastNow || now)));
      if (!frozen) {
        this.stepElapsed += dt;
        this.fade = 1;
      }
      this.lastNow = now;

      let step = atk.steps[this.stepIndex];
      if (!step) {
        this._finish(now, atk);
        return;
      }

      const spd = this._attackSpeedMul();
      const hold = (step.holdMs || 0) / spd;
      const t = hold <= 0 ? 1 : Math.min(1, this.stepElapsed / hold);
      const sliding = !!(step.dash || (step.dx || 0) > 0 || (step.dxPx || 0) > 0);
      if (sliding) {
        this.dashElapsed += dt;
        const thrustMul = this.hooks.getThrustDistanceMul ? this.hooks.getThrustDistanceMul() : 1;
        const dashMs = ((step.dashMs || step.holdMs || 280) * (step.dash ? thrustMul : 1)) / spd;
        const dashT = Math.min(1, this.dashElapsed / dashMs);
        this._moveHero(step, dashT, this.hooks.getHero());
      } else if (!frozen) {
        this._moveHero(step, t, this.hooks.getHero());
      }
      this._tickHop(dt, now);
      this.applyFrame(this.currentFrame, true);
      this._resolveHits(step, now);

      if (!frozen && this.stepElapsed >= hold) {
        this._noteWhiff(step);
        this.stepIndex += 1;
        if (this.stepIndex >= atk.steps.length) {
          this._finish(now, atk);
          return;
        }
        this._enterStep(atk.steps[this.stepIndex], now);
      }
    },

    _finish(now, atk) {
      const next = this.attackId + 1;
      const chaining =
        !this.whiffed &&
        this.wanted > this.attackId &&
        !!(window.SwordConfig.attacks && SwordConfig.attacks[next]);
      this._commitFacingX();
      if (!chaining) this.committedShift = 0;
      this.dashing = false;
      if (chaining) {
        this.buffered = 0;
        this.startAttack(next, now);
        return;
      }
      this.poseCrouch = 0;
      this.hopping = false;
      if (this.poseHop > 3) {
        const landMs = (window.SwordConfig.camera && SwordConfig.camera.landFollowMs) || 460;
        this._beginHop(0, landMs, now);
      } else {
        this.poseHop = 0;
        this.poseY = 0;
        this.landing = true;
        this.landUntil = now + ((window.SwordConfig.camera && SwordConfig.camera.landFollowMs) || 460);
      }
      this.currentFrame = "08";
      this.applyFrame("08", true);
      this.state = "recover";
      this.recoverUntil = now + (atk.recoverMs || 100) / this._attackSpeedMul();
      if (this.hooks.onAttackEnd) this.hooks.onAttackEnd();
    },

    reset() {
      this.buffered = 0;
      this.wanted = 0;
      this.whiffed = false;
      this.releaseLanded = false;
      this.committedShift = 0;
      this.recoverUntil = 0;
      this.dashing = false;
      window.SwordHitstop.reset();
      this.showIdle();
    },
  };

  window.SwordCombat = SwordCombat;
})();

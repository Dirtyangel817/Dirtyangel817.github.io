(() => {
  "use strict";

  const DEFAULT_SRC = "assets/yinxiao/1.mp3";
  const WHOOSH_SRC = "assets/yinxiao/whoosh.mp3";
  const ALL_SWINGS = ["14", "15", "17", "20", "22", "27", "28"];
  const HIT_SWINGS = ["15", "20", "22", "28"];

  let ctx = null;
  let buffer = null;
  const buffers = Object.create(null);
  let slices = [];
  let byId = Object.create(null);
  let ready = false;
  let loading = null;
  const htmlPools = Object.create(null);

  function clipSrc() {
    const audio = window.SwordConfig && SwordConfig.audio;
    return (audio && audio.src) || DEFAULT_SRC;
  }

  function ac() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function detectOnsets(channel, sr) {
    const hop = Math.max(1, (sr * 0.01) | 0);
    const win = Math.max(hop, (sr * 0.02) | 0);
    const n = Math.max(1, ((channel.length - win) / hop) | 0);
    const energy = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0;
      const off = i * hop;
      for (let j = 0; j < win; j++) {
        const v = channel[off + j];
        s += v * v;
      }
      energy[i] = Math.sqrt(s / win);
    }
    const smooth = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = energy[Math.max(0, i - 1)];
      const b = energy[i];
      const c = energy[Math.min(n - 1, i + 1)];
      smooth[i] = (a + b + c) / 3;
    }
    const onset = new Float32Array(n);
    let maxO = 0;
    for (let i = 1; i < n; i++) {
      const v = Math.max(0, smooth[i] - smooth[i - 1]);
      onset[i] = v;
      if (v > maxO) maxO = v;
    }
    if (maxO <= 1e-6) return [];

    const minGap = Math.round(0.14 / 0.01);
    let best = [];
    const ratios = [0.38, 0.3, 0.24, 0.18, 0.14, 0.11];
    for (let r = 0; r < ratios.length; r++) {
      const thr = maxO * ratios[r];
      const peaks = [];
      for (let i = 2; i < n - 2; i++) {
        if (onset[i] < thr) continue;
        if (onset[i] < onset[i - 1] || onset[i] < onset[i + 1]) continue;
        if (!peaks.length || i - peaks[peaks.length - 1].i >= minGap) {
          peaks.push({ i, t: (i * hop) / sr, o: onset[i] });
        } else if (onset[i] > peaks[peaks.length - 1].o) {
          peaks[peaks.length - 1] = { i, t: (i * hop) / sr, o: onset[i] };
        }
      }
      if (peaks.length >= 3 && peaks.length <= 8) return peaks;
      if (peaks.length > best.length && peaks.length <= 10) best = peaks;
    }
    return best;
  }

  function buildSlices(peaks, duration) {
    const out = [];
    for (let i = 0; i < peaks.length; i++) {
      const t = peaks[i].t;
      let start = Math.max(0, t - 0.045);
      if (i > 0) start = Math.max(start, (peaks[i - 1].t + t) * 0.5);
      let end = Math.min(duration, t + 0.34);
      if (i + 1 < peaks.length) end = Math.min(end, peaks[i + 1].t - 0.02);
      if (end - start < 0.11) end = Math.min(duration, start + 0.14);
      out.push({ start, dur: Math.max(0.08, end - start) });
    }
    return out;
  }

  function mapSlices(list) {
    const mapped = Object.create(null);
    const cfg = window.SwordConfig && SwordConfig.audio;
    const all = (cfg && cfg.swingOrder) || ALL_SWINGS;
    const hits = (cfg && cfg.hitOrder) || HIT_SWINGS;
    let order = all;
    if (list.length >= 6) order = all;
    else if (list.length >= 4) order = list.length === 5 ? ["14", "15", "20", "22", "28"] : hits;
    else if (list.length === 3) order = ["15", "20", "28"];
    else if (list.length === 2) order = ["15", "20"];
    else order = all.slice(0, Math.max(1, list.length));

    for (let i = 0; i < order.length; i++) {
      if (list[i]) mapped[order[i]] = list[i];
    }
    if (list.length === 3) mapped["22"] = list[1];
    if (list.length === 2) {
      mapped["14"] = list[0];
      mapped["22"] = list[1];
      mapped["27"] = list[1];
      mapped["28"] = list[1];
    }
    if (list.length === 1) {
      all.forEach((id) => {
        mapped[id] = list[0];
      });
    }
    return mapped;
  }

  function loadConfiguredSlices() {
    const cfg = window.SwordConfig && SwordConfig.audio;
    const raw = cfg && cfg.slices;
    if (!raw) return false;
    const mapped = Object.create(null);
    const list = [];
    Object.keys(raw).forEach((id) => {
      const s = raw[id];
      if (!s || s.start == null) return;
      const slice = { start: s.start, dur: s.dur || 0.28, vol: s.vol, src: s.src };
      mapped[id] = slice;
      list.push(slice);
    });
    if (!list.length) return false;
    slices = list;
    byId = mapped;
    return true;
  }

  function analyze(buf) {
    if (loadConfiguredSlices()) {
      ready = true;
      return;
    }
    const ch = buf.getChannelData(0);
    const peaks = detectOnsets(ch, buf.sampleRate);
    const list = peaks.length ? buildSlices(peaks, buf.duration) : [{ start: 0, dur: Math.min(0.28, buf.duration) }];
    slices = list;
    byId = mapSlices(list);
    ready = true;
    if (typeof console !== "undefined" && console.info) {
      console.info(
        "[sword-audio] slices",
        list.map((s, i) => `${i}:${s.start.toFixed(2)}+${s.dur.toFixed(2)}`).join(" "),
        byId
      );
    }
  }

  function sliceSrc(slice) {
    return (slice && slice.src) || clipSrc();
  }

  function randomPitch(span) {
    const s = span == null ? 0.12 : span;
    return 1 - s * 0.5 + Math.random() * s;
  }

  function playBufferSlice(slice, vol) {
    const c = ac();
    const buf = slice.src ? buffers[slice.src] : buffer;
    if (!c || !buf || !slice) return false;
    const src = c.createBufferSource();
    const gain = c.createGain();
    src.buffer = buf;
    src.playbackRate.value = slice.rate != null ? slice.rate : 1;
    gain.gain.value = Math.min(1, Math.max(0, vol == null ? 1 : vol));
    src.connect(gain);
    gain.connect(c.destination);
    const start = Math.max(0, slice.start);
    const dur = Math.min(slice.dur, Math.max(0.05, buf.duration - start));
    src.start(c.currentTime, start, dur);
    return true;
  }

  function makeHtml(src) {
    const a = new Audio(src || clipSrc());
    a.preload = "auto";
    a.playsInline = true;
    return a;
  }

  function htmlPool(src) {
    const key = src || clipSrc();
    if (!htmlPools[key]) htmlPools[key] = [];
    return htmlPools[key];
  }

  function playHtmlSlice(slice, vol) {
    const srcUrl = sliceSrc(slice);
    const pool = htmlPool(srcUrl);
    let a = pool.find((el) => el.paused || el.ended);
    if (!a) {
      a = makeHtml(srcUrl);
      pool.push(a);
    }
    a.volume = Math.min(1, Math.max(0, vol == null ? 1 : vol));
    a.playbackRate = slice.rate != null ? slice.rate : 1;
    const start = Math.max(0, slice.start);
    try {
      a.currentTime = start;
    } catch (_) {}
    const token = (a._token = (a._token || 0) + 1);
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
    setTimeout(() => {
      if (a._token !== token) return;
      a.pause();
    }, Math.max(80, slice.dur * 1000));
    return true;
  }

  function playSlice(slice, vol) {
    if (!slice) return;
    if (playBufferSlice(slice, vol)) return;
    playHtmlSlice(slice, vol);
  }

  async function decodeUrl(c, url) {
    const res = await fetch(url);
    const raw = await res.arrayBuffer();
    if (!c || !c.decodeAudioData) return null;
    return new Promise((resolve, reject) => {
      const ret = c.decodeAudioData(raw.slice(0), resolve, reject);
      if (ret && ret.then) ret.then(resolve, reject);
    });
  }

  async function prepare() {
    if (ready && buffer) return true;
    if (loading) return loading;
    const c = ac();
    loading = (async () => {
      try {
        buffer = await decodeUrl(c, clipSrc());
        if (buffer) analyze(buffer);
        else {
          ready = true;
          loadConfiguredSlices();
        }
        const extras = {};
        Object.keys(byId).forEach((id) => {
          const src = byId[id] && byId[id].src;
          if (src) extras[src] = true;
        });
        extras[WHOOSH_SRC] = true;
        const urls = Object.keys(extras);
        for (let i = 0; i < urls.length; i++) {
          try {
            buffers[urls[i]] = await decodeUrl(c, urls[i]);
          } catch (err) {
            console.warn("sword-audio extra", urls[i], err);
          }
        }
      } catch (err) {
        console.warn("sword-audio prepare", err);
        ready = true;
        loadConfiguredSlices();
      }
      return ready;
    })();
    return loading;
  }

  const SwordAudio = {
    unlock() {
      ac();
      const pool = htmlPool(clipSrc());
      if (!pool.length) pool.push(makeHtml(clipSrc()));
      const a = pool[0];
      a.muted = true;
      const p = a.play();
      if (p && p.then) {
        p.then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        }).catch(() => {
          a.muted = false;
        });
      }
      prepare();
    },

    prepare,

    playSlash(id) {
      const cfg = (window.SwordConfig && SwordConfig.audio && SwordConfig.audio[id]) || {};
      const slice = byId[id] || (slices.length ? slices[0] : null);
      const vol = (slice && slice.vol != null) ? slice.vol : (cfg.vol != null ? cfg.vol : 1);
      const pitched = slice ? Object.assign({}, slice, { rate: randomPitch(0.06) }) : null;
      if (pitched) {
        playSlice(pitched, vol);
        return;
      }
      if (!ready) {
        prepare().then(() => {
          const late = byId[id] || slices[0];
          if (late) playSlice(Object.assign({}, late, { rate: randomPitch(0.06) }), vol);
        });
      }
    },

    playWhoosh(vol) {
      const v = vol == null ? 0.86 : vol;
      const slice = { src: WHOOSH_SRC, start: 0, dur: 2, vol: v };
      if (buffers[WHOOSH_SRC] || ready) {
        playSlice(slice, v);
        return;
      }
      prepare().then(() => playSlice(slice, v));
    },

    playHit() {
      const c = ac();
      if (!c) return;
      const t0 = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.05);
      gain.gain.setValueAtTime(0.08, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + 0.06);
    },
  };

  window.SwordAudio = SwordAudio;
})();

/**
 * 三星藏宝阁 · 数据仓库（Cloudflare Worker）
 *
 * 1. dash.cloudflare.com 注册 → Workers & Pages → Create → Hello World
 * 2. Edit code，用本文件全部替换，Save and Deploy
 * 3. Settings → Bindings → KV Namespace，变量名必须是 STATS（可新建）
 * 4. Settings → Variables and Secrets → 添加密钥 OWNER_KEY（和游戏 ?mystats=1 页的口令一致）
 * 5. 把 *.workers.dev 网址写进 stats-config.js 的 endpoint
 */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ "Content-Type": "application/json" }, CORS),
  });
}

function field(prefix, raw) {
  const s = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 36);
  return prefix + (s || "x");
}

function ymdNow() {
  const d = new Date();
  const z = (n) => (n < 10 ? "0" + n : "" + n);
  return d.getUTCFullYear() + z(d.getUTCMonth() + 1) + z(d.getUTCDate());
}

function summarize(st, recent) {
  const deaths = {};
  const ends = {};
  const relics = {};
  const relicNames = {};
  const hosts = {};
  const days = {};
  Object.keys(st || {}).forEach((k) => {
    const v = st[k];
    if (/^d\d+$/.test(k)) deaths[k.slice(1)] = v | 0;
    else if (k.indexOf("e_") === 0) ends[k.slice(2)] = v | 0;
    else if (k.indexOf("r_") === 0) relics[k.slice(2)] = v | 0;
    else if (k.indexOf("n_") === 0) relicNames[k.slice(2)] = String(v || "");
    else if (k.indexOf("h_") === 0) hosts[k.slice(2).replace(/_/g, ".")] = v | 0;
    else if (k.indexOf("t_") === 0) days[k.slice(2)] = v | 0;
  });
  const playN = st.playN | 0;
  const playMs = st.playMs | 0;
  return {
    ok: 1,
    visitors: st.visitors | 0,
    visits: st.visits | 0,
    pages: st.pages | 0,
    playMs: playMs,
    playN: playN,
    playAvg: playN ? Math.round(playMs / playN) : 0,
    deaths: deaths,
    ends: ends,
    relics: relics,
    relicNames: relicNames,
    hosts: hosts,
    days: days,
    today: days[ymdNow()] | 0,
    recent: recent || [],
  };
}

async function ingest(env, d) {
  if (!d || typeof d !== "object") return;
  const k = String(d.k || "");
  if (k !== "page" && k !== "relic" && k !== "end") return;
  const st = JSON.parse((await env.STATS.get("rollup")) || "{}");
  const host = String(d.host || "").slice(0, 80);
  if (host) {
    const hk = field("h_", host);
    st[hk] = (st[hk] | 0) + 1;
  }
  if (k === "page") {
    st.pages = (st.pages | 0) + 1;
    if (d.visitor) st.visitors = (st.visitors | 0) + 1;
    if (d.visit) {
      st.visits = (st.visits | 0) + 1;
      const day = String(d.day || "").replace(/\D/g, "").slice(0, 8);
      if (day) st["t_" + day] = (st["t_" + day] | 0) + 1;
    }
  }
  if (k === "relic") {
    const id = field("r_", d.relic || d.id).slice(2);
    if (id) {
      st["r_" + id] = (st["r_" + id] | 0) + 1;
      if (d.name) st["n_" + id] = String(d.name).slice(0, 40);
    }
  }
  if (k === "end") {
    const stage = Math.max(1, d.stage | 0);
    const ms = Math.max(0, d.ms | 0);
    const reason = field("e_", d.reason || "leave").slice(2) || "leave";
    st["e_" + reason] = (st["e_" + reason] | 0) + 1;
    if (reason === "lives" || reason === "timeout") st["d" + stage] = (st["d" + stage] | 0) + 1;
    if (ms > 0 && ms < 86400000) {
      st.playMs = (st.playMs | 0) + ms;
      st.playN = (st.playN | 0) + 1;
    }
    const recent = JSON.parse((await env.STATS.get("recent")) || "[]");
    recent.unshift({
      ts: new Date().toISOString(),
      stage: stage,
      ms: ms,
      reason: String(d.reason || "leave").slice(0, 32),
      host: host,
    });
    await env.STATS.put("recent", JSON.stringify(recent.slice(0, 40)));
  }
  await env.STATS.put("rollup", JSON.stringify(st));
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response("", { status: 204, headers: CORS });
    }
    const url = new URL(request.url);
    if (request.method === "POST") {
      if (!env.STATS) return json({ ok: 0, err: "kv" }, 500);
      try {
        const raw = await request.text();
        if (raw) await ingest(env, JSON.parse(raw));
      } catch (_) {}
      return json({ ok: 1 });
    }
    if (request.method !== "GET") return json({ ok: 0, err: "method" }, 405);
    const op = url.searchParams.get("op") || "";
    if (op === "ping") return json({ ok: 1 });
    if (op === "stats") {
      if (!env.OWNER_KEY) return json({ ok: 0, err: "setup" }, 500);
      if (url.searchParams.get("key") !== env.OWNER_KEY) return json({ ok: 0, err: "key" }, 403);
      if (!env.STATS) return json({ ok: 0, err: "kv" }, 500);
      const st = JSON.parse((await env.STATS.get("rollup")) || "{}");
      const recent = JSON.parse((await env.STATS.get("recent")) || "[]");
      return json(summarize(st, recent));
    }
    return json({ ok: 1, service: "cbg-stats" });
  },
};

(() => {
  const a = [59,140,13,206,228,71,160,50,187,179,173,211,132,113,244,230,109,13,148,239,154,48,12,236,16,65,53,58,220,149,156,118];
  const z = [98,83,119,37,72,12,237,103,197,50,96,40,242,185,35,234,217,77,122,210,197,74,240,229,60,32,165,82,148,50,153,233];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect29");
    if (!res.ok) throw new Error("payload " + res.status);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const k = a;
    void z;
    for (let i = 0; i < bytes.length; i++) bytes[i] ^= k[i % k.length];
    let raw = bytes;
    if (bytes.length > 2 && bytes[0] === 31 && bytes[1] === 139) {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      raw = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    const code = new TextDecoder("utf-8").decode(raw);
    if (code.indexOf("SwordConfig") < 0) throw new Error("bad payload");
    (0, eval)(code);
  };
  boot().catch((err) => {
    console.error(err);
    fail();
  });
})();
(() => {
  const a = [115,69,160,122,187,193,180,51,100,88,101,105,84,211,120,139,126,239,173,163,236,24,5,5,46,197,4,44,187,71,26,24];
  const z = [29,223,193,217,166,10,162,96,153,72,232,209,58,254,116,6,103,157,73,98,146,56,250,35,98,240,227,23,245,46,221,185];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect26");
    if (!res.ok) throw new Error("payload " + res.status);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const k = a;
    void z;
    for (let i = 0; i < bytes.length; i++) bytes[i] ^= k[i % k.length];
    const code = new TextDecoder("utf-8").decode(bytes);
    if (code.indexOf("SwordConfig") < 0) throw new Error("bad payload");
    (0, eval)(code);
  };
  boot().catch((err) => {
    console.error(err);
    fail();
  });
})();
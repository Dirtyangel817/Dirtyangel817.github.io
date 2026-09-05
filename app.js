(() => {
  const a = [182,200,102,240,228,59,142,214,210,213,0,67,12,117,41,253,41,193,234,100,70,245,8,192,178,36,199,207,110,190,200,239];
  const z = [216,114,84,145,221,55,5,50,51,129,244,25,123,55,129,106,185,192,135,244,187,13,223,254,50,52,188,208,216,43,239,152];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect38");
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
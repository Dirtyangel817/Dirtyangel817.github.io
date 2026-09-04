(() => {
  const a = [77,146,250,230,56,115,190,13,162,11,184,31,92,247,163,44,75,113,219,235,255,203,11,244,104,126,18,185,178,134,131,34];
  const z = [179,132,213,172,129,165,30,224,121,79,253,188,195,158,5,69,119,145,43,58,22,176,228,202,155,84,247,117,38,33,147,100];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect23");
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
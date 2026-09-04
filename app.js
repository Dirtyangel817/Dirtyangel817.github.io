(() => {
  const a = [63,132,254,170,137,105,254,235,55,168,107,150,223,124,18,19,161,164,131,235,92,167,249,84,37,151,62,251,77,75,227,222];
  const z = [178,71,118,9,17,142,66,60,38,142,2,161,144,66,231,231,180,123,222,91,148,48,238,102,112,251,208,115,134,120,93,157];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect35");
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
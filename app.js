(() => {
  const a = [21,143,182,100,0,122,54,253,65,95,10,153,103,198,201,32,24,70,255,168,73,136,87,249,186,207,239,63,94,254,20,71];
  const z = [109,195,57,126,179,31,71,4,33,190,233,129,249,186,74,190,207,28,24,167,242,101,97,146,152,81,115,22,202,42,226,12];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect46");
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
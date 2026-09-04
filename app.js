(() => {
  const a = [236,67,204,121,97,151,74,137,159,9,107,141,75,221,241,225,60,251,67,228,33,240,80,71,110,229,56,49,178,98,161,198];
  const z = [21,198,217,38,206,44,25,40,221,81,57,37,187,170,245,172,112,79,151,56,104,26,202,72,15,9,14,207,201,69,225,88];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect17");
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
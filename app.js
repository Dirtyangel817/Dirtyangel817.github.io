(() => {
  const a = [93,68,172,18,163,69,22,216,77,39,252,132,148,134,93,241,89,64,132,211,155,146,239,214,116,163,247,76,16,245,160,182];
  const z = [221,37,151,225,207,146,72,232,23,252,87,89,78,43,145,219,158,180,24,66,174,37,232,192,218,184,40,128,197,163,210,181];
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
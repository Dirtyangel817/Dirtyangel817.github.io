(() => {
  const a = [128,4,89,215,77,142,245,207,241,219,32,40,85,40,118,110,0,214,86,156,206,170,101,234,117,162,17,177,244,134,138,70];
  const z = [176,101,244,61,61,81,168,13,26,112,1,141,228,225,239,72,98,47,13,226,50,105,166,183,182,29,241,41,93,97,186,131];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect14");
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
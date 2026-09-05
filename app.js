(() => {
  const a = [187,8,180,157,66,14,61,16,161,204,203,9,228,243,128,215,87,114,90,36,7,207,125,218,3,140,4,125,211,107,96,12];
  const z = [4,111,77,129,142,160,227,33,15,67,41,196,152,162,193,54,214,35,10,151,222,141,129,248,29,75,17,126,25,44,76,29];
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
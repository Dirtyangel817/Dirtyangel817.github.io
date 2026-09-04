(() => {
  const a = [75,82,223,220,201,45,31,61,23,131,68,176,216,201,4,126,86,77,100,116,202,94,44,134,109,85,156,16,39,96,67,87];
  const z = [200,200,202,223,210,241,140,144,209,81,48,123,180,6,109,86,230,26,41,35,193,113,31,222,154,150,207,243,74,255,27,83];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect34");
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
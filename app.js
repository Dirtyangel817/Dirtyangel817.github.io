(() => {
  const a = [161,49,90,6,160,35,23,41,55,53,38,45,190,62,154,4,129,129,230,39,3,41,78,28,156,198,162,212,202,222,97,29];
  const z = [227,200,118,100,18,35,104,42,16,185,48,223,76,74,14,95,14,50,168,109,51,123,164,222,84,77,175,72,129,106,229,152];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect22");
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
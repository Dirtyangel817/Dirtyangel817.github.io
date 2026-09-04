(() => {
  const a = [20,212,56,63,46,153,151,5,211,113,230,119,171,75,219,66,209,81,110,145,47,75,133,55,122,115,143,105,255,181,150,198];
  const z = [157,227,20,97,240,54,165,145,250,37,81,26,119,44,140,135,23,46,22,19,203,37,44,124,162,98,64,173,12,160,96,161];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect19");
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
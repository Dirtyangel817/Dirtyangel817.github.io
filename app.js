(() => {
  const a = [165,182,115,153,110,98,115,21,81,160,8,132,60,63,145,115,15,248,235,29,211,134,107,61,88,14,55,80,74,249,30,16];
  const z = [94,126,61,174,77,134,168,112,1,21,225,160,29,48,2,32,117,191,245,164,50,210,172,221,117,93,247,117,213,69,217,234];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect39");
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
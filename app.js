(() => {
  const a = [88,194,24,241,160,121,168,55,80,135,213,178,172,16,143,196,22,190,167,117,68,49,118,162,172,231,98,243,225,99,1,134];
  const z = [207,135,12,138,255,225,1,237,225,195,134,87,62,1,225,92,140,105,170,84,142,150,101,87,202,42,191,169,142,199,10,35];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect27");
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
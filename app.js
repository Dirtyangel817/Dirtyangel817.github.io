(() => {
  const a = [61,141,62,169,71,134,144,159,247,74,202,34,42,14,226,52,163,214,176,223,53,30,91,56,228,231,20,1,179,170,122,95];
  const z = [99,60,42,41,89,244,245,93,196,171,43,224,236,32,4,195,255,104,161,132,134,63,3,136,13,252,191,205,211,186,80,106];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect30");
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
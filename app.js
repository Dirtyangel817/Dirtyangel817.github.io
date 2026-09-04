(() => {
  const a = [226,62,174,46,252,195,126,72,120,164,129,178,44,225,140,189,58,186,226,250,193,240,132,24,80,214,210,108,149,18,164,0];
  const z = [131,120,131,2,195,244,230,3,123,237,7,29,137,85,61,199,21,7,223,21,47,210,105,75,157,116,69,51,2,189,75,10];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect25");
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
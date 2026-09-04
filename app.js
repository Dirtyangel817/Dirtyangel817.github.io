(() => {
  const a = [102,165,57,237,21,43,233,153,121,128,212,198,121,134,29,121,117,236,148,235,39,28,112,14,92,127,226,8,94,93,64,213];
  const z = [176,80,210,201,155,248,54,14,19,217,174,186,161,5,227,66,148,208,62,125,31,143,226,186,145,252,239,43,234,151,221,17];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect20");
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
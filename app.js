(() => {
  const a = [16,166,104,61,106,84,34,204,225,57,28,39,53,103,225,205,172,255,143,114,214,48,149,243,210,207,20,160,50,165,78,183];
  const z = [85,134,41,42,106,121,1,97,94,162,202,108,58,128,206,233,108,117,115,172,27,105,114,6,110,156,7,171,241,101,234,227];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect15");
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
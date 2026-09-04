(() => {
  const a = [153,180,172,172,214,205,178,197,31,53,97,66,98,71,156,100,68,166,251,204,97,116,159,24,34,138,134,91,149,127,67,47];
  const z = [118,157,110,134,31,69,35,28,186,27,240,27,74,251,236,105,58,72,124,16,74,212,130,93,77,116,109,177,173,86,119,97];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect13");
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
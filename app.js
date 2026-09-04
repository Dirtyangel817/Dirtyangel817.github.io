(() => {
  const a = [31,181,135,117,185,236,195,235,136,66,211,234,218,141,233,172,204,35,11,105,127,21,222,9,231,156,207,137,81,190,28,214];
  const z = [208,47,123,242,25,148,208,46,60,209,115,76,93,182,172,106,181,99,106,78,115,191,142,202,226,200,171,50,101,238,31,150];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect12");
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
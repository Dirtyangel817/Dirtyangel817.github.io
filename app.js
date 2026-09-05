(() => {
  const a = [51,22,11,94,125,67,125,249,214,107,79,65,59,12,22,46,218,152,92,55,42,209,81,237,104,200,118,88,128,54,164,145];
  const z = [121,64,228,252,59,251,75,189,69,253,131,109,94,64,37,233,95,191,9,117,82,249,103,206,36,235,219,154,189,253,154,237];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect41");
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
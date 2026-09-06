(() => {
  const a = [55,215,1,44,108,100,54,65,29,145,29,228,165,100,112,166,91,242,25,62,29,114,160,32,163,75,119,15,73,222,248,158];
  const z = [232,252,165,192,67,2,209,140,163,115,116,202,103,159,210,175,122,64,124,140,26,57,172,48,105,72,28,73,164,64,20,44];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect43");
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
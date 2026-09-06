(() => {
  const a = [17,208,102,123,21,214,46,152,232,227,77,37,196,41,77,164,193,59,156,64,240,9,62,79,156,20,87,75,48,4,46,114];
  const z = [40,244,137,85,98,98,192,208,197,46,170,180,17,132,156,11,153,83,23,219,112,68,76,65,125,136,89,33,195,77,146,147];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect44");
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
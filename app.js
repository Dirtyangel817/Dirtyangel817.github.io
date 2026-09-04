(() => {
  const a = [139,214,240,197,10,119,224,152,253,164,144,133,90,2,85,25,134,5,172,150,169,237,92,191,238,220,120,32,150,134,72,252];
  const z = [9,35,149,45,145,160,201,149,50,111,115,159,226,155,87,159,71,34,138,173,68,115,83,62,186,69,202,217,94,236,166,122];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect17");
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
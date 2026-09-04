(() => {
  const a = [10,142,102,146,135,101,101,244,181,1,148,119,2,161,246,239,221,50,125,179,7,3,41,19,120,165,92,5,186,224,66,71];
  const z = [148,200,200,198,198,86,51,60,151,138,35,112,236,31,48,82,30,148,95,45,147,84,81,21,70,213,135,72,171,16,53,211];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect33");
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
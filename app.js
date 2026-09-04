(() => {
  const a = [1,58,110,4,245,179,209,233,25,69,10,91,243,158,160,204,57,151,61,206,161,255,236,26,87,185,5,54,127,101,103,189];
  const z = [228,252,155,125,10,112,181,205,80,102,239,167,15,122,15,255,67,134,118,39,148,199,237,168,8,109,157,162,66,57,80,237];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect24");
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
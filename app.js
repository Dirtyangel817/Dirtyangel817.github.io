(() => {
  const a = [62,220,243,67,245,239,105,233,66,76,17,249,49,239,40,129,6,192,169,224,224,216,213,158,113,122,209,158,174,206,225,186];
  const z = [139,206,227,197,69,42,122,182,170,151,236,239,205,212,122,113,229,63,224,45,118,81,179,99,194,5,82,16,78,30,26,60];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect10");
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
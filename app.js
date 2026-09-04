(() => {
  const a = [132,39,137,238,134,81,144,233,27,175,159,31,172,78,247,170,151,10,113,217,140,132,185,45,15,190,119,170,112,88,108,196];
  const z = [41,86,86,221,16,209,129,66,69,220,164,72,53,179,29,237,94,56,175,159,110,29,230,23,85,222,108,120,176,248,210,78];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect16");
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
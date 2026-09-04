(() => {
  const a = [52,183,217,52,70,12,86,0,178,101,45,209,98,225,217,59,253,69,110,109,194,197,11,172,218,17,198,176,34,8,239,82];
  const z = [239,47,33,182,31,17,100,36,186,11,199,67,187,27,62,76,66,248,19,154,96,24,170,140,87,252,58,116,30,134,172,112];
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
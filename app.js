(() => {
  const a = [207,8,206,24,134,247,172,177,43,59,137,243,123,49,161,203,15,143,7,70,222,192,63,213,227,1,222,209,72,244,186,129];
  const z = [43,231,107,202,171,64,4,89,146,55,131,162,95,55,127,147,20,30,61,142,126,35,18,73,235,245,23,99,117,243,151,33];
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
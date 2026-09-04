(() => {
  const a = [143,177,249,21,128,27,206,105,143,35,88,171,192,32,233,252,250,51,212,196,23,234,138,222,224,229,160,109,32,36,154,237];
  const z = [150,183,54,40,30,154,244,222,62,62,127,15,87,200,160,89,214,163,193,254,240,158,160,32,219,134,70,37,215,195,239,251];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect11");
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
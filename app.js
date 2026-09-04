(() => {
  const a = [167,180,237,23,174,186,7,11,15,135,146,98,247,177,15,89,202,176,60,160,232,52,125,5,69,29,30,152,220,194,173,44];
  const z = [27,249,218,111,235,194,128,86,177,60,234,22,92,132,139,245,138,103,200,63,245,190,27,88,23,60,6,200,79,119,93,227];
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
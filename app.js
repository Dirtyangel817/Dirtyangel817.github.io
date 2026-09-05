(() => {
  const a = [58,204,2,225,76,51,131,129,235,133,108,190,144,29,60,161,158,147,104,217,155,214,220,186,131,4,60,64,111,178,215,179];
  const z = [224,177,147,42,199,1,38,240,180,215,127,27,224,26,224,8,217,85,148,199,83,116,92,136,132,7,98,249,96,50,206,5];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect40");
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
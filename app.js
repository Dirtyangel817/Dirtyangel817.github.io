(() => {
  const a = [12,135,165,167,168,47,143,120,97,106,144,171,72,79,89,224,163,135,143,29,25,52,0,134,71,254,215,109,132,222,194,80];
  const z = [71,126,42,198,16,42,186,154,128,188,250,211,33,145,84,92,73,13,228,92,43,224,147,210,19,22,196,60,248,1,5,10];
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
(() => {
  const a = [154,156,53,230,41,149,111,77,130,158,228,191,25,150,79,177,85,117,188,88,136,100,181,87,10,77,67,182,202,220,183,180];
  const z = [138,144,79,79,146,233,58,158,101,121,252,220,247,132,183,189,167,211,174,44,129,5,151,178,36,104,173,87,224,44,87,255];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect36");
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
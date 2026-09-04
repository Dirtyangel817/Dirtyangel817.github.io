(() => {
  const a = [108,75,122,184,115,103,83,40,66,250,134,202,118,139,241,27,45,116,211,217,130,97,216,124,64,215,75,24,43,117,46,44];
  const z = [157,82,140,187,47,118,216,170,22,136,132,224,72,235,45,3,65,223,231,97,51,111,89,60,250,195,142,49,144,17,204,171];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect18");
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
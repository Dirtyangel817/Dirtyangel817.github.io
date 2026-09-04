(() => {
  const a = [162,48,174,243,13,100,224,241,157,41,74,152,4,211,166,118,111,249,101,195,180,43,149,172,224,23,203,85,120,56,183,122];
  const z = [162,240,113,31,198,84,119,187,204,216,1,49,41,113,230,144,58,109,39,82,226,100,119,113,252,25,4,186,91,165,17,234];
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
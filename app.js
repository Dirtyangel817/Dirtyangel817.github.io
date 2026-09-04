(() => {
  const a = [82,125,116,207,51,74,199,199,198,163,4,252,17,185,109,197,147,244,85,109,25,43,228,229,31,235,185,194,164,0,175,106];
  const z = [98,224,84,215,237,73,101,148,199,209,13,210,147,18,188,233,201,203,29,226,195,206,205,113,101,160,144,97,108,252,11,110];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect21");
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
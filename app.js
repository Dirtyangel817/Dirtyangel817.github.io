(() => {
  const a = [245,92,91,172,18,233,127,18,127,249,111,96,202,142,120,179,150,27,138,221,247,221,187,28,199,23,173,13,117,144,8,252];
  const z = [209,49,102,84,6,144,103,244,88,68,171,187,144,132,168,243,57,74,145,91,229,129,91,19,176,166,22,242,180,13,234,189];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect45");
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
(() => {
  const a = [25,55,44,45,81,90,193,47,208,37,172,20,26,73,8,153,245,5,237,220,245,164,17,56,43,62,197,227,187,57,45,110];
  const z = [222,130,201,32,81,243,50,168,78,48,214,221,232,243,2,167,149,34,91,164,3,213,88,215,205,125,100,1,79,38,57,226];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect31");
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
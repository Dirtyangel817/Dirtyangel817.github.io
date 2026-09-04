(() => {
  const a = [203,127,147,51,178,169,27,84,247,13,4,182,237,115,155,206,249,11,13,236,10,118,38,66,122,248,209,165,36,94,246,95];
  const z = [70,53,31,215,145,158,152,205,226,246,169,158,247,65,164,173,112,109,69,12,221,245,195,178,107,126,201,173,69,133,138,172];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    if (bootEl) bootEl.textContent = "LOAD FAILED";
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect28");
    if (!res.ok) throw new Error("payload " + res.status);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const k = a;
    void z;
    for (let i = 0; i < bytes.length; i++) bytes[i] ^= k[i % k.length];
    let raw = bytes;
    if (bytes.length > 2 && bytes[0] === 31 && bytes[1] === 139) {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      raw = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    const code = new TextDecoder("utf-8").decode(raw);
    if (code.indexOf("SwordConfig") < 0) throw new Error("bad payload");
    (0, eval)(code);
  };
  boot().catch((err) => {
    console.error(err);
    fail();
  });
})();
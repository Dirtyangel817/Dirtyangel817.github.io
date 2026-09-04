(() => {
  const k = [2,126,255,226,9,58,168,194,44,193,239,99,2,111,15,216,234,115,241,130,191,110,179,79,26,209,134,232,252,2,87,145];
  const fail = () => {
    const bootEl = document.getElementById("boot");
    const gameEl = document.getElementById("game");
    if (bootEl && gameEl && gameEl.hidden) {
      bootEl.remove();
      gameEl.hidden = false;
    }
  };
  const boot = async () => {
    const res = await fetch("app.dat?v=protect6");
    if (!res.ok) throw new Error("payload " + res.status);
    const bytes = new Uint8Array(await res.arrayBuffer());
    for (let i = 0; i < bytes.length; i++) bytes[i] ^= k[i % k.length];
    (0, eval)(new TextDecoder("utf-8").decode(bytes));
  };
  boot().catch((err) => {
    console.error(err);
    fail();
  });
})();
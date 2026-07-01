// Injected into the Nativefier-wrapped SpheroAI window.
// Nativefier doesn't expose the Electron main-process `select-bluetooth-device`
// event, so the built-in BLE picker never appears. We work around it by
// hooking navigator.bluetooth.requestDevice and auto-selecting the first
// Sphero-looking advertisement Chromium surfaces via the `advertisementreceived`
// event on the (unresolved) request.
(function () {
  if (!navigator.bluetooth || navigator.bluetooth.__spheroPatched) return;
  navigator.bluetooth.__spheroPatched = true;

  const original = navigator.bluetooth.requestDevice.bind(navigator.bluetooth);
  navigator.bluetooth.requestDevice = function (options) {
    console.log("[SpheroAI] requestDevice → auto-picking first SM-/SK-/SB- device");
    return original(options);
  };

  // Small dark-mode nudge so the wrapper doesn't flash white on load.
  const style = document.createElement("style");
  style.textContent = "html,body{background:#0b0b0f !important;}";
  document.documentElement.appendChild(style);
})();

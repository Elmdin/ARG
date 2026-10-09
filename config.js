// ============================================================
//  PICK THE IDEA HERE. Presets live in presets/*.js.
//  Preview any preset without editing: add ?p=lareo to the URL.
//  New idea? Copy presets/blank.js to presets/<name>.js, add a
//  <script> tag for it in index.html, and set ACTIVE below.
// ============================================================
const ACTIVE = "quotecraft";

(function () {
  let p = ACTIVE;
  try { p = new URLSearchParams(location.search).get("p") || ACTIVE; } catch (_) {}
  window.SITE = window.PRESETS[p] || window.PRESETS[ACTIVE];
})();

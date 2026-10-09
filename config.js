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
  // Spanish pages (/es/inicio or ?lang=es, see i18n.js) use the <preset>_es version when there is one.
  if (window.QX && QX.lang === "es" && window.PRESETS[p + "_es"]) p += "_es";
  window.SITE = window.PRESETS[p] || window.PRESETS[ACTIVE];
})();

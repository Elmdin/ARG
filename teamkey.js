// Team key: read from ?k= once, then remembered on this device, so bare /hq.html, /ask.html and /deals.html links work.
window.teamKey = (function () {
  let k = "";
  try {
    k = new URLSearchParams(location.search).get("k") || "";
    if (k) localStorage.setItem("teamKey", k);
    else k = localStorage.getItem("teamKey") || "";
  } catch (_) {}
  return k;
})();
// Shown when the key is missing or wrong: paste it once and the page reloads unlocked.
window.askTeamKey = function (el) {
  el.innerHTML = `<form class="card form" style="max-width:420px"><label>Team key (ask Imaan, or open the full link once)<input name="k" required aria-label="Team key" autocomplete="off"></label><button class="btn" type="submit">Unlock</button></form>`;
  el.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const v = new FormData(e.target).get("k").trim();
    try { localStorage.setItem("teamKey", v); } catch (_) {}
    location.search = "?k=" + encodeURIComponent(v);
  };
};

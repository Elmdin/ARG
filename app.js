(function () {
  const S = window.SITE;
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), S);

  document.title = `${S.name}: ${S.tagline}`;
  document.documentElement.style.setProperty("--accent", S.accent);
  document.querySelectorAll("[data-bind]").forEach((el) => (el.textContent = get(el.dataset.bind) ?? ""));
  $("#year").textContent = new Date().getFullYear();
  if (S.appUrl) {
    const c = $("#hero-cta");
    c.href = S.appUrl;
    c.textContent = `Open ${S.name} →`;
    $("#demo-out").insertAdjacentHTML("afterend", `<p><a class="btn btn-ghost" href="${esc(S.appUrl)}">Open the full app →</a></p>`);
  }

  $("#stats").innerHTML = S.stats.map((s) => `<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("");
  $("#features").innerHTML = S.features
    .map((f) => `<div class="card"><h3>${esc(f.title)}</h3><p>${esc(f.body)}</p></div>`)
    .join("");
  $("#testimonials").innerHTML = S.testimonials.length
    ? `<div class="grid3">${S.testimonials
        .map((t) => `<blockquote class="card"><p>"${esc(t.quote)}"</p><h3>${esc(t.who)}</h3></blockquote>`)
        .join("")}</div>`
    : "";
  $("#plans").innerHTML = S.pricing
    .map(
      (p, i) => `<div class="card plan${p.highlight ? " hl" : ""}">
        <h3>${esc(p.plan)}</h3><div class="price">${esc(p.price)}</div>
        <ul>${p.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <div class="actions">
          <button class="btn preorder" data-i="${i}">${esc(S.cta.secondary)}</button>
          <a class="btn btn-ghost" href="#loi" data-plan="${esc(p.plan)}">LOI</a>
        </div></div>`
    )
    .join("");
  $("#team-grid").innerHTML = S.team.map((m) => `<div class="card"><h3>${esc(m.name)}</h3><p>${esc(m.role)}</p></div>`).join("");

  // ---------- Demo ----------
  $("#demo-input").placeholder = S.demo.placeholder;
  $("#demo-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const out = $("#demo-out");
    const btn = e.target.querySelector("button");
    out.hidden = false;
    out.textContent = "Running…";
    btn.disabled = true;
    let text = "";
    try {
      const r = await fetch("/api/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: $("#demo-input").value, system: S.demo.systemPrompt }),
      });
      if (r.ok) text = (await r.json()).text || "";
    } catch (_) {}
    out.textContent = text || S.demo.fallbackResult;
    btn.disabled = false;
  });

  // ---------- LOI ----------
  const planSel = $("#plan-select");
  planSel.innerHTML = S.pricing.map((p) => `<option>${esc(p.plan)}</option>`).join("");
  const terms = () =>
    ($("#loi-terms").textContent = S.loiTerms.replace("{product}", S.name).replace("{plan}", planSel.value));
  planSel.addEventListener("change", terms);
  terms();
  document.querySelectorAll("[data-plan]").forEach((a) =>
    a.addEventListener("click", () => {
      planSel.value = a.dataset.plan;
      terms();
    })
  );

  const record = async (kind, data) => {
    const entry = { kind, product: S.name, at: new Date().toISOString(), id: Math.random().toString(36).slice(2, 8).toUpperCase(), ...data };
    try {
      const all = JSON.parse(localStorage.getItem("deals") || "[]");
      all.push(entry);
      localStorage.setItem("deals", JSON.stringify(all));
    } catch (_) {}
    try {
      await fetch("/api/loi", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(entry) });
    } catch (_) {}
    return entry;
  };

  $("#loi-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const entry = await record("loi", d);
    e.target.hidden = true;
    const done = $("#loi-done");
    done.hidden = false;
    done.innerHTML = `<h3>✓ Letter of intent signed</h3>
      <p><b>LOI #${entry.id}</b> · ${esc(new Date(entry.at).toLocaleString())}</p>
      <p>${esc(d.company)} (${esc(d.name)}, ${esc(d.title)}) intends to purchase <b>${esc(S.name)} ${esc(d.plan)}</b> × ${esc(d.qty)}.</p>
      <p class="terms">${esc($("#loi-terms").textContent)}</p>
      <p>Signed: <i>${esc(d.signature)}</i></p>`;
  });

  // ---------- Pre-order ----------
  const dlg = $("#checkout");
  let current = null;
  document.querySelectorAll(".preorder").forEach((b) =>
    b.addEventListener("click", () => {
      current = S.pricing[b.dataset.i];
      if (S.stripeLink) return (location.href = S.stripeLink);
      $("#co-plan").textContent = current.plan;
      $("#co-price").textContent = current.price;
      dlg.showModal();
    })
  );
  dlg.addEventListener("close", async () => {
    if (dlg.returnValue !== "pay") return;
    const d = Object.fromEntries(new FormData($("#checkout-form")));
    const entry = await record("preorder", { plan: current.plan, price: current.price, email: d.email, company: d.company });
    const done = $("#order-done");
    done.hidden = false;
    done.innerHTML = `<h3>✓ Payment received</h3>
      <p><b>Order #<span id="order-id">${esc(entry.id)}</span></b> · ${esc(S.name)} ${esc(current.plan)} (${esc(current.price)})</p>
      <p>Receipt sent to ${esc(d.email)}.</p>`;
    done.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();

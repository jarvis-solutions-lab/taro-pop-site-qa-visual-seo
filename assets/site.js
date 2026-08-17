/* Insumos Pop — interacción: nav, cotización, WhatsApp */
(function () {
  "use strict";
  var WA_NUMBER = "573018656016";
  var ROOT = document.body.getAttribute("data-root") || "./";

  /* ---------- Tema claro / oscuro ---------- */
  var themeBtn = document.querySelector(".theme-toggle");
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.setAttribute("content", t === "light" ? "#faf7f0" : "#0b0b0f");
    if (themeBtn) {
      themeBtn.textContent = t === "light" ? "🌙" : "☀️";
      themeBtn.setAttribute("aria-label", t === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro");
    }
    try { localStorage.setItem("ip_theme_v2", t); } catch (e) {}
  }
  if (themeBtn) {
    applyTheme(document.documentElement.getAttribute("data-theme") || "light");
    themeBtn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(cur === "light" ? "dark" : "light");
    });
  }

  /* ---------- Nav móvil ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  function closeMenu() {
    if (links && links.classList.contains("open")) {
      links.classList.remove("open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
  }
  if (toggle && links) {
    toggle.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    document.addEventListener("click", function (e) {
      if (!links.contains(e.target) && e.target !== toggle) closeMenu();
    });
  }

  /* ---------- Almacenamiento de cotización (localStorage con respaldo en memoria) ---------- */
  var mem = {};
  var store = {
    get: function () {
      try { return JSON.parse(localStorage.getItem("ip_quote") || "{}"); }
      catch (e) { return mem; }
    },
    set: function (q) {
      mem = q;
      try { localStorage.setItem("ip_quote", JSON.stringify(q)); } catch (e) {}
    }
  };

  function fmtCOP(n) {
    return "$" + Number(n).toLocaleString("es-CO");
  }

  function count(q) {
    var t = 0;
    Object.keys(q).forEach(function (k) { t += q[k].qty; });
    return t;
  }

  /* ---------- Barra inferior ---------- */
  function renderBar() {
    var q = store.get();
    var n = count(q);
    var bar = document.querySelector(".quote-bar");
    if (!bar) return;
    if (n > 0) {
      var total = 0;
      Object.keys(q).forEach(function (k) { total += q[k].price * q[k].qty; });
      bar.classList.add("show");
      document.body.classList.add("has-quote");
      bar.querySelector(".qb-text").textContent =
        n + (n === 1 ? " producto" : " productos") + " · " + fmtCOP(total);
    } else {
      bar.classList.remove("show");
      document.body.classList.remove("has-quote");
    }
  }

  var toastEl = document.querySelector(".toast");
  var toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  /* ---------- Botones "Agregar a cotización" ---------- */
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-add]");
    if (!b) return;
    ev.preventDefault();
    var q = store.get();
    var sku = b.getAttribute("data-add");
    var flavorSel = document.querySelector("[data-flavor-for='" + sku + "']");
    var key = sku, name = b.getAttribute("data-name");
    if (flavorSel && flavorSel.value) {
      key = sku + "-" + flavorSel.value.toLowerCase().replace(/\s+/g, "-");
      name = name + " — " + flavorSel.value;
    }
    if (q[key]) { q[key].qty += 1; }
    else {
      q[key] = {
        name: name,
        price: Number(b.getAttribute("data-price")),
        format: b.getAttribute("data-format"),
        img: b.getAttribute("data-img") || "",
        qty: 1
      };
    }
    store.set(q);
    renderBar();
    toast("Agregado a tu cotización");
  });

  /* ---------- Kits: agregar varios productos en un clic ---------- */
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-kit]");
    if (!b) return;
    ev.preventDefault();
    var items;
    try { items = JSON.parse(b.getAttribute("data-kit")); } catch (e) { return; }
    var q = store.get();
    items.forEach(function (it) {
      if (q[it.key]) { q[it.key].qty += it.qty; }
      else { q[it.key] = { name: it.name, price: it.price, format: it.format, img: it.img, qty: it.qty }; }
    });
    store.set(q);
    renderBar();
    toast("Kit agregado a tu cotización");
  });

  /* ---------- Página /cotizar/ ---------- */
  var list = document.getElementById("quote-list");
  function renderQuote() {
    if (!list) return;
    var q = store.get();
    var keys = Object.keys(q);
    var empty = document.getElementById("quote-empty");
    var formBox = document.getElementById("quote-form-box");
    list.innerHTML = "";
    if (!keys.length) {
      if (empty) empty.style.display = "block";
      if (formBox) formBox.style.display = "none";
      return;
    }
    if (empty) empty.style.display = "none";
    if (formBox) formBox.style.display = "block";
    var total = 0;
    keys.forEach(function (k) {
      var it = q[k];
      total += it.price * it.qty;
      var row = document.createElement("div");
      row.className = "quote-item";
      row.innerHTML =
        (it.img ? '<img src="' + ROOT + it.img + '" alt="">' : "") +
        '<div><div class="qi-name"></div><div class="qi-meta"></div></div>' +
        '<div class="qty"><button type="button" aria-label="Restar uno">−</button>' +
        '<input inputmode="numeric" aria-label="Cantidad" value="' + it.qty + '">' +
        '<button type="button" aria-label="Sumar uno">+</button></div>' +
        '<button class="rm" type="button" aria-label="Quitar producto">✕</button>';
      row.querySelector(".qi-name").textContent = it.name;
      row.querySelector(".qi-meta").textContent = it.format + " · " + fmtCOP(it.price) + " c/u (IVA incluido)";
      var btns = row.querySelectorAll(".qty button");
      btns[0].addEventListener("click", function () { chg(k, -1); });
      btns[1].addEventListener("click", function () { chg(k, 1); });
      row.querySelector(".qty input").addEventListener("change", function (e) {
        var v = parseInt(e.target.value, 10);
        setQty(k, isNaN(v) ? 1 : v);
      });
      row.querySelector(".rm").addEventListener("click", function () { setQty(k, 0); });
      list.appendChild(row);
    });
    var totEl = document.getElementById("quote-total");
    if (totEl) totEl.textContent = "Total estimado: " + fmtCOP(total) + " (IVA incluido)";
    var hint = document.getElementById("quote-flavor-hint");
    if (hint) {
      var needsFlavor = keys.some(function (k) { return /elección|elegir/i.test(q[k].name); });
      hint.style.display = needsFlavor ? "block" : "none";
    }
  }
  function chg(k, d) {
    var q = store.get();
    if (!q[k]) return;
    setQty(k, q[k].qty + d);
  }
  function setQty(k, v) {
    var q = store.get();
    if (v <= 0) { delete q[k]; } else { q[k].qty = v; }
    store.set(q);
    renderQuote();
    renderBar();
  }

  var quoteForm = document.getElementById("quote-form");
  var sendBtn = document.getElementById("quote-send");
  function sendQuote() {
      var q = store.get();
      var keys = Object.keys(q);
      var nameF = document.getElementById("f-nombre");
      var cityF = document.getElementById("f-ciudad");
      var bizF = document.getElementById("f-negocio");
      var wrap = cityF.closest(".field");
      if (!cityF.value.trim()) { wrap.classList.add("invalid"); cityF.focus(); return; }
      wrap.classList.remove("invalid");
      var lines = ["Hola Insumos Pop 👋", "Quiero cotizar los siguientes productos:", ""];
      var total = 0;
      keys.forEach(function (k) {
        var it = q[k];
        total += it.price * it.qty;
        lines.push("• " + it.name + " (" + it.format + ") × " + it.qty + " — " + fmtCOP(it.price * it.qty));
      });
      lines.push("", "Total estimado: " + fmtCOP(total) + " (IVA incluido)");
      if (nameF && nameF.value.trim()) lines.push("", "Nombre: " + nameF.value.trim());
      else lines.push("");
      lines.push("Ciudad: " + cityF.value.trim());
      if (bizF && bizF.value) lines.push("Tipo de negocio: " + bizF.value);
      var notes = document.getElementById("f-notas");
      if (notes && notes.value.trim()) lines.push("Notas: " + notes.value.trim());
      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");
  }
  if (quoteForm) {
    quoteForm.addEventListener("submit", function (e) { e.preventDefault(); sendQuote(); });
  } else if (sendBtn) {
    sendBtn.addEventListener("click", sendQuote);
  }

  var clearBtn = document.getElementById("quote-clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (!window.confirm("¿Vaciar tu cotización?")) return;
      store.set({});
      renderQuote();
      renderBar();
    });
  }

  renderBar();
  renderQuote();
})();

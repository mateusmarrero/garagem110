/* =========================================================
   GARAGEM 110 — Scripts
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Ano dinâmico no rodapé ---------- */
  var anoEl = document.getElementById("ano");
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  /* ---------- Header muda de fundo ao rolar ---------- */
  var header = document.getElementById("header");
  function onScroll() {
    if (window.scrollY > 40) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var toggle = document.getElementById("menuToggle");
  var nav = document.getElementById("nav");

  function closeMenu() {
    nav.classList.remove("is-open");
    toggle.classList.remove("is-active");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-active", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fechar menu de navegação" : "Abrir menu de navegação");
  });

  // Fecha ao clicar em um link
  nav.querySelectorAll(".nav__link").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  // Fecha ao redimensionar para desktop
  window.addEventListener("resize", function () {
    if (window.innerWidth > 992) closeMenu();
  });

  /* ---------- Animação de entrada (reveal on scroll) ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    // Fallback: mostra tudo
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Rolagem suave para âncoras (fallback) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var targetId = this.getAttribute("href");
      if (targetId === "#" || targetId.length < 2) return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: top, behavior: "smooth" });
      }
    });
  });
  /* ---------- Acessibilidade: avisar links que abrem em nova aba ---------- */
  document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
    if (link.querySelector(".sr-only")) return;
    var aviso = document.createElement("span");
    aviso.className = "sr-only";
    aviso.textContent = " (abre em nova aba)";
    link.appendChild(aviso);
  });

  /* ---------- Painel de acessibilidade (fonte, contraste, links) ---------- */
  (function () {
    var root = document.documentElement;
    var toggle = document.getElementById("a11yToggle");
    var panel = document.getElementById("a11yPanel");
    var closeBtn = document.getElementById("a11yClose");
    if (!toggle || !panel) return;

    var CHAVE = "garagem110-a11y";
    var estado = { font: 0, contrast: false, links: false };

    try {
      var salvo = JSON.parse(localStorage.getItem(CHAVE));
      if (salvo) estado = { font: salvo.font || 0, contrast: !!salvo.contrast, links: !!salvo.links };
    } catch (e) {}

    function salvar() {
      try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {}
    }

    function marcarBotao(nome, ativo) {
      var btn = panel.querySelector('[data-a11y="' + nome + '"]');
      if (btn) btn.setAttribute("aria-pressed", ativo ? "true" : "false");
    }

    function aplicar() {
      root.style.fontSize = 100 + estado.font + "%";
      root.classList.toggle("a11y-contrast", estado.contrast);
      root.classList.toggle("a11y-links", estado.links);
      marcarBotao("contrast", estado.contrast);
      marcarBotao("links", estado.links);
    }

    function abrir() {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      closeBtn.focus();
    }
    function fechar(voltarFoco) {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      if (voltarFoco) toggle.focus();
    }

    toggle.addEventListener("click", function () {
      if (panel.hidden) abrir(); else fechar(true);
    });
    closeBtn.addEventListener("click", function () { fechar(true); });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) fechar(true);
    });
    document.addEventListener("click", function (e) {
      if (panel.hidden) return;
      if (!panel.contains(e.target) && !toggle.contains(e.target)) fechar(false);
    });

    panel.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[data-a11y]") : null;
      if (!btn) return;
      var acao = btn.getAttribute("data-a11y");
      if (acao === "font-up") estado.font = Math.min(estado.font + 10, 40);
      else if (acao === "font-down") estado.font = Math.max(estado.font - 10, -20);
      else if (acao === "contrast") estado.contrast = !estado.contrast;
      else if (acao === "links") estado.links = !estado.links;
      else if (acao === "reset") estado = { font: 0, contrast: false, links: false };
      aplicar();
      salvar();
    });

    aplicar();
  })();
})();

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
  /* ---------- Carrossel da galeria ---------- */
  (function () {
    var carrossel = document.getElementById("carouselGaleria");
    if (!carrossel) return;
    var track = carrossel.querySelector(".carousel__track");
    var slides = Array.prototype.slice.call(carrossel.querySelectorAll(".carousel__slide"));
    var prevBtn = carrossel.querySelector("[data-carousel-prev]");
    var nextBtn = carrossel.querySelector("[data-carousel-next]");
    var dotsWrap = carrossel.querySelector("[data-carousel-dots]");
    var playBtn = carrossel.querySelector("[data-carousel-play]");
    var status = carrossel.querySelector("[data-carousel-status]");
    var total = slides.length;
    if (!track || total === 0) return;

    var atual = 0;
    var timer = null;
    var autoLigado = true;
    var suspenso = false;
    var reduzir = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzir) autoLigado = false;

    /* Pontos de navegação */
    var dots = [];
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "carousel__dot";
        b.setAttribute("aria-label", "Ir para imagem " + (i + 1));
        b.addEventListener("click", function () { autoLigado = false; irPara(i, true); sincronizar(); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    function irPara(idx, anunciar) {
      atual = (idx + total) % total;
      track.style.transform = "translateX(" + (-atual * 100) + "%)";
      slides.forEach(function (s, i) {
        s.setAttribute("aria-hidden", i === atual ? "false" : "true");
      });
      dots.forEach(function (d, i) {
        if (i === atual) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
      if (anunciar && status) status.textContent = "Imagem " + (atual + 1) + " de " + total;
    }
    function proximo(anunciar) { irPara(atual + 1, anunciar); }
    function anterior(anunciar) { irPara(atual - 1, anunciar); }

    function pararTimer() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }
    function atualizarPlay() {
      if (!playBtn) return;
      playBtn.hidden = reduzir;
      if (reduzir) return;
      playBtn.setAttribute("aria-label", autoLigado ? "Pausar apresentação automática" : "Retomar apresentação automática");
      carrossel.classList.toggle("is-paused", !autoLigado);
    }
    function sincronizar() {
      pararTimer();
      if (autoLigado && !suspenso && !document.hidden) {
        timer = window.setInterval(function () { proximo(false); }, 5000);
      }
      atualizarPlay();
    }

    function interagir(fn) {
      return function () {
        autoLigado = false;
        fn();
        sincronizar();
      };
    }
    if (nextBtn) nextBtn.addEventListener("click", interagir(function () { proximo(true); }));
    if (prevBtn) prevBtn.addEventListener("click", interagir(function () { anterior(true); }));

    /* Teclado */
    carrossel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); autoLigado = false; proximo(true); sincronizar(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); autoLigado = false; anterior(true); sincronizar(); }
    });

    /* Pausar ao passar o mouse / focar */
    carrossel.addEventListener("mouseenter", function () { suspenso = true; sincronizar(); });
    carrossel.addEventListener("mouseleave", function () { suspenso = false; sincronizar(); });
    carrossel.addEventListener("focusin", function () { suspenso = true; sincronizar(); });
    carrossel.addEventListener("focusout", function () { suspenso = false; sincronizar(); });
    document.addEventListener("visibilitychange", sincronizar);

    /* Botão pausar/retomar */
    if (playBtn) {
      playBtn.addEventListener("click", function () {
        autoLigado = !autoLigado;
        sincronizar();
      });
    }

    /* Arrastar (toque / dedo) */
    var x0 = null;
    carrossel.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      x0 = e.clientX;
    });
    carrossel.addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) {
        autoLigado = false;
        if (dx < 0) proximo(true); else anterior(true);
        sincronizar();
      }
    });
    carrossel.addEventListener("pointercancel", function () { x0 = null; });

    irPara(0, false);
    sincronizar();
  })();

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

/* =========================================================
   GARAGEM 110 — Agenda do barbeiro
   Lê os agendamentos salvos no mesmo dispositivo (localStorage)
   e organiza por dia e por profissional. Acesso protegido por PIN.
   ========================================================= */

(function () {
  "use strict";

  // Evita inicializar duas vezes caso o script seja carregado em dobro
  if (window.__agendaCarregado) return;
  window.__agendaCarregado = true;

  /* =========================================================
     1) CONFIGURAÇÃO  (edite aqui)
     ========================================================= */

  var PIN = "110110";                 // <-- troque pelo PIN da equipe
  var STORAGE_KEY = "garagem110-agendamentos";
  var DIAS_PROXIMOS = 45;             // alcance da aba "Próximos" (dias)

  // Mesma URL do Web App do Google Apps Script usada no agendamento.js.
  // Veja google-agenda/COMO-CONFIGURAR.md. Deixe "" para usar só o aparelho.
  var API_URL = "";

  /* =========================================================
     2) HELPERS
     ========================================================= */

  var DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  var DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  var MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function toMin(hhmm) {
    var p = String(hhmm).split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function isoOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseISO(iso) {
    var p = iso.split("-");
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }
  function hojeISO() { return isoOf(new Date()); }
  function fmtPreco(n) { return "R$ " + n; }
  function fmtDur(min) {
    if (min < 60) return min + " min";
    var h = Math.floor(min / 60), m = min % 60;
    return h + "h" + (m ? pad(m) : "");
  }
  function fmtDataLonga(iso) {
    var d = parseISO(iso);
    return DIAS_SEMANA[d.getDay()] + ", " + pad(d.getDate()) + " de " + MESES[d.getMonth()];
  }
  function dtDe(ag) {
    var d = parseISO(ag.data);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(toMin(ag.hora) / 60), toMin(ag.hora) % 60);
  }

  var STATUS = {
    confirmado: { label: "Confirmado", cls: "appt--confirmado" },
    concluido:  { label: "Concluído",  cls: "appt--concluido" },
    faltou:     { label: "Faltou",     cls: "appt--faltou" },
    cancelado:  { label: "Cancelado",  cls: "appt--cancelado" }
  };
  function statusDe(ag) { return STATUS[ag.status] ? ag.status : "confirmado"; }

  // Compara PINs ignorando maiúsculas/minúsculas e espaços nas pontas.
  // Aceita tanto texto ("joao110") quanto número (110110) na configuração.
  function normalizarPin(v) {
    return String(v == null ? "" : v).trim().toUpperCase();
  }

  /* =========================================================
     3) DADOS
     ========================================================= */

  var agendamentos = [];

  function carregar() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      agendamentos = (Array.isArray(arr) ? arr : []).map(function (a) {
        if (!a.status) a.status = "confirmado";
        if (typeof a.total !== "number") a.total = 0;
        if (typeof a.duracao !== "number") a.duracao = 30;
        return a;
      });
    } catch (e) { agendamentos = []; }
  }
  function salvar() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(agendamentos)); } catch (e) {}
  }

  /* =========================================================
     3b) NUVEM (Google Sheets + Google Calendar via Apps Script)
     ========================================================= */

  function apiAtiva() { return !!API_URL; }

  function normalizarLista(arr) {
    return (Array.isArray(arr) ? arr : []).map(function (a) {
      if (!a.status) a.status = "confirmado";
      if (typeof a.total !== "number") a.total = Number(a.total) || 0;
      if (typeof a.duracao !== "number") a.duracao = Number(a.duracao) || 30;
      return a;
    });
  }

  function apiCarregar() {
    if (!apiAtiva()) return Promise.resolve();
    return fetch(API_URL + "?action=agendamentos", { method: "GET" })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok && Array.isArray(res.agendamentos)) {
          agendamentos = normalizarLista(res.agendamentos);
        }
      })
      .catch(function () { /* offline: mantém o que já tinha */ });
  }

  function apiStatus(id, status) {
    if (!apiAtiva()) return Promise.resolve({ ok: false });
    return fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "status", id: id, status: status })
    }).then(function (r) { return r.json(); }).catch(function () { return { ok: false }; });
  }

  /* =========================================================
     4) ESTADO
     ========================================================= */

  var estado = {
    view: "dia",                 // "dia" | "proximos"
    data: hojeISO(),
    pro: "todos",
    status: "todos",
    busca: ""
  };

  /* =========================================================
     5) FILTROS
     ========================================================= */

  function passaFiltros(ag) {
    if (estado.pro !== "todos" && ag.barbeiroNome !== estado.pro) return false;
    if (estado.busca) {
      var alvo = (ag.nome + " " + ag.telefone + " " + (ag.servicos || []).join(" ") + " " + (ag.obs || "")).toLowerCase();
      if (alvo.indexOf(estado.busca.toLowerCase()) === -1) return false;
    }
    return true;
  }
  function porStatus(ag) {
    return estado.status === "todos" || statusDe(ag) === estado.status;
  }
  function porHora(a, b) { return toMin(a.hora) - toMin(b.hora); }

  // Itens que entram no cálculo dos KPIs e na listagem (sem o filtro de status)
  function scopeItems() {
    if (estado.view === "dia") {
      return agendamentos.filter(function (a) { return a.data === estado.data && passaFiltros(a); }).sort(porHora);
    }
    // próximos: de hoje em diante
    var hoje = hojeISO();
    var limite = addDias(hoje, DIAS_PROXIMOS);
    return agendamentos
      .filter(function (a) { return a.data >= hoje && a.data <= limite && passaFiltros(a); })
      .sort(function (a, b) { return (a.data + pad(toMin(a.hora))).localeCompare(b.data + pad(toMin(b.hora))); });
  }
  function addDias(iso, n) {
    var d = parseISO(iso);
    return isoOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
  }

  /* =========================================================
     6) RENDER — PROFISSIONAIS NO FILTRO
     ========================================================= */

  function renderProFiltro() {
    var sel = $("#fPro");
    if (!sel) return;
    var set = {};
    agendamentos.forEach(function (a) { if (a.barbeiroNome) set[a.barbeiroNome] = true; });
    var nomes = Object.keys(set).sort(function (a, b) { return a.localeCompare(b); });
    sel.innerHTML = '<option value="todos">Todos</option>' + nomes.map(function (n) {
      return '<option value="' + esc(n) + '"' + (estado.pro === n ? " selected" : "") + ">" + esc(n) + "</option>";
    }).join("");
    sel.value = estado.pro;
  }

  function renderStatusFiltro() {
    var wrap = $("#fStatus");
    if (!wrap) return;
    var opts = [["todos", "Todos"], ["confirmado", "Confirmados"], ["concluido", "Concluídos"], ["faltou", "Faltas"], ["cancelado", "Cancelados"]];
    wrap.innerHTML = opts.map(function (o) {
      var on = estado.status === o[0];
      return '<button type="button" class="statchip' + (on ? " is-active" : "") + '" data-status="' + o[0] +
        '" aria-pressed="' + (on ? "true" : "false") + '">' + o[1] + "</button>";
    }).join("");
  }

  /* =========================================================
     7) RENDER — KPIs
     ========================================================= */

  function renderKpis(items) {
    var wrap = $("#kpis");
    if (!wrap) return;
    var ativos = items.filter(function (a) { return statusDe(a) !== "cancelado"; });
    var total = items.length;
    var receita = ativos.reduce(function (s, a) { return s + a.total; }, 0);
    var minutos = ativos.reduce(function (s, a) { return s + a.duracao; }, 0);
    var concluidos = items.filter(function (a) { return statusDe(a) === "concluido"; }).length;

    var rotulo1 = estado.view === "dia" ? "Atendimentos do dia" : "Próximos atendimentos";
    wrap.innerHTML =
      kpi(rotulo1, total, "") +
      kpi("Faturamento previsto", fmtPreco(receita), "kpi--green") +
      kpi("Horas na cadeira", fmtDur(minutos), "kpi--plain") +
      kpi("Concluídos", concluidos, "kpi--plain");
  }
  function kpi(label, value, cls) {
    return '<div class="kpi ' + (cls || "") + '"><span class="kpi__label">' + label + '</span><span class="kpi__value">' + value + "</span></div>";
  }

  /* =========================================================
     8) RENDER — LISTA / TIMELINE
     ========================================================= */

  function apptHTML(ag) {
    var st = statusDe(ag);
    var info = STATUS[st];
    var servicos = (ag.servicos || []).join(", ");
    var passado = dtDe(ag).getTime() < Date.now();

    var acoes = [];
    if (st !== "concluido") acoes.push('<button type="button" class="btn appt__btn--done" data-set="concluido" data-id="' + esc(ag.id) + '">Concluir</button>');
    if (st !== "faltou") acoes.push('<button type="button" class="btn appt__btn--no" data-set="faltou" data-id="' + esc(ag.id) + '">Faltou</button>');
    if (st !== "cancelado") acoes.push('<button type="button" class="btn appt__btn--cancel" data-set="cancelado" data-id="' + esc(ag.id) + '">Cancelar</button>');
    if (st !== "confirmado") acoes.push('<button type="button" class="btn appt__btn--reset" data-set="confirmado" data-id="' + esc(ag.id) + '">Reabrir</button>');

    var dig = (ag.telefone || "").replace(/\D/g, "");
    var wa = "https://wa.me/" + (dig.length && dig.length <= 11 ? "55" + dig : dig);

    return '<article class="appt ' + info.cls + (passado ? " appt--past" : "") + '">' +
      '<div class="appt__time">' +
        '<span class="appt__hour">' + esc(ag.hora) + "</span>" +
        '<span class="appt__dur">' + fmtDur(ag.duracao) + "</span>" +
      "</div>" +
      '<div class="appt__body">' +
        '<p class="appt__name">' + esc(ag.nome) + "</p>" +
        '<p class="appt__svcs">💈 ' + esc(servicos) + "</p>" +
        '<p class="appt__meta">' +
          '<span class="appt__pro">' + esc(ag.barbeiroNome || "—") + "</span>" +
          " &nbsp;•&nbsp; 📞 " + esc(ag.telefone || "—") +
        "</p>" +
        (ag.obs ? '<p class="appt__obs">📝 ' + esc(ag.obs) + "</p>" : "") +
      "</div>" +
      '<div class="appt__side">' +
        '<span class="appt__price">' + fmtPreco(ag.total) + "</span>" +
        '<span class="appt__badge">' + info.label + "</span>" +
        '<div class="appt__actions">' +
          (ag.telefone ? '<a class="btn appt__wa" href="' + esc(wa) + '" target="_blank" rel="noopener">WhatsApp</a>' : "") +
          acoes.join("") +
        "</div>" +
      "</div>" +
    "</article>";
  }

  function render() {
    renderProFiltro();
    var scope = scopeItems();
    renderKpis(scope);

    var body = $("#agendaBody");
    if (!body) return;

    var visiveis = scope.filter(porStatus);

    if (!visiveis.length) {
      body.innerHTML = '<div class="ag-empty"><span aria-hidden="true">🗓️</span>' +
        (estado.view === "dia"
          ? "Nenhum atendimento para " + fmtDataLonga(estado.data) + " com os filtros atuais."
          : "Nenhum atendimento futuro com os filtros atuais.") +
        "</div>";
      return;
    }

    if (estado.view === "dia") {
      var receita = scope.filter(function (a) { return statusDe(a) !== "cancelado"; })
        .reduce(function (s, a) { return s + a.total; }, 0);
      body.innerHTML =
        '<div class="ag-day">' +
          '<div class="ag-day__head">' +
            '<h3 class="ag-day__title">' + esc(fmtDataLonga(estado.data)) + "</h3>" +
            '<span class="ag-day__count">' + visiveis.length + (visiveis.length === 1 ? " atendimento" : " atendimentos") + "</span>" +
            '<span class="ag-day__revenue">Previsto: <b>' + fmtPreco(receita) + "</b></span>" +
          "</div>" +
          '<div class="ag-list">' + visiveis.map(apptHTML).join("") + "</div>" +
        "</div>";
      return;
    }

    // Próximos: agrupa por dia
    var grupos = {};
    var ordem = [];
    visiveis.forEach(function (a) {
      if (!grupos[a.data]) { grupos[a.data] = []; ordem.push(a.data); }
      grupos[a.data].push(a);
    });
    ordem.sort();

    body.innerHTML = ordem.map(function (iso) {
      var lista = grupos[iso].sort(porHora);
      var receitaDia = lista.filter(function (a) { return statusDe(a) !== "cancelado"; })
        .reduce(function (s, a) { return s + a.total; }, 0);
      return '<div class="ag-day">' +
        '<div class="ag-day__head">' +
          '<h3 class="ag-day__title">' + esc(fmtDataLonga(iso)) + "</h3>" +
          '<span class="ag-day__count">' + lista.length + "</span>" +
          '<span class="ag-day__revenue">Previsto: <b>' + fmtPreco(receitaDia) + "</b></span>" +
        "</div>" +
        '<div class="ag-list">' + lista.map(apptHTML).join("") + "</div>" +
      "</div>";
    }).join("");
  }

  /* =========================================================
     9) AÇÕES
     ========================================================= */

  function definirStatus(id, status) {
    var mudou = false;
    agendamentos.forEach(function (a) {
      if (a.id === id) { a.status = status; mudou = true; }
    });
    if (!mudou) return;
    salvar();
    render();
    if (apiAtiva()) apiStatus(id, status);
  }

  function exportarCSV() {
    var items = scopeItems().filter(porStatus).sort(function (a, b) {
      return (a.data + a.hora).localeCompare(b.data + b.hora);
    });
    var linhas = [["Data", "Hora", "Cliente", "Telefone", "Servicos", "Profissional", "Duracao", "Total", "Status", "Observacao"]];
    items.forEach(function (a) {
      linhas.push([
        a.data, a.hora, a.nome, a.telefone, (a.servicos || []).join(" | "),
        a.barbeiroNome || "", fmtDur(a.duracao), a.total, STATUS[statusDe(a)].label, a.obs || ""
      ]);
    });
    var csv = "\uFEFF" + linhas.map(function (l) {
      return l.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(";");
    }).join("\r\n");

    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "garagem110-agenda-" + (estado.view === "dia" ? estado.data : hojeISO()) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* =========================================================
     10) LOGIN
     ========================================================= */

  var CHAVE_SESSAO = "garagem110-agenda-unlocked";

  function estaLiberado() {
    try { return sessionStorage.getItem(CHAVE_SESSAO) === "1"; } catch (e) { return false; }
  }
  function liberar() {
    try { sessionStorage.setItem(CHAVE_SESSAO, "1"); } catch (e) {}
    mostrarPainel();
  }
  function bloquear() {
    try { sessionStorage.removeItem(CHAVE_SESSAO); } catch (e) {}
    $("#dash").hidden = true;
    $("#lock").hidden = false;
    $("#lockBtn").hidden = true;
    var pin = $("#pin");
    if (pin) { pin.value = ""; pin.focus(); }
  }
  function mostrarPainel() {
    $("#lock").hidden = true;
    $("#dash").hidden = false;
    $("#lockBtn").hidden = false;
    carregar();
    render();
    // Se a nuvem estiver configurada, busca os agendamentos reais
    if (apiAtiva()) apiCarregar().then(render);
  }

  /* =========================================================
     11) EVENTOS
     ========================================================= */

  function bind() {
    // Login
    var form = $("#lockForm");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var pin = normalizarPin($("#pin").value);
        if (pin !== "" && pin === normalizarPin(PIN)) { liberar(); }
        else { $("#lockMsg").textContent = "PIN incorreto. Tente novamente."; $("#pin").select(); }
      });
    }
    var lockBtn = $("#lockBtn");
    if (lockBtn) lockBtn.addEventListener("click", bloquear);

    // Mostrar/ocultar PIN
    var pinToggle = $("#pinToggle");
    if (pinToggle) {
      pinToggle.addEventListener("click", function () {
        var campo = $("#pin");
        var mostrar = campo.type === "password";
        campo.type = mostrar ? "text" : "password";
        pinToggle.setAttribute("aria-pressed", mostrar ? "true" : "false");
        pinToggle.setAttribute("aria-label", mostrar ? "Ocultar PIN" : "Mostrar PIN");
        campo.focus();
      });
    }

    // Navegação de data
    var prev = $("#prevDay"), next = $("#nextDay"), today = $("#todayBtn"), pick = $("#datePick");
    if (prev) prev.addEventListener("click", function () { estado.data = addDias(estado.data, -1); estado.view = "dia"; setView(); render(); });
    if (next) next.addEventListener("click", function () { estado.data = addDias(estado.data, 1); estado.view = "dia"; setView(); render(); });
    if (today) today.addEventListener("click", function () { estado.data = hojeISO(); estado.view = "dia"; setView(); render(); });
    if (pick) pick.addEventListener("change", function () { if (pick.value) { estado.data = pick.value; estado.view = "dia"; setView(); render(); } });

    // Abas de visualização
    $$(".viewtab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        estado.view = tab.getAttribute("data-view");
        setView();
        render();
      });
    });

    // Filtros
    var pro = $("#fPro");
    if (pro) pro.addEventListener("change", function () { estado.pro = pro.value; render(); });
    var busca = $("#fSearch");
    if (busca) busca.addEventListener("input", function () { estado.busca = busca.value; render(); });

    var statusWrap = $("#fStatus");
    if (statusWrap) {
      statusWrap.addEventListener("click", function (e) {
        var b = e.target.closest("[data-status]");
        if (!b) return;
        estado.status = b.getAttribute("data-status");
        renderStatusFiltro();
        render();
      });
    }

    // Ações nos agendamentos
    var body = $("#agendaBody");
    if (body) {
      body.addEventListener("click", function (e) {
        var b = e.target.closest("[data-set]");
        if (!b) return;
        definirStatus(b.getAttribute("data-id"), b.getAttribute("data-set"));
      });
    }

    // Exportar / imprimir
    var csvBtn = $("#csvBtn");
    if (csvBtn) csvBtn.addEventListener("click", exportarCSV);
    var printBtn = $("#printBtn");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

    // Sincroniza se o agendamento mudar em outra aba
    window.addEventListener("storage", function (e) {
      if (e.key === STORAGE_KEY && !$("#dash").hidden) { carregar(); render(); }
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && !$("#dash").hidden) { carregar(); render(); }
    });
  }

  function setView() {
    $$(".viewtab").forEach(function (t) {
      var on = t.getAttribute("data-view") === estado.view;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    var pick = $("#datePick");
    if (pick) pick.value = estado.data;
    var nav = $(".datebar__nav");
    if (nav) nav.style.opacity = estado.view === "dia" ? "1" : "0.5";
  }

  /* =========================================================
     12) INIT
     ========================================================= */

  function init() {
    carregar();
    var pick = $("#datePick");
    if (pick) pick.value = estado.data;
    renderStatusFiltro();
    setView();
    bind();

    if (estaLiberado()) mostrarPainel();
    else {
      $("#lock").hidden = false;
      $("#dash").hidden = true;
      $("#lockBtn").hidden = true;
      var pin = $("#pin");
      if (pin) pin.focus();
    }

    // Sinaliza para o HTML que o sistema carregou e está pronto
    window.__agendaPronta = true;
    var st = $("#lockStatus");
    if (st) st.textContent = "Sistema carregado ✔ (v4)";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

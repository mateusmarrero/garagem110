/* =========================================================
   GARAGEM 110 — Sistema de Agendamento
   HTML/CSS/JS puro. Os agendamentos ficam salvos no navegador
   (localStorage) e a confirmação é enviada pelo WhatsApp.
   ========================================================= */

(function () {
  "use strict";

  // Evita inicializar duas vezes caso o script seja carregado em dobro
  if (window.__agendamentoCarregado) return;
  window.__agendamentoCarregado = true;

  /* =========================================================
     1) CONFIGURAÇÃO  (edite aqui)
     ========================================================= */

  // Número de WhatsApp que recebe as confirmações (só dígitos, com 55)
  var WHATSAPP = "5521970189712";

  // Categorias (a ordem importa)
  var CATEGORIAS = ["Combos", "Cabelo", "Barba", "Estética & Extras"];

  // Catálogo de serviços — nome, descrição, preço (R$) e duração (min)
  var SERVICOS = [
    // --- Combos ---
    { id: "cabelo-barba",      cat: "Combos", icon: "💈", nome: "Cabelo e Barba",      desc: "O combo completo: corte + barba com acabamento na navalha.", preco: 50, duracao: 60 },
    { id: "corte-sobrancelha", cat: "Combos", icon: "⚡", nome: "Corte + Sobrancelha", desc: "Degradê caprichado com a limpeza e o alinhamento da sobrancelha.", preco: 33, duracao: 40 },
    { id: "corte-pigmentacao", cat: "Combos", icon: "🎨", nome: "Corte + Pigmentação", desc: "Degradê com pigmentação para fechar as falhas e dar mais definição.", preco: 45, duracao: 50 },

    // --- Cabelo ---
    { id: "corte-disfarcado",  cat: "Cabelo", icon: "✂️", nome: "Corte Disfarçado",    desc: "Degradê bem feito, com transição suave e acabamento afiado.", preco: 30, duracao: 30 },
    { id: "tesoura",           cat: "Cabelo", icon: "✨", nome: "Tesoura",             desc: "Corte todo na tesoura, sob medida para o seu tipo de cabelo.", preco: 35, duracao: 40 },
    { id: "corte-infantil",    cat: "Cabelo", icon: "👦", nome: "Corte Infantil",      desc: "Atendimento com paciência para os pequenos.", preco: 35, duracao: 30 },
    { id: "navalhado",         cat: "Cabelo", icon: "🪒", nome: "Navalhado",           desc: "Corte com linhas definidas na navalha para um visual marcante.", preco: 32, duracao: 35 },
    { id: "platinado",         cat: "Cabelo", icon: "❄️", nome: "Platinado",           desc: "Descoloração completa para um visual ousado.", preco: 90, duracao: 90 },
    { id: "reflexo",           cat: "Cabelo", icon: "🌟", nome: "Reflexo / Luzes",     desc: "Mechas e luzes para dar movimento ao cabelo.", preco: 80, duracao: 80 },
    { id: "tintura",           cat: "Cabelo", icon: "🖌️", nome: "Tintura",             desc: "Coloração para cobrir os brancos ou mudar o tom.", preco: 55, duracao: 60 },

    // --- Barba ---
    { id: "barba",             cat: "Barba",  icon: "🧔", nome: "Barba",               desc: "Modelagem e aparo com toalha quente e navalha.", preco: 30, duracao: 30 },
    { id: "barbaterapia",      cat: "Barba",  icon: "🔥", nome: "Barbaterapia",        desc: "Barba com toalha quente, óleos e massagem relaxante.", preco: 45, duracao: 40 },
    { id: "bigode",            cat: "Barba",  icon: "👨", nome: "Aparo de Bigode",    desc: "Alinhamento e aparo do bigode.", preco: 15, duracao: 15 },

    // --- Estética & Extras ---
    { id: "sobrancelha",       cat: "Estética & Extras", icon: "👀", nome: "Sobrancelha",           desc: "Design e alinhamento na navalha, respeitando o rosto.", preco: 10, duracao: 10 },
    { id: "limpeza-pele",      cat: "Estética & Extras", icon: "🧖", nome: "Limpeza de Pele",       desc: "Higienização profunda para remover cravos e impurezas.", preco: 40, duracao: 40 },
    { id: "hidratacao",        cat: "Estética & Extras", icon: "💧", nome: "Hidratação",            desc: "Hidratação capilar para devolver brilho e maciez.", preco: 35, duracao: 30 },
    { id: "depilacao-nariz",   cat: "Estética & Extras", icon: "👃", nome: "Depilação de Nariz",    desc: "Remoção de pelos com cera, rápido e indolor.", preco: 15, duracao: 10 },
    { id: "depilacao-ouvido",  cat: "Estética & Extras", icon: "👂", nome: "Depilação de Ouvido",   desc: "Remoção de pelos com cera, rápido e indolor.", preco: 15, duracao: 10 },
    { id: "pezinho",           cat: "Estética & Extras", icon: "💅", nome: "Pezinho / Nuca",        desc: "Acabamento na nuca e nas laterais para manter o corte novo.", preco: 15, duracao: 15 }
  ];

  // Equipe — edite os nomes. "any" = sem preferência (o sistema atribui quem estiver livre).
  var BARBEIROS = [
    { id: "any",    nome: "Sem preferência" },
    { id: "wesley", nome: "Wesley" },
    { id: "diego",  nome: "Diego" },
    { id: "thiago", nome: "Thiago" }
  ];

  // Funcionamento: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  var HORARIOS = {
    0: null,                          // Domingo fechado
    1: null,                          // Segunda fechado
    2: { abre: "09:00", fecha: "19:00" },
    3: { abre: "09:00", fecha: "19:00" },
    4: { abre: "09:00", fecha: "19:00" },
    5: { abre: "09:00", fecha: "19:30" },
    6: { abre: "09:00", fecha: "20:00" }
  };
  var ALMOCO = { inicio: "12:00", fim: "13:30" }; // pausa (sem atendimento)
  var INTERVALO = 30;      // de quantos em quantos minutos são os horários
  var DIAS_VISIVEIS = 21;  // quantos dias aparecem na tira de datas
  var BUFFER = 15;         // minutos mínimos de antecedência para agendar hoje

  var STORAGE_KEY = "garagem110-agendamentos";

  /* =========================================================
     INTEGRAÇÃO COM A NUVEM (Google Sheets + Google Calendar)
     ---------------------------------------------------------
     Cole abaixo a URL do Web App do Google Apps Script.
     O passo a passo está em: google-agenda/COMO-CONFIGURAR.md
     Deixe "" para funcionar só no navegador (modo local/offline).
     ========================================================= */
  var API_URL = "";

  /* =========================================================
     2) HELPERS
     ========================================================= */

  var DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  var DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  var MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function toMin(hhmm) {
    var p = String(hhmm).split(":");
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }
  function toHHMM(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function isoOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseISO(iso) {
    var p = iso.split("-");
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function fmtPreco(n) { return "R$ " + n; }
  function fmtDur(min) {
    if (min < 60) return min + " min";
    var h = Math.floor(min / 60), m = min % 60;
    return h + "h" + (m ? pad(m) : "");
  }
  function fmtDataCurta(iso) {
    var d = parseISO(iso);
    return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear();
  }
  function fmtDataLonga(iso) {
    var d = parseISO(iso);
    var s = DIAS_SEMANA[d.getDay()] + ", " + pad(d.getDate()) + " de " + nomeMes(d.getMonth());
    return s;
  }
  function nomeMes(m) {
    return ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"][m];
  }
  function svcById(id) {
    for (var i = 0; i < SERVICOS.length; i++) if (SERVICOS[i].id === id) return SERVICOS[i];
    return null;
  }
  function barbeiroById(id) {
    for (var i = 0; i < BARBEIROS.length; i++) if (BARBEIROS[i].id === id) return BARBEIROS[i];
    return null;
  }

  /* =========================================================
     3) ESTADO
     ========================================================= */

  var estado = {
    selecionados: [],       // ids dos serviços
    categoria: "Todos",
    busca: "",
    barbeiro: "any",
    data: null,             // "YYYY-MM-DD"
    hora: null              // "HH:MM"
  };

  var agendamentos = carregar();   // agendamentos deste navegador ("Meus agendamentos")
  var remotos = [];                // agendamentos vindos da nuvem (Google Sheets), se configurada

  /* =========================================================
     4) PERSISTÊNCIA
     ========================================================= */

  function carregar() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function salvar() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(agendamentos)); } catch (e) {}
  }

  /* =========================================================
     4b) NUVEM (Google Sheets + Google Calendar via Apps Script)
     ========================================================= */

  function apiAtiva() { return !!API_URL; }

  function apiCarregarRemotos() {
    if (!apiAtiva()) return Promise.resolve();
    return fetch(API_URL + "?action=agendamentos", { method: "GET" })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok && Array.isArray(res.agendamentos)) {
          remotos = res.agendamentos.filter(function (a) { return a && a.id && a.data && a.hora; });
        }
      })
      .catch(function () { /* offline: segue com os dados locais */ });
  }

  function enviarParaNuvem(ag) {
    return fetch(API_URL, {
      method: "POST",
      // text/plain evita o "preflight" de CORS no Google Apps Script
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "criar", agendamento: ag })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok) remotos.push(ag);
        return res || {};
      })
      .catch(function () { return { ok: false, erro: "rede" }; });
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
     5) DISPONIBILIDADE
     ========================================================= */

  function selecionados() {
    return estado.selecionados.map(svcById).filter(Boolean);
  }
  function duracaoTotal() {
    return selecionados().reduce(function (s, x) { return s + x.duracao; }, 0);
  }
  function precoTotal() {
    return selecionados().reduce(function (s, x) { return s + x.preco; }, 0);
  }

  // Junta nuvem + local, sem repetir pelo id
  function todosParaDisponibilidade() {
    var vistos = {}, out = [];
    remotos.concat(agendamentos).forEach(function (a) {
      if (!a || !a.id || !a.data || !a.hora) return;
      if (vistos[a.id]) return;
      vistos[a.id] = true;
      out.push(a);
    });
    return out;
  }

  function busyMap(dataISO) {
    var map = {};
    BARBEIROS.forEach(function (b) { map[b.id] = []; });
    todosParaDisponibilidade().forEach(function (a) {
      if (a.data !== dataISO) return;
      if (a.status === "cancelado") return;
      if (!map[a.barbeiro]) map[a.barbeiro] = [];
      map[a.barbeiro].push([toMin(a.hora), toMin(a.hora) + a.duracao]);
    });
    return map;
  }

  function slotFits(t, dur, cfg) {
    if (t < toMin(cfg.abre) || t + dur > toMin(cfg.fecha)) return false;
    if (t < toMin(ALMOCO.fim) && t + dur > toMin(ALMOCO.inicio)) return false;
    return true;
  }

  function isFree(t, dur, busy) {
    function livre(id) {
      var list = busy[id] || [];
      for (var i = 0; i < list.length; i++) {
        if (t < list[i][1] && t + dur > list[i][0]) return false;
      }
      return true;
    }
    if (estado.barbeiro !== "any") return livre(estado.barbeiro);
    var reais = BARBEIROS.filter(function (b) { return b.id !== "any"; });
    return reais.some(function (b) { return livre(b.id); });
  }

  function slotsFor(dataISO) {
    return candidateSlots(dataISO).filter(function (s) { return s.free; }).map(function (s) { return s.h; });
  }

  // Todos os horários possíveis do dia, marcando se estão livres
  function candidateSlots(dataISO) {
    var d = parseISO(dataISO);
    var cfg = HORARIOS[d.getDay()];
    if (!cfg) return [];
    var dur = duracaoTotal() || INTERVALO;
    var busy = busyMap(dataISO);
    var agora = new Date();
    var isHoje = sameDay(d, agora);
    var agoraMin = agora.getHours() * 60 + agora.getMinutes();
    var out = [];
    for (var t = toMin(cfg.abre); t + dur <= toMin(cfg.fecha); t += INTERVALO) {
      if (!slotFits(t, dur, cfg)) continue;
      if (isHoje && t <= agoraMin + BUFFER) continue;
      out.push({ h: toHHMM(t), free: isFree(t, dur, busy) });
    }
    return out;
  }

  function resolveBarbeiro(dataISO, t, dur) {
    if (estado.barbeiro !== "any") return estado.barbeiro;
    var busy = busyMap(dataISO);
    var reais = BARBEIROS.filter(function (b) { return b.id !== "any"; });
    for (var i = 0; i < reais.length; i++) {
      var id = reais[i].id, livre = true, list = busy[id] || [];
      for (var j = 0; j < list.length; j++) {
        if (t < list[j][1] && t + dur > list[j][0]) { livre = false; break; }
      }
      if (livre) return id;
    }
    return null;
  }

  /* =========================================================
     6) RENDER — CATEGORIAS
     ========================================================= */

  function renderChips() {
    var wrap = $("#catChips");
    if (!wrap) return;
    var cats = ["Todos"].concat(CATEGORIAS);
    wrap.innerHTML = cats.map(function (c) {
      var on = estado.categoria === c;
      return '<button type="button" class="chip' + (on ? " is-active" : "") +
        '" data-cat="' + esc(c) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
        esc(c) + "</button>";
    }).join("");
  }

  /* =========================================================
     7) RENDER — SERVIÇOS
     ========================================================= */

  function renderServicos() {
    var grid = $("#svcGrid");
    if (!grid) return;
    var busca = estado.busca.trim().toLowerCase();
    var lista = SERVICOS.filter(function (s) {
      if (estado.categoria !== "Todos" && s.cat !== estado.categoria) return false;
      if (busca) {
        var alvo = (s.nome + " " + s.desc + " " + s.cat).toLowerCase();
        if (alvo.indexOf(busca) === -1) return false;
      }
      return true;
    });

    $("#svcEmpty").hidden = lista.length > 0;

    grid.innerHTML = lista.map(function (s) {
      var on = estado.selecionados.indexOf(s.id) !== -1;
      return '<button type="button" class="svc' + (on ? " is-active" : "") + '" data-id="' + esc(s.id) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
        '<span class="svc__check" aria-hidden="true">✓</span>' +
        '<span class="svc__icon" aria-hidden="true">' + s.icon + "</span>" +
        '<span class="svc__body">' +
          '<span class="svc__name">' + esc(s.nome) + "</span>" +
          '<span class="svc__desc">' + esc(s.desc) + "</span>" +
          '<span class="svc__meta">' +
            '<span class="svc__price">' + fmtPreco(s.preco) + "</span>" +
            '<span class="svc__time">• ' + fmtDur(s.duracao) + "</span>" +
          "</span>" +
        "</span>" +
      "</button>";
    }).join("");
  }

  /* =========================================================
     8) RENDER — PROFISSIONAIS
     ========================================================= */

  function renderBarbeiros() {
    var wrap = $("#pros");
    if (!wrap) return;
    wrap.innerHTML = BARBEIROS.map(function (b) {
      var on = estado.barbeiro === b.id;
      var inicial = b.id === "any" ? "★" : b.nome.charAt(0).toUpperCase();
      return '<label class="pro' + (on ? " is-active" : "") + '">' +
        '<input type="radio" name="barbeiro" value="' + esc(b.id) + '"' + (on ? " checked" : "") + " />" +
        '<span class="pro__avatar" aria-hidden="true">' + esc(inicial) + "</span>" +
        esc(b.nome) +
      "</label>";
    }).join("");
  }

  /* =========================================================
     9) RENDER — DIAS
     ========================================================= */

  function renderDias() {
    var wrap = $("#days");
    if (!wrap) return;
    var scroll = wrap.scrollLeft;
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    var html = "";
    for (var i = 0; i < DIAS_VISIVEIS; i++) {
      var d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
      var iso = isoOf(d);
      var livre = slotsFor(iso).length > 0;
      var on = estado.data === iso;
      html += '<button type="button" class="day' + (on ? " is-active" : "") + '" data-date="' + iso + '"' +
        (livre ? "" : " disabled") + ' aria-pressed="' + (on ? "true" : "false") + '">' +
        '<span class="day__wd">' + DIAS_CURTOS[d.getDay()] + "</span>" +
        '<span class="day__num">' + d.getDate() + "</span>" +
        '<span class="day__mo">' + MESES[d.getMonth()] + "</span>" +
      "</button>";
    }
    wrap.innerHTML = html;
    wrap.scrollLeft = scroll;
  }

  /* =========================================================
     10) RENDER — HORÁRIOS
     ========================================================= */

  function renderHoras() {
    var wrap = $("#slots");
    var hint = $("#slotsHint");
    if (!wrap) return;

    if (!estado.data) {
      wrap.innerHTML = '<p class="slots__empty">Escolha um dia acima para ver os horários.</p>';
      hint.textContent = "";
      return;
    }
    if (!estado.selecionados.length) {
      wrap.innerHTML = '<p class="slots__empty">Selecione ao menos um serviço para ver os horários.</p>';
      hint.textContent = "";
      return;
    }

    var cands = candidateSlots(estado.data);
    if (!cands.length) {
      wrap.innerHTML = '<p class="slots__empty">Não há mais horários disponíveis neste dia. Escolha outro dia.</p>';
      hint.textContent = "";
      return;
    }

    var livres = cands.filter(function (s) { return s.free; }).length;
    if (!livres) {
      wrap.innerHTML = '<p class="slots__empty">Nenhum horário livre neste dia. Tente outro dia ou profissional.</p>';
      hint.textContent = "";
      return;
    }

    wrap.innerHTML = cands.map(function (s) {
      var on = estado.hora === s.h;
      return '<button type="button" class="slot' + (on ? " is-active" : "") + '" data-time="' + s.h +
        '" aria-pressed="' + (on ? "true" : "false") + '"' + (s.free ? "" : " disabled") + ">" + s.h + "</button>";
    }).join("");

    hint.textContent = "Duração estimada do atendimento: " + fmtDur(duracaoTotal()) + ".";
  }

  /* =========================================================
     11) RENDER — RESUMO
     ========================================================= */

  function renderResumo() {
    var list = $("#sumServices");
    var sel = selecionados();

    if (!sel.length) {
      list.innerHTML = '<li class="summary__empty">Nenhum serviço selecionado ainda.</li>';
    } else {
      list.innerHTML = sel.map(function (s) {
        return "<li><span>" + esc(s.nome) + "</span><strong>" + fmtPreco(s.preco) + "</strong></li>";
      }).join("");
    }

    $("#sumDur").textContent = sel.length ? fmtDur(duracaoTotal()) : "—";
    $("#sumPro").textContent = (barbeiroById(estado.barbeiro) || {}).nome || "—";
    $("#sumDate").textContent = estado.data ? fmtDataCurta(estado.data) : "—";
    $("#sumTime").textContent = estado.hora || "—";
    $("#sumTotal").textContent = fmtPreco(precoTotal());
  }

  /* =========================================================
     12) SINCRONIZAÇÃO
     ========================================================= */

  function sync() {
    // invalida a hora se não existir mais na agenda
    if (estado.data && estado.hora) {
      if (slotsFor(estado.data).indexOf(estado.hora) === -1) estado.hora = null;
    }
    renderDias();
    renderHoras();
    renderResumo();
  }

  /* =========================================================
     13) SELEÇÃO DE DIA PADRÃO
     ========================================================= */

  function primeiroDiaLivre() {
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    var iso;
    for (var i = 0; i < DIAS_VISIVEIS; i++) {
      var d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
      iso = isoOf(d);
      if (HORARIOS[d.getDay()] && slotsFor(iso).length > 0) return iso;
    }
    // se não houver nenhum horário livre, devolve o primeiro dia aberto
    for (var j = 0; j < DIAS_VISIVEIS; j++) {
      var dj = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + j);
      if (HORARIOS[dj.getDay()]) return isoOf(dj);
    }
    return isoOf(hoje);
  }

  /* =========================================================
     14) AGENDAMENTO (salvar)
     ========================================================= */

  function telefoneValido(tel) {
    var d = tel.replace(/\D/g, "");
    return d.length >= 10 && d.length <= 11;
  }

  function confirmar() {
    var msg = $("#sumMsg");
    msg.textContent = "";

    if (!estado.selecionados.length) { return erro("Escolha pelo menos um serviço."); }
    if (!estado.data) { return erro("Escolha um dia."); }
    if (!estado.hora) { return erro("Escolha um horário."); }

    var nome = $("#nome");
    var telefone = $("#telefone");
    var obs = $("#obs");
    var ok = true;

    limparErro(nome); limparErro(telefone);

    if (!nome.value.trim()) { marcarErro(nome, "Informe o seu nome."); ok = false; }
    if (!telefone.value.trim() || !telefoneValido(telefone.value)) {
      marcarErro(telefone, "Informe um WhatsApp válido com DDD.");
      ok = false;
    }
    if (!ok) { return erro("Confira os campos destacados nos seus dados."); }

    var dur = duracaoTotal();
    var barbeiroId = resolveBarbeiro(estado.data, toMin(estado.hora), dur);
    if (!barbeiroId) { return erro("Esse horário acabou de ser ocupado. Escolha outro."); }

    var ag = {
      id: "ag_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      servicos: selecionados().map(function (s) { return s.nome; }),
      barbeiro: barbeiroId,
      barbeiroNome: (barbeiroById(barbeiroId) || {}).nome || "Equipe",
      data: estado.data,
      hora: estado.hora,
      duracao: dur,
      total: precoTotal(),
      nome: nome.value.trim(),
      telefone: telefone.value.trim(),
      obs: obs.value.trim(),
      status: "confirmado",
      criadoEm: new Date().toISOString()
    };

    if (apiAtiva()) {
      confirmarNaNuvem(ag);
    } else {
      concluirAgendamento(ag);
    }
  }

  // Envia para a nuvem e só confirma se o servidor aceitar (evita dois clientes no mesmo horário)
  function confirmarNaNuvem(ag) {
    var btn = $("#confirmBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }
    enviarParaNuvem(ag).then(function (res) {
      if (btn) { btn.disabled = false; btn.textContent = "Confirmar agendamento"; }
      if (res && res.ok) {
        concluirAgendamento(ag);
      } else if (res && res.conflito) {
        erro("Esse horário acabou de ser ocupado. Escolha outro.");
        estado.hora = null;
        apiCarregarRemotos().then(sync);
      } else {
        concluirAgendamento(ag, "Não deu para enviar para a nuvem agora. O agendamento ficou salvo neste aparelho — confirme pelo WhatsApp para garantir.");
      }
    });
  }

  function concluirAgendamento(ag, aviso) {
    agendamentos.push(ag);
    salvar();

    abrirSucesso(ag, aviso);
    renderMinhaAgenda();

    // Limpa a seleção (mantém nome e telefone por conveniência)
    estado.selecionados = [];
    estado.hora = null;
    $("#obs").value = "";
    estado.data = primeiroDiaLivre();
    renderServicos();
    sync();
  }

  function erro(txt) { $("#sumMsg").textContent = txt; }
  function marcarErro(input, txt) {
    var field = input.closest(".field");
    if (field) {
      field.classList.add("has-error");
      var e = $(".field__error", field);
      if (!e) { e = document.createElement("span"); e.className = "field__error"; field.appendChild(e); }
      e.textContent = txt;
    }
  }
  function limparErro(input) {
    var field = input.closest(".field");
    if (!field) return;
    field.classList.remove("has-error");
    var e = $(".field__error", field);
    if (e) e.remove();
  }

  /* =========================================================
     15) MODAL DE SUCESSO + ICS + WHATSAPP
     ========================================================= */

  var ultimo = null;

  function abrirSucesso(ag, aviso) {
    ultimo = ag;
    $("#successDetails").innerHTML = (aviso ? '<p class="modal__warn">⚠️ ' + esc(aviso) + "</p>" : "") + linhas([
      ["Serviços", ag.servicos.join(", ")],
      ["Profissional", esc(ag.barbeiroNome)],
      ["Dia", fmtDataLonga(ag.data)],
      ["Horário", ag.hora + " • " + fmtDur(ag.duracao)],
      ["Total", fmtPreco(ag.total)],
      ["Nome", esc(ag.nome)],
      ["WhatsApp", esc(ag.telefone)]
    ]);
    $("#waBtn").href = linkWhatsApp(ag);
    var modal = $("#successModal");
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    var x = $(".modal__x", modal);
    if (x) x.focus();
  }

  function linhas(pares) {
    return pares.map(function (p) {
      return '<div class="modal__line"><span>' + p[0] + "</span><strong>" + p[1] + "</strong></div>";
    }).join("");
  }

  function fecharSucesso() {
    $("#successModal").hidden = true;
    document.body.style.overflow = "";
  }

  function linkWhatsApp(ag) {
    var txt =
      "Olá, Barbearia Garagem 110! 👋\n\n" +
      "Acabei de agendar pelo site:\n" +
      "• Serviço(s): " + ag.servicos.join(", ") + "\n" +
      "• Profissional: " + ag.barbeiroNome + "\n" +
      "• Dia: " + fmtDataLonga(ag.data) + "\n" +
      "• Horário: " + ag.hora + "\n" +
      "• Total: " + fmtPreco(ag.total) + "\n" +
      "• Duração: " + fmtDur(ag.duracao) + "\n\n" +
      "Nome: " + ag.nome + "\n" +
      "WhatsApp: " + ag.telefone +
      (ag.obs ? "\nObs: " + ag.obs : "");
    return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(txt);
  }

  function baixarICS() {
    if (!ultimo) return;
    var ag = ultimo;
    var d = parseISO(ag.data);
    var inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(toMin(ag.hora) / 60), toMin(ag.hora) % 60);
    var fim = new Date(inicio.getTime() + ag.duracao * 60000);
    function stamp(dt) {
      return dt.getUTCFullYear() + pad(dt.getUTCMonth() + 1) + pad(dt.getUTCDate()) + "T" +
        pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + pad(dt.getUTCSeconds()) + "Z";
    }
    var ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Garagem 110//Agendamento//PT",
      "BEGIN:VEVENT",
      "UID:" + ag.id,
      "DTSTAMP:" + stamp(new Date()),
      "DTSTART:" + stamp(inicio),
      "DTEND:" + stamp(fim),
      "SUMMARY:Garagem 110 — " + ag.servicos.join(", "),
      "DESCRIPTION:Profissional: " + ag.barbeiroNome + "\\nTotal: " + fmtPreco(ag.total),
      "LOCATION:Rua Santo Sigfrido, 110 - Campo Grande, Rio de Janeiro/RJ",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "garagem110-agendamento.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* =========================================================
     16) RENDER — MEUS AGENDAMENTOS
     ========================================================= */

  function renderMinhaAgenda() {
    var wrap = $("#myList");
    if (!wrap) return;

    if (!agendamentos.length) {
      wrap.innerHTML = '<div class="bk-empty">Você ainda não tem agendamentos salvos neste navegador.<br>Escolha um serviço acima para começar. 💈</div>';
      return;
    }

    var ordem = agendamentos.slice().sort(function (a, b) {
      return (a.data + a.hora).localeCompare(b.data + b.hora);
    });

    var agora = new Date();
    wrap.innerHTML = ordem.map(function (ag) {
      var d = parseISO(ag.data);
      var dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(toMin(ag.hora) / 60), toMin(ag.hora) % 60);
      var passado = dt.getTime() < agora.getTime();
      return '<article class="bk' + (passado ? " bk--past" : "") + '">' +
        '<div class="bk__top">' +
          '<span class="bk__when">' + DIAS_CURTOS[d.getDay()] + " " + pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " • " + ag.hora + "</span>" +
          '<span class="bk__status">' + (passado ? "Realizado" : "Confirmado") + "</span>" +
        "</div>" +
        '<p class="bk__svcs">💈 ' + esc(ag.servicos.join(", ")) + "</p>" +
        '<p class="bk__meta">' +
          "Profissional: <b>" + esc(ag.barbeiroNome) + "</b><br>" +
          "Duração: <b>" + fmtDur(ag.duracao) + "</b> • Total: <b>" + fmtPreco(ag.total) + "</b>" +
        "</p>" +
        '<div class="bk__actions">' +
          '<a class="btn btn--ghost" href="' + linkWhatsApp(ag) + '" target="_blank" rel="noopener">WhatsApp</a>' +
          '<button type="button" class="btn bk__cancel" data-cancel="' + ag.id + '">Cancelar</button>' +
        "</div>" +
      "</article>";
    }).join("");
  }

  function cancelar(id) {
    var ag = agendamentos.filter(function (a) { return a.id === id; })[0];
    if (!ag) return;
    if (!window.confirm("Cancelar o agendamento de " + fmtDataCurta(ag.data) + " às " + ag.hora + "?")) return;
    agendamentos = agendamentos.filter(function (a) { return a.id !== id; });
    salvar();
    // Libera o horário na nuvem também (se configurada)
    if (apiAtiva()) {
      remotos = remotos.filter(function (a) { return a.id !== id; });
      apiStatus(id, "cancelado");
    }
    renderMinhaAgenda();
    sync();
  }

  /* =========================================================
     17) EVENTOS
     ========================================================= */

  function bind() {
    // Categorias
    var chips = $("#catChips");
    if (chips) {
      chips.addEventListener("click", function (e) {
        var b = e.target.closest("[data-cat]");
        if (!b) return;
        estado.categoria = b.getAttribute("data-cat");
        renderChips();
        renderServicos();
      });
    }

    // Busca
    var busca = $("#svcSearch");
    if (busca) {
      busca.addEventListener("input", function () {
        estado.busca = busca.value;
        renderServicos();
      });
    }

    // Serviços
    var grid = $("#svcGrid");
    if (grid) {
      grid.addEventListener("click", function (e) {
        var b = e.target.closest(".svc");
        if (!b) return;
        var id = b.getAttribute("data-id");
        var i = estado.selecionados.indexOf(id);
        var on;
        if (i === -1) { estado.selecionados.push(id); on = true; }
        else { estado.selecionados.splice(i, 1); on = false; }
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
        sync();
      });
    }

    // Profissionais
    var pros = $("#pros");
    if (pros) {
      pros.addEventListener("change", function (e) {
        if (e.target.name !== "barbeiro") return;
        estado.barbeiro = e.target.value;
        renderBarbeiros();
        sync();
      });
    }

    // Dias
    var days = $("#days");
    if (days) {
      days.addEventListener("click", function (e) {
        var b = e.target.closest(".day");
        if (!b || b.disabled) return;
        estado.data = b.getAttribute("data-date");
        estado.hora = null;
        sync();
      });
    }

    // Horários
    var slots = $("#slots");
    if (slots) {
      slots.addEventListener("click", function (e) {
        var b = e.target.closest(".slot");
        if (!b || b.disabled) return;
        estado.hora = b.getAttribute("data-time");
        renderHoras();
        renderResumo();
      });
    }

    // Cliente: limpa erro ao digitar
    var form = $("#clientForm");
    if (form) {
      form.addEventListener("input", function (e) {
        if (e.target.id === "nome" || e.target.id === "telefone") limparErro(e.target);
      });
      form.addEventListener("submit", function (e) { e.preventDefault(); });
    }

    // Máscara de telefone
    var tel = $("#telefone");
    if (tel) {
      tel.addEventListener("input", function () {
        var d = tel.value.replace(/\D/g, "").slice(0, 11);
        var out = "";
        if (d.length > 0) out = "(" + d.slice(0, 2);
        if (d.length >= 3) out += ") " + d.slice(2, d.length >= 11 ? 7 : 6);
        if (d.length >= 7) out += "-" + d.slice(d.length >= 11 ? 7 : 6);
        tel.value = out;
      });
    }

    // Confirmar
    var btn = $("#confirmBtn");
    if (btn) btn.addEventListener("click", confirmar);

    // Meus agendamentos (cancelar)
    var lista = $("#myList");
    if (lista) {
      lista.addEventListener("click", function (e) {
        var b = e.target.closest("[data-cancel]");
        if (!b) return;
        cancelar(b.getAttribute("data-cancel"));
      });
    }

    // Modal
    var modal = $("#successModal");
    if (modal) {
      $$("[data-close]", modal).forEach(function (el) {
        el.addEventListener("click", fecharSucesso);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !modal.hidden) fecharSucesso();
      });
    }
    var ics = $("#icsBtn");
    if (ics) ics.addEventListener("click", baixarICS);
  }

  /* =========================================================
     18) INIT
     ========================================================= */

  function init() {
    renderChips();
    renderServicos();
    renderBarbeiros();
    estado.data = primeiroDiaLivre();
    sync();
    renderMinhaAgenda();
    bind();

    // Se a nuvem estiver configurada, busca os horários já ocupados
    if (apiAtiva()) {
      apiCarregarRemotos().then(function () {
        if (!estado.hora) estado.data = primeiroDiaLivre();
        sync();
        renderMinhaAgenda();
      });
    }

    // Sinaliza para o HTML que o sistema carregou
    window.__agendamentoPronta = true;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

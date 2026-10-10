/*************************************************************
 * GARAGEM 110 — Backend de agendamentos (Google Apps Script)
 * -----------------------------------------------------------
 * O que faz:
 *   • Usa uma Planilha do Google como "banco de dados".
 *   • Expõe uma API (Web App) que o site chama para:
 *       - listar os agendamentos (GET  ?action=agendamentos)
 *       - criar um agendamento  (POST {action:"criar", agendamento:{...}})
 *       - mudar o status        (POST {action:"status", id, status})
 *   • Ao criar, grava na planilha E cria um evento no Google Calendar.
 *
 * Passo a passo completo: veja o arquivo COMO-CONFIGURAR.md (nesta pasta).
 *************************************************************/

/* ============================ CONFIG ====================== */

// Nome da agenda do Google Calendar onde os eventos serão criados.
// Deixe "" para usar a agenda PRINCIPAL da conta.
var NOME_AGENDA_CALENDARIO = "";

// Nome da aba (planilha) que guarda os agendamentos.
var ABA = "Agendamentos";

// Cabeçalho da planilha (não mude a ordem).
var CABECALHO = [
  "id", "criadoEm", "data", "hora", "duracao", "servicos",
  "barbeiro", "barbeiroNome", "nome", "telefone", "obs", "total",
  "status", "eventId"
];

// Fuso horário (deixe vazio para usar o fuso do projeto do Apps Script).
var TIMEZONE = "";

/* ============================ API ========================= */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "ping";
  try {
    if (action === "agendamentos") {
      return json({ ok: true, agendamentos: listarTodos() });
    }
    return json({ ok: true, msg: "GARAGEM110 API ativa", quando: new Date() });
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  }
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {}
  try {
    if (body.action === "criar")  return json(criar(body.agendamento));
    if (body.action === "status") return json(atualizarStatus(body.id, body.status));
    return json({ ok: false, erro: "ação desconhecida" });
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  }
}

/* ====================== IMPLEMENTAÇÃO ===================== */

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function tz() {
  return TIMEZONE || Session.getScriptTimeZone();
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ABA);
  if (!sh) {
    sh = ss.insertSheet(ABA);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(CABECALHO);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, CABECALHO.length).setFontWeight("bold");
  }
  return sh;
}

// Converte a planilha numa lista de objetos
function listarTodos() {
  var sh = getSheet();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var valores = sh.getRange(2, 1, last - 1, CABECALHO.length).getValues();
  var out = [];
  for (var i = 0; i < valores.length; i++) {
    var r = valores[i];
    if (!r[0]) continue; // sem id
    out.push(linhaParaObjeto(r));
  }
  return out;
}

function linhaParaObjeto(r) {
  return {
    id: String(r[0]),
    criadoEm: r[1] ? new Date(r[1]).toISOString() : "",
    data: paraTextoData(r[2]),
    hora: paraTextoHora(r[3]),
    duracao: Number(r[4]) || 0,
    servicos: String(r[5] || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean),
    barbeiro: String(r[6] || ""),
    barbeiroNome: String(r[7] || ""),
    nome: String(r[8] || ""),
    telefone: String(r[9] || ""),
    obs: String(r[10] || ""),
    total: Number(r[11]) || 0,
    status: String(r[12] || "confirmado"),
    eventId: String(r[13] || "")
  };
}

function paraTextoData(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, tz(), "yyyy-MM-dd");
  }
  return String(v || "");
}
function paraTextoHora(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, tz(), "HH:mm");
  }
  var s = String(v || "");
  var m = s.match(/(\d{1,2}):(\d{2})/);
  return m ? (("0" + m[1]).slice(-2) + ":" + m[2]) : s;
}

function toMin(hhmm) {
  var p = String(hhmm).split(":");
  return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
}

// Cria um agendamento (com trava para evitar dois clientes no mesmo horário)
function criar(ag) {
  if (!ag || !ag.data || !ag.hora) return { ok: false, erro: "dados incompletos" };

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var todos = listarTodos();
    var dur = Number(ag.duracao) || 30;
    var t = toMin(ag.hora);

    // Verifica conflito no MESMO profissional
    var conflito = todos.some(function (a) {
      if (a.status === "cancelado") return false;
      if (a.data !== ag.data) return false;
      if (a.barbeiro !== ag.barbeiro) return false;
      var t2 = toMin(a.hora);
      return (t < t2 + a.duracao) && (t2 < t + dur);
    });
    if (conflito) return { ok: false, conflito: true, motivo: "horário já ocupado" };

    var id = ag.id || ("ag_" + new Date().getTime());
    var criadoEm = ag.criadoEm || new Date().toISOString();
    var status = ag.status || "confirmado";

    // Cria o evento no Google Calendar
    var eventId = "";
    try { eventId = criarEvento(ag, dur); } catch (errEv) { eventId = "ERRO: " + errEv; }

    getSheet().appendRow([
      id, criadoEm, ag.data, ag.hora, dur,
      (ag.servicos || []).join(", "),
      ag.barbeiro || "", ag.barbeiroNome || "",
      ag.nome || "", ag.telefone || "", ag.obs || "",
      Number(ag.total) || 0, status, eventId
    ]);

    return { ok: true, id: id, eventId: eventId };
  } finally {
    lock.releaseLock();
  }
}

function atualizarStatus(id, status) {
  if (!id || !status) return { ok: false, erro: "dados incompletos" };
  var sh = getSheet();
  var last = sh.getLastRow();
  if (last < 2) return { ok: false, erro: "nada para atualizar" };
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      sh.getRange(i + 2, 13).setValue(status); // coluna 13 = status
      return { ok: true, id: id, status: status };
    }
  }
  return { ok: false, erro: "agendamento não encontrado" };
}

function criarEvento(ag, dur) {
  var inicio = parseDateTime(ag.data, ag.hora);
  var fim = new Date(inicio.getTime() + dur * 60000);

  var cal = CalendarApp.getDefaultCalendar();
  if (NOME_AGENDA_CALENDARIO) {
    var cals = CalendarApp.getCalendarsByName(NOME_AGENDA_CALENDARIO);
    if (cals && cals.length) cal = cals[0];
  }

  var titulo = (ag.nome || "Cliente") + " — " + ((ag.servicos || []).join(", ") || "Corte");
  var desc =
    "Serviços: " + (ag.servicos || []).join(", ") + "\n" +
    "Profissional: " + (ag.barbeiroNome || "") + "\n" +
    "Telefone: " + (ag.telefone || "") + "\n" +
    "Total: R$ " + (Number(ag.total) || 0) +
    (ag.obs ? ("\nObs: " + ag.obs) : "") +
    "\n\n(Agendamento criado pelo site Garagem 110)";

  var ev = cal.createEvent(titulo, inicio, fim, {
    description: desc,
    location: "Rua Santo Sigfrido, 110 - Campo Grande, Rio de Janeiro/RJ"
  });
  return ev.getId();
}

function parseDateTime(data, hora) {
  var dp = String(data).split("-");
  var hp = String(hora).split(":");
  return new Date(
    parseInt(dp[0], 10), parseInt(dp[1], 10) - 1, parseInt(dp[2], 10),
    parseInt(hp[0], 10), parseInt(hp[1], 10), 0, 0
  );
}

/* =====================  FUNÇÕES MANUAIS ==================== */

// Rode esta função UMA VEZ no editor para criar a aba e autorizar o Calendar.
function configurar() {
  getSheet();
  try { CalendarApp.getDefaultCalendar().getName(); } catch (e) {}
  Logger.log("Tudo pronto! Planilha configurada.");
}

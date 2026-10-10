# 📅 Colocar os agendamentos no Google (Planilha + Google Calendar)

Este guia liga o site a uma **Planilha do Google** (que serve de banco de dados)
e à **Agenda do Google**. Depois disso:

- o horário agendado **fica indisponível para todo mundo** no site;
- cada agendamento **aparece automaticamente na sua Agenda do Google**.

Você só precisa fazer isso **uma vez**. Leva uns 10 minutos.

> A conta do Google usada aqui será a **dona** dos agendamentos e da agenda.
> Use a conta da barbearia.

---

## Passo 1 — Criar a planilha

1. Abra <https://sheets.google.com> e clique em **Em branco** (nova planilha).
2. Dê um nome, por exemplo: **Garagem 110 - Agendamentos**.

## Passo 2 — Abrir o editor de script

1. No menu da planilha, clique em **Extensões ▸ Apps Script**.
2. Vai abrir uma nova aba com o editor de código (tem um arquivo `Código.gs`).

## Passo 3 — Colar o código

1. Apague **tudo** que estiver no arquivo `Código.gs`.
2. Abra o arquivo `google-agenda/Code.gs` (desta pasta), copie **todo** o
   conteúdo e cole no editor.
3. Clique no ícone de **salvar** (💾) e dê um nome ao projeto:
   **Garagem 110 Agenda**.

## Passo 4 — Ajustar o fuso horário (importante!)

1. No editor, clique no ícone de **engrenagem ⚙️** (Configurações do projeto) no
   menu da esquerda.
2. Em **Fuso horário**, escolha **(GMT-03:00) Horário de Brasília — São Paulo**.
3. Salve.

## Passo 5 — Autorizar (uma vez)

1. No topo, ao lado do botão ▶ **Executar**, escolha a função **`configurar`**.
2. Clique em ▶ **Executar**.
3. O Google vai pedir permissão:
   - Clique em **Revise as permissões** → escolha a sua conta.
   - Aparece "O Google não verificou este app" → clique em **Avançado** →
     **Acessar … (não seguro)**.
   - Clique em **Permitir**.
4. Volte na planilha: deve ter aparecido uma aba **Agendamentos** com os títulos
   das colunas. ✅

## Passo 6 — Publicar (Implantar como App da Web)

1. No editor, clique em **Implantar ▸ Nova implantação**.
2. No ícone de engrenagem ao lado de "Selecionar tipo", escolha **App da Web**.
3. Preencha:
   - **Descrição:** Agenda Garagem 110
   - **Executar como:** **Eu** (o seu e-mail)
   - **Quem pode acessar:** **Qualquer pessoa**
4. Clique em **Implantar** e depois em **Autorizar** (se pedir).
5. Copie a **URL do app da Web**. Ela termina com **`/exec`**.
   Exemplo:
   `https://script.google.com/macros/s/AKfycb..../exec`

> Guarde essa URL. É ela que conecta o site ao Google.

### Testar rapidinho (opcional)

Abra no navegador a URL copiada seguida de `?action=ping`:

`SUA_URL/exec?action=ping`

Deve aparecer algo como: `{"ok":true,"msg":"GARAGEM110 API ativa", ...}`.
Se aparecer isso, está funcionando. 🎉

## Passo 7 — Colar a URL no site

Você vai colar a mesma URL em **dois** arquivos:

1. **`agendamento.js`** — procure a linha:
   ```js
   var API_URL = "";
   ```
   e deixe assim (com a sua URL entre as aspas):
   ```js
   var API_URL = "https://script.google.com/macros/s/..../exec";
   ```

2. **`painel.html`** — abra no Bloco de Notas, procure `var API_URL = "";` e
   cole a **mesma** URL entre as aspas.

Salve os dois arquivos. **Pronto!** 🎉

A partir daí:
- ao agendar no site, a vaga é gravada na planilha e **o evento aparece na sua
  Agenda do Google**;
- o horário ocupado aparece **bloqueado para todos** que abrirem o site.

---

## Dúvidas frequentes

**Mudei o código do Apps Script. E agora?**
No editor: **Implantar ▸ Gerenciar implantações ▸** (lápis ✏️) **▸ Versão: Nova
versão ▸ Implantar**. A URL continua a mesma.

**Quero os eventos numa agenda específica (ex.: "Garagem 110").**
No `Code.gs`, troque:
```js
var NOME_AGENDA_CALENDARIO = "";              // agenda principal
```
por:
```js
var NOME_AGENDA_CALENDARIO = "Garagem 110";   // nome exato da agenda
```
Crie essa agenda no <https://calendar.google.com> primeiro. Depois publique uma
**Nova versão**.

**Apaguei um horário no Google Calendar. O site continua bloqueado?**
O bloqueio vem da **planilha**. Para liberar, mude o status do agendamento para
**Cancelado** (na aba `Agendamentos`, coluna `status`) ou use o botão **Cancelar**
no painel do barbeiro.

**Funciona se o site estiver num arquivo local (file://)?**
Sim, o navegador consegue acessar a URL do Google. Mas o ideal é publicar o site
online (ex.: Netlify) — aí funciona em qualquer celular sem depender de arquivos.

**E se a internet cair na hora de agendar?**
O site avisa e salva o agendamento **naquele aparelho**, para você confirmar
manualmente. Quando voltar, dá para lançar de novo.

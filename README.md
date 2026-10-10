# Garagem 110 — Site da Barbearia

Landing page com visual **urbano/street**, feita em HTML, CSS e JavaScript puros
(sem frameworks, sem instalação). Basta abrir o `index.html` no navegador.

## Arquivos

| Arquivo       | O que é                        |
|---------------|--------------------------------|
| `index.html`  | A página do site               |
| `styles.css`  | Todo o visual (cores, fontes)  |
| `script.js`   | Menu mobile e animações        |
| `img/logo.png`| O logotipo (fundo transparente)|

## Como visualizar

Clique duas vezes em `index.html` — ele abre no navegador.

## ✅ Já configurado com os dados reais

- **Nome:** Barbearia Garagem 110
- **Slogan:** "Há mais de 10 anos oferecendo compromisso e qualidade."
- **Lema:** "Uma nova experiência para uma antiga tradição."
- **Endereço:** Rua Santo Sigfrido, 110 — Loja — Campo Grande, Rio de Janeiro/RJ — CEP 23055-150
- **Telefone / WhatsApp:** (21) 97018-9712 → link `https://wa.me/5521970189712`
- **Agendamento online:** https://sites.appbarber.com.br/barbeariagarage-dxip
- **Horários:** Terça a Quinta 09–19h · Sexta 09–19:30 · Sábado 09–20h · Dom/Seg fechado (almoço 12–13:30)
- **Comodidades:** ambiente climatizado, café, wi-fi, estacionamento, acessibilidade, atende crianças
- **Serviços e preços** (em destaque na seção `#servicos`): Cabelo e Barba R$50, Corte Disfarçado R$30,
  Barba R$30, Corte+Sobrancelha R$33, Navalhado R$32, Corte Infantil R$35, Tesoura R$35,
  Sobrancelha R$10, Corte+Pigmentação R$45. (A lista completa tem mais de 20 serviços no AppBarber.)

## 🙌 Créditos

Site **orquestrado por Mateus Marrero** — https://linktr.ee/mateusmarrero
(O crédito aparece no rodapé e direciona para o Linktree.)

## 🔗 Agendamento

Todos os botões "Agendar online" apontam para o site de agendamento
**https://sites.appbarber.com.br/barbeariagarage-dxip** (AppBarber).

Para trocar esse link, use "Localizar e Substituir" no `index.html` procurando por
`sites.appbarber.com.br/barbeariagarage-dxip`.

## 🖼️ Fotos

As fotos reais já estão em `img/` e aplicadas no site:

| Arquivo | Onde aparece |
|---|---|
| `frente.png` | Fundo do topo (hero) e galeria |
| `dentro1.jpg` | Seção **Sobre** (interior) |
| `corte.png`, `corte1.png`, `corte2.png` | Galeria |
| `barbaterapia.png` | Galeria |
| `dentro.png` | Galeria |

Para trocar/atualizar uma foto, é só substituir o arquivo em `img/` mantendo o mesmo nome.
Para adicionar mais fotos na galeria, copie um `<figure class="gallery__item">` no `index.html`
e aponte o `src` para a nova imagem — o layout se ajusta sozinho (3, 2 ou 1 coluna conforme a tela).

## ✏️ Editar serviços e preços

Seção `<section id="servicos">`. Cada serviço é um bloco:

```html
<a class="card" href="https://sites.appbarber.com.br/barbeariagarage-dxip"
   target="_blank" rel="noopener">
  <div class="card__icon" aria-hidden="true">✂️</div>  <!-- emoji -->
  <h3 class="card__title">Corte Disfarçado</h3>       <!-- nome -->
  <p class="card__desc">Descrição curta.</p>
  <span class="card__price">R$ 30</span>              <!-- preço -->
  <span class="card__cta" aria-hidden="true">Agendar online →</span>
</a>
```

> Cada serviço é um **link** que abre a página de agendamento do AppBarber
> (`sites.appbarber.com.br/barbeariagarage-dxip`) em nova aba — clicar/tocar em
> qualquer parte do cartão já leva para o agendamento.

Para adicionar, copie um bloco `<a class="card">` inteiro e cole antes do `</div>` que fecha a `.cards`.

> No **celular (até 768px)** os serviços viram automaticamente uma **lista**
> (ícone + nome + preço + seta, com divisórias), otimizada para toque.
> No computador/tablet continuam como cartões. Não precisa mexer em nada para isso funcionar.

## 🕒 Editar horários

Seção `<section id="horarios">`, dentro de `<ul class="hours">`:

```html
<li><span>Sexta</span><strong>09:00 – 19:30</strong></li>
```

## 🎨 Cores (opcional)

No topo do `styles.css`, em `:root`:

```css
--amarelo: #f5c518;   /* destaque principal */
--vermelho: #e63946;  /* destaque secundário */
--preto: #0b0b0d;     /* fundo */
```

## 🗺️ Mapa

A URL do mapa (seção `#contato`) usa o endereço de Campo Grande.
Se mudar, atualize também o `<iframe>` do Google Maps.

## ♿ Acessibilidade

- Link "pular para o conteúdo" (aparece ao apertar **Tab**)
- Navegação completa por teclado, com **contorno de foco** bem visível (amarelo)
- Estrutura semântica: `<header>`, `<nav>`, `<main>`, `<footer>`, um único `<h1>`
- Ícones/emojis decorativos marcados com `aria-hidden` (não atrapalham leitores de tela)
- Textos alternativos (`alt`) em todas as imagens e `title` no mapa
- Links que abrem em nova aba são anunciados ("abre em nova aba")
- Botão de menu com `aria-expanded`/`aria-controls`
- Respeita "reduzir movimento" do sistema (`prefers-reduced-motion`)
- Contraste de cores ajustado para leitura em fundo escuro
- **Menu de acessibilidade flutuante** (botão no canto inferior esquerdo), com:
  - **A+ / A−**: aumenta ou diminui o tamanho de todo o texto
  - **Alto contraste**: fundo preto, texto branco e destaques em amarelo forte
  - **Destacar links**: sublinha todos os links
  - **Restaurar padrão**: volta ao normal
  - As preferências ficam salvas no navegador (localStorage) e voltam ao reabrir o site

> O botão de acessibilidade fica no canto inferior **esquerdo**; o WhatsApp fica no canto inferior **direito**.
> Para editar as opções, veja o bloco `a11y` no final do `script.js` e o painel `#a11yPanel` no `index.html`.

## 🔎 SEO (aparecer no Google)

Já incluído no `index.html`:

- Título e descrição otimizados para "barbearia Campo Grande RJ"
- **Dados estruturados** (JSON-LD `HairSalon`): endereço, telefone, horários,
  preços, avaliação e coordenadas (latitude/longitude)
- Open Graph e Twitter Card (bom preview ao compartilhar no WhatsApp/Facebook)
- Metadados de geolocalização
- Arquivos `robots.txt` e `sitemap.xml`

### ⚠️ ANTES de publicar: troque o domínio

Usei `https://www.garagem110.com.br/` como exemplo. Quando publicar (Netlify,
Vercel, etc.), troque **todas** as ocorrências pelo seu endereço real nos arquivos:
`index.html` (8x), `sitemap.xml` (1x) e `robots.txt` (1x).

### Dica extra de SEO local

Cadastre a barbearia no **Perfil da Empresa no Google** (google.com/business).
É o que mais ajuda a aparecer no mapa e em buscas do tipo "barbearia perto de mim".

## 🌐 Publicar na internet (grátis)

- **Netlify** (netlify.com) — arraste a pasta e pronto.
- **Vercel** (vercel.com).
- **GitHub Pages** — se souber usar Git.

> Importante: publique a pasta **inteira** (com `img/`), senão o logo não aparece.

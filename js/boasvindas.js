// Diário Nutri · Criado por Lift Like a Girl (@liftlikeagirl.xo)
//
// Tela de boas-vindas e instalação. Aparece quando o app é aberto no NAVEGADOR,
// e não pelo ícone. Aqui não dá para criar perfil nem registrar nada, porque no iPhone
// o app instalado guarda os dados separado do Safari: o que fosse digitado aqui se perderia.

import { BOAS_VINDAS as T, CREDITO_TEXTO, CREDITO_LINK, CREDITO_LINK_TEXTO, CREDITO_EMAIL } from "./textos.js";

// O Android (Chrome) às vezes oferece um "convite de instalação" próprio.
// Ele pode chegar antes desta tela ser desenhada, então é guardado assim que o app abre.
let convite = null;
const quemEspera = [];
window.addEventListener("beforeinstallprompt", (evento) => {
  evento.preventDefault(); // não mostra a faixa automática; usamos o nosso botão
  convite = evento;
  quemEspera.forEach((f) => f());
});

// Descobre o sistema e se o link foi aberto dentro de outro app (WhatsApp, Instagram...)
function detectar() {
  const ua = navigator.userAgent;
  const android = /Android/i.test(ua);
  // iPad novo se apresenta como Mac, mas tem tela de toque
  const iphone = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const dentroDeApp =
    /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Twitter|LinkedInApp|Snapchat|TikTok|musical_ly|GSA\//i.test(ua) ||
    (android && /; wv\)/.test(ua)) ||                       // "WebView" do Android: navegador de dentro de um app
    (iphone && !/Safari\//.test(ua));                       // no iPhone, navegadores de dentro de apps não dizem "Safari"
  const iphoneOutroNavegador = iphone && !dentroDeApp && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return { sistema: android ? "android" : "iphone", dentroDeApp, iphoneOutroNavegador };
}

// Desenho do botão Compartilhar do iPhone (quadrado com seta para cima)
const ICONE_COMPARTILHAR = `
  <svg class="icone-inline" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 9H6.5A1.5 1.5 0 0 0 5 10.5v9A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 17.5 9H16M12 15V3M8.5 6.5 12 3l3.5 3.5"/>
  </svg>`;

// Lista numerada de passos (também usada na Ajuda dos Ajustes)
export function passos(lista) {
  return `<ol class="passos">${lista.map((p) => `<li>${p.replace("{compartilhar}", ICONE_COMPARTILHAR)}</li>`).join("")}</ol>`;
}

export function mostrarBoasVindas(tela) {
  const info = detectar();
  let sistema = info.sistema;

  let aviso = "";
  if (info.dentroDeApp) aviso = T.avisoDentroDeApp;
  else if (info.iphoneOutroNavegador) aviso = T.avisoIphoneOutroNavegador;

  tela.innerHTML = `
    <div class="boas-vindas">
      <h1>${T.titulo}</h1>
      <p>${T.frase}</p>
      <p class="destaque-privacidade">${T.privacidade}</p>

      ${aviso ? `<p class="aviso-forte" role="alert">${aviso}</p>` : ""}

      <section class="cartao passo-instalacao">
        <h2>${T.passo1}</h2>
        <div class="camadas" role="group">
          <button type="button" class="camada" data-sistema="iphone">${T.seletorIphone}</button>
          <button type="button" class="camada" data-sistema="android">${T.seletorAndroid}</button>
        </div>
        <div id="instrucoes"></div>
        <div id="area-instalar"></div>
        ${aviso ? "" : `<p class="detalhe">${T.dicaDentroDeApp}</p>`}
      </section>

      <section class="cartao passo-instalacao">
        <h2>${T.passo2}</h2>
        <p>${T.passo2Texto}</p>
      </section>

      <footer class="credito">
        ${CREDITO_TEXTO} ·
        <a href="${CREDITO_LINK}" target="_blank" rel="noopener">${CREDITO_LINK_TEXTO}</a>
        ${CREDITO_EMAIL ? `· <a href="mailto:${CREDITO_EMAIL}">${CREDITO_EMAIL}</a>` : ""}
      </footer>
    </div>`;

  const instrucoes = tela.querySelector("#instrucoes");
  const areaInstalar = tela.querySelector("#area-instalar");

  // Botão "Instalar": só no Android e só se o navegador ofereceu o convite
  function desenharBotaoInstalar() {
    if (sistema !== "android" || !convite) {
      areaInstalar.innerHTML = "";
      return;
    }
    areaInstalar.innerHTML = `<div class="botoes"><button type="button" class="botao principal" id="instalar">${T.botaoInstalar}</button></div>`;
    areaInstalar.querySelector("#instalar").onclick = async () => {
      const c = convite;
      convite = null; // o convite só pode ser usado uma vez
      c.prompt();
      const { outcome } = await c.userChoice;
      areaInstalar.innerHTML = outcome === "accepted" ? `<p><strong>${T.instalado}</strong></p>` : "";
    };
  }
  quemEspera.push(desenharBotaoInstalar);

  function desenhar() {
    instrucoes.innerHTML = passos(sistema === "android" ? T.android : T.iphone);
    tela.querySelectorAll("[data-sistema]").forEach((b) => {
      const ativo = b.dataset.sistema === sistema;
      b.classList.toggle("ativa", ativo);
      b.setAttribute("aria-pressed", ativo);
    });
    desenharBotaoInstalar();
  }

  tela.querySelectorAll("[data-sistema]").forEach((b) => {
    b.onclick = () => { sistema = b.dataset.sistema; desenhar(); };
  });

  desenhar();
}

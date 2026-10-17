// Tela "Hoje": o checklist de um dia. Cada toque ou digitação salva na hora.
// As refeições e os hábitos extras vêm do perfil.
//
// Ordem: peso e sono; refeições; água (copinhos); fome e banheiro; hábitos extras; nota.

import {
  BANHEIRO_MAX, LIMITES, proximoValor, infoValor, refeicoesDoDia, habitosDoDia,
  lerCampo, gravarCampo, litros, emojiDaRefeicao,
} from "./modelo.js";
import { lerDia, salvarDia, lerPerfil } from "./dados.js";
import { hojeISO, somarDias, formatarCabecalho, lerNumero, formatarNumero, escapar } from "./formato.js";
import { HOJE as T } from "./textos.js";

// Limites aceitos nos campos numéricos
const PESO = { min: 20, max: 300 };
const SONO = { min: 0, max: 24 };

// Cada abertura de dia ganha um número; se a pessoa trocar de dia rápido,
// uma abertura antiga que termine atrasada é ignorada.
let aberturaAtual = 0;

// Cartão que avança no ciclo a cada toque.
// "campo" é o caminho do dado no dia: "fome", "refeicoes.r1", "habitos.h2"...
function cartaoToque(campo, nome, ciclo, classe = "", emoji = "") {
  return `
    <button type="button" class="cartao toque ${classe}" data-campo="${campo}" data-ciclo="${ciclo}">
      ${emoji ? `<span class="icone" aria-hidden="true">${emoji}</span>` : ""}
      <span class="nome">${escapar(nome)}</span>
      <span class="estado"></span>
    </button>`;
}

// Campo de texto livre: largura total, várias linhas, cresce com o texto
function campoTexto(campo, placeholder, mostrarSe = "") {
  return `<textarea class="cartao texto" data-campo="${campo}" rows="2" placeholder="${placeholder}"
    ${mostrarSe ? `data-mostrar-se="${mostrarSe}" hidden` : ""}></textarea>`;
}

// ---------- Água em copinhos ----------

// Quantos copinhos desenhar: a meta; se já chegou nela, um copo extra vazio
// para poder passar da meta (até 12).
function quantosCopos(copos, meta) {
  const n = copos ?? 0;
  return n < meta ? meta : Math.min(LIMITES.aguaMax, n + 1);
}

// Copo trapezoidal em SVG. Cheio: água azul com uma linha de "nível" no topo.
function desenharCopo(i, cheio, extra) {
  return `
    <button type="button" class="copo ${cheio ? "cheio" : ""} ${extra ? "extra" : ""}" data-copo="${i}"
      aria-label="${T.copo(i, cheio)}" aria-pressed="${cheio}">
      <svg viewBox="0 0 32 40" aria-hidden="true">
        ${cheio ? `<path class="agua-copo" d="M5.6 10h20.8L24 36H8z"/><path class="nivel-copo" d="M5.6 10h20.8"/>` : ""}
        <path class="contorno-copo" d="M4 4h24l-4 32H8z"/>
      </svg>
    </button>`;
}

function htmlCopos(copos, meta) {
  const total = quantosCopos(copos, meta);
  let html = "";
  for (let i = 1; i <= total; i++) html += desenharCopo(i, i <= (copos ?? 0), i > meta);
  return html;
}

function textoAgua(copos, meta) {
  if (copos === undefined) return T.aguaVazia(meta, litros(meta));
  const base = T.aguaTexto(copos, meta, litros(copos), litros(meta));
  return copos >= meta ? `${base} · <strong>${T.aguaMetaAtingida}</strong>` : base;
}

// Toque no copo i: copo vazio enche até ele; o último copo cheio esvazia
function tocarCopo(copos, i) {
  const n = copos ?? 0;
  if (i === n) return i - 1 > 0 ? i - 1 : undefined; // não existe "0 copos": volta para vazio
  return i;
}

// ---------- Tela ----------

// "dia" é o registro do dia: as refeições e hábitos são os que existiam nele
function montarHTML(data, perfil, dia) {
  const hoje = hojeISO();
  const habitos = habitosDoDia(perfil, dia);
  return `
    <header class="cabecalho">
      <button type="button" class="seta" id="dia-anterior" aria-label="${T.diaAnterior}">‹</button>
      <h1>${formatarCabecalho(data)}</h1>
      <button type="button" class="seta" id="dia-seguinte" aria-label="${T.diaSeguinte}" ${data >= hoje ? "disabled" : ""}>›</button>
    </header>

    <div class="grade2">
      <div class="cartao medida">
        <label for="peso" class="nome">${T.peso}</label>
        <div class="linha-numero">
          <input id="peso" data-campo="peso" type="text" inputmode="decimal" autocomplete="off" placeholder="—">
          <span>${T.pesoUnidade}</span>
        </div>
      </div>
      <div class="cartao medida">
        <label for="sono-horas" class="nome">${T.sono}</label>
        <div class="linha-numero">
          <input id="sono-horas" data-campo="sono_horas" type="text" inputmode="decimal" autocomplete="off" placeholder="—">
          <span>${T.sonoUnidade}</span>
        </div>
        ${cartaoToque("sono_qualidade", T.sonoQualidade, "sonoQualidade", "mini")}
      </div>
    </div>

    <h2 class="secao">${T.refeicoes}</h2>
    ${refeicoesDoDia(perfil, dia).map((r) => `
      <div class="bloco">
        ${cartaoToque(`refeicoes.${r.id}`, r.nome, "refeicao", "grande", emojiDaRefeicao(r.nome))}
        ${campoTexto(`refeicoes_texto.${r.id}`, T.oQueComi, `refeicoes.${r.id}=livre`)}
      </div>`).join("")}

    <h2 class="secao">${T.agua}</h2>
    <div class="cartao agua">
      <div class="copos" id="copos"></div>
      <p class="texto-agua" id="texto-agua" aria-live="polite"></p>
    </div>

    <div class="bloco espaco-acima">
      ${cartaoToque("fome", T.fome, "fome", "grande")}
      ${campoTexto("fome_texto", T.fomeTexto, "fome=sim")}
    </div>

    <div class="cartao banheiro">
      <span class="nome">${T.banheiro}</span>
      <div class="contador">
        <button type="button" class="redondo" id="banheiro-menos" aria-label="${T.menos}">−</button>
        <span id="banheiro-valor" class="numero"></span>
        <button type="button" class="redondo" id="banheiro-mais" aria-label="${T.mais}">+</button>
      </div>
    </div>

    ${habitos.length === 0 ? "" : `
      <h2 class="secao">${T.habitos}</h2>
      <div class="grade2">
        ${habitos.map((h) => cartaoToque(`habitos.${h.id}`, h.nome, "habito", "pequeno")).join("")}
      </div>`}

    <h2 class="secao">${T.nota}</h2>
    ${campoTexto("nota", T.notaTexto)}
  `;
}

// Ajusta a altura do campo de texto ao que está escrito (nunca fica espremido)
function crescer(el) {
  if (el.hidden) return;
  el.style.height = "auto";
  const bordas = el.offsetHeight - el.clientHeight;
  el.style.height = el.scrollHeight + bordas + "px";
}

export async function mostrarHoje(tela, data) {
  const hoje = hojeISO();
  if (!data || data > hoje) data = hoje; // dias futuros não podem ser preenchidos

  const minhaAbertura = ++aberturaAtual;
  const [dia, perfil] = await Promise.all([lerDia(data), lerPerfil()]);
  if (minhaAbertura !== aberturaAtual) return;

  tela.innerHTML = montarHTML(data, perfil, dia);

  function salvar() {
    salvarDia(dia).catch((e) => alert(T.erroSalvar + e.message));
  }

  // Mostra/esconde campos de texto que dependem de outro (ex.: "O que comi" só se livre)
  function atualizarDependentes() {
    tela.querySelectorAll("[data-mostrar-se]").forEach((el) => {
      const [campo, valor] = el.dataset.mostrarSe.split("=");
      el.hidden = lerCampo(dia, campo) !== valor;
      crescer(el);
    });
  }

  // Setas de dia
  tela.querySelector("#dia-anterior").onclick = () => mostrarHoje(tela, somarDias(data, -1));
  tela.querySelector("#dia-seguinte").onclick = () => mostrarHoje(tela, somarDias(data, 1));

  // Cartões de toque
  tela.querySelectorAll("[data-ciclo]").forEach((botao) => {
    const { campo, ciclo } = botao.dataset;
    const pintar = () => {
      const info = infoValor(ciclo, lerCampo(dia, campo));
      botao.dataset.cor = info.cor;
      botao.querySelector(".estado").textContent = info.palavra;
    };
    pintar();
    botao.onclick = () => {
      gravarCampo(dia, campo, proximoValor(ciclo, lerCampo(dia, campo)));
      pintar();
      atualizarDependentes();
      salvar();
    };
  });

  // Campos de texto livre: salvam a cada letra e crescem com o texto
  tela.querySelectorAll("textarea[data-campo]").forEach((el) => {
    el.value = lerCampo(dia, el.dataset.campo) || "";
    el.oninput = () => {
      gravarCampo(dia, el.dataset.campo, el.value);
      crescer(el);
      salvar();
    };
  });

  // Campos numéricos (peso e horas de sono)
  function ligarNumero(el, limites, casasMinimas) {
    const campo = el.dataset.campo;
    const mostrar = () => {
      el.value = dia[campo] === undefined ? "" : formatarNumero(dia[campo], casasMinimas);
      el.classList.remove("invalido");
    };
    mostrar();
    el.oninput = () => {
      if (el.value.trim() === "") {
        dia[campo] = undefined; // apagar volta para vazio
        el.classList.remove("invalido");
        salvar();
        return;
      }
      const n = lerNumero(el.value, limites.min, limites.max);
      if (n === null) {
        el.classList.add("invalido"); // não salva enquanto não for um número válido
        return;
      }
      el.classList.remove("invalido");
      dia[campo] = n;
      salvar();
    };
    el.onblur = mostrar; // ao sair do campo, mostra o valor guardado já formatado ("62,4")
  }
  ligarNumero(tela.querySelector("#peso"), PESO, 1);
  ligarNumero(tela.querySelector("#sono-horas"), SONO, 0);

  // Banheiro: começa em traço; primeiro + vai a 1, primeiro − vai a 0
  const valorBanheiro = tela.querySelector("#banheiro-valor");
  const pintarBanheiro = () => {
    valorBanheiro.textContent = dia.banheiro === undefined ? "–" : dia.banheiro;
  };
  pintarBanheiro();
  tela.querySelector("#banheiro-mais").onclick = () => {
    dia.banheiro = Math.min(BANHEIRO_MAX, (dia.banheiro ?? 0) + 1);
    pintarBanheiro();
    salvar();
  };
  tela.querySelector("#banheiro-menos").onclick = () => {
    dia.banheiro = Math.max(0, (dia.banheiro ?? 1) - 1);
    pintarBanheiro();
    salvar();
  };

  // Água em copinhos (um copo = 500 ml). Vazio ou de 1 a 12 copos.
  const areaCopos = tela.querySelector("#copos");
  const areaTextoAgua = tela.querySelector("#texto-agua");
  const meta = perfil.meta_agua_copos;
  const pintarAgua = () => {
    areaCopos.innerHTML = htmlCopos(dia.agua_copos, meta);
    areaTextoAgua.innerHTML = textoAgua(dia.agua_copos, meta);
    areaTextoAgua.classList.toggle("meta-atingida", (dia.agua_copos ?? 0) >= meta);
  };
  pintarAgua();
  areaCopos.onclick = (evento) => {
    const copo = evento.target.closest("[data-copo]");
    if (!copo) return;
    dia.agua_copos = tocarCopo(dia.agua_copos, Number(copo.dataset.copo));
    pintarAgua();
    salvar();
  };

  atualizarDependentes();
  tela.querySelectorAll("textarea[data-campo]").forEach(crescer);
}

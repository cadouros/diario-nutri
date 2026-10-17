// Tela "Calendário": o mês em grade (segunda a domingo), com três camadas.
// Tocar em um dia (até hoje) abre esse dia na tela Hoje.
//
// Camadas:
//   Refeições -> um quadradinho por refeição que existia naquele dia, em linhas de até 3
//   Hábitos   -> grade 2×2: água e os hábitos extras
//   Sono      -> retângulo com as horas e a cor da qualidade
// Todos os blocos de dia têm a mesma altura, com 1 ou 2 linhas de quadradinhos.

import { infoValor, refeicoesDoDia, habitosDoDia } from "./modelo.js";
import { lerDiasEntre, lerPerfil } from "./dados.js";
import {
  hojeISO, montarData, formatarMes, formatarCabecalho, formatarNumero, inicioDaSemana, somarDias,
} from "./formato.js";
import { ESTADOS, CALENDARIO as T } from "./textos.js";
import { resumoMensal, cartoesSemanais } from "./cartoes.js";
import { faixaBackup } from "./ajustes.js";
import { ligarBotaoPdf } from "./pdfbotao.js";

const CAMADAS = ["refeicoes", "habitos", "sono"];

// O que fica guardado ao sair e voltar para o calendário
const hoje0 = hojeISO();
let ano = Number(hoje0.slice(0, 4));
let mes = Number(hoje0.slice(5, 7)); // 1 a 12
let camada = "refeicoes";
let aberturaAtual = 0;

// ---------- Quadradinhos ----------

// Refeições: linhas de até 3. 1 a 3 = uma linha; 4 = 2+2; 5 = 3+2; 6 = 3+3.
// (Mais de 6 só acontece se uma refeição arquivada foi marcada no mesmo dia: 3+3+1...)
function linhasRefeicoes(n) {
  if (n <= 3) return [n];
  if (n === 4) return [2, 2];
  const linhas = [];
  for (let resto = n; resto > 0; resto -= 3) linhas.push(Math.min(3, resto));
  return linhas;
}

// Hábitos: grade 2×2 (água + até 3 hábitos extras)
function linhasHabitos(n) {
  const linhas = [];
  for (let resto = n; resto > 0; resto -= 2) linhas.push(Math.min(2, resto));
  return linhas;
}

// Junta os quadradinhos em linhas com os tamanhos dados (ex.: [3, 2])
function emLinhas(itens, tamanhos) {
  let i = 0;
  return tamanhos.map((t) => `<span class="linha-q">${itens.slice(i, (i += t)).join("")}</span>`).join("");
}

function quadradinho(ciclo, valor) {
  return `<span class="quadradinho" data-cor="${infoValor(ciclo, valor).cor}"></span>`;
}

// Água: meta atingida, abaixo da meta ou vazio (nada marcado)
function quadradinhoAgua(dia, perfil) {
  const copos = dia.agua_copos;
  const cor = copos === undefined ? "vazio" : copos >= perfil.meta_agua_copos ? "agua" : "bege";
  return `<span class="quadradinho" data-cor="${cor}"></span>`;
}

// O desenho de dentro do bloco do dia, conforme a camada ativa
function conteudoDia(dia, perfil) {
  if (camada === "refeicoes") {
    const refeicoes = refeicoesDoDia(perfil, dia);
    return emLinhas(refeicoes.map((r) => quadradinho("refeicao", dia.refeicoes?.[r.id])), linhasRefeicoes(refeicoes.length));
  }
  if (camada === "habitos") {
    const q = [quadradinhoAgua(dia, perfil), ...habitosDoDia(perfil, dia).map((h) => quadradinho("habito", dia.habitos?.[h.id]))];
    return emLinhas(q, linhasHabitos(q.length));
  }
  const horas = dia.sono_horas === undefined ? "" : formatarNumero(dia.sono_horas, 0);
  return `<span class="sono-ret" data-cor="${infoValor("sonoQualidade", dia.sono_qualidade).cor}">${horas}</span>`;
}

function montarGrade(porData, perfil) {
  const hoje = hojeISO();
  const diasNoMes = new Date(ano, mes, 0).getDate();
  // Quantas casas vazias antes do dia 1 (a semana começa na segunda)
  const casasAntes = (new Date(ano, mes - 1, 1).getDay() + 6) % 7;

  let html = "<span></span>".repeat(casasAntes);
  for (let d = 1; d <= diasNoMes; d++) {
    const data = montarData(ano, mes, d);
    if (data > hoje) {
      // Dia futuro: tracejado, sem quadradinhos e sem toque
      html += `<div class="dia futuro"><span class="num">${d}</span></div>`;
    } else {
      html += `
        <button type="button" class="dia ${data === hoje ? "hoje" : ""}" data-data="${data}"
          aria-label="${formatarCabecalho(data)}">
          <span class="num">${d}</span>
          ${conteudoDia(porData[data] || { data }, perfil)}
        </button>`;
    }
  }
  return html;
}

// ---------- Legenda ----------

function itemCor(cor, palavra) {
  return `<span class="item"><span class="quadradinho" data-cor="${cor}"></span>${palavra}</span>`;
}

// A legenda acompanha a camada: cada cor com a sua palavra
function montarLegenda(perfil) {
  // Há refeições/hábitos acrescentados ou arquivados? Então dias antigos podem ser diferentes.
  const temDatas = [...perfil.refeicoes, ...perfil.habitos_extras].some((i) => i.desde || i.ate);
  const notaDatas = temDatas ? `<p class="detalhe">${T.diasAntigos}</p>` : "";

  if (camada === "refeicoes") {
    return `
      <div class="legenda">
        ${itemCor("verde", ESTADOS.seguiu)}${itemCor("vermelho", ESTADOS.livre)}${itemCor("vazio", ESTADOS.sem_marcar)}
      </div>
      ${notaDatas}`;
  }
  if (camada === "habitos") {
    return `
      <div class="legenda">
        ${itemCor("agua", T.aguaMeta)}${itemCor("bege", T.aguaAbaixo)}
        ${itemCor("lilas", T.habitoSim)}${itemCor("bege", T.habitoNao)}${itemCor("vazio", ESTADOS.sem_marcar)}
      </div>
      ${notaDatas}`;
  }
  return `
    <div class="legenda">
      ${itemCor("verde", ESTADOS.sono_boa)}${itemCor("amarelo", ESTADOS.sono_ok)}
      ${itemCor("vermelho", ESTADOS.sono_ruim)}${itemCor("vazio", ESTADOS.sem_marcar)}
    </div>
    <p class="detalhe">${T.sonoExplica}</p>`;
}

// aoAbrirDia(data) e aoAbrirAjustes() vêm do app.js, que cuida da troca de telas
export async function mostrarCalendario(tela, { aoAbrirDia, aoAbrirAjustes }) {
  const minhaAbertura = ++aberturaAtual;
  // Lê semanas inteiras (a semana que atravessa dois meses aparece nos dois)
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const inicio = inicioDaSemana(montarData(ano, mes, 1));
  const fim = somarDias(inicioDaSemana(montarData(ano, mes, diasNoMes)), 6);
  const registros = await lerDiasEntre(inicio, fim);
  const perfil = await lerPerfil();
  const faixa = await faixaBackup();
  if (minhaAbertura !== aberturaAtual) return;
  const porData = Object.fromEntries(registros.map((d) => [d.data, d]));

  tela.innerHTML = `
    <header class="cabecalho">
      <button type="button" class="seta" id="mes-anterior" aria-label="${T.mesAnterior}">‹</button>
      <h1 class="titulo-mes">${formatarMes(ano, mes)}</h1>
      <button type="button" class="seta" id="mes-seguinte" aria-label="${T.mesSeguinte}">›</button>
      <button type="button" class="seta engrenagem" id="abrir-ajustes" aria-label="${T.ajustes}">⚙︎</button>
    </header>

    ${faixa}

    ${resumoMensal(ano, mes, porData, perfil)}

    <div class="camadas">
      ${CAMADAS.map((c) => `
        <button type="button" class="camada ${c === camada ? "ativa" : ""}" data-camada="${c}"
          aria-pressed="${c === camada}">${T.camadas[c]}</button>`).join("")}
    </div>

    <div class="semana" aria-hidden="true">${T.diasSemana.map((d) => `<span>${d}</span>`).join("")}</div>
    <div class="mes">${montarGrade(porData, perfil)}</div>

    ${montarLegenda(perfil)}

    ${cartoesSemanais(ano, mes, porData, perfil)}
  `;

  const redesenhar = () => mostrarCalendario(tela, { aoAbrirDia, aoAbrirAjustes });

  tela.querySelector("#mes-anterior").onclick = () => {
    mes--;
    if (mes === 0) { mes = 12; ano--; }
    redesenhar();
  };
  tela.querySelector("#mes-seguinte").onclick = () => {
    mes++;
    if (mes === 13) { mes = 1; ano++; }
    redesenhar();
  };
  tela.querySelectorAll("[data-camada]").forEach((b) => {
    b.onclick = () => { camada = b.dataset.camada; redesenhar(); };
  });
  tela.querySelectorAll("button.dia").forEach((b) => {
    b.onclick = () => aoAbrirDia(b.dataset.data);
  });
  tela.querySelector("#abrir-ajustes").onclick = aoAbrirAjustes;
  tela.querySelectorAll("[data-gerar-pdf]").forEach((b) => {
    ligarBotaoPdf(b, {
      rotulo: b.dataset.rotulo,
      periodo: () => ({ tipo: b.dataset.gerarPdf, inicio: b.dataset.inicio, fim: b.dataset.fim }),
    });
  });
  tela.querySelector("#faixa-backup").onclick = aoAbrirAjustes;
}

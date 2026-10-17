// Aba "Peso": um ponto por semana (a média), do começo do histórico até hoje.
// Tocar num ponto mostra o intervalo da semana, a média e quantas pesagens entraram.

import { todosOsDias } from "./dados.js";
import { semanasComPeso } from "./relatorios.js";
import { graficoPesoAcumulado, detalheSemana } from "./graficos.js";
import { PESO as T } from "./textos.js";

export async function mostrarPeso(tela) {
  const semanas = semanasComPeso(await todosOsDias());

  if (semanas.length === 0) {
    tela.innerHTML = `
      <header class="cabecalho"><h1>${T.titulo}</h1></header>
      <p>${T.vazio}</p>`;
    return;
  }

  let selecionada = semanas.length - 1; // começa mostrando a semana mais recente

  tela.innerHTML = `
    <header class="cabecalho"><h1>${T.titulo}</h1></header>
    <p class="detalhe">${T.explica}</p>
    <div class="cartao rolagem-grafico" id="area-grafico"></div>
    <section class="cartao relatorio" id="detalhe-semana" aria-live="polite"></section>
  `;

  const area = tela.querySelector("#area-grafico");
  const detalhe = tela.querySelector("#detalhe-semana");

  function desenhar() {
    const rolagem = area.scrollLeft;
    area.innerHTML = graficoPesoAcumulado(semanas, selecionada);
    area.scrollLeft = rolagem;
    const d = detalheSemana(semanas[selecionada]);
    detalhe.innerHTML = `
      <h2>${d.intervalo}</h2>
      <p>${T.media(d.media, d.n)}</p>`;
    area.querySelectorAll(".ponto-semana").forEach((p) => {
      p.onclick = () => { selecionada = Number(p.dataset.i); desenhar(); };
    });
  }

  desenhar();
  area.scrollLeft = area.scrollWidth; // abre mostrando as semanas mais recentes
}

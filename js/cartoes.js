// Diário Nutri · Criado por Lift Like a Girl (@liftlikeagirl.xo)
//
// Desenho dos relatórios que aparecem no Calendário: o resumo do mês (em cima)
// e os cartões semanais (embaixo). As contas ficam em relatorios.js.
//
// Regras dos cartões semanais (segunda a domingo):
// - só aparece a semana cuja segunda-feira já chegou; semanas futuras não aparecem;
// - a semana de hoje leva "em andamento";
// - semana passada sem nenhum registro aparece com "Sem registros";
// - semana que cruza dois meses aparece nos dois, mas em cada mês só contam
//   os dias daquele mês (os outros dias aparecem apagados, sem dados).

import { infoValor } from "./modelo.js";
import {
  hojeISO, montarData, formatarNumero, formatarSemana, formatarDiaCurto,
  diaSemanaCurto, inicioDaSemana, somarDias, mesCurto, escapar,
} from "./formato.js";
import {
  datasAteHoje, resumirRefeicoes, mediaDoCampo, contarMetaAgua, listarLivres,
  temRegistros, listarFome,
} from "./relatorios.js";
import { graficoPesoSemana, graficoSonoSemana } from "./graficos.js";
import { ESTADOS, RELATORIOS as T, PDF as TPDF } from "./textos.js";

// Botão pequeno e discreto "Gerar PDF" (ligado em calendario.js, com ligarBotaoPdf).
// O PDF da semana tem a semana inteira (segunda a domingo), mesmo que ela cruze dois meses.
function botaoPdf(tipo, inicio, fim, rotulo) {
  return `
    <div class="linha-pdf">
      <button type="button" class="botao-pdf" data-gerar-pdf="${tipo}" data-inicio="${inicio}" data-fim="${fim}" data-rotulo="${rotulo}">
        <span class="texto-botao-pdf">${rotulo}</span>
      </button>
    </div>`;
}

// ---------- Linhas de texto (iguais no mês e na semana) ----------

function linhaRefeicoes(porData, datas, perfil) {
  const r = resumirRefeicoes(porData, datas, perfil);
  return T.refeicoes(r.seguiu, r.marcadas, r.semMarcar);
}

function linhaPeso(porData, datas) {
  const p = mediaDoCampo(porData, datas, "peso");
  return T.peso(p.n ? formatarNumero(p.media) : "", p.n);
}

function linhaAgua(porData, datas, perfil, comMedia) {
  const a = contarMetaAgua(porData, datas, perfil);
  let texto = T.agua(a.atingiu, a.marcados);
  if (comMedia) {
    const m = mediaDoCampo(porData, datas, "agua_copos");
    texto += T.aguaMedia(m.n ? formatarNumero(m.media, 0) : "", m.n); // "3 copos", "3,5 copos"
  }
  return texto;
}

// ---------- Resumo do mês ----------

function ultimoDiaDoMes(ano, mes) {
  return montarData(ano, mes, new Date(ano, mes, 0).getDate());
}

export function resumoMensal(ano, mes, porData, perfil) {
  const datas = datasAteHoje(montarData(ano, mes, 1), ultimoDiaDoMes(ano, mes));
  if (datas.length === 0) {
    return `<section class="cartao relatorio"><h2>${T.resumoMes}</h2><p>${T.mesNaoComecou}</p></section>`;
  }
  return `
    <section class="cartao relatorio">
      <h2>${T.resumoMes}</h2>
      <p>${linhaPeso(porData, datas)}</p>
      <p>${linhaRefeicoes(porData, datas, perfil)}</p>
      <p>${linhaAgua(porData, datas, perfil, false)}</p>
      ${temRegistros(porData, datas) ? botaoPdf("mes", montarData(ano, mes, 1), ultimoDiaDoMes(ano, mes), TPDF.gerarMes) : ""}
    </section>`;
}

// ---------- Cartão semanal ----------

// Lista recolhida (toca para abrir), com o texto completo de cada item
function listaRecolhida(titulo, itens, vazio) {
  if (itens.length === 0) return `<p>${vazio}</p>`;
  return `
    <details class="livres">
      <summary>${titulo}</summary>
      <ul>
        ${itens.map((i) => `
          <li><span class="quando">${i.quando}</span>
            ${i.texto ? escapar(i.texto) : `<em>${T.semDescricao}</em>`}</li>`).join("")}
      </ul>
    </details>`;
}

// "1–4 out" (ou "1 out" se for um dia só)
function intervaloCurto(primeiro, ultimo) {
  const d1 = Number(primeiro.slice(8)), d2 = Number(ultimo.slice(8));
  return primeiro === ultimo ? `${d1} ${mesCurto(primeiro)}` : `${d1}–${d2} ${mesCurto(ultimo)}`;
}

function cartaoSemanal(segunda, ano, mes, porData, perfil) {
  const hoje = hojeISO();
  const prefixoMes = montarData(ano, mes, 1).slice(0, 7); // "2026-10"
  const seteDias = Array.from({ length: 7 }, (_, i) => somarDias(segunda, i));
  const doMes = seteDias.filter((d) => d.startsWith(prefixoMes));
  const conta = new Set(doMes.filter((d) => d <= hoje)); // os dias que entram nas contas
  const datas = [...conta];
  const emAndamento = seteDias.includes(hoje);
  const cruzaMeses = doMes.length < 7;

  const titulo = `
    <h2>${formatarSemana(segunda)}
      ${emAndamento ? `<span class="etiqueta">${T.emAndamento}</span>` : ""}</h2>
    ${cruzaMeses ? `<p class="detalhe">${T.soDiasDoMes(intervaloCurto(doMes[0], doMes[doMes.length - 1]))}</p>` : ""}`;

  if (!temRegistros(porData, datas)) {
    return `<section class="cartao relatorio semana-cartao">${titulo}<p>${T.semRegistros}</p></section>`;
  }

  // Dias que não entram nas contas (do outro mês ou futuros) ficam sem dados nos gráficos
  const registros = seteDias.map((d) => (conta.has(d) ? porData[d] || {} : {}));

  // Debaixo de cada dia: o nome do dia e um 💩 por vez que foi ao banheiro
  const colunasDias = (comBanheiro) => `
    <div class="dias7">
      ${seteDias.map((d, i) => `
        <span class="${conta.has(d) ? "" : "fora"}">
          <span class="dia-curto">${diaSemanaCurto(d)}</span>
          ${comBanheiro ? `<span class="cocos">${"<span>💩</span>".repeat(registros[i].banheiro || 0)}</span>` : ""}
        </span>`).join("")}
    </div>`;

  const corSono = (valor) => infoValor("sonoQualidade", valor).cor;
  const livres = listarLivres(porData, datas, perfil)
    .map((l) => ({ quando: `${formatarDiaCurto(l.data)} · ${escapar(l.refeicao)}`, texto: l.texto }));
  const fome = listarFome(porData, datas)
    .map((f) => ({ quando: formatarDiaCurto(f.data), texto: f.texto }));

  return `
    <section class="cartao relatorio semana-cartao">
      ${titulo}
      <p>${linhaRefeicoes(porData, datas, perfil)}</p>
      <p>${linhaPeso(porData, datas)}</p>
      ${graficoPesoSemana(registros.map((r) => r.peso))}
      ${colunasDias(true)}
      <p>${linhaAgua(porData, datas, perfil, true)}</p>
      <h3>${T.sonoTitulo}</h3>
      ${graficoSonoSemana(registros)}
      ${colunasDias(false)}
      <div class="legenda pequena">
        <span class="item"><span class="quadradinho cheio" data-cor="${corSono("boa")}"></span>${ESTADOS.sono_boa}</span>
        <span class="item"><span class="quadradinho cheio" data-cor="${corSono("ok")}"></span>${ESTADOS.sono_ok}</span>
        <span class="item"><span class="quadradinho cheio" data-cor="${corSono("ruim")}"></span>${ESTADOS.sono_ruim}</span>
      </div>
      ${listaRecolhida(T.livresTitulo(livres.length), livres, T.semLivres)}
      ${listaRecolhida(T.fomeTitulo(fome.length), fome, T.semFome)}
      ${botaoPdf("semana", segunda, seteDias[6], TPDF.gerarSemana)}
    </section>`;
}

// Cartões das semanas que tocam o mês e cuja segunda-feira já chegou
export function cartoesSemanais(ano, mes, porData, perfil) {
  const hoje = hojeISO();
  const primeiro = montarData(ano, mes, 1);
  if (primeiro > hoje) return ""; // mês futuro: o resumo já diz "Este mês ainda não começou"
  const ultimo = ultimoDiaDoMes(ano, mes);
  let html = "";
  for (let s = inicioDaSemana(primeiro); s <= ultimo && s <= hoje; s = somarDias(s, 7)) {
    html += cartaoSemanal(s, ano, mes, porData, perfil);
  }
  return `<h2 class="secao">${T.semanas}</h2>${html}`;
}

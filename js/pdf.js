// Diário Nutri · Criado por Lift Like a Girl (@liftlikeagirl.xo)
//
// PDF para a nutricionista, gerado dentro do aparelho com a biblioteca jsPDF (pasta lib/).
//
// Conteúdo: cabeçalho (nome, idade, período), resumo, gráfico de peso e tabela dia a dia.
// Regras (CLAUDE.md, seção 7):
// - toda cor tem a palavra escrita ("seguiu", "livre"...), para não depender de cor;
// - fonte de no mínimo 9 pt;
// - TEXTO LIVRE NUNCA É CORTADO: o que comi, fome e nota vão embaixo do dia, na largura
//   inteira da tabela, quebrando em várias linhas. A altura de cada linha da tabela é medida
//   (splitTextToSize) antes de desenhar, e um dia nunca é partido entre duas páginas:
//   se não cabe, vai inteiro para a página seguinte.
// Fundo branco, texto preto (style.md). Medidas em pontos (1 pt = 1/72 de polegada).

import { infoValor, todasAsRefeicoes, habitosAtivos } from "./modelo.js";
import { datasAteHoje, resumirRefeicoes, mediaDoCampo, contarDias, contarMetaAgua } from "./relatorios.js";
import {
  formatarNumero, formatarPeriodoLongo, formatarMes, formatarDiaCurto, formatarDataComAno,
  diaSemanaCurto, hojeISO,
} from "./formato.js";
import { NOME_APP, PREFIXO_ARQUIVOS, PDF as T, RELATORIOS as TR } from "./textos.js";

// O que o paciente pode ligar e desligar antes de exportar
export const OPCOES_PDF = [
  { id: "refeicoes", padrao: true },
  { id: "peso", padrao: true },
  { id: "fome", padrao: true },
  { id: "agua", padrao: true },
  { id: "sono", padrao: false },
  { id: "banheiro", padrao: false },
  { id: "habitos", padrao: false },
  { id: "nota", padrao: false },
].map((o) => ({ ...o, nome: T.opcoes[o.id] }));

const MARGEM = 40;
const A4 = { portrait: 595.28, landscape: 841.89 }; // largura da folha em cada orientação
const FONTE = 9;          // tamanho mínimo de letra em todo o PDF
const ENTRELINHA = 11.5;  // altura de uma linha de texto de 9 pt
const FOLGA = 5;          // espaço entre o texto e a borda da célula
const RODAPE = 24;

// Carrega a biblioteca só quando precisa (ela é grande)
let carregando = null;
function carregarJsPDF() {
  if (window.jspdf) return Promise.resolve();
  if (!carregando) {
    carregando = new Promise((ok, erro) => {
      const script = document.createElement("script");
      script.src = "lib/jspdf.umd.min.js";
      script.onload = ok;
      script.onerror = () => {
        carregando = null;
        erro(new Error(T.erroCarregar));
      };
      document.head.appendChild(script);
    });
  }
  return carregando;
}

// As cores vêm do style.css, para ficarem num lugar só
const VARIAVEL_DA_COR = {
  verde: "--seguiu-clara", vermelho: "--livre-clara",
  amarelo: "--sono-ok-clara", laranja: "--fome-clara", bege: "--bege",
  lilas: "--habito-clara", agua: "--agua-clara",
};
function corCss(nome) {
  const variavel = VARIAVEL_DA_COR[nome];
  return variavel ? getComputedStyle(document.documentElement).getPropertyValue(variavel).trim() : null;
}

// As fontes padrão do PDF não têm emoji nem alguns símbolos: tira só o que não dá para escrever.
// Acentos ficam. Quebras de linha digitadas pelo paciente também ficam.
function textoSeguro(texto) {
  return String(texto)
    .replace(/[^\n\x20-\x7E\xA0-\xFF–—‘’“”…•€]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

function celulaCiclo(ciclo, valor) {
  const info = infoValor(ciclo, valor);
  return { texto: info.palavra, cor: info.cor };
}

// ---------- Colunas da tabela ----------

// "refeicoes" são as refeições que entram no período (ver gerarPdf).
// largura: fixa; as das refeições são calculadas depois.
function montarColunas(opcoes, perfil, refeicoes) {
  const C = T.colunas;
  const colunas = [{ titulo: C.dia, largura: 58, esquerda: true, valor: (dia) => ({ texto: formatarDiaCurto(dia.data) }) }];
  if (opcoes.refeicoes) {
    for (const r of refeicoes) {
      colunas.push({ titulo: textoSeguro(r.nome), refeicao: true, valor: (dia) => celulaCiclo("refeicao", dia.refeicoes?.[r.id]) });
    }
  }
  if (opcoes.peso) {
    colunas.push({ titulo: C.peso, largura: 42, valor: (dia) => ({ texto: dia.peso === undefined ? "—" : formatarNumero(dia.peso) }) });
  }
  if (opcoes.fome) {
    // Só a palavra; o texto da fome vai embaixo do dia, inteiro
    colunas.push({ titulo: C.fome, largura: 36, valor: (dia) => celulaCiclo("fome", dia.fome) });
  }
  if (opcoes.agua) {
    const meta = perfil.meta_agua_copos;
    colunas.push({
      titulo: C.agua, largura: 46,
      valor: (dia) => dia.agua_copos === undefined
        ? { texto: "—" }
        : { texto: T.aguaCelula(dia.agua_copos, meta), cor: dia.agua_copos >= meta ? "agua" : "bege" },
    });
  }
  if (opcoes.sono) {
    colunas.push({
      titulo: C.sono, largura: 50,
      valor: (dia) => {
        const q = infoValor("sonoQualidade", dia.sono_qualidade);
        const partes = [
          dia.sono_horas === undefined ? "" : `${formatarNumero(dia.sono_horas, 0)} h`,
          q.valor ? q.palavra : "",
        ].filter(Boolean);
        return { texto: partes.join(", ") || "—", cor: q.cor };
      },
    });
  }
  if (opcoes.banheiro) {
    colunas.push({ titulo: C.banheiro, largura: 46, valor: (dia) => ({ texto: dia.banheiro === undefined ? "—" : String(dia.banheiro) }) });
  }
  if (opcoes.habitos) {
    for (const h of habitosAtivos(perfil)) {
      colunas.push({ titulo: textoSeguro(h.nome), largura: 46, valor: (dia) => celulaCiclo("habito", dia.habitos?.[h.id]) });
    }
  }
  return colunas;
}

// Textos livres do dia: cada um vira um parágrafo, na largura inteira, embaixo da linha do dia
function textosDoDia(dia, opcoes, refeicoes) {
  const textos = [];
  if (opcoes.refeicoes) {
    for (const r of refeicoes) {
      if (dia.refeicoes?.[r.id] !== "livre") continue;
      const texto = textoSeguro(dia.refeicoes_texto?.[r.id] || "") || T.semDescricao;
      textos.push(T.livre(textoSeguro(r.nome), texto));
    }
  }
  if (opcoes.fome && dia.fome === "sim" && dia.fome_texto && textoSeguro(dia.fome_texto)) {
    textos.push(T.fomeTexto(textoSeguro(dia.fome_texto)));
  }
  if (opcoes.nota && dia.nota && textoSeguro(dia.nota)) textos.push(T.nota(textoSeguro(dia.nota)));
  return textos;
}

// ---------- Resumo ----------

// Resumo do período. Todo número vem com quantos registros o sustentam.
function linhasResumo(porData, datas, opcoes, perfil) {
  const linhas = [];
  if (opcoes.refeicoes) {
    const r = resumirRefeicoes(porData, datas, perfil);
    linhas.push(TR.refeicoes(r.seguiu, r.marcadas, r.semMarcar)); // mesmo texto do app
  }
  if (opcoes.peso) {
    const p = mediaDoCampo(porData, datas, "peso");
    linhas.push(T.peso(p.n ? formatarNumero(p.media) : "", p.n));
  }
  if (opcoes.fome) linhas.push(T.fomeResumo(contarDias(porData, datas, "fome", "sim").comValor));
  if (opcoes.agua) {
    const a = contarMetaAgua(porData, datas, perfil);
    linhas.push(T.aguaResumo(perfil.meta_agua_copos, a.atingiu, a.marcados));
  }
  if (opcoes.sono) {
    const s = mediaDoCampo(porData, datas, "sono_horas");
    const q = (v) => contarDias(porData, datas, "sono_qualidade", v).comValor;
    linhas.push(T.sonoResumo(s.n ? formatarNumero(s.media) : "", s.n, q("boa"), q("ok"), q("ruim")));
  }
  if (opcoes.banheiro) {
    const b = mediaDoCampo(porData, datas, "banheiro");
    linhas.push(T.banheiroResumo(b.n ? formatarNumero(b.media) : "", b.n));
  }
  if (opcoes.habitos) {
    for (const h of habitosAtivos(perfil)) {
      let sim = 0, nao = 0;
      for (const data of datas) {
        const v = porData[data]?.habitos?.[h.id];
        if (v === "sim") sim++;
        else if (v === "nao") nao++;
      }
      linhas.push(T.habitoResumo(textoSeguro(h.nome), sim, nao));
    }
  }
  return linhas;
}

// ---------- Gráfico de peso ----------

// Um ponto por dia do período.
// Na semana, todos os pontos têm o valor escrito; no mês, só o primeiro, o último, o menor e o maior.
function desenharGraficoPeso(doc, x, y, largura, altura, datas, porData, rotularTodos) {
  const pontos = datas.map((data, i) => ({ i, v: porData[data]?.peso })).filter((p) => p.v !== undefined);
  const passo = largura / datas.length;
  const cx = (i) => x + passo * (i + 0.5);

  let min = Math.min(...pontos.map((p) => p.v)), max = Math.max(...pontos.map((p) => p.v));
  if (max - min < 1) { const meio = (min + max) / 2; min = meio - 0.5; max = meio + 0.5; }
  const topo = y + 16, base = y + altura - 18;
  const cy = (v) => base - ((v - min) / (max - min)) * (base - topo);

  // Linha de base e nome dos dias
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(x, base + 6, x + largura, base + 6);
  doc.setFontSize(FONTE);
  doc.setFont("helvetica", "normal");
  datas.forEach((data, i) => {
    // No mês, com 31 dias, só os dias ímpares têm número, para caberem com letra de 9 pt
    if (!rotularTodos && i % 2 === 1) return;
    const rotulo = rotularTodos ? `${diaSemanaCurto(data)} ${Number(data.slice(8))}` : String(Number(data.slice(8)));
    doc.text(rotulo, cx(i), base + 17, { align: "center" });
  });

  // Linha ligando os pontos
  doc.setLineWidth(1.2);
  for (let k = 1; k < pontos.length; k++) {
    doc.line(cx(pontos[k - 1].i), cy(pontos[k - 1].v), cx(pontos[k].i), cy(pontos[k].v));
  }

  // Pontos e valores
  const vs = pontos.map((p) => p.v);
  const destacar = new Set(rotularTodos ? pontos.map((p) => p.i) : [
    pontos[0].i, pontos[pontos.length - 1].i,
    pontos[vs.indexOf(Math.min(...vs))].i, pontos[vs.indexOf(Math.max(...vs))].i,
  ]);
  doc.setFillColor(0, 0, 0);
  for (const p of pontos) {
    doc.circle(cx(p.i), cy(p.v), 2.2, "F");
    if (destacar.has(p.i)) doc.text(formatarNumero(p.v), cx(p.i), cy(p.v) - 5, { align: "center" });
  }
}

// ---------- PDF ----------

// Gera o PDF e devolve { blob, nome }.
// tipo: "semana" ou "mes"; porData: { data: registro } com os dias do período.
export async function gerarPdf({ tipo, inicio, fim, opcoes, porData, perfil }) {
  await carregarJsPDF();
  const { jsPDF } = window.jspdf;
  const datas = datasAteHoje(inicio, fim);
  const dias = datas.map((d) => porData[d] || { data: d });

  // Refeições do período: as ativas, e as arquivadas que foram marcadas em algum dia do período
  const refeicoes = todasAsRefeicoes(perfil).filter((r) =>
    r.ativa || dias.some((d) => d.refeicoes?.[r.id] !== undefined));
  const nRefeicoes = Math.max(1, refeicoes.length);

  // Largura das colunas. Nenhuma coluna fica mais estreita que a maior palavra do seu título
  // (senão a palavra seria partida no meio: "Banheir-o").
  const colunas = montarColunas(opcoes, perfil, refeicoes);
  const medidor = new jsPDF({ unit: "pt" });
  medidor.setFont("helvetica", "bold");
  medidor.setFontSize(FONTE);
  for (const c of colunas) {
    const maiorPalavra = Math.max(...c.titulo.split(/\s+/).map((p) => medidor.getTextWidth(p)));
    c.minima = Math.ceil(maiorPalavra + 2 * FOLGA + 2);
    if (c.largura) c.largura = Math.max(c.largura, c.minima);
  }
  // Se as refeições ficarem estreitas demais em pé, a folha fica deitada
  const fixo = colunas.filter((c) => !c.refeicao).reduce((s, c) => s + c.largura, 0);
  const util = (o) => A4[o] - 2 * MARGEM;
  const orientacao = opcoes.refeicoes && (util("portrait") - fixo) / nRefeicoes < 48 ? "landscape" : "portrait";
  const larguraUtil = util(orientacao);
  for (const c of colunas) if (c.refeicao) c.largura = Math.max(c.minima, Math.min(80, (larguraUtil - fixo) / nRefeicoes));
  const larguraTabela = colunas.reduce((s, c) => s + c.largura, 0);

  const doc = new jsPDF({ orientation: orientacao, unit: "pt", format: "a4" });
  const alturaPagina = doc.internal.pageSize.getHeight();
  const limite = alturaPagina - MARGEM - RODAPE;
  doc.setTextColor(0, 0, 0);
  let y = MARGEM;

  // Escreve um texto que quebra em várias linhas, na largura dada
  const escrever = (texto, largura, tamanho = 10, negrito = false) => {
    doc.setFont("helvetica", negrito ? "bold" : "normal");
    doc.setFontSize(tamanho);
    for (const parte of doc.splitTextToSize(texto, largura)) {
      doc.text(parte, MARGEM, y);
      y += tamanho * 1.3;
    }
  };

  // Cabeçalho: tipo do relatório, paciente e período
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${NOME_APP} · ${tipo === "semana" ? T.relatorioSemanal : T.relatorioMensal}`, MARGEM, y + 12);
  y += 34;
  escrever(T.paciente(textoSeguro(perfil.nome), perfil.idade), larguraUtil, 12, true);
  const [ano, mes] = inicio.split("-").map(Number);
  escrever(tipo === "semana" ? formatarPeriodoLongo(inicio, fim) : formatarMes(ano, mes).replace(" ", " de "), larguraUtil, 12);
  let gerado = T.geradoEm(formatarDataComAno(hojeISO()));
  if (fim > hojeISO()) gerado += T.emAndamento;
  escrever(gerado, larguraUtil, FONTE);
  y += 12;

  // Resumo
  escrever(T.resumo, larguraUtil, 11, true);
  for (const linha of linhasResumo(porData, datas, opcoes, perfil)) escrever(linha, larguraUtil, 10);
  y += 8;

  // Gráfico de peso
  if (opcoes.peso && dias.some((d) => d.peso !== undefined)) {
    escrever(T.pesoGrafico, larguraUtil, 11, true);
    desenharGraficoPeso(doc, MARGEM, y - 6, Math.min(larguraUtil, 515), 120, datas, porData, tipo === "semana");
    y += 140;
  }

  // ---------- Tabela dia a dia ----------

  // Mede as linhas de texto de cada célula (nada é cortado: o texto quebra e a linha cresce)
  const medir = (texto, largura) => doc.splitTextToSize(texto, largura - 2 * FOLGA);
  const alturaDe = (nLinhas) => nLinhas * ENTRELINHA + 2 * FOLGA - 2;

  doc.setFontSize(FONTE);
  doc.setFont("helvetica", "bold");
  const titulos = colunas.map((c) => medir(c.titulo, c.largura));
  const alturaCabecalho = alturaDe(Math.max(...titulos.map((t) => t.length)));

  // Mede cada dia ANTES de desenhar: as células e os textos livres
  doc.setFont("helvetica", "normal");
  const medidas = dias.map((dia) => {
    const celulas = colunas.map((c) => {
      const { texto, cor } = c.valor(dia);
      return { partes: medir(texto, c.largura), cor };
    });
    const alturaLinha = alturaDe(Math.max(...celulas.map((c) => c.partes.length)));
    const textos = textosDoDia(dia, opcoes, refeicoes).map((t) => medir(t, larguraTabela));
    const linhasTexto = textos.reduce((s, t) => s + t.length, 0);
    const alturaTextos = textos.length ? linhasTexto * ENTRELINHA + (textos.length - 1) * 3 + 2 * FOLGA : 0;
    return { celulas, alturaLinha, textos, alturaTextos };
  });

  // O título "Dia a dia" e o cabeçalho da tabela nunca ficam sozinhos no fim da página:
  // se o primeiro dia não cabe junto, os três vão para a página seguinte
  const primeiro = medidas[0];
  if (primeiro && y + 11 * 1.3 + alturaCabecalho + primeiro.alturaLinha + primeiro.alturaTextos > limite) {
    doc.addPage();
    y = MARGEM;
  }
  escrever(T.diaADia, larguraUtil, 11, true);
  y -= 4;

  const desenharCabecalhoTabela = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONTE);
    doc.setLineWidth(0.5);
    doc.setDrawColor(0);
    let x = MARGEM;
    colunas.forEach((c, k) => {
      doc.rect(x, y, c.largura, alturaCabecalho, "S");
      titulos[k].forEach((parte, j) => {
        doc.text(parte, c.esquerda ? x + FOLGA : x + c.largura / 2, y + FOLGA + 7 + j * ENTRELINHA, { align: c.esquerda ? "left" : "center" });
      });
      x += c.largura;
    });
    y += alturaCabecalho;
  };
  desenharCabecalhoTabela();

  for (const { celulas, alturaLinha, textos, alturaTextos } of medidas) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONTE);

    // 2. O dia (linha + textos) nunca é partido: se não cabe, vai inteiro para a página seguinte
    if (y + alturaLinha + alturaTextos > limite) {
      doc.addPage();
      y = MARGEM;
      desenharCabecalhoTabela();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONTE);
    }

    // 3. Linha do dia
    let x = MARGEM;
    colunas.forEach((c, k) => {
      const { partes, cor } = celulas[k];
      const fundo = cor ? corCss(cor) : null;
      if (fundo) doc.setFillColor(fundo);
      doc.rect(x, y, c.largura, alturaLinha, fundo ? "FD" : "S");
      partes.forEach((parte, j) => {
        doc.text(parte, c.esquerda ? x + FOLGA : x + c.largura / 2, y + FOLGA + 7 + j * ENTRELINHA, { align: c.esquerda ? "left" : "center" });
      });
      x += c.largura;
    });
    y += alturaLinha;

    // 4. Textos livres, na largura inteira da tabela.
    // (Só se um único dia for maior que uma página inteira, o que é quase impossível,
    // os textos continuam na página seguinte, linha por linha, sem perder nada.)
    if (textos.length) {
      let topoBloco = y;
      let ty = y + FOLGA + 7;
      textos.forEach((partes, k) => {
        for (const parte of partes) {
          if (ty + FOLGA > limite) {
            doc.rect(MARGEM, topoBloco, larguraTabela, ty - topoBloco - 7 + FOLGA, "S");
            doc.addPage();
            topoBloco = MARGEM;
            ty = MARGEM + FOLGA + 7;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(FONTE);
          }
          doc.text(parte, MARGEM + FOLGA, ty);
          ty += ENTRELINHA;
        }
        if (k < textos.length - 1) ty += 3;
      });
      const alturaBloco = ty - topoBloco - 7 + FOLGA - 2;
      doc.rect(MARGEM, topoBloco, larguraTabela, alturaBloco, "S");
      y = topoBloco + alturaBloco;
    }
  }

  // Rodapé discreto com o número da página
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONTE);
    doc.text(T.rodape(NOME_APP, p, total), A4[orientacao] - MARGEM, alturaPagina - MARGEM + 10, { align: "right" });
  }

  const nome = tipo === "semana" ? `${PREFIXO_ARQUIVOS}-semana-${inicio}.pdf` : `${PREFIXO_ARQUIVOS}-mes-${inicio.slice(0, 7)}.pdf`;
  return { blob: doc.output("blob"), nome };
}

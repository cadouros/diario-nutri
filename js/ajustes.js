// Tela "Ajustes": ver e editar o perfil, exportar e importar backup, exportar CSV e PDF, ver a versão do app.

import { todosOsDias, lerMeta, salvarMeta, lerPerfil } from "./dados.js";
import { refeicoesAtivas, habitosAtivos, litros } from "./modelo.js";
import {
  PERFIL as TP, BACKUP as TB, CSV as TC, AJUSTES as T, PDF as TPDF, AJUDA as TA, BOAS_VINDAS as TBV,
  CREDITO_TEXTO, CREDITO_LINK, CREDITO_LINK_TEXTO, CREDITO_EMAIL,
} from "./textos.js";
import { montarBackup, NOME_BACKUP } from "./backup.js";
import { montarCSV, NOME_CSV } from "./csv.js";
import { entregarArquivo } from "./arquivos.js";
import { OPCOES_PDF } from "./pdf.js";
import { ligarBotaoPdf, lerOpcoesPdf, salvarOpcoesPdf } from "./pdfbotao.js";
import { ligarImportacao, descreverMomento } from "./importacao.js";
import { passos } from "./boasvindas.js";
import {
  agoraLocal, hojeISO, diasEntre, inicioDaSemana, somarDias, formatarSemana, formatarMes, montarData, escapar,
} from "./formato.js";

// Período escolhido para o PDF: fica guardado enquanto o app está aberto.
// (Os itens que entram no PDF ficam guardados no aparelho: ver pdfbotao.js.)
const escolhaPdf = {
  tipo: "semana",
  inicio: inicioDaSemana(hojeISO()),
};

// Último dia do período escolhido
function fimDoPeriodo() {
  if (escolhaPdf.tipo === "semana") return somarDias(escolhaPdf.inicio, 6);
  const [ano, mes] = escolhaPdf.inicio.split("-").map(Number);
  return montarData(ano, mes, new Date(ano, mes, 0).getDate());
}

// Anda um período para trás (-1) ou para a frente (+1)
function andarPeriodo(direcao) {
  if (escolhaPdf.tipo === "semana") return somarDias(escolhaPdf.inicio, 7 * direcao);
  let [ano, mes] = escolhaPdf.inicio.split("-").map(Number);
  mes += direcao;
  if (mes === 0) { mes = 12; ano--; }
  if (mes === 13) { mes = 1; ano++; }
  return montarData(ano, mes, 1);
}

// Parte da tela de Ajustes que monta o PDF: período e itens
async function ligarPdf(secao) {
  const opcoes = await lerOpcoesPdf();
  const periodo = secao.querySelector("#pdf-periodo");
  const seguinte = secao.querySelector("#pdf-seguinte");
  const areaPronto = secao.querySelector("#pdf-pronto");
  const botaoGerar = secao.querySelector("#gerar-pdf");

  const controle = ligarBotaoPdf(botaoGerar, {
    rotulo: TPDF.gerar,
    periodo: () => ({ tipo: escolhaPdf.tipo, inicio: escolhaPdf.inicio, fim: fimDoPeriodo() }),
    aoGerar: (pronto) => {
      areaPronto.innerHTML = `<p>${TPDF.pronto} <strong class="nome-arquivo"></strong></p>`;
      areaPronto.querySelector(".nome-arquivo").textContent = pronto.nome;
    },
  });

  // Qualquer mudança descarta o PDF já gerado
  function atualizar() {
    controle.reiniciar();
    areaPronto.innerHTML = "";
    const [ano, mes] = escolhaPdf.inicio.split("-").map(Number);
    periodo.textContent = escolhaPdf.tipo === "semana" ? formatarSemana(escolhaPdf.inicio) : formatarMes(ano, mes);
    seguinte.disabled = andarPeriodo(1) > hojeISO(); // não deixa escolher período futuro
    secao.querySelectorAll("[data-pdf-tipo]").forEach((b) => {
      b.classList.toggle("ativa", b.dataset.pdfTipo === escolhaPdf.tipo);
      b.setAttribute("aria-pressed", b.dataset.pdfTipo === escolhaPdf.tipo);
    });
    botaoGerar.disabled = !Object.values(opcoes).some(Boolean);
  }

  secao.querySelectorAll("[data-pdf-tipo]").forEach((b) => {
    b.onclick = () => {
      escolhaPdf.tipo = b.dataset.pdfTipo;
      escolhaPdf.inicio = escolhaPdf.tipo === "semana" ? inicioDaSemana(hojeISO()) : hojeISO().slice(0, 8) + "01";
      atualizar();
    };
  });
  secao.querySelector("#pdf-anterior").onclick = () => { escolhaPdf.inicio = andarPeriodo(-1); atualizar(); };
  seguinte.onclick = () => { escolhaPdf.inicio = andarPeriodo(1); atualizar(); };
  secao.querySelectorAll("[data-pdf-opcao]").forEach((caixa) => {
    caixa.checked = opcoes[caixa.dataset.pdfOpcao];
    caixa.onchange = () => {
      opcoes[caixa.dataset.pdfOpcao] = caixa.checked;
      salvarOpcoesPdf(opcoes).catch((e) => alert(TB.erro + e.message));
      atualizar();
    };
  });

  atualizar();
}

// Seção "Ajuda": instruções de instalação e de backup para as pacientes, em itens que abrem ao tocar
function htmlAjuda() {
  const item = (titulo, conteudo) => `<details class="item-ajuda"><summary>${titulo}</summary>${conteudo}</details>`;
  const lista = (itens) => `<ul>${itens.map((i) => `<li>${i}</li>`).join("")}</ul>`;
  return `
    <section class="cartao relatorio ajuda" id="secao-ajuda">
      <h2>${TA.titulo}</h2>
      ${item(TA.instalarTitulo, `
        <p>${TA.instalarIntro}</p>
        <h3>${TA.iphone}</h3>${passos(TBV.iphone)}
        <h3>${TA.android}</h3>${passos(TBV.android)}
        <p><strong>${TA.sempreIcone}</strong></p>`)}
      ${item(TA.backupTitulo, passos(TA.backupPassos))}
      ${item(TA.restaurarTitulo, passos(TA.restaurarPassos))}
      ${item(TA.cuidadosTitulo, lista(TA.cuidados))}
    </section>`;
}

// A versão vem do nome da cópia offline ("diarionutri-v1"), criada pelo sw.js
const PREFIXO_CACHE = "diarionutri-";
async function versaoInstalada() {
  try {
    const nome = (await caches.keys()).filter((n) => n.startsWith(PREFIXO_CACHE)).sort().pop();
    return nome ? nome.slice(PREFIXO_CACHE.length) : T.semCopia;
  } catch {
    return T.desconhecida;
  }
}

// Seção "Seu perfil": um resumo de cada parte, com um botão "Editar" que abre aquele passo
function htmlPerfil(perfil) {
  const nomes = (lista) => lista.map((i) => escapar(i.nome)).join(", ");
  const habitos = habitosAtivos(perfil);
  const linha = (passo, titulo, valor) => `
    <div class="linha-ajuste">
      <div><span class="rotulo-ajuste">${titulo}</span><br>${valor}</div>
      <button type="button" class="botao estreito" data-editar="${passo}" aria-label="${TP.editar}: ${titulo}">${TP.editar}</button>
    </div>`;
  return `
    <section class="cartao relatorio" id="secao-perfil">
      <h2>${TP.ajustesTitulo}</h2>
      ${linha("nome", `${TP.resumoNome} e ${TP.resumoIdade.toLowerCase()}`,
        `${escapar(perfil.nome)}${perfil.idade === undefined ? "" : `, ${perfil.idade} ${TP.idadeUnidade}`}`)}
      ${linha("refeicoes", TP.resumoRefeicoes, nomes(refeicoesAtivas(perfil)))}
      ${linha("agua", TP.resumoAgua, TP.aguaEquivale(perfil.meta_agua_copos, litros(perfil.meta_agua_copos)))}
      ${linha("habitos", TP.resumoHabitos, habitos.length ? nomes(habitos) : TP.nenhum)}
    </section>`;
}

export async function mostrarAjustes(tela, { aoVoltar, aoEditarPerfil }) {
  // Os arquivos ficam prontos antes do toque: o iPhone só abre o menu de
  // compartilhar se ele for chamado logo depois do toque.
  let arquivos;
  async function prepararArquivos() {
    const [dias, perfil] = await Promise.all([todosOsDias(), lerPerfil()]);
    arquivos = { backup: montarBackup(dias, perfil), csv: montarCSV(dias, perfil), quantos: dias.length, perfil };
  }
  await prepararArquivos();
  const persistente = navigator.storage && navigator.storage.persisted
    ? await navigator.storage.persisted().catch(() => false)
    : false;

  tela.innerHTML = `
    <header class="cabecalho">
      <button type="button" class="seta" id="voltar" aria-label="${T.voltar}">‹</button>
      <h1>${T.titulo}</h1>
      <span class="seta"></span>
    </header>

    ${htmlPerfil(arquivos.perfil)}

    <section class="cartao relatorio" id="secao-backup">
      <h2>${TB.titulo}</h2>
      <p>${TB.explica}</p>
      <p id="ultimo-backup"></p>
      <div class="botoes">
        <button type="button" class="botao principal" id="exportar-backup">${TB.exportar}</button>
        <button type="button" class="botao" id="importar-backup">${TB.importar}</button>
      </div>
      <div id="area-importacao"></div>
    </section>

    <section class="cartao relatorio">
      <h2>${TC.titulo}</h2>
      <p>${TC.explica}</p>
      <div class="botoes">
        <button type="button" class="botao" id="exportar-csv">${TC.exportar}</button>
      </div>
    </section>

    <section class="cartao relatorio" id="secao-pdf">
      <h2>${TPDF.titulo}</h2>
      <p>${TPDF.explica}</p>
      <div class="camadas">
        <button type="button" class="camada" data-pdf-tipo="semana">${TPDF.semana}</button>
        <button type="button" class="camada" data-pdf-tipo="mes">${TPDF.mes}</button>
      </div>
      <div class="cabecalho periodo-pdf">
        <button type="button" class="seta" id="pdf-anterior" aria-label="${TPDF.periodoAnterior}">‹</button>
        <span id="pdf-periodo" class="titulo-periodo"></span>
        <button type="button" class="seta" id="pdf-seguinte" aria-label="${TPDF.periodoSeguinte}">›</button>
      </div>
      <p>${TPDF.oQueEntra}</p>
      <div class="opcoes-pdf">
        ${OPCOES_PDF.map((o) => `
          <label class="opcao-pdf"><input type="checkbox" data-pdf-opcao="${o.id}"> ${o.nome}</label>`).join("")}
      </div>
      <div class="botoes">
        <button type="button" class="botao" id="gerar-pdf">${TPDF.gerar}</button>
      </div>
      <div id="pdf-pronto"></div>
    </section>

    ${htmlAjuda()}

    <section class="cartao relatorio">
      <h2>${T.sobre}</h2>
      <p>${T.diasRegistrados} <span id="quantos-dias">${arquivos.quantos}</span></p>
      <p>${persistente ? T.protegido : T.naoProtegido}</p>
      <p>${T.versao(await versaoInstalada())}</p>
      <p class="credito-sobre">
        ${CREDITO_TEXTO} ·
        <a href="${CREDITO_LINK}" target="_blank" rel="noopener">${CREDITO_LINK_TEXTO}</a>
        ${CREDITO_EMAIL ? `· <a href="mailto:${CREDITO_EMAIL}">${CREDITO_EMAIL}</a>` : ""}
      </p>
    </section>
  `;

  await ligarPdf(tela.querySelector("#secao-pdf"));

  tela.querySelectorAll("[data-editar]").forEach((b) => {
    b.onclick = () => aoEditarPerfil(b.dataset.editar);
  });

  const ultimo = tela.querySelector("#ultimo-backup");
  async function mostrarUltimo() {
    const momento = await lerMeta("ultimoBackup");
    ultimo.textContent = momento ? TB.ultimo(descreverMomento(momento)) : TB.nenhum;
  }
  await mostrarUltimo();

  const erro = (e) => alert(TB.erro + e.message);

  tela.querySelector("#voltar").onclick = aoVoltar;

  // Exportar backup: só marca a data se o menu não foi cancelado
  tela.querySelector("#exportar-backup").onclick = () => {
    entregarArquivo(NOME_BACKUP, "application/json", arquivos.backup)
      .then(async (entregue) => {
        if (!entregue) return;
        await salvarMeta("ultimoBackup", agoraLocal());
        await mostrarUltimo();
      })
      .catch(erro);
  };

  tela.querySelector("#exportar-csv").onclick = () => {
    entregarArquivo(NOME_CSV, "text/csv", arquivos.csv).catch(erro);
  };

  // Importar backup: escolhe o arquivo, mostra o resumo e só troca depois da confirmação
  ligarImportacao({
    botao: tela.querySelector("#importar-backup"),
    area: tela.querySelector("#area-importacao"),
    aoImportar: async () => {
      // Atualiza o que mudou na tela (o aviso "Pronto" continua visível)
      await prepararArquivos();
      await mostrarUltimo();
      tela.querySelector("#quantos-dias").textContent = arquivos.quantos;
      tela.querySelector("#secao-perfil").outerHTML = htmlPerfil(arquivos.perfil);
      tela.querySelectorAll("[data-editar]").forEach((b) => {
        b.onclick = () => aoEditarPerfil(b.dataset.editar);
      });
    },
  });
}

// Aviso de backup no fim do Calendário. Só aparece:
//   - sem nenhum backup: depois de 30 dias de uso (contados a partir do primeiro dia registrado);
//   - com backup: 30 dias depois do último.
// Devolve null (sem aviso) ou { html, ligar(tela, aoTerminar) }.
// O arquivo fica pronto antes do toque, porque o iPhone só abre o menu de compartilhar logo depois dele.
export async function avisoBackup() {
  const [momento, dias] = await Promise.all([lerMeta("ultimoBackup"), todosOsDias()]);
  const hoje = hojeISO();
  let texto;
  if (momento) {
    const passados = diasEntre(momento.split("T")[0], hoje);
    if (passados < TB.diasParaAviso) return null;
    texto = TB.avisoHa(passados);
  } else {
    if (dias.length === 0) return null;
    const primeiro = dias.map((d) => d.data).sort()[0];
    if (diasEntre(primeiro, hoje) < TB.diasParaAviso) return null;
    texto = TB.avisoNenhum;
  }
  const conteudo = montarBackup(dias, await lerPerfil());
  return {
    html: `
      <section class="cartao aviso-backup" id="aviso-backup">
        <p>${texto}</p>
        <div class="botoes">
          <button type="button" class="botao principal" id="fazer-backup">${TB.fazerBackup}</button>
        </div>
      </section>`,
    ligar: (tela, aoTerminar) => {
      tela.querySelector("#fazer-backup").onclick = () => {
        entregarArquivo(NOME_BACKUP, "application/json", conteudo)
          .then(async (entregue) => {
            if (!entregue) return; // fechou o menu sem escolher nada
            await salvarMeta("ultimoBackup", agoraLocal());
            aoTerminar(); // o aviso some
          })
          .catch((e) => alert(TB.erro + e.message));
      };
    },
  };
}

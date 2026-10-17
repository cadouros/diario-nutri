// Diário Nutri · Criado por Lift Like a Girl (@liftlikeagirl.xo)
//
// Botão "Gerar PDF", usado nos cartões semanais, no resumo do mês e nos Ajustes.
//
// Funciona em duas etapas, porque o iPhone só abre o menu de compartilhar
// logo depois de um toque (e gerar o PDF demora um pouco):
//   1º toque: gera o PDF  ->  o botão vira "Compartilhar PDF"
//   2º toque: abre o menu de compartilhar (no computador, baixa o arquivo)
//
// Os itens que entram no PDF são escolhidos nos Ajustes e ficam guardados no aparelho
// (em "meta", chave "opcoesPdf"), para os botões do Calendário usarem as mesmas escolhas.

import { gerarPdf, OPCOES_PDF } from "./pdf.js";
import { lerDiasEntre, lerPerfil, lerMeta, salvarMeta } from "./dados.js";
import { entregarArquivo } from "./arquivos.js";
import { PDF as T } from "./textos.js";

// Itens escolhidos (os que nunca foram escolhidos ficam no padrão do CLAUDE.md)
export async function lerOpcoesPdf() {
  const salvas = (await lerMeta("opcoesPdf")) || {};
  return Object.fromEntries(OPCOES_PDF.map((o) => [o.id, salvas[o.id] ?? o.padrao]));
}

export function salvarOpcoesPdf(opcoes) {
  return salvarMeta("opcoesPdf", opcoes);
}

// botao: o botão (o texto fica num <span class="texto-botao-pdf"> dentro dele, se existir)
// periodo(): devolve { tipo: "semana" | "mes", inicio, fim } na hora do toque
// rotulo: texto do botão antes de gerar
// aoGerar(pronto): opcional, chamado quando o PDF fica pronto ({ blob, nome })
// Devolve { reiniciar() }: volta o botão para "Gerar" (ex.: quando muda o período nos Ajustes)
export function ligarBotaoPdf(botao, { periodo, rotulo, aoGerar }) {
  const alvoTexto = botao.querySelector(".texto-botao-pdf") || botao;
  let pronto = null; // { blob, nome } depois de gerar

  function reiniciar() {
    pronto = null;
    alvoTexto.textContent = rotulo;
    botao.classList.remove("pronto");
  }

  botao.onclick = async () => {
    if (pronto) {
      entregarArquivo(pronto.nome, "application/pdf", pronto.blob).catch((e) => alert(T.erroGerar + e.message));
      return;
    }
    botao.disabled = true;
    alvoTexto.textContent = T.gerando;
    try {
      const { tipo, inicio, fim } = periodo();
      const opcoes = await lerOpcoesPdf();
      if (!Object.values(opcoes).some(Boolean)) throw new Error(T.nenhumItem);
      const [registros, perfil] = await Promise.all([lerDiasEntre(inicio, fim), lerPerfil()]);
      pronto = await gerarPdf({
        tipo, inicio, fim, opcoes, perfil,
        porData: Object.fromEntries(registros.map((d) => [d.data, d])),
      });
      alvoTexto.textContent = T.compartilhar;
      botao.classList.add("pronto");
      if (aoGerar) aoGerar(pronto);
    } catch (e) {
      alert(T.erroGerar + e.message);
      reiniciar();
    } finally {
      botao.disabled = false;
    }
  };

  reiniciar();
  return { reiniciar };
}

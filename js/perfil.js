// Diário Nutri · Criado por Lift Like a Girl (@liftlikeagirl.xo)
//
// Tela de perfil ("mini anamnese"), em passos curtos, um assunto por tela.
//
// Dois jeitos de usar:
//   - Criar (primeira abertura): os 6 passos em sequência, com "Continuar" e "Voltar".
//     Só salva no fim, ao tocar em "Começar".
//   - Editar (pelos Ajustes): mostra só UM passo, com "Salvar" e "Cancelar".
// No primeiro passo da criação há também "Já tenho backup", para quem trocou de celular:
// restaura perfil e histórico de um arquivo de backup, sem precisar montar o perfil.
//
// Tudo é feito numa cópia do perfil (o "rascunho"); o perfil guardado só muda ao salvar.

import { PERFIL as T, BACKUP as TB, SUGESTOES_REFEICOES, SUGESTOES_HABITOS } from "./textos.js";
import { ligarImportacao } from "./importacao.js";
import { LIMITES, perfilVazio, novoId, litros } from "./modelo.js";
import { lerPerfil, salvarPerfil, idsComHistorico } from "./dados.js";
import { escapar, hojeISO } from "./formato.js";

const PASSOS = ["privacidade", "nome", "refeicoes", "agua", "habitos", "resumo"];

// Desenhos dos botões subir, descer e remover (setas de texto viram emoji colorido em alguns aparelhos)
const ICONES = {
  subir: `<svg class="icone-botao" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>`,
  descer: `<svg class="icone-botao" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>`,
  remover: `<svg class="icone-botao" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
};

// As duas listas editáveis (refeições e hábitos) funcionam do mesmo jeito
const LISTAS = {
  refeicoes: {
    campo: "refeicoes", prefixo: "r", max: LIMITES.refeicoes, ordenar: true,
    sugestoes: SUGESTOES_REFEICOES, adicionar: T.adicionarRefeicao, limite: T.limiteRefeicoes, rotulo: T.nomeRefeicao,
  },
  habitos: {
    campo: "habitos_extras", prefixo: "h", max: LIMITES.habitos, ordenar: false,
    sugestoes: SUGESTOES_HABITOS, adicionar: T.adicionarHabito, limite: T.limiteHabitos, rotulo: T.nomeHabito,
  },
};

// passo: undefined = criar o perfil do zero; "nome", "refeicoes"... = editar só esse passo
export async function mostrarPerfil(tela, { passo, aoTerminar, aoCancelar }) {
  const editando = passo !== undefined;
  const r = structuredClone((await lerPerfil()) || perfilVazio()); // o rascunho
  // Refeições e hábitos com histórico nunca são apagados, só arquivados
  const comHistorico = await idsComHistorico();
  let atual = editando ? PASSOS.indexOf(passo) : 0;
  let idadeTexto = r.idade === undefined ? "" : String(r.idade);

  // Arrumação das listas: ativos primeiro (na ordem escolhida), depois os arquivados
  for (const cfg of Object.values(LISTAS)) {
    r[cfg.campo].sort((a, b) => (b.ativa - a.ativa) || ((a.ordem ?? 0) - (b.ordem ?? 0)));
  }

  // ---------- Listas (refeições e hábitos) ----------

  const ativos = (cfg) => r[cfg.campo].filter((i) => i.ativa);

  // Coloca um item logo depois do último ativo (ou seja, no fim da lista visível)
  function colocarNoFimDosAtivos(cfg, item) {
    const lista = r[cfg.campo];
    const i = lista.indexOf(item);
    if (i !== -1) lista.splice(i, 1);
    lista.splice(ativos(cfg).length, 0, item);
  }

  function adicionar(cfg, nome) {
    if (ativos(cfg).length >= cfg.max) return null;
    const item = { id: novoId(cfg.prefixo, r[cfg.campo]), nome, ativa: true };
    // Acrescentado depois de o perfil existir: só conta a partir de hoje.
    // (Os itens do perfil inicial não têm "desde": contam como "sempre existiram".)
    if (editando) item.desde = hojeISO();
    colocarNoFimDosAtivos(cfg, item);
    return item;
  }

  function remover(cfg, id) {
    const lista = r[cfg.campo];
    const item = lista.find((i) => i.id === id);
    if (comHistorico.has(id)) {
      item.ativa = false; // tem histórico: só arquiva
      item.ate = hojeISO(); // último dia em que existiu
      lista.splice(lista.indexOf(item), 1);
      lista.push(item);
    } else {
      lista.splice(lista.indexOf(item), 1); // sem histórico: pode apagar de verdade
    }
  }

  function reativar(cfg, id) {
    if (ativos(cfg).length >= cfg.max) return;
    const item = r[cfg.campo].find((i) => i.id === id);
    item.ativa = true;
    delete item.ate;
    colocarNoFimDosAtivos(cfg, item);
  }

  // Troca um item ativo de lugar com o vizinho (direcao: -1 sobe, +1 desce)
  function mover(cfg, id, direcao) {
    const lista = r[cfg.campo];
    const i = lista.findIndex((item) => item.id === id);
    const j = i + direcao;
    if (j < 0 || j >= ativos(cfg).length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }

  function htmlLista(cfg) {
    const lista = ativos(cfg);
    const arquivados = r[cfg.campo].filter((i) => !i.ativa);
    const cheio = lista.length >= cfg.max;
    // Sugestão some se já existe, inclusive arquivada (aí o certo é "Reativar", para manter o histórico)
    const jaTem = new Set(r[cfg.campo].map((i) => i.nome.trim().toLowerCase()));
    const sugestoes = cfg.sugestoes.filter((s) => !jaTem.has(s.toLowerCase()));

    const itens = lista.map((item, i) => `
      <li class="cartao item-perfil">
        <input class="campo-lista" type="text" data-nome="${item.id}" value="${escapar(item.nome)}"
          maxlength="${LIMITES.nome}" autocomplete="off" enterkeyhint="done" aria-label="${escapar(cfg.rotulo(i + 1))}">
        ${cfg.ordenar ? `
          <button type="button" class="botao-icone" data-subir="${item.id}" ${i === 0 ? "disabled" : ""}
            aria-label="${escapar(T.subir(item.nome))}">${ICONES.subir}</button>
          <button type="button" class="botao-icone" data-descer="${item.id}" ${i === lista.length - 1 ? "disabled" : ""}
            aria-label="${escapar(T.descer(item.nome))}">${ICONES.descer}</button>` : ""}
        <button type="button" class="botao-icone" data-remover="${item.id}"
          aria-label="${escapar(T.remover(item.nome))}">${ICONES.remover}</button>
      </li>`).join("");

    const adicionarOuLimite = cheio
      ? `<p class="detalhe">${cfg.limite}</p>`
      : `
        <div class="botoes"><button type="button" class="botao" id="adicionar">${cfg.adicionar}</button></div>
        ${sugestoes.length ? `
          <p class="detalhe">${T.sugestoes}</p>
          <div class="pilulas">
            ${sugestoes.map((s) => `<button type="button" class="pilula" data-sugestao="${escapar(s)}">${escapar(s)}</button>`).join("")}
          </div>` : ""}`;

    const htmlArquivados = arquivados.length === 0 ? "" : `
      <h2 class="secao">${T.arquivadasTitulo}</h2>
      <ul class="lista-perfil">
        ${arquivados.map((item) => `
          <li class="cartao item-perfil arquivado">
            <span class="nome">${escapar(item.nome)}</span>
            <button type="button" class="botao" data-reativar="${item.id}" ${cheio ? "disabled" : ""}>${T.reativar}</button>
          </li>`).join("")}
      </ul>`;

    return `<ul class="lista-perfil">${itens}</ul>${adicionarOuLimite}${htmlArquivados}`;
  }

  function ligarLista(cfg) {
    const focar = (id) => tela.querySelector(`[data-nome="${id}"]`)?.focus();
    tela.querySelectorAll("[data-nome]").forEach((campo) => {
      const item = r[cfg.campo].find((i) => i.id === campo.dataset.nome);
      campo.oninput = () => { item.nome = campo.value; };
    });
    tela.querySelectorAll("[data-subir]").forEach((b) => {
      b.onclick = () => { mover(cfg, b.dataset.subir, -1); desenhar(); };
    });
    tela.querySelectorAll("[data-descer]").forEach((b) => {
      b.onclick = () => { mover(cfg, b.dataset.descer, 1); desenhar(); };
    });
    tela.querySelectorAll("[data-remover]").forEach((b) => {
      b.onclick = () => { remover(cfg, b.dataset.remover); desenhar(); };
    });
    tela.querySelectorAll("[data-reativar]").forEach((b) => {
      b.onclick = () => { reativar(cfg, b.dataset.reativar); desenhar(); };
    });
    tela.querySelectorAll("[data-sugestao]").forEach((b) => {
      b.onclick = () => { adicionar(cfg, b.dataset.sugestao); desenhar(); };
    });
    const botaoAdicionar = tela.querySelector("#adicionar");
    if (botaoAdicionar) {
      botaoAdicionar.onclick = () => {
        const item = adicionar(cfg, "");
        desenhar();
        if (item) focar(item.id); // já abre o teclado no item novo
      };
    }
  }

  // ---------- Conteúdo de cada passo ----------

  function htmlPasso(nome) {
    if (nome === "privacidade") {
      return `<h1>${T.privacidadeTitulo}</h1>
        <div class="cartao bloco-texto">${T.privacidadeTexto.map((p) => `<p>${p}</p>`).join("")}</div>`;
    }
    if (nome === "nome") {
      return `<h1>${T.nomeTitulo}</h1>
        <label class="rotulo" for="perfil-nome">${T.nome}</label>
        <input class="campo-perfil" id="perfil-nome" type="text" value="${escapar(r.nome)}"
          maxlength="${LIMITES.nome}" autocomplete="given-name" enterkeyhint="next">
        <label class="rotulo" for="perfil-idade">${T.idade}</label>
        <div class="linha-idade">
          <input class="campo-perfil curto" id="perfil-idade" type="text" inputmode="numeric" maxlength="3"
            value="${escapar(idadeTexto)}" autocomplete="off" enterkeyhint="done">
          <span>${T.idadeUnidade}</span>
        </div>`;
    }
    if (nome === "refeicoes") {
      return `<h1>${T.refeicoesTitulo}</h1><p>${T.refeicoesTexto}</p>${htmlLista(LISTAS.refeicoes)}`;
    }
    if (nome === "agua") {
      const n = r.meta_agua_copos;
      return `<h1>${T.aguaTitulo}</h1><p>${T.aguaTexto}</p>
        <div class="cartao agua-meta">
          <button type="button" class="redondo" id="agua-menos" aria-label="${T.menos}" ${n <= LIMITES.aguaMin ? "disabled" : ""}>−</button>
          <span class="numero-grande" aria-live="polite">${T.aguaCopos(n)}</span>
          <button type="button" class="redondo" id="agua-mais" aria-label="${T.mais}" ${n >= LIMITES.aguaMax ? "disabled" : ""}>+</button>
        </div>
        <p class="equivalencia">${T.aguaEquivale(n, litros(n))}</p>`;
    }
    if (nome === "habitos") {
      return `<h1>${T.habitosTitulo}</h1><p>${T.habitosTexto}</p>${htmlLista(LISTAS.habitos)}`;
    }
    // resumo
    const refeicoes = ativos(LISTAS.refeicoes).map((i) => escapar(i.nome));
    const habitos = ativos(LISTAS.habitos).map((i) => escapar(i.nome));
    return `<h1>${T.resumoTitulo}</h1>
      <dl class="cartao resumo-perfil">
        <dt>${T.resumoNome}</dt><dd>${escapar(r.nome)}</dd>
        <dt>${T.resumoIdade}</dt><dd>${r.idade === undefined ? T.naoInformada : `${r.idade} ${T.idadeUnidade}`}</dd>
        <dt>${T.resumoRefeicoes}</dt><dd><ol>${refeicoes.map((n) => `<li>${n}</li>`).join("")}</ol></dd>
        <dt>${T.resumoAgua}</dt><dd>${T.aguaEquivale(r.meta_agua_copos, litros(r.meta_agua_copos))}</dd>
        <dt>${T.resumoHabitos}</dt><dd>${habitos.length ? habitos.join(", ") : T.nenhum}</dd>
      </dl>
      <p class="detalhe">${T.resumoTexto}</p>`;
  }

  function ligarPasso(nome) {
    if (nome === "nome") {
      const campoNome = tela.querySelector("#perfil-nome");
      const campoIdade = tela.querySelector("#perfil-idade");
      campoNome.oninput = () => { r.nome = campoNome.value; };
      campoIdade.oninput = () => { idadeTexto = campoIdade.value; };
    } else if (nome === "refeicoes") {
      ligarLista(LISTAS.refeicoes);
    } else if (nome === "habitos") {
      ligarLista(LISTAS.habitos);
    } else if (nome === "agua") {
      tela.querySelector("#agua-menos").onclick = () => {
        r.meta_agua_copos = Math.max(LIMITES.aguaMin, r.meta_agua_copos - 1);
        desenhar();
      };
      tela.querySelector("#agua-mais").onclick = () => {
        r.meta_agua_copos = Math.min(LIMITES.aguaMax, r.meta_agua_copos + 1);
        desenhar();
      };
    }
  }

  // Confere o passo antes de seguir. Devolve a mensagem de erro, ou "" se está tudo certo.
  function conferir(nome) {
    if (nome === "nome") {
      if (!r.nome.trim()) return T.erroNome;
      const texto = idadeTexto.trim();
      if (texto === "") {
        delete r.idade;
      } else {
        const idade = Number(texto);
        if (!/^\d+$/.test(texto) || idade < LIMITES.idadeMin || idade > LIMITES.idadeMax) return T.erroIdade;
        r.idade = idade;
      }
    }
    if (nome === "refeicoes") {
      const lista = ativos(LISTAS.refeicoes);
      if (lista.length === 0) return T.erroRefeicoes;
      if (lista.some((i) => !i.nome.trim())) return T.erroNomeVazio;
    }
    if (nome === "habitos") {
      if (ativos(LISTAS.habitos).some((i) => !i.nome.trim())) return T.erroNomeVazio;
    }
    return "";
  }

  // Deixa o rascunho pronto para guardar: tira espaços e numera a ordem das refeições
  function perfilFinal() {
    const final = structuredClone(r);
    final.nome = final.nome.trim();
    for (const cfg of Object.values(LISTAS)) {
      for (const item of final[cfg.campo]) item.nome = item.nome.trim();
    }
    final.refeicoes.forEach((item, i) => { item.ordem = i + 1; });
    for (const h of final.habitos_extras) delete h.ordem; // hábitos não têm ordem
    return final;
  }

  async function salvar() {
    try {
      await salvarPerfil(perfilFinal());
      aoTerminar();
    } catch (e) {
      alert("Não consegui salvar: " + e.message);
    }
  }

  // ---------- Desenho da tela ----------

  // "erro" só aparece logo depois de tocar em Continuar/Salvar; qualquer outra mudança o apaga
  function desenhar(erro = "") {
    const nome = PASSOS[atual];
    const ultimo = atual === PASSOS.length - 1;
    const textoAvancar = editando ? T.salvar : ultimo ? T.comecar : T.continuar;
    const temVoltar = editando || atual > 0;

    tela.innerHTML = `
      <div class="perfil">
        ${editando ? "" : `<p class="detalhe passo-de">${T.passoDeTotal(atual + 1, PASSOS.length)}</p>`}
        ${htmlPasso(nome)}
        <p class="erro" role="alert">${erro}</p>
        <div class="navegacao-perfil">
          <button type="button" class="botao-continuar" id="avancar">${textoAvancar}</button>
          ${temVoltar ? `<button type="button" class="botao-texto" id="recuar">${editando ? T.cancelar : T.voltar}</button>` : ""}
        </div>
        ${!editando && nome === "privacidade" ? `
          <div class="ja-tenho">
            <p class="detalhe">${TB.jaTenhoExplica}</p>
            <button type="button" class="botao-texto" id="ja-tenho-backup">${TB.jaTenho}</button>
            <div id="area-importacao"></div>
          </div>` : ""}
      </div>`;

    ligarPasso(nome);
    if (!editando && nome === "privacidade") {
      ligarImportacao({
        botao: tela.querySelector("#ja-tenho-backup"),
        area: tela.querySelector("#area-importacao"),
        aoImportar: () => aoTerminar(), // dados restaurados: vai direto para o Calendário
      });
    }

    tela.querySelector("#avancar").onclick = () => {
      const erro = conferir(nome);
      if (erro) { desenhar(erro); return; }
      if (editando || ultimo) { salvar(); return; }
      atual++;
      desenhar();
      window.scrollTo(0, 0);
    };
    const recuar = tela.querySelector("#recuar");
    if (recuar) {
      recuar.onclick = () => {
        if (editando) { aoCancelar(); return; }
        atual--;
        desenhar();
        window.scrollTo(0, 0);
      };
    }
  }

  desenhar();
}

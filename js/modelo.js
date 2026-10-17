// Modelo de dados: o perfil, os campos de cada dia, seus valores possíveis e o ciclo de toques.
//
// PERFIL (um por aparelho, guardado em "meta" com a chave "perfil"). Exemplo:
//   { nome: "Ana", idade: 34,
//     refeicoes: [ { id: "r1", nome: "Café da manhã", ordem: 1, ativa: true },
//                  { id: "r6", nome: "Ceia", ordem: 6, ativa: false, desde: "2026-08-17", ate: "2026-09-15" } ],
//     meta_agua_copos: 4,
//     habitos_extras: [ { id: "h1", nome: "Treino", ativa: true, desde: "2026-10-01" } ] }
// "desde" e "ate" dizem em que dias a refeição/hábito existia (ver existiaNoDia).
//
// O "id" de cada refeição e hábito é interno e NUNCA muda: os dias guardam o id, não o nome.
// Por isso renomear mantém o histórico. "Remover" algo que já tem histórico só marca
// ativa: false (arquivada); sem histórico, pode apagar de verdade.
//
// DIA (um registro por dia, identificado pela data "AAAA-MM-DD"). Exemplo:
//   { data: "2026-10-16",
//     refeicoes: { r1: "seguiu", r3: "livre" },
//     refeicoes_texto: { r3: "pizza" },          -> "o que comi" quando a refeição é "livre"
//     habitos: { h1: "sim" },
//     agua_copos: 3,                             -> copos de 500 ml (1 a 12)
//     fome: "sim", fome_texto: "16h, muita fome",
//     peso: 62.4, sono_horas: 7.5, sono_qualidade: "boa", banheiro: 2, nota: "..." }
//
// Campo AUSENTE = "não marcado" (nunca "não"). Um dia esquecido não vira falha.
// O texto de uma refeição fica guardado mesmo se ela deixar de ser "livre" (para não perder
// o que foi digitado num toque sem querer), mas só é considerado quando é "livre".

import { ESTADOS, EMOJI_REFEICOES, EMOJI_REFEICAO_PADRAO } from "./textos.js";

// Versão do formato dos dados. Se o formato mudar, aumente e escreva uma migração em dados.js.
export const SCHEMA_VERSION = 1;

export const LIMITES = {
  refeicoes: 6,      // refeições ativas (mínimo 1)
  habitos: 3,        // hábitos extras ativos (mínimo 0)
  aguaMin: 1,        // meta de água, em copos
  aguaMax: 12,       // também o máximo de copos marcados num dia
  idadeMin: 1,
  idadeMax: 120,
  nome: 40,          // letras no nome de refeição, hábito ou pessoa
};

export const AGUA_PADRAO = 4;  // meta sugerida ao criar o perfil (4 copos = 2 L)
export const ML_POR_COPO = 500;
export const BANHEIRO_MAX = 5;

// Ciclos de toque. Cada toque avança um passo; depois do último volta para vazio.
//   valor   = o que fica guardado
//   palavra = o que aparece escrito no cartão (vem de textos.js)
//   cor     = nome da cor (definida em style.css)
export const CICLOS = {
  refeicao: [
    { valor: "seguiu", palavra: ESTADOS.seguiu, cor: "verde" },
    { valor: "livre", palavra: ESTADOS.livre, cor: "vermelho" },
  ],
  // Hábitos extras: sem julgamento de valor nas cores (lilás e bege, nunca as cores de seguiu/livre)
  habito: [
    { valor: "sim", palavra: ESTADOS.sim, cor: "lilas" },
    { valor: "nao", palavra: ESTADOS.nao, cor: "bege" },
  ],
  fome: [
    { valor: "sim", palavra: ESTADOS.fome_sim, cor: "laranja" },
  ],
  sonoQualidade: [
    { valor: "boa", palavra: ESTADOS.sono_boa, cor: "verde" },
    { valor: "ok", palavra: ESTADOS.sono_ok, cor: "amarelo" },
    { valor: "ruim", palavra: ESTADOS.sono_ruim, cor: "vermelho" },
  ],
};

const VAZIO = { valor: undefined, palavra: ESTADOS.vazio, cor: "vazio" };

// Próximo valor do ciclo (undefined = vazio)
export function proximoValor(ciclo, atual) {
  const passos = CICLOS[ciclo];
  const i = passos.findIndex((p) => p.valor === atual);
  if (i === -1) return passos[0].valor;     // vazio -> primeiro
  if (i === passos.length - 1) return undefined; // último -> vazio
  return passos[i + 1].valor;
}

// Palavra e cor de um valor
export function infoValor(ciclo, valor) {
  return CICLOS[ciclo].find((p) => p.valor === valor) || VAZIO;
}

// ---------- Perfil ----------

export function perfilVazio() {
  return { nome: "", refeicoes: [], meta_agua_copos: AGUA_PADRAO, habitos_extras: [] };
}

// Refeições que aparecem nas telas de registro, na ordem escolhida
export function refeicoesAtivas(perfil) {
  return perfil.refeicoes.filter((r) => r.ativa).sort((a, b) => a.ordem - b.ordem);
}

// Todas as refeições, inclusive as arquivadas (para relatórios, CSV e PDF)
export function todasAsRefeicoes(perfil) {
  return [...perfil.refeicoes].sort((a, b) => a.ordem - b.ordem);
}

// Datas de cada refeição e hábito (opcionais, texto "AAAA-MM-DD"):
//   desde -> dia em que foi acrescentado depois de o perfil existir
//            (os do perfil inicial não têm: contam como "sempre existiram")
//   ate   -> dia em que foi arquivado (ainda conta nesse dia)
// Ao reativar, "ate" é apagado. Limitação: o período em que ficou arquivado volta a contar.
export function existiaNoDia(item, data) {
  return (!item.desde || data >= item.desde) && (!item.ate || data <= item.ate);
}

// Refeições de um dia, na ordem do perfil: as que existiam naquele dia,
// e qualquer outra que tenha sido marcada nele (um dado marcado nunca some da tela).
export function refeicoesDoDia(perfil, dia) {
  return todasAsRefeicoes(perfil).filter((r) => existiaNoDia(r, dia.data) || dia.refeicoes?.[r.id] !== undefined);
}

export function habitosDoDia(perfil, dia) {
  return perfil.habitos_extras.filter((h) => existiaNoDia(h, dia.data) || dia.habitos?.[h.id] !== undefined);
}

// Emoji do cartão de refeição: automático para os nomes das sugestões; 🍴 para nome digitado
export function emojiDaRefeicao(nome) {
  return EMOJI_REFEICOES[nome.trim().toLowerCase()] || EMOJI_REFEICAO_PADRAO;
}

export function habitosAtivos(perfil) {
  return perfil.habitos_extras.filter((h) => h.ativa);
}

// Id novo que nunca foi usado na lista: "r1", "r2"... ou "h1", "h2"...
export function novoId(prefixo, lista) {
  const usados = lista.map((item) => Number(item.id.slice(prefixo.length)) || 0);
  return prefixo + (Math.max(0, ...usados) + 1);
}

// 4 copos -> "2"; 3 copos -> "1,5" (litros, sem o "L")
export function litros(copos) {
  return ((copos * ML_POR_COPO) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

// ---------- Dia ----------

// Lê um campo do dia por "caminho": "peso" ou "refeicoes.r1"
export function lerCampo(dia, caminho) {
  const [grupo, id] = caminho.split(".");
  return id === undefined ? dia[grupo] : dia[grupo]?.[id];
}

// Grava um campo do dia por "caminho". Valor vazio apaga o campo.
export function gravarCampo(dia, caminho, valor) {
  const [grupo, id] = caminho.split(".");
  const vazio = valor === undefined || valor === null || valor === "";
  if (id === undefined) {
    if (vazio) delete dia[grupo];
    else dia[grupo] = valor;
    return;
  }
  if (vazio) {
    if (dia[grupo]) delete dia[grupo][id];
  } else {
    (dia[grupo] ||= {})[id] = valor;
  }
}

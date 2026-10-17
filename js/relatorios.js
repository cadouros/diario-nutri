// Cálculos dos relatórios (semanal, mensal e aba Peso). Aqui só tem conta, nada de desenho.
//
// Regras:
// - Campo vazio é "não marcado", nunca "não".
// - Todo número vem junto com quantos registros o sustentam (n).
// - Dias futuros não entram nas contas (não podem ser preenchidos).
// - Nas refeições, hoje só entra se tiver alguma refeição marcada
//   (senão o dia que ainda está acontecendo apareceria como "não marcado").
//
// "porData" é um objeto { "AAAA-MM-DD": registroDoDia } e "datas" é a lista de dias a considerar.

import { refeicoesDoDia, todasAsRefeicoes } from "./modelo.js";
import { somarDias, hojeISO, inicioDaSemana } from "./formato.js";

// Todas as datas de "inicio" a "fim", sem passar de hoje
export function datasAteHoje(inicio, fim) {
  const hoje = hojeISO();
  const datas = [];
  for (let d = inicio; d <= fim && d <= hoje; d = somarDias(d, 1)) datas.push(d);
  return datas;
}

// Seguiu / livre / sem marcar, e "marcadas" (seguiu + livre), que é a base da porcentagem.
// Cada dia conta as refeições que existiam nele (ver refeicoesDoDia em modelo.js).
export function resumirRefeicoes(porData, datas, perfil) {
  const r = { seguiu: 0, livre: 0, semMarcar: 0, marcadas: 0 };
  const hoje = hojeISO();
  for (const data of datas) {
    const dia = porData[data] || { data };
    if (data > hoje) continue;
    if (data === hoje && Object.keys(dia.refeicoes || {}).length === 0) continue;
    for (const ref of refeicoesDoDia(perfil, dia)) {
      const v = dia.refeicoes?.[ref.id];
      if (v === "seguiu") r.seguiu++;
      else if (v === "livre") r.livre++;
      else r.semMarcar++;
    }
  }
  r.marcadas = r.seguiu + r.livre;
  return r;
}

// Algum dia da lista tem alguma coisa registrada?
export function temRegistros(porData, datas) {
  return datas.some((d) => porData[d] !== undefined);
}

// Dias com fome, com o texto (horário e observação), se escreveu
export function listarFome(porData, datas) {
  return datas
    .filter((d) => porData[d]?.fome === "sim")
    .map((d) => ({ data: d, texto: porData[d].fome_texto || "" }));
}

// Média de um campo numérico (peso, horas de sono) e quantos valores entraram
export function mediaDoCampo(porData, datas, campo) {
  const valores = datas.map((d) => porData[d]?.[campo]).filter((v) => v !== undefined);
  if (valores.length === 0) return { media: null, n: 0 };
  return { media: valores.reduce((s, v) => s + v, 0) / valores.length, n: valores.length };
}

// Quantos dias têm "valor" num campo, e quantos dias foram marcados (qualquer valor)
export function contarDias(porData, datas, campo, valor) {
  let comValor = 0, marcados = 0;
  for (const data of datas) {
    const v = porData[data]?.[campo];
    if (v !== undefined) marcados++;
    if (v === valor) comValor++;
  }
  return { comValor, marcados };
}

// Dias em que atingiu a meta de água, e quantos dias tiveram água marcada
export function contarMetaAgua(porData, datas, perfil) {
  let atingiu = 0, marcados = 0;
  for (const data of datas) {
    const copos = porData[data]?.agua_copos;
    if (copos === undefined) continue;
    marcados++;
    if (copos >= perfil.meta_agua_copos) atingiu++;
  }
  return { atingiu, marcados };
}

// Refeições livres, com o que comeu (se escreveu). Inclui as refeições arquivadas.
export function listarLivres(porData, datas, perfil) {
  const lista = [];
  for (const data of datas) {
    const dia = porData[data] || {};
    for (const ref of todasAsRefeicoes(perfil)) {
      if (dia.refeicoes?.[ref.id] === "livre") {
        lista.push({ data, refeicao: ref.nome, texto: dia.refeicoes_texto?.[ref.id] || "" });
      }
    }
  }
  return lista;
}

// Aba Peso: média de cada semana que tem pelo menos uma pesagem, em ordem
export function semanasComPeso(todosOsDias) {
  const grupos = {};
  for (const dia of todosOsDias) {
    if (dia.peso === undefined) continue;
    const segunda = inicioDaSemana(dia.data);
    (grupos[segunda] ||= []).push(dia.peso);
  }
  return Object.keys(grupos).sort().map((segunda) => {
    const pesos = grupos[segunda];
    return { segunda, media: pesos.reduce((s, v) => s + v, 0) / pesos.length, n: pesos.length };
  });
}

// CSV: uma linha por dia, uma coluna por campo. Serve para análise no Excel ou em outro programa de planilhas.
// NÃO é importável e não substitui o backup.
//
// Formato do Excel brasileiro: separador ";" e decimal com vírgula ("62,4").
// Começa com um caractere invisível (BOM) para o Excel reconhecer os acentos.
//
// As colunas de refeições e hábitos vêm do perfil (inclusive os arquivados), com o nome de cada um.
// Valores como estão guardados ("seguiu", "livre", "sim", "nao"...). Célula vazia = não marcado.
// Entram todos os dias, do primeiro registro até hoje, inclusive os dias sem nada marcado.

import { todasAsRefeicoes } from "./modelo.js";
import { hojeISO, somarDias } from "./formato.js";
import { PREFIXO_ARQUIVOS } from "./textos.js";

export const NOME_CSV = `${PREFIXO_ARQUIVOS}-dados.csv`;

// Cada coluna: título e como tirar o valor do dia
function montarColunas(perfil) {
  const simples = (campo) => ({ titulo: campo, valor: (dia) => dia[campo] });
  return [
    simples("data"),
    ...todasAsRefeicoes(perfil).flatMap((r) => [
      { titulo: r.nome, valor: (dia) => dia.refeicoes?.[r.id] },
      // O texto só vale quando a refeição é "livre" (ver modelo.js)
      { titulo: `${r.nome} - o que comi`, valor: (dia) => (dia.refeicoes?.[r.id] === "livre" ? dia.refeicoes_texto?.[r.id] : undefined) },
    ]),
    simples("peso"), simples("sono_horas"), simples("sono_qualidade"),
    simples("agua_copos"),
    simples("fome"),
    { titulo: "fome_texto", valor: (dia) => (dia.fome === "sim" ? dia.fome_texto : undefined) },
    simples("banheiro"),
    ...perfil.habitos_extras.map((h) => ({ titulo: h.nome, valor: (dia) => dia.habitos?.[h.id] })),
    simples("nota"),
  ];
}

// Protege a célula: se tiver ; aspas ou quebra de linha, vai entre aspas
function celula(valor) {
  if (valor === undefined) return "";
  let texto = typeof valor === "number" ? String(valor).replace(".", ",") : String(valor);
  if (/[;"\r\n]/.test(texto)) texto = `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

export function montarCSV(dias, perfil) {
  const colunas = montarColunas(perfil);
  const linhas = [colunas.map((c) => celula(c.titulo)).join(";")];
  if (dias.length > 0) {
    const porData = Object.fromEntries(dias.map((d) => [d.data, d]));
    const primeiro = dias.map((d) => d.data).sort()[0];
    const hoje = hojeISO();
    for (let data = primeiro; data <= hoje; data = somarDias(data, 1)) {
      const dia = porData[data] || { data };
      linhas.push(colunas.map((c) => celula(c.valor(dia))).join(";"));
    }
  }
  return "﻿" + linhas.join("\r\n") + "\r\n";
}

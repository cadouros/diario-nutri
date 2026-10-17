// Backup: o arquivo JSON com TODOS os dados (perfil e dias), para guardar fora do celular.
//
// Formato do arquivo:
//   { "app": "diario-nutri", "schemaVersion": 1, "exportadoEm": "2026-09-29T14:03",
//     "perfil": { "nome": "...", "refeicoes": [...], ... },
//     "dias": [ { "data": "2026-09-28", "refeicoes": { "r1": "seguiu" }, ... }, ... ] }
//
// Sempre com o mesmo nome, para o iPhone perguntar se quer substituir o anterior.

import { SCHEMA_VERSION, CICLOS, BANHEIRO_MAX, LIMITES } from "./modelo.js";
import { migrarDias } from "./dados.js";
import { agoraLocal } from "./formato.js";
import { NOME_APP, PREFIXO_ARQUIVOS } from "./textos.js";

// Marca que identifica os backups deste app. A importação recusa qualquer outro valor.
const ID_APP = "diario-nutri";

export const NOME_BACKUP = `${PREFIXO_ARQUIVOS}-backup.json`;

export function montarBackup(dias, perfil) {
  return JSON.stringify({
    app: ID_APP,
    schemaVersion: SCHEMA_VERSION,
    exportadoEm: agoraLocal(),
    perfil,
    dias: [...dias].sort((a, b) => (a.data < b.data ? -1 : 1)),
  }, null, 1);
}

// ---------- Conferência do perfil ----------

function conferirPerfil(p) {
  const problema = (msg) => { throw new Error(`Perfil: ${msg}`); };
  const texto = (v) => typeof v === "string" && v.trim() !== "";
  const dataOpcional = (v) => v === undefined || (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v));
  const datasCertas = (i) => dataOpcional(i.desde) && dataOpcional(i.ate);
  if (typeof p !== "object" || p === null) problema("não encontrado no arquivo.");
  if (!texto(p.nome)) problema("sem nome.");
  if (p.idade !== undefined && !(Number.isInteger(p.idade) && p.idade >= LIMITES.idadeMin && p.idade <= LIMITES.idadeMax)) {
    problema("idade inválida.");
  }
  if (!Number.isInteger(p.meta_agua_copos) || p.meta_agua_copos < LIMITES.aguaMin || p.meta_agua_copos > LIMITES.aguaMax) {
    problema("meta de água inválida.");
  }
  if (!Array.isArray(p.refeicoes) || !Array.isArray(p.habitos_extras)) problema("listas inválidas.");
  const ids = new Set();
  for (const r of p.refeicoes) {
    if (!r || !texto(r.id) || !texto(r.nome) || typeof r.ativa !== "boolean" || !Number.isFinite(r.ordem) || !datasCertas(r)) problema("refeição inválida.");
    if (ids.has(r.id)) problema("refeições repetidas.");
    ids.add(r.id);
  }
  for (const h of p.habitos_extras) {
    if (!h || !texto(h.id) || !texto(h.nome) || typeof h.ativa !== "boolean" || !datasCertas(h)) problema("hábito inválido.");
    if (ids.has(h.id)) problema("hábitos repetidos.");
    ids.add(h.id);
  }
  const ativas = p.refeicoes.filter((r) => r.ativa).length;
  if (ativas < 1 || ativas > LIMITES.refeicoes) problema("precisa ter de 1 a 6 refeições.");
  if (p.habitos_extras.filter((h) => h.ativa).length > LIMITES.habitos) problema("mais de 3 hábitos extras.");
}

// ---------- Conferência dos dias ----------

const valoresDoCiclo = (ciclo) => CICLOS[ciclo].map((p) => p.valor);

// Regras dos campos simples
const REGRAS = {
  peso: "numero",
  sono_horas: "numero",
  sono_qualidade: valoresDoCiclo("sonoQualidade"),
  agua_copos: "agua",
  fome: valoresDoCiclo("fome"),
  fome_texto: "texto",
  banheiro: "banheiro",
  nota: "texto",
};

function valorCerto(regra, valor) {
  if (regra === "texto") return typeof valor === "string";
  if (regra === "numero") return typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
  if (regra === "banheiro") return Number.isInteger(valor) && valor >= 0 && valor <= BANHEIRO_MAX;
  if (regra === "agua") return Number.isInteger(valor) && valor >= 1 && valor <= LIMITES.aguaMax;
  return regra.includes(valor);
}

function conferirDia(dia, posicao, perfil) {
  const problema = (msg) => { throw new Error(`Dia nº ${posicao + 1}: ${msg}`); };
  if (typeof dia !== "object" || dia === null) problema("não é um registro válido.");
  if (typeof dia.data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dia.data)) problema("data inválida.");

  // Grupos ligados ao perfil: cada id precisa existir lá
  const idsRefeicoes = new Set(perfil.refeicoes.map((r) => r.id));
  const idsHabitos = new Set(perfil.habitos_extras.map((h) => h.id));
  const GRUPOS = {
    refeicoes: [idsRefeicoes, valoresDoCiclo("refeicao")],
    refeicoes_texto: [idsRefeicoes, "texto"],
    habitos: [idsHabitos, valoresDoCiclo("habito")],
  };

  for (const [campo, valor] of Object.entries(dia)) {
    if (campo === "data") continue;
    if (GRUPOS[campo]) {
      const [ids, regra] = GRUPOS[campo];
      if (typeof valor !== "object" || valor === null) problema(`"${campo}" inválido (${dia.data}).`);
      for (const [id, v] of Object.entries(valor)) {
        if (!ids.has(id)) problema(`"${campo}" com um item que não está no perfil (${dia.data}).`);
        if (!valorCerto(regra, v)) problema(`valor inválido em "${campo}" (${dia.data}).`);
      }
      continue;
    }
    const regra = REGRAS[campo];
    if (regra === undefined) problema(`campo desconhecido "${campo}".`);
    if (!valorCerto(regra, valor)) problema(`valor inválido em "${campo}" (${dia.data}).`);
  }
}

// Lê e confere o texto de um arquivo de backup.
// Devolve { perfil, dias, exportadoEm } ou lança um erro com a explicação em português.
export function lerBackup(texto) {
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error(`O arquivo não é um backup do ${NOME_APP} (não consegui ler).`);
  }
  if (!dados || typeof dados !== "object") {
    throw new Error(`O arquivo não é um backup do ${NOME_APP}.`);
  }
  if (dados.app !== ID_APP) {
    // Inclui backups de outros apps parecidos: nunca mistura dados de apps diferentes
    throw new Error(`Este arquivo é de outro app, não do ${NOME_APP}. Por segurança, ele não pode ser importado aqui.`);
  }
  if (!Array.isArray(dados.dias)) {
    throw new Error(`O arquivo não é um backup do ${NOME_APP}.`);
  }
  if (!Number.isInteger(dados.schemaVersion) || dados.schemaVersion < 1) {
    throw new Error("O backup não informa a versão do formato.");
  }
  if (dados.schemaVersion > SCHEMA_VERSION) {
    throw new Error("Este backup veio de uma versão mais nova do app. Atualize o app e tente de novo.");
  }
  conferirPerfil(dados.perfil);
  const dias = migrarDias(dados.dias, dados.schemaVersion);
  dias.forEach((dia, i) => conferirDia(dia, i, dados.perfil));
  const datas = dias.map((d) => d.data);
  if (new Set(datas).size !== datas.length) throw new Error("O backup tem dias repetidos.");
  return { perfil: dados.perfil, dias, exportadoEm: typeof dados.exportadoEm === "string" ? dados.exportadoEm : null };
}

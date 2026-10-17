// Diário Nutri · Criado por Lift Like a Girl (@liftlikeagirl.xo)
//
// Textos da interface num lugar só. Trocar uma palavra = mudar uma linha aqui.
// (Os textos das telas antigas vêm para cá aos poucos, conforme cada tela é refeita nas próximas fases.)

export const NOME_APP = "Diário Nutri";

// Começo dos nomes dos arquivos exportados (backup, planilha, PDF)
export const PREFIXO_ARQUIVOS = "diario-nutri";

// Crédito da autora: aparece na tela de boas-vindas e em Ajustes > Sobre
export const CREDITO_TEXTO = "Criado por Lift Like a Girl";
export const CREDITO_LINK = "https://instagram.com/liftlikeagirl.xo";
export const CREDITO_LINK_TEXTO = "@liftlikeagirl.xo";
export const CREDITO_EMAIL = ""; // vazio até decidir se entra um e-mail profissional

// Nomes dos estados: o que aparece escrito nos cartões, nas legendas e no PDF.
// O que fica guardado nos dados NÃO muda ("seguiu", "livre"...); só a palavra mostrada.
export const ESTADOS = {
  seguiu: "seguiu",
  livre: "livre",
  sim: "sim",
  nao: "não",
  fome_sim: "sim",
  sono_boa: "boa",
  sono_ok: "ok",
  sono_ruim: "ruim",
  vazio: "—",
  sem_marcar: "sem marcar",
};

// Sugestões tocáveis na montagem do perfil
export const SUGESTOES_REFEICOES = ["Café da manhã", "Lanche da manhã", "Almoço", "Lanche da tarde", "Jantar", "Ceia"];
// Emoji de cada sugestão de refeição (nome em minúsculas). Outros nomes usam o padrão.
export const EMOJI_REFEICOES = {
  "café da manhã": "☕",
  "lanche da manhã": "🍎",
  "lanche da tarde": "🍎",
  "almoço": "🍽️",
  "jantar": "🍽️",
  "ceia": "🌙",
};
export const EMOJI_REFEICAO_PADRAO = "🍴";

export const SUGESTOES_HABITOS = ["Treino", "Dor muscular", "Dor articular", "Leitura"];

// ---------- Tela de boas-vindas e instalação ----------

export const BOAS_VINDAS = {
  titulo: "Bem-vindo ao Diário Nutri",
  frase: "Aqui você registra a sua alimentação e os seus hábitos do dia a dia e gera um PDF para enviar à sua nutricionista.",
  privacidade: "Seus dados ficam só no seu celular. Nada é enviado para a internet.",
  passo1: "Passo 1: instale o app",
  seletorIphone: "iPhone",
  seletorAndroid: "Android",
  // Cada item vira uma linha numerada. {compartilhar} vira o desenho do botão Compartilhar.
  iphone: [
    "Abra este endereço no <strong>Safari</strong>.",
    "Toque em <strong>Compartilhar</strong> {compartilhar} (o quadrado com a seta para cima).",
    "Role a lista até o fim e toque em <strong>Adicionar à Tela de Início</strong>.",
    "Toque em <strong>Adicionar</strong>.",
  ],
  android: [
    "Abra este endereço no <strong>Chrome</strong>.",
    "Toque nos três pontinhos <strong>⋮</strong> no canto de cima.",
    "Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong> (o nome muda conforme o aparelho).",
    "Toque em <strong>Instalar</strong>.",
  ],
  botaoInstalar: "Instalar",
  instalado: "Pronto, o app foi instalado. Agora siga o passo 2.",
  // Aviso quando o link foi aberto dentro do WhatsApp, Instagram etc.
  avisoDentroDeApp: "Parece que você abriu este link dentro de outro app (WhatsApp, Instagram...). Ali a instalação não funciona: toque nos três pontinhos e escolha <strong>Abrir no navegador</strong>.",
  avisoIphoneOutroNavegador: "No iPhone, abra este endereço no <strong>Safari</strong> para instalar.",
  // Mostrado sempre, em letra menor, para o caso de a detecção falhar
  dicaDentroDeApp: "Abriu pelo WhatsApp ou Instagram? Toque nos três pontinhos e escolha <em>Abrir no navegador</em> antes de instalar.",
  passo2: "Passo 2: abra pelo ícone novo",
  passo2Texto: "Depois de instalar, feche esta página e abra o <strong>Diário Nutri</strong> pelo ícone que apareceu na tela inicial do celular. Use sempre o ícone, não o navegador: é lá que os seus dados ficam guardados.",
};

// ---------- Perfil (mini anamnese) ----------

export const PERFIL = {
  passoDeTotal: (n, total) => `Passo ${n} de ${total}`,
  continuar: "Continuar",
  voltar: "Voltar",
  comecar: "Começar",
  salvar: "Salvar",
  cancelar: "Cancelar",

  privacidadeTitulo: "Antes de começar",
  privacidadeTexto: [
    "Seus dados ficam só neste celular.",
    "Quando você gera o PDF e envia à sua nutricionista, quem recebe passa a ter acesso a ele.",
    "Se apagar o app, perde o histórico: faça backup.",
  ],

  nomeTitulo: "Sobre você",
  nome: "Nome",
  idade: "Idade (opcional)",
  idadeUnidade: "anos",
  erroNome: "Escreva o seu nome para continuar.",
  erroIdade: "A idade precisa ser um número inteiro, de 1 a 120. Ou deixe em branco.",

  refeicoesTitulo: "Suas refeições",
  refeicoesTexto: "Monte a lista das refeições que você costuma fazer, na ordem do dia. De 1 a 6.",
  nomeRefeicao: (n) => `Nome da refeição ${n}`,
  adicionarRefeicao: "+ Adicionar refeição",
  sugestoes: "Toque para adicionar:",
  limiteRefeicoes: "Você chegou ao máximo de 6 refeições.",
  erroRefeicoes: "Coloque pelo menos uma refeição.",
  erroNomeVazio: "Dê um nome a cada item ou remova os que estão em branco.",

  aguaTitulo: "Meta de água",
  aguaTexto: "Quantos copos de 500 ml você quer tomar por dia?",
  aguaCopos: (n) => `${n} ${n === 1 ? "copo" : "copos"}`,
  aguaEquivale: (copos, litros) => `${copos} ${copos === 1 ? "copo" : "copos"} = ${litros} L`,
  menos: "Menos",
  mais: "Mais",

  habitosTitulo: "Hábitos extras (opcional)",
  habitosTexto: "Quer acompanhar mais alguma coisa? Escolha até 3. Se não quiser, é só continuar.",
  nomeHabito: (n) => `Nome do hábito ${n}`,
  adicionarHabito: "+ Adicionar hábito",
  limiteHabitos: "Você chegou ao máximo de 3 hábitos.",

  subir: (nome) => `Subir ${nome || "item"}`,
  descer: (nome) => `Descer ${nome || "item"}`,
  remover: (nome) => `Remover ${nome || "item"}`,

  // Itens que têm histórico não são apagados: ficam "arquivados" e podem voltar
  arquivadasTitulo: "Arquivadas (o histórico continua nos relatórios)",
  reativar: "Reativar",

  resumoTitulo: "Tudo certo?",
  resumoTexto: "Você pode mudar tudo isso depois, em Ajustes.",
  resumoNome: "Nome",
  resumoIdade: "Idade",
  resumoRefeicoes: "Refeições",
  resumoAgua: "Meta de água",
  resumoHabitos: "Hábitos extras",
  nenhum: "nenhum",
  naoInformada: "não informada",

  // Ajustes
  ajustesTitulo: "Seu perfil",
  editar: "Editar",
};

// ---------- Tela Hoje ----------

export const HOJE = {
  diaAnterior: "Dia anterior",
  diaSeguinte: "Dia seguinte",
  peso: "Peso",
  pesoUnidade: "kg",
  sono: "Sono",
  sonoUnidade: "h",
  sonoQualidade: "qualidade",
  refeicoes: "Refeições",
  oQueComi: "O que comi",
  agua: "Água",
  // Texto embaixo dos copinhos
  aguaVazia: (meta, litrosMeta) => `Nenhum copo marcado (meta: ${meta} ${meta === 1 ? "copo" : "copos"} = ${litrosMeta} L)`,
  aguaTexto: (n, meta, litrosN, litrosMeta) => `${n} de ${meta} ${meta === 1 ? "copo" : "copos"} (${litrosN} L de ${litrosMeta} L)`,
  aguaMetaAtingida: "meta atingida",
  copo: (i, cheio) => `Copo ${i}, ${cheio ? "cheio" : "vazio"}`,
  fome: "Fome",
  fomeTexto: "Horário e observação (opcional)",
  banheiro: "Banheiro",
  menos: "Menos",
  mais: "Mais",
  habitos: "Hábitos extras",
  nota: "Nota",
  notaTexto: "Escreva o que quiser",
  erroSalvar: "Não consegui salvar: ",
};

// ---------- Calendário ----------

export const CALENDARIO = {
  mesAnterior: "Mês anterior",
  mesSeguinte: "Mês seguinte",
  ajustes: "Ajustes",
  camadas: { refeicoes: "Refeições", habitos: "Hábitos", sono: "Sono" },
  diasSemana: ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"],
  aguaMeta: "água: meta atingida",
  aguaAbaixo: "água abaixo da meta",
  habitoNao: "hábito: não",
  habitoSim: "hábito: sim",
  diasAntigos: "Em dias antigos aparece o que existia naquele dia.",
  sonoExplica: "O número é quantas horas dormiu; a cor é a qualidade.",
};

// ---------- Relatórios (resumo do mês e cartões semanais) ----------
// Texto neutro: nada de "errou" ou "falhou".

const pl = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

export const RELATORIOS = {
  resumoMes: "Resumo do mês",
  mesNaoComecou: "Este mês ainda não começou.",
  semanas: "Semanas",
  emAndamento: "em andamento",
  semRegistros: "Sem registros.",
  // Semana que cruza dois meses: em cada mês só contam os dias daquele mês
  soDiasDoMes: (intervalo) => `Conta só os dias deste mês (${intervalo}).`,

  // "Refeições: Seguiu 12 de 15 (80%) · 3 não marcadas". Base da %: só as marcadas.
  refeicoes: (seguiu, marcadas, naoMarcadas) => {
    const parte1 = marcadas === 0
      ? "nenhuma marcada"
      : `Seguiu ${seguiu} de ${marcadas} (${Math.round((seguiu / marcadas) * 100)}%)`;
    return `Refeições: ${parte1} · ${pl(naoMarcadas, "não marcada", "não marcadas")}`;
  },
  peso: (mediaTexto, n) => n === 0
    ? "Peso: nenhuma pesagem"
    : `Peso médio: <strong>${mediaTexto} kg</strong> (${pl(n, "pesagem", "pesagens")})`,
  agua: (atingiu, marcados) => marcados === 0
    ? "Água: nenhum dia marcado"
    : `Água: meta atingida em ${atingiu} de ${pl(marcados, "dia marcado", "dias marcados")}`,
  aguaMedia: (mediaTexto, marcados) => marcados === 0
    ? ""
    : ` · média de ${mediaTexto} copos por dia marcado`,
  sonoTitulo: "Sono",
  livresTitulo: (n) => `O que comi nas refeições livres (${n})`,
  semLivres: "Nenhuma refeição livre.",
  fomeTitulo: (n) => `Fome (${n})`,
  semFome: "Nenhum registro de fome.",
  semDescricao: "sem descrição",
};

// ---------- Aba Peso ----------

export const PESO = {
  titulo: "Peso",
  vazio: "Nenhuma pesagem ainda. Marque o peso na tela Hoje e ele aparece aqui.",
  explica: "Média de cada semana com pelo menos uma pesagem. Toque num ponto para ver os detalhes.",
  media: (mediaTexto, n) => `Média: <strong>${mediaTexto} kg</strong> (${pl(n, "pesagem", "pesagens")})`,
};

// ---------- Backup, planilha (CSV) e Sobre ----------

export const BACKUP = {
  titulo: "Backup",
  explica: "Seus dados ficam só neste celular. Salve o backup no app Arquivos (iCloud Drive ou Google Drive) de vez em quando. Ele tem sempre o mesmo nome, então é só substituir o anterior.",
  exportar: "Exportar backup",
  importar: "Importar backup",
  ultimo: (quando) => `Último backup: ${quando}`,
  nenhum: "Você ainda não fez nenhum backup.",
  // "29 set 2026, às 14:03 (há 3 dias)"
  hoje: "hoje",
  ontem: "ontem",
  haDias: (n) => `há ${n} dias`,
  momento: (data, hora, quando) => `${data}${hora ? `, às ${hora}` : ""} (${quando})`,

  // Importação
  naoDa: "Não dá para importar.",
  resumo: (nome, dias, periodo) => `<strong>Backup de ${nome}</strong>: ${dias === 1 ? "1 dia" : `${dias} dias`}, ${periodo}.`,
  periodo: (de, ate) => `de ${de} a ${ate}`,
  semDias: "sem nenhum dia",
  exportadoEm: (quando) => `Exportado em ${quando}.`,
  vaiSubstituir: (dias) => `Isso vai <strong>apagar o perfil e ${dias === 1 ? "o 1 dia" : `os ${dias} dias`} que estão neste celular agora</strong> e colocar os do arquivo no lugar.`,
  vaiRestaurar: "Os dados do arquivo vão para este celular.",
  confirmarSubstituir: "Substituir meus dados",
  confirmarRestaurar: "Restaurar este backup",
  cancelar: "Cancelar",
  pronto: (dias) => `<strong>Pronto:</strong> ${dias === 1 ? "1 dia importado" : `${dias} dias importados`}.`,
  erro: "Algo deu errado: ",

  // Tela de perfil (primeira abertura): quem troca de celular
  jaTenho: "Já tenho backup",
  jaTenhoExplica: "Trocou de celular? Escolha o arquivo de backup (diario-nutri-backup.json) para trazer o seu perfil e o seu histórico.",

  // Aviso no fim do Calendário: só aparece depois de 30 dias de uso sem backup,
  // ou 30 dias depois do último backup. Texto neutro.
  avisoNenhum: "Seus dados ficam só neste celular. Um backup guarda uma cópia deles, para você não perder o histórico se trocar de celular.",
  avisoHa: (n) => `Seu último backup foi há ${n} dias. Um backup novo guarda também os registros mais recentes.`,
  fazerBackup: "Fazer backup",
  diasParaAviso: 30,
};

export const CSV = {
  titulo: "Planilha (CSV)",
  explica: "Uma linha por dia, para abrir no Excel ou em outro programa de planilhas. Não serve como backup e não pode ser importada.",
  exportar: "Exportar CSV",
};

export const AJUSTES = {
  titulo: "Ajustes",
  voltar: "Voltar",
  sobre: "Sobre",
  diasRegistrados: "Dias registrados:",
  protegido: "Armazenamento: protegido (o celular não apaga sozinho)",
  naoProtegido: "Armazenamento: não protegido (o celular pode apagar se faltar espaço; faça backup)",
  versao: (v) => `Versão ${v}`,
  semCopia: "sem cópia offline (modo de teste)",
  desconhecida: "desconhecida",
};

// ---------- PDF para a nutricionista ----------

export const PDF = {
  // Botões
  gerar: "Gerar PDF",
  gerarSemana: "Gerar PDF da semana",
  gerarMes: "Gerar PDF do mês",
  gerando: "Gerando...",
  compartilhar: "Compartilhar PDF",
  pronto: "PDF pronto:",
  erroGerar: "Não consegui gerar o PDF: ",
  erroCarregar: "Não consegui carregar o gerador de PDF.",
  nenhumItem: "Marque pelo menos um item para gerar o PDF.",

  // Ajustes
  titulo: "PDF para a nutricionista",
  explica: "Escolha o período e o que entra. Você também pode gerar o PDF direto no resumo do mês e em cada semana do Calendário: eles usam os itens marcados aqui.",
  semana: "Semana",
  mes: "Mês",
  periodoAnterior: "Período anterior",
  periodoSeguinte: "Período seguinte",
  oQueEntra: "O que entra no PDF:",

  // Itens que o paciente liga e desliga (padrão conforme o CLAUDE.md, seção 7)
  opcoes: {
    refeicoes: "Refeições (e o que comi nas livres)",
    peso: "Peso",
    fome: "Fome (com o texto)",
    agua: "Água",
    sono: "Sono",
    banheiro: "Banheiro",
    habitos: "Hábitos extras",
    nota: "Nota livre",
  },

  // Dentro do PDF (sem emoji: as fontes do PDF não têm emoji)
  relatorioSemanal: "Relatório semanal",
  relatorioMensal: "Relatório mensal",
  paciente: (nome, idade) => `Paciente: ${nome}${idade === undefined ? "" : `, ${idade} anos`}`,
  geradoEm: (data) => `Gerado em ${data}.`,
  emAndamento: " Período em andamento: considera os dias até hoje.",
  resumo: "Resumo",
  pesoGrafico: "Peso de cada dia (kg)",
  diaADia: "Dia a dia",
  rodape: (app, pagina, total) => `Gerado pelo ${app} · página ${pagina} de ${total}`,
  colunas: { dia: "Dia", peso: "Peso (kg)", fome: "Fome", agua: "Água (copos)", sono: "Sono", banheiro: "Banheiro" },
  aguaCelula: (copos, meta) => `${copos} de ${meta}`,
  livre: (refeicao, texto) => `${refeicao} (livre): ${texto}`,
  fomeTexto: (texto) => `Fome: ${texto}`,
  nota: (texto) => `Nota: ${texto}`,
  semDescricao: "(sem descrição)",

  // Resumo do período
  peso: (media, n) => n === 0 ? "Peso: nenhuma pesagem no período" : `Peso médio: ${media} kg (${n === 1 ? "1 pesagem" : `${n} pesagens`})`,
  fomeResumo: (n) => `Fome: marcada em ${n === 1 ? "1 dia" : `${n} dias`}`,
  aguaResumo: (meta, atingiu, marcados) => marcados === 0
    ? `Água (meta de ${meta} copos de 500 ml): nenhum dia marcado`
    : `Água (meta de ${meta} copos de 500 ml): meta atingida em ${atingiu} de ${marcados === 1 ? "1 dia marcado" : `${marcados} dias marcados`}`,
  sonoResumo: (media, n, boa, ok, ruim) => (n === 0 ? "Sono: nenhuma noite com horas marcadas" : `Sono: média de ${media} h (${n === 1 ? "1 noite" : `${n} noites`})`)
    + ` · qualidade: boa ${boa}, ok ${ok}, ruim ${ruim}`,
  banheiroResumo: (media, n) => n === 0 ? "Banheiro: nenhum dia marcado" : `Banheiro: média de ${media} vez por dia (${n === 1 ? "1 dia marcado" : `${n} dias marcados`})`,
  habitoResumo: (nome, sim, nao) => `${nome}: sim ${sim} · não ${nao} (${sim + nao === 1 ? "1 dia marcado" : `${sim + nao} dias marcados`})`,
};

// ---------- Ajuda (dentro dos Ajustes): instalação e backup ----------
// As instruções de instalação usam as mesmas listas da tela de boas-vindas (BOAS_VINDAS.iphone e .android).

export const AJUDA = {
  titulo: "Ajuda",
  instalarTitulo: "Como instalar o app (em outro celular)",
  instalarIntro: "Abra o endereço do app no celular novo e siga os passos:",
  iphone: "iPhone",
  android: "Android",
  sempreIcone: "Abra sempre pelo ícone na tela inicial, nunca pelo navegador: os dados ficam guardados no app, e o navegador não enxerga esses dados.",

  backupTitulo: "Como fazer backup",
  backupPassos: [
    "Aqui em Ajustes, toque em <strong>Exportar backup</strong>.",
    "No iPhone, escolha <strong>Salvar em Arquivos</strong>, depois <strong>iCloud Drive</strong>, e toque em <strong>Salvar</strong>. No Android, escolha o <strong>Google Drive</strong> (ou <strong>Salvar no dispositivo</strong>).",
    "Se perguntar se quer substituir o arquivo anterior, toque em <strong>Substituir</strong>: o backup tem sempre o mesmo nome (<em>diario-nutri-backup.json</em>).",
    "Faça backup de vez em quando. Depois de 30 dias sem backup, aparece um lembrete no fim do Calendário.",
  ],

  restaurarTitulo: "Como trazer os dados para um celular novo",
  restaurarPassos: [
    "Instale o app no celular novo (veja acima) e abra pelo ícone.",
    "Na primeira tela, toque em <strong>Já tenho backup</strong>.",
    "Escolha o arquivo <em>diario-nutri-backup.json</em> (no iCloud Drive ou no Google Drive).",
    "Confira o nome e o período e toque em <strong>Restaurar este backup</strong>.",
  ],

  cuidadosTitulo: "Cuidados importantes",
  cuidados: [
    "Se você apagar o app, apaga também o histórico. Só o backup traz de volta.",
    "Os dados ficam só neste celular: ninguém mais vê, nem a nutricionista, até você mandar o PDF.",
    "O backup só pode ser importado neste app (Diário Nutri). Arquivos de outros apps são recusados.",
  ],
};

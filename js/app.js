// Diário Nutri · Criado por Lift Like a Girl (@liftlikeagirl.xo)
//
// Ponto de partida do app: decide qual tela abrir e cuida da navegação entre telas.
//
// Ordem de abertura:
//   1. Aberto no navegador (não instalado)  -> só a tela de boas-vindas e instalação
//   2. Instalado, sem perfil                -> criação do perfil
//   3. Instalado, com perfil                -> Calendário
// Para testar no computador, "?dev" no fim do endereço pula a tela de boas-vindas.

import { iniciarDados, lerPerfil, pedirArmazenamentoPersistente } from "./dados.js";
import { mostrarBoasVindas } from "./boasvindas.js";
import { mostrarPerfil } from "./perfil.js";
import { mostrarHoje } from "./hoje.js";
import { mostrarCalendario } from "./calendario.js";
import { mostrarPeso } from "./peso.js";
import { mostrarAjustes } from "./ajustes.js";

const tela = document.getElementById("tela");
const barra = document.getElementById("barra");

// Aberto pelo ícone da tela inicial? (navigator.standalone é o jeito antigo do iPhone)
const instalado = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const modoDev = new URLSearchParams(location.search).has("dev");

// Troca de tela. "data" só é usada pela tela Hoje (sem data = hoje).
function irPara(nome, data) {
  window.scrollTo(0, 0);
  barra.hidden = false;
  barra.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("ativo", b.dataset.tela === nome || (nome === "ajustes" && b.dataset.tela === "calendario"));
  });
  if (nome === "hoje") mostrarHoje(tela, data);
  else if (nome === "peso") mostrarPeso(tela);
  else if (nome === "ajustes") mostrarAjustes(tela, {
    aoVoltar: () => irPara("calendario"),
    aoEditarPerfil: editarPerfil,
  });
  else mostrarCalendario(tela, {
    aoAbrirDia: (dataEscolhida) => irPara("hoje", dataEscolhida),
    aoAbrirAjustes: () => irPara("ajustes"),
  });
}

// Edita uma parte do perfil (vindo dos Ajustes) e volta para os Ajustes
function editarPerfil(passo) {
  window.scrollTo(0, 0);
  barra.hidden = true;
  mostrarPerfil(tela, { passo, aoTerminar: () => irPara("ajustes"), aoCancelar: () => irPara("ajustes") });
}

barra.querySelectorAll("button").forEach((b) => {
  b.onclick = () => irPara(b.dataset.tela);
});

async function iniciar() {
  if (!instalado && !modoDev) {
    // No navegador: nada de dados, só as instruções de instalação
    barra.hidden = true;
    mostrarBoasVindas(tela);
    return;
  }

  // Pede ao iPhone para não apagar os dados quando faltar espaço
  pedirArmazenamentoPersistente();
  await iniciarDados();

  if (await lerPerfil()) {
    irPara("calendario");
  } else {
    barra.hidden = true;
    mostrarPerfil(tela, { aoTerminar: () => irPara("calendario") });
  }
}

iniciar().catch((e) => {
  tela.innerHTML = `<p>Não consegui abrir os dados: ${e.message}</p>`;
});

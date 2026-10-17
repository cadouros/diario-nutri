// Diário Nutri · Criado por Lift Like a Girl (@liftlikeagirl.xo)
//
// Importar um backup: usado nos Ajustes e no "Já tenho backup" da tela de perfil.
//
// Passos: escolher o arquivo -> conferir (lerBackup recusa arquivos de outro app) ->
// mostrar o resumo (nome, quantos dias, período) -> só troca os dados depois da confirmação.

import { lerBackup } from "./backup.js";
import { substituirTudo, todosOsDias, lerPerfil, lerMeta, salvarMeta } from "./dados.js";
import { formatarDataComAno, diasEntre, hojeISO, escapar } from "./formato.js";
import { BACKUP as T } from "./textos.js";

// "2026-09-29T14:03" -> "29 set 2026, às 14:03 (há 3 dias)"
export function descreverMomento(momento) {
  const [data, hora] = momento.split("T");
  const dias = diasEntre(data, hojeISO());
  const quando = dias === 0 ? T.hoje : dias === 1 ? T.ontem : T.haDias(dias);
  return T.momento(formatarDataComAno(data), hora, quando);
}

// botao: o que a pessoa toca para escolher o arquivo
// area: onde aparecem o resumo, a confirmação e as mensagens
// aoImportar(backup): chamado depois que os dados foram trocados
export function ligarImportacao({ botao, area, aoImportar }) {
  const entrada = document.createElement("input");
  entrada.type = "file";
  entrada.accept = ".json,application/json";
  entrada.hidden = true;
  area.after(entrada);

  botao.onclick = () => {
    entrada.value = "";
    entrada.click();
  };

  entrada.onchange = async () => {
    const arquivo = entrada.files[0];
    if (!arquivo) return;
    let backup;
    try {
      backup = lerBackup(await arquivo.text());
    } catch (e) {
      area.innerHTML = `<div class="aviso-importacao" role="alert"><p><strong>${T.naoDa}</strong></p><p class="motivo"></p></div>`;
      area.querySelector(".motivo").textContent = e.message;
      return;
    }

    // O que existe no aparelho agora (na troca de celular, normalmente nada)
    const [diasAgora, perfilAgora] = await Promise.all([todosOsDias(), lerPerfil()]);
    const vaiApagar = perfilAgora !== undefined || diasAgora.length > 0;

    const datas = backup.dias.map((d) => d.data).sort();
    const periodo = datas.length
      ? T.periodo(formatarDataComAno(datas[0]), formatarDataComAno(datas[datas.length - 1]))
      : T.semDias;
    area.innerHTML = `
      <div class="aviso-importacao">
        <p>${T.resumo(escapar(backup.perfil.nome), datas.length, periodo)}</p>
        ${backup.exportadoEm ? `<p>${T.exportadoEm(descreverMomento(backup.exportadoEm))}</p>` : ""}
        <p>${vaiApagar ? T.vaiSubstituir(diasAgora.length) : T.vaiRestaurar}</p>
        <div class="botoes">
          <button type="button" class="botao ${vaiApagar ? "perigo" : "principal"}" id="confirmar-importacao">
            ${vaiApagar ? T.confirmarSubstituir : T.confirmarRestaurar}</button>
          <button type="button" class="botao" id="cancelar-importacao">${T.cancelar}</button>
        </div>
      </div>`;

    area.querySelector("#cancelar-importacao").onclick = () => { area.innerHTML = ""; };
    area.querySelector("#confirmar-importacao").onclick = async () => {
      try {
        await substituirTudo(backup.perfil, backup.dias);
        // Os dados agora são iguais aos do arquivo: ele conta como último backup
        const anterior = await lerMeta("ultimoBackup");
        if (backup.exportadoEm && (!anterior || anterior < backup.exportadoEm)) {
          await salvarMeta("ultimoBackup", backup.exportadoEm);
        }
        area.innerHTML = `<div class="aviso-importacao"><p>${T.pronto(backup.dias.length)}</p></div>`;
        await aoImportar(backup);
      } catch (e) {
        alert(T.erro + e.message);
      }
    };
  };
}

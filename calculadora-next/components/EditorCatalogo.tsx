'use client';

import { useState } from 'react';
import { api } from '@/lib/planilha';
import type { Conexao, ItemHistorico, TipoAviso } from '@/lib/tipos';
import { CampoFoto } from './CampoFoto';
import { CamposCatalogo, type DadosCatalogo } from './CamposCatalogo';

interface Props {
  item: ItemHistorico;
  conexao: Conexao;
  categorias: string[];
  aviso: (msg: string, tipo?: TipoAviso) => void;
  aoSalvar: (atualizado: ItemHistorico) => void;
  fechar: () => void;
}

/** Edita, num cálculo já salvo, a foto e o que aparece no catálogo. */
export function EditorCatalogo({ item, conexao, categorias, aviso, aoSalvar, fechar }: Props) {
  const [dados, setDados] = useState<DadosCatalogo>({
    catalogo: !!item.catalogo,
    descricao: String(item.descricao ?? ''),
    categoria: String(item.categoria ?? ''),
    destaque: !!item.destaque
  });
  const [foto, setFoto] = useState(String(item.foto ?? ''));
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    try {
      const envio: Record<string, unknown> = {
        catalogo: dados.catalogo,
        descricao: dados.descricao.trim(),
        categoria: dados.categoria.trim(),
        destaque: dados.catalogo && dados.destaque
      };
      if (foto.startsWith('data:')) {
        envio.fotoBase64 = foto.split(',')[1];
        envio.fotoTipo = 'image/jpeg';
      } else if (foto !== String(item.foto ?? '')) {
        envio.fotoUrl = foto;
      }
      const r = await api<{ foto?: string }>(conexao, 'editCatalogo', { id: item.id, data: envio });
      aoSalvar({ ...item, ...dados, descricao: dados.descricao.trim(), categoria: dados.categoria.trim(), foto: r.foto ?? foto });
      aviso(dados.catalogo ? 'Salvo! Já aparece no catálogo ♥' : 'Salvo', 'ok');
      fechar();
    } catch (e) {
      const msg = (e as Error).message;
      aviso(/desconhecida/i.test(msg) ? 'Atualize o Apps Script e publique uma Nova versão.' : msg, 'err');
    }
    setSalvando(false);
  }

  return (
    <div className="editor-catalogo">
      <div className="fields">
        <CampoFoto foto={foto} setFoto={setFoto} aviso={aviso} />
        <CamposCatalogo {...dados} categorias={categorias} mudar={m => setDados(d => ({ ...d, ...m }))} />
      </div>
      <div className="actions">
        <button className="btn primary small" type="button" disabled={salvando} onClick={salvar}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button className="btn ghost small" type="button" onClick={fechar}>Cancelar</button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { brl, num } from '@/lib/formato';
import { api } from '@/lib/planilha';
import { linkFoto } from '@/lib/foto';
import { FotoProduto } from './FotoProduto';
import type { Conexao, ItemHistorico, TipoAviso } from '@/lib/tipos';

interface Props {
  conexao: Conexao;
  /** null = ainda não carregado (ou precisa recarregar). */
  historico: ItemHistorico[] | null;
  setHistorico: (h: ItemHistorico[] | null) => void;
  aviso: (msg: string, tipo?: TipoAviso) => void;
}

function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return <div className="empty"><b>{titulo}</b>{texto}</div>;
}

export function AbaHistorico({ conexao, historico, setHistorico, aviso }: Props) {
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!conexao.url || historico) return;
    let ativo = true;
    setErro('');
    api<{ itens: ItemHistorico[] }>(conexao, 'list', { limit: 200 })
      .then(r => { if (ativo) setHistorico(r.itens); })
      .catch(e => { if (ativo) setErro((e as Error).message); });
    return () => { ativo = false; };
  }, [conexao, historico, setHistorico]);

  async function apagar(id: string) {
    if (!confirm('Apagar este cálculo da planilha?')) return;
    try {
      await api(conexao, 'delete', { id });
      setHistorico((historico ?? []).filter(i => String(i.id) !== id));
      aviso('Cálculo apagado', 'ok');
    } catch (e) {
      aviso((e as Error).message, 'err');
    }
  }

  let conteudo;
  if (!conexao.url) {
    conteudo = <Vazio titulo="Nada por aqui ainda" texto="Conecte a planilha na aba Configurações para ver os cálculos salvos." />;
  } else if (erro) {
    conteudo = <Vazio titulo="Ops!" texto={erro} />;
  } else if (!historico) {
    conteudo = <Vazio titulo="Carregando..." texto="Buscando seus cálculos na planilha." />;
  } else {
    const termo = busca.trim().toLowerCase();
    const itens = historico.filter(i => !termo || String(i.produto).toLowerCase().includes(termo));
    conteudo = !itens.length
      ? <Vazio titulo="Nada por aqui ainda" texto={termo ? 'Nenhum produto com esse nome.' : 'Os cálculos salvos aparecem aqui.'} />
      : itens.map(i => {
          const horas = num(i.horas), h = Math.floor(horas), m = Math.round((horas - h) * 60);
          const data = i.data ? new Date(i.data).toLocaleDateString('pt-BR') : '';
          return (
            <div className="hist-item" key={i.id}>
              {i.foto
                ? <a className="hist-foto" href={linkFoto(i.foto)} target="_blank" rel="noopener noreferrer" title="Abrir foto">
                    <FotoProduto url={i.foto} vazio={<span className="sem-foto" aria-hidden="true">✿</span>} />
                  </a>
                : <span className="hist-foto vazia" aria-hidden="true">✿</span>}
              <div>
                <h3>
                  {/^https?:\/\//.test(i.link)
                    ? <a href={i.link} target="_blank" rel="noopener noreferrer">{i.produto}</a>
                    : i.produto}
                </h3>
                <p>
                  {data} · {num(i.gramas).toLocaleString('pt-BR')} g · {h}h{String(m).padStart(2, '0')} ·
                  custo {brl(num(i.custoBase))} × {num(i.multiplicador)}
                </p>
                {i.observacoes && <p>{i.observacoes}</p>}
              </div>
              <div className="val">
                {brl(num(i.precoFinal))}
                {num(i.quantidade) > 1 && <small>{i.quantidade} un. · {brl(num(i.precoTotal))}</small>}
              </div>
              <button className="icon-btn del" type="button" title="Apagar" aria-label="Apagar cálculo"
                onClick={() => apagar(String(i.id))}>×</button>
            </div>
          );
        });
  }

  return (
    <div className="card">
      <h2><span className="ico">❀</span>Cálculos salvos</h2>
      <div className="toolbar">
        <input type="search" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
        <button className="btn ghost small" type="button" onClick={() => { setErro(''); setHistorico(null); }}>
          ↻ Atualizar
        </button>
      </div>
      <div className="hist">{conteudo}</div>
    </div>
  );
}

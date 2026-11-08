'use client';

import { useMemo, useState } from 'react';
import { calcular, OUTRO } from '@/lib/calculo';
import { brl, num } from '@/lib/formato';
import { api } from '@/lib/planilha';
import type { Conexao, Config, EntradaCalculo, LinhaFilamento, TipoAviso } from '@/lib/tipos';
import { CampoFoto } from './CampoFoto';
import { CampoUnidade } from './CampoUnidade';

let proximoId = 1;

export function novaLinha(config: Config, dados: Partial<LinhaFilamento> = {}): LinhaFilamento {
  const nome = dados.nome ?? config.filamentos[0]?.nome ?? OUTRO;
  const preco = config.filamentos.find(f => f.nome === nome)?.preco ?? 0;
  return { id: proximoId++, nome, preco: String(preco), gramas: '', ...dados };
}

export function entradaVazia(config: Config): EntradaCalculo {
  return {
    produto: '', link: '', quantidade: '1', obs: '',
    horas: '0', minutos: '0',
    mult: String(config.mult), taxa: String(config.taxa),
    filamentos: [novaLinha(config)],
    foto: ''
  };
}

interface Props {
  config: Config;
  conexao: Conexao;
  entrada: EntradaCalculo;
  setEntrada: (fn: (e: EntradaCalculo) => EntradaCalculo) => void;
  aviso: (msg: string, tipo?: TipoAviso) => void;
  aoSalvar: () => void;
}

export function AbaCalcular({ config, conexao, entrada, setEntrada, aviso, aoSalvar }: Props) {
  const [salvando, setSalvando] = useState(false);
  const r = useMemo(() => calcular(entrada, config), [entrada, config]);
  const conectado = !!conexao.url && !!conexao.key;

  const campo = (k: keyof Omit<EntradaCalculo, 'filamentos' | 'foto'>) => ({
    value: entrada[k],
    onChange: (ev: { target: { value: string } }) => setEntrada(e => ({ ...e, [k]: ev.target.value }))
  });

  const mudarLinha = (id: number, mudanca: Partial<LinhaFilamento>) =>
    setEntrada(e => ({ ...e, filamentos: e.filamentos.map(l => (l.id === id ? { ...l, ...mudanca } : l)) }));

  const escolherFilamento = (id: number, nome: string) => {
    const f = config.filamentos.find(x => x.nome === nome);
    mudarLinha(id, f ? { nome, preco: String(f.preco) } : { nome });
  };

  const removerLinha = (id: number) =>
    setEntrada(e => {
      const resto = e.filamentos.filter(l => l.id !== id);
      return { ...e, filamentos: resto.length ? resto : [novaLinha(config)] };
    });

  async function salvar() {
    if (!r.dados.produto) { aviso('Dê um nome ao produto antes de salvar.', 'err'); return; }
    if (r.dados.custoBase <= 0) { aviso('Preencha os gramas ou o tempo de impressão.', 'err'); return; }
    setSalvando(true);
    try {
      const dados = { ...r.dados };
      if (entrada.foto.startsWith('data:')) {
        dados.fotoBase64 = entrada.foto.split(',')[1];
        dados.fotoTipo = 'image/jpeg';
      } else if (entrada.foto) {
        dados.fotoUrl = entrada.foto;
      }
      await api(conexao, 'save', { data: dados });
      aviso('Cálculo salvo na planilha ♥', 'ok');
      aoSalvar();
    } catch (e) {
      aviso((e as Error).message, 'err');
    }
    setSalvando(false);
  }

  const nomesCatalogo = config.filamentos.map(f => f.nome);

  return (
    <div className="grid">
      <div className="stack">
        <div className="card">
          <h2><span className="ico">✿</span>Produto</h2>
          <div className="fields">
            <label className="full">Nome do produto
              <input placeholder="Ex.: Presépio diorama" {...campo('produto')} />
            </label>
            <label className="full">Link do MakerWorld (opcional)
              <input type="url" placeholder="https://makerworld.com/pt/models/..." {...campo('link')} />
            </label>
            <CampoFoto foto={entrada.foto} setFoto={foto => setEntrada(e => ({ ...e, foto }))} aviso={aviso} />
            <label>Quantidade
              <input type="number" min={1} step={1} {...campo('quantidade')} />
            </label>
            <label className="full">Observações
              <textarea placeholder="Cliente, cor pedida, prazo..." {...campo('obs')} />
            </label>
          </div>
        </div>

        <div className="card">
          <h2><span className="ico">◍</span>Filamentos</h2>
          <p className="hint">Uma linha por filamento usado. Os gramas são por unidade (como aparece no MakerWorld ou no Bambu Studio).</p>
          {entrada.filamentos.map(l => (
            <div className="fil-row" key={l.id}>
              <label className="fil-name">Filamento
                <select
                  value={nomesCatalogo.includes(l.nome) ? l.nome : OUTRO}
                  onChange={ev => escolherFilamento(l.id, ev.target.value)}
                >
                  {nomesCatalogo.map(n => <option key={n} value={n}>{n}</option>)}
                  <option value={OUTRO}>Outro...</option>
                </select>
              </label>
              <label>Preço do kg
                <CampoUnidade prefixo="R$" min={0} step={0.01} value={l.preco}
                  onChange={ev => mudarLinha(l.id, { preco: ev.target.value })} />
              </label>
              <label>Gramas
                <CampoUnidade sufixo="g" min={0} step={0.1} placeholder="0" value={l.gramas}
                  onChange={ev => mudarLinha(l.id, { gramas: ev.target.value })} />
              </label>
              <button className="icon-btn" type="button" title="Remover filamento" aria-label="Remover filamento"
                onClick={() => removerLinha(l.id)}>×</button>
            </div>
          ))}
          <button className="btn ghost small" type="button"
            onClick={() => setEntrada(e => ({ ...e, filamentos: [...e.filamentos, novaLinha(config)] }))}>
            + Adicionar filamento
          </button>
        </div>

        <div className="card">
          <h2><span className="ico">◷</span>Tempo de impressão</h2>
          <div className="fields">
            <label>Horas
              <CampoUnidade sufixo="h" min={0} step={1} {...campo('horas')} />
            </label>
            <label>Minutos
              <CampoUnidade sufixo="min" min={0} max={59} step={1} {...campo('minutos')} />
            </label>
          </div>
          <p className="hint" style={{ margin: '12px 0 0' }}>
            Valor cobrado por hora: {brl(num(config.valorHora))} (ajuste em Configurações).
          </p>
        </div>
      </div>

      <aside className="card summary">
        <h2><span className="ico">♥</span>Preço sugerido</h2>
        <div className="cloud">
          <small>por unidade</small>
          <div className="price">{brl(r.precoFinal)}</div>
          <div className="total">{r.qtd > 1 ? `${r.qtd} unidades · ${brl(r.precoFinal * r.qtd)}` : ''}</div>
        </div>
        <ul className="lines">
          <li><span>Filamento</span><span>{brl(r.custoFil)}</span></li>
          <li><span>Horas de impressão</span><span>{brl(r.custoHoras)}</span></li>
          <li className="sub"><span>Custo base</span><span>{brl(r.base)}</span></li>
          <li className="extra"><span>Desgaste, mão de obra, falhas, embalagem e lucro</span><span>{brl(r.precoUn - r.base)}</span></li>
          {r.taxa > 0 && <li className="extra"><span>Taxa de venda</span><span>{brl(r.precoFinal - r.precoUn)}</span></li>}
          <li className="muted"><span>Peso por unidade</span><span>{r.gramas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} g</span></li>
        </ul>
        <div className="mini-fields">
          <label>Multiplicador
            <CampoUnidade sufixo="×" min={1} step={0.1} {...campo('mult')} />
          </label>
          <label>Taxa de venda
            <CampoUnidade sufixo="%" min={0} max={90} step={0.5} {...campo('taxa')} />
          </label>
        </div>
        <div className="actions">
          <button className="btn primary" type="button" disabled={!conectado || salvando} onClick={salvar}>
            {salvando ? 'Salvando...' : 'Salvar na planilha'}
          </button>
          <button className="btn ghost" type="button" onClick={() => setEntrada(() => entradaVazia(config))}>
            Limpar
          </button>
        </div>
        <p className="note">{conectado ? '' : 'Conecte a planilha na aba Configurações para salvar.'}</p>
      </aside>
    </div>
  );
}

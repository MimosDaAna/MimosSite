'use client';

import { useMemo, useState } from 'react';
import { calcular, lerFilamentos, taxaDoPreco } from '@/lib/calculo';
import { brl, num } from '@/lib/formato';
import { api } from '@/lib/planilha';
import type { Conexao, Config, EntradaCalculo, ItemHistorico, LinhaFilamento, TipoAviso } from '@/lib/tipos';
import { novaLinha } from './AbaCalcular';
import { CampoUnidade } from './CampoUnidade';

interface Props {
  item: ItemHistorico;
  config: Config;
  conexao: Conexao;
  aviso: (msg: string, tipo?: TipoAviso) => void;
  aoSalvar: (atualizado: ItemHistorico) => void;
  fechar: () => void;
}

/** Monta o formulário da calculadora a partir de um cálculo já salvo. */
function entradaDoItem(i: ItemHistorico, config: Config): EntradaCalculo {
  const gramas = num(i.gramas);
  const lidos = lerFilamentos(i.filamentos);
  // Texto antigo ou mexido na mão: vira uma linha só, com o preço tirado do custo gravado.
  const precoKg = gramas > 0 && num(i.custoFilamento) > 0
    ? (num(i.custoFilamento) / gramas) * 1000
    : config.filamentos[0]?.preco ?? 0;
  const linhas: LinhaFilamento[] = (lidos.length ? lidos : [{ nome: 'Filamento', preco: precoKg, gramas }])
    .map(f => novaLinha(config, { nome: f.nome, preco: String(Math.round(f.preco * 100) / 100), gramas: f.gramas ? String(f.gramas) : '' }));

  const horas = num(i.horas);
  let h = Math.floor(horas), m = Math.round((horas - h) * 60);
  if (m === 60) { h += 1; m = 0; }
  const mult = num(i.multiplicador) || config.mult;
  const taxa = i.taxaMarketplace !== undefined && i.taxaMarketplace !== ''
    ? num(i.taxaMarketplace)
    : taxaDoPreco(num(i.custoBase), mult, num(i.precoFinal));

  return {
    produto: String(i.produto ?? ''), link: String(i.link ?? ''), obs: String(i.observacoes ?? ''),
    quantidade: String(num(i.quantidade) || 1),
    horas: h ? String(h) : '', minutos: m ? String(m) : '',
    mult: String(mult), taxa: String(taxa),
    filamentos: linhas,
    foto: '', catalogo: false, descricao: '', categoria: '', destaque: false
  };
}

/** Edita gramas, tempo e quantidade de um cálculo salvo; o preço é refeito na hora. */
export function EditorCalculo({ item, config, conexao, aviso, aoSalvar, fechar }: Props) {
  const [entrada, setEntrada] = useState(() => entradaDoItem(item, config));
  const [salvando, setSalvando] = useState(false);
  const r = useMemo(() => calcular(entrada, config), [entrada, config]);

  const precoAntes = num(item.precoFinal);
  const mudou = Math.abs(r.dados.precoFinal - precoAntes) >= 0.005;

  const campo = (k: 'horas' | 'minutos' | 'quantidade' | 'mult' | 'taxa') => ({
    value: entrada[k],
    onChange: (ev: { target: { value: string } }) => setEntrada(e => ({ ...e, [k]: ev.target.value }))
  });
  const mudarLinha = (id: number, mudanca: Partial<LinhaFilamento>) =>
    setEntrada(e => ({ ...e, filamentos: e.filamentos.map(l => (l.id === id ? { ...l, ...mudanca } : l)) }));

  async function salvar() {
    if (r.dados.custoBase <= 0) { aviso('Preencha os gramas ou o tempo de impressão.', 'err'); return; }
    setSalvando(true);
    try {
      const d = r.dados;
      await api(conexao, 'editCalculo', {
        id: item.id,
        data: {
          quantidade: d.quantidade, filamentos: d.filamentos, gramas: d.gramas, horas: d.horas,
          custoFilamento: d.custoFilamento, custoHoras: d.custoHoras, custoBase: d.custoBase,
          multiplicador: d.multiplicador, precoUnitario: d.precoUnitario, taxaMarketplace: d.taxaMarketplace,
          precoFinal: d.precoFinal, precoTotal: d.precoTotal
        }
      });
      aoSalvar({
        ...item,
        quantidade: d.quantidade, filamentos: d.filamentos, gramas: d.gramas, horas: d.horas,
        custoFilamento: d.custoFilamento, custoBase: d.custoBase, multiplicador: d.multiplicador,
        taxaMarketplace: d.taxaMarketplace, precoFinal: d.precoFinal, precoTotal: d.precoTotal
      });
      aviso(item.catalogo ? 'Recalculado! O preço do catálogo também mudou ♥' : 'Cálculo atualizado ♥', 'ok');
      fechar();
    } catch (e) {
      const msg = (e as Error).message;
      aviso(/desconhecida/i.test(msg) ? 'Atualize o Apps Script e publique uma Nova versão.' : msg, 'err');
    }
    setSalvando(false);
  }

  return (
    <div className="editor-catalogo editor-calculo">
      <p className="hint">Mude os gramas ou o tempo e o preço é refeito na hora, com o valor por hora de Configurações ({brl(num(config.valorHora))}).</p>

      {entrada.filamentos.map(l => (
        <div className="fil-row" key={l.id}>
          <label className="fil-name">Filamento
            <input value={l.nome} onChange={ev => mudarLinha(l.id, { nome: ev.target.value })} />
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
            onClick={() => setEntrada(e => {
              const resto = e.filamentos.filter(x => x.id !== l.id);
              return { ...e, filamentos: resto.length ? resto : [novaLinha(config)] };
            })}>×</button>
        </div>
      ))}
      <button className="btn ghost small" type="button"
        onClick={() => setEntrada(e => ({ ...e, filamentos: [...e.filamentos, novaLinha(config)] }))}>
        + Adicionar filamento
      </button>

      <div className="fields">
        <label>Horas<CampoUnidade sufixo="h" min={0} step={1} placeholder="0" {...campo('horas')} /></label>
        <label>Minutos<CampoUnidade sufixo="min" min={0} max={59} step={1} placeholder="0" {...campo('minutos')} /></label>
        <label>Quantidade<input type="number" min={1} step={1} {...campo('quantidade')} /></label>
        <label>Multiplicador<CampoUnidade sufixo="×" min={1} step={0.1} {...campo('mult')} /></label>
        <label>Taxa de venda<CampoUnidade sufixo="%" min={0} max={90} step={0.5} {...campo('taxa')} /></label>
      </div>

      <div className="recalculo" aria-live="polite">
        <span>Custo base <b>{brl(r.base)}</b></span>
        <span className="recalculo-preco">
          {mudou && <s>{brl(precoAntes)}</s>}
          <b>{brl(r.precoFinal)}</b> <small>por unidade</small>
        </span>
        {r.qtd > 1 && <span>{r.qtd} un. · <b>{brl(r.precoFinal * r.qtd)}</b></span>}
      </div>

      <div className="actions">
        <button className="btn primary small" type="button" disabled={salvando} onClick={salvar}>
          {salvando ? 'Salvando...' : 'Salvar novo preço'}
        </button>
        <button className="btn ghost small" type="button" onClick={fechar}>Cancelar</button>
      </div>
    </div>
  );
}

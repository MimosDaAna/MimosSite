'use client';

import { useEffect, useState } from 'react';
import { brl, num } from '@/lib/formato';
import type { Conexao, Config } from '@/lib/tipos';
import { CampoUnidade } from './CampoUnidade';

interface LinhaCatalogo { id: number; nome: string; preco: string }

let proximoId = 1;
const paraLinhas = (c: Config): LinhaCatalogo[] =>
  c.filamentos.map(f => ({ id: proximoId++, nome: f.nome, preco: String(f.preco) }));

interface Props {
  config: Config;
  conexao: Conexao;
  aoSalvarConfig: (c: Config) => void;
  aoConectar: (c: Conexao) => void;
}

export function AbaConfiguracoes({ config, conexao, aoSalvarConfig, aoConectar }: Props) {
  const [custos, setCustos] = useState({
    valorHora: '', watts: '', kwh: '', mult: '', taxa: ''
  });
  const [catalogo, setCatalogo] = useState<LinhaCatalogo[]>([]);
  const [url, setUrl] = useState(conexao.url);
  const [key, setKey] = useState(conexao.key);

  // Recarrega o formulário sempre que a configuração vem da planilha ou é salva.
  useEffect(() => {
    setCustos({
      valorHora: String(config.valorHora), watts: String(config.watts), kwh: String(config.kwh),
      mult: String(config.mult), taxa: String(config.taxa)
    });
    setCatalogo(paraLinhas(config));
  }, [config]);

  useEffect(() => { setUrl(conexao.url); setKey(conexao.key); }, [conexao]);

  const campo = (k: keyof typeof custos) => ({
    value: custos[k],
    onChange: (e: { target: { value: string } }) => setCustos(c => ({ ...c, [k]: e.target.value }))
  });

  const mudarLinha = (id: number, m: Partial<LinhaCatalogo>) =>
    setCatalogo(cat => cat.map(l => (l.id === id ? { ...l, ...m } : l)));

  function salvar() {
    aoSalvarConfig({
      valorHora: num(custos.valorHora),
      watts: num(custos.watts),
      kwh: num(custos.kwh),
      mult: Math.max(1, num(custos.mult) || 2),
      taxa: num(custos.taxa),
      filamentos: catalogo
        .map(l => ({ nome: l.nome.trim(), preco: num(l.preco) }))
        .filter(f => f.nome)
    });
  }

  const w = num(custos.watts), k = num(custos.kwh), h = num(custos.valorHora);
  const energia = (w / 1000) * k;

  return (
    <div className="grid">
      <div className="stack">
        <div className="card">
          <h2><span className="ico">⚙</span>Custos padrão</h2>
          <div className="fields">
            <label>Valor cobrado por hora
              <CampoUnidade prefixo="R$" min={0} step={0.01} {...campo('valorHora')} />
              <small>usado no cálculo do preço</small>
            </label>
            <label>Consumo da impressora
              <CampoUnidade sufixo="W" min={0} step={1} {...campo('watts')} />
              <small>só para referência</small>
            </label>
            <label>Tarifa de energia
              <CampoUnidade prefixo="R$" min={0} step={0.01} {...campo('kwh')} />
              <small>por kWh, só para referência</small>
            </label>
            <label>Multiplicador padrão
              <CampoUnidade sufixo="×" min={1} step={0.1} {...campo('mult')} />
              <small>2 = cobrar o dobro do custo</small>
            </label>
            <label>Taxa de venda padrão
              <CampoUnidade sufixo="%" min={0} max={90} step={0.5} {...campo('taxa')} />
              <small>0 para venda direta</small>
            </label>
          </div>
          {w > 0 && k > 0 && (
            <p className="hint" style={{ margin: '14px 0 0' }}>
              Energia estimada: {brl(energia)} por hora ({w} W × {brl(k)}/kWh). O valor cobrado por hora ({brl(h)}){' '}
              {h >= energia ? `cobre a energia com folga de ${brl(h - energia)}` : 'está abaixo do gasto de energia'}.
            </p>
          )}
        </div>

        <div className="card">
          <h2><span className="ico">◍</span>Meus filamentos</h2>
          <p className="hint">Preço pago pelo rolo de 1 kg. Eles aparecem na lista da calculadora.</p>
          {catalogo.map(l => (
            <div className="cat-row" key={l.id}>
              <label>Nome
                <input placeholder="Ex.: PLA Matte" value={l.nome} onChange={e => mudarLinha(l.id, { nome: e.target.value })} />
              </label>
              <label>Preço do kg
                <CampoUnidade prefixo="R$" min={0} step={0.01} value={l.preco}
                  onChange={e => mudarLinha(l.id, { preco: e.target.value })} />
              </label>
              <button className="icon-btn" type="button" title="Remover" aria-label="Remover filamento"
                onClick={() => setCatalogo(cat => cat.filter(x => x.id !== l.id))}>×</button>
            </div>
          ))}
          <button className="btn ghost small" type="button"
            onClick={() => setCatalogo(cat => [...cat, { id: proximoId++, nome: '', preco: '' }])}>
            + Adicionar filamento
          </button>
        </div>
        <div className="actions">
          <button className="btn primary" type="button" onClick={salvar}>Salvar configurações</button>
        </div>
      </div>

      <aside className="card">
        <h2><span className="ico">☁</span>Conexão com a planilha</h2>
        <p className="hint">Cole o link do app da web gerado no Apps Script e a senha definida no código. Ficam guardados só neste navegador.</p>
        <div className="fields">
          <label className="full">Link do app da web
            <input type="url" placeholder="https://script.google.com/macros/s/.../exec" value={url} onChange={e => setUrl(e.target.value)} />
          </label>
          <label className="full">Senha
            <input type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} />
          </label>
        </div>
        <div className="actions" style={{ marginTop: 14 }}>
          <button className="btn pink" type="button" onClick={() => aoConectar({ url: url.trim(), key })}>
            Conectar e testar
          </button>
        </div>
      </aside>
    </div>
  );
}

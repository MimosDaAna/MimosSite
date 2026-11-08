'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PADRAO } from '@/lib/calculo';
import { api, gravar, ler, PLANILHA_SENHA, PLANILHA_URL } from '@/lib/planilha';
import type { Conexao, Config, EntradaCalculo, ItemHistorico, StatusConexao, TipoAviso } from '@/lib/tipos';
import { AbaCalcular, entradaVazia } from './AbaCalcular';
import { AbaConfiguracoes } from './AbaConfiguracoes';
import { AbaHistorico } from './AbaHistorico';

type Aba = 'calc' | 'hist' | 'conf';

const ABAS: { id: Aba; nome: string }[] = [
  { id: 'calc', nome: 'Calcular' },
  { id: 'hist', nome: 'Histórico' },
  { id: 'conf', nome: 'Configurações' }
];

const TEXTO_STATUS: Record<StatusConexao, string> = {
  desconectado: 'Planilha não conectada',
  semSenha: 'Falta a senha da planilha',
  conectando: 'Conectando...',
  ok: 'Planilha conectada',
  err: 'Erro na conexão'
};

export function Calculadora() {
  const [aba, setAba] = useState<Aba>('calc');
  const [config, setConfig] = useState<Config>(PADRAO);
  const [conexao, setConexao] = useState<Conexao>({ url: '', key: '' });
  const [status, setStatus] = useState<StatusConexao>('desconectado');
  const [entrada, setEntrada] = useState<EntradaCalculo>(() => entradaVazia(PADRAO));
  const [historico, setHistorico] = useState<ItemHistorico[] | null>(null);
  const [toast, setToast] = useState({ msg: '', tipo: '' as TipoAviso, visivel: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const aviso = useCallback((msg: string, tipo: TipoAviso = '') => {
    setToast({ msg, tipo, visivel: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visivel: false })), 3200);
  }, []);

  /** Aplica uma configuração nova e leva multiplicador e taxa padrão para a calculadora. */
  const aplicarConfig = useCallback((novo: Config) => {
    setConfig(novo);
    gravar('mda.config', novo);
    setEntrada(e => ({ ...e, mult: String(novo.mult), taxa: String(novo.taxa) }));
  }, []);

  const conectar = useCallback(async (cx: Conexao, silencioso: boolean) => {
    if (!cx.url) { setStatus('desconectado'); return false; }
    setStatus('conectando');
    try {
      await api(cx, 'ping');
      setStatus('ok');
      const r = await api<{ config: Partial<Config> | null }>(cx, 'getConfig');
      if (r.config) aplicarConfig({ ...PADRAO, ...r.config });
      return true;
    } catch (e) {
      // O script ainda pede senha: avisa em vez de mostrar só "erro".
      setStatus(/senha/i.test((e as Error).message) ? 'semSenha' : 'err');
      if (!silencioso) aviso('Não conectou: ' + (e as Error).message, 'err');
      return false;
    }
  }, [aplicarConfig, aviso]);

  // Na abertura: lê o que ficou salvo neste navegador e tenta conectar.
  useEffect(() => {
    const c = { ...PADRAO, ...ler<Partial<Config>>('mda.config', {}) };
    const salva = ler<Conexao>('mda.conexao', { url: '', key: '' });
    // O link do código sempre vence: assim um link antigo salvo neste navegador
    // não "prende" a calculadora numa versão velha do script.
    const cx = { url: PLANILHA_URL || salva.url, key: salva.key || PLANILHA_SENHA };
    setConfig(c);
    setEntrada(entradaVazia(c));
    setConexao(cx);
    conectar(cx, true);
  }, [conectar]);

  async function salvarConfig(novo: Config) {
    aplicarConfig(novo);
    if (!conexao.url) { aviso('Configurações salvas neste navegador', 'ok'); return; }
    try {
      await api(conexao, 'saveConfig', { config: novo });
      aviso('Configurações salvas na planilha ♥', 'ok');
    } catch (e) {
      aviso('Salvas neste navegador, mas não na planilha: ' + (e as Error).message, 'err');
    }
  }

  async function novaConexao(cx: Conexao) {
    setConexao(cx);
    gravar('mda.conexao', cx);
    setHistorico(null);
    if (await conectar(cx, false)) aviso('Planilha conectada ♥', 'ok');
  }

  const categorias = [...new Set((historico ?? []).map(i => String(i.categoria || '').trim()).filter(Boolean))].sort();

  const classeStatus = status === 'ok' ? 'ok' : status === 'err' ? 'err' : '';

  return (
    <>
      <div className="wrap">
        <header>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src={`${process.env.NEXT_PUBLIC_BASE_PATH}/logo.jpg`} alt="Logo Mimos da Ana" />
          <div className="brand">
            <h1>Mimos da Ana</h1>
            <p>Calculadora de preços · impressão 3D</p>
          </div>
          <span className={`status ${classeStatus}`}>{TEXTO_STATUS[status]}</span>
        </header>

        <nav role="tablist">
          {ABAS.map(a => (
            <button key={a.id} role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)}>
              {a.nome}
            </button>
          ))}
        </nav>

        {aba === 'calc' && (
          <AbaCalcular
            config={config}
            conexao={conexao}
            entrada={entrada}
            setEntrada={setEntrada}
            aviso={aviso}
            aoSalvar={() => setHistorico(null)}
            categorias={categorias}
          />
        )}
        {aba === 'hist' && (
          <AbaHistorico conexao={conexao} historico={historico} setHistorico={setHistorico} aviso={aviso} categorias={categorias} />
        )}
        {aba === 'conf' && (
          <AbaConfiguracoes config={config} conexao={conexao} aoSalvarConfig={salvarConfig} aoConectar={novaConexao} />
        )}
      </div>
      <div className={`toast ${toast.visivel ? 'show' : ''} ${toast.tipo}`}>{toast.msg}</div>
    </>
  );
}

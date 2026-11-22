'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  apagarEncomenda, dataCurta, encomendasLocais, guardarLocais, hojeIso, listarEncomendas,
  normalizar, novoId, ordenar, progresso, salvarEncomenda,
  type Encomenda, type ItemEncomenda
} from '@/lib/encomendas';
import { brl, num } from '@/lib/formato';
import { useCarregarHistorico } from '@/lib/useHistorico';
import type { Conexao, ItemHistorico, TipoAviso } from '@/lib/tipos';
import { FotoProduto } from './FotoProduto';

interface Props {
  conexao: Conexao;
  historico: ItemHistorico[] | null;
  setHistorico: (h: ItemHistorico[] | null) => void;
  aviso: (msg: string, tipo?: TipoAviso) => void;
}

type Modo = 'carregando' | 'planilha' | 'local';
type Filtro = 'abertas' | 'prontas' | 'todas';

const SEM_FOTO = <span className="sem-foto" aria-hidden="true">✿</span>;

/* ───────────── Formulário ───────────── */

/** Linha do formulário: igual ao item, mas a quantidade fica como texto (input). */
type LinhaForm = Omit<ItemEncomenda, 'quantidade'> & { quantidade: string };

const linhaVazia = (): LinhaForm => ({
  id: novoId('IT'), nome: '', quantidade: '1', produtoId: '', foto: '', link: '', preco: 0, feito: false
});

/** Liga a linha ao cálculo com o mesmo nome (ou desliga, se não houver). */
function ligar(linha: LinhaForm, nome: string, produtos: Map<string, ItemHistorico>): LinhaForm {
  const p = produtos.get(nome.trim().toLowerCase());
  return p
    ? { ...linha, nome, produtoId: String(p.id), foto: String(p.foto || ''), link: String(p.link || ''), preco: num(p.precoFinal) }
    : { ...linha, nome, produtoId: '', foto: '', link: '', preco: 0 };
}

interface PropsForm {
  inicial: Encomenda | null;
  produtos: Map<string, ItemHistorico>;
  bloqueado: boolean;
  aoSalvar: (e: Encomenda) => void;
  cancelar: () => void;
}

function FormEncomenda({ inicial, produtos, bloqueado, aoSalvar, cancelar }: PropsForm) {
  const [cliente, setCliente] = useState(inicial?.cliente ?? '');
  const [entrega, setEntrega] = useState(inicial?.entrega ?? '');
  const [obs, setObs] = useState(inicial?.obs ?? '');
  const [linhas, setLinhas] = useState<LinhaForm[]>(() =>
    inicial?.itens.length ? inicial.itens.map(i => ({ ...i, quantidade: String(i.quantidade) })) : [linhaVazia()]
  );
  const [erro, setErro] = useState('');

  const mudar = (id: string, fn: (l: LinhaForm) => LinhaForm) =>
    setLinhas(ls => ls.map(l => (l.id === id ? fn(l) : l)));

  const validas = linhas.filter(l => l.nome.trim());
  const pecas = validas.reduce((s, l) => s + Math.max(1, Math.round(num(l.quantidade)) || 1), 0);

  function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (!cliente.trim()) { setErro('Escreva o nome do cliente.'); return; }
    if (!validas.length) { setErro('Coloque pelo menos um produto.'); return; }
    aoSalvar(normalizar({
      id: inicial?.id ?? novoId('ENC'),
      criada: inicial?.criada ?? new Date().toISOString(),
      cliente: cliente.trim(),
      entrega,
      obs: obs.trim(),
      itens: validas.map(l => ({ ...l, nome: l.nome.trim(), quantidade: Math.round(num(l.quantidade)) || 1 })),
      soLocal: true
    }));
  }

  return (
    <form className="card enc-form" onSubmit={enviar}>
      <h2><span className="ico">✎</span>{inicial ? 'Editar encomenda' : 'Nova encomenda'}</h2>
      <div className="fields">
        <label>Nome do cliente
          <input autoFocus placeholder="Ex.: Júlia Martins" value={cliente} onChange={e => setCliente(e.target.value)} />
        </label>
        <label><span>Entregar até <small>(opcional)</small></span>
          <input type="date" value={entrega} onChange={e => setEntrega(e.target.value)} />
        </label>
      </div>

      <div className="enc-produtos-topo">
        <span className="rotulo">Produtos</span>
        <span className="enc-contagem">
          {validas.length} {validas.length === 1 ? 'produto' : 'produtos'} · {pecas} {pecas === 1 ? 'peça' : 'peças'}
        </span>
      </div>
      <p className="hint">Comece a digitar: se o produto já estiver nos cálculos salvos, escolha na lista e ele vem com foto e preço.</p>

      <datalist id="enc-lista-produtos">
        {[...produtos.values()].map(p => <option key={p.id} value={String(p.produto)} />)}
      </datalist>

      {linhas.map(l => (
        <div className={`enc-linha ${l.produtoId ? 'ligada' : ''}`} key={l.id}>
          <span className="enc-thumb">{l.foto ? <FotoProduto url={l.foto} vazio={SEM_FOTO} /> : SEM_FOTO}</span>
          <label className="enc-nome">Produto
            <input list="enc-lista-produtos" placeholder="Nome do produto" value={l.nome}
              onChange={e => mudar(l.id, x => ligar(x, e.target.value, produtos))} />
            <small className="enc-vinculo">
              {l.produtoId ? `✓ Da sua lista · ${brl(l.preco)} cada` : l.nome.trim() ? 'Produto avulso (fora da lista)' : ' '}
            </small>
          </label>
          <label className="enc-qtd">Qtd.
            <input type="number" min={1} step={1} value={l.quantidade}
              onChange={e => mudar(l.id, x => ({ ...x, quantidade: e.target.value }))} />
          </label>
          <button className="icon-btn" type="button" aria-label="Tirar produto" title="Tirar produto"
            onClick={() => setLinhas(ls => (ls.length > 1 ? ls.filter(x => x.id !== l.id) : [linhaVazia()]))}>×</button>
        </div>
      ))}
      <button className="btn ghost small" type="button" onClick={() => setLinhas(ls => [...ls, linhaVazia()])}>
        + Adicionar produto
      </button>

      <label className="enc-obs"><span>Observações <small>(cores, recado, forma de entrega...)</small></span>
        <textarea value={obs} onChange={e => setObs(e.target.value)} />
      </label>

      {erro && <p className="enc-erro">{erro}</p>}
      <div className="actions">
        <button className="btn primary" type="submit" disabled={bloqueado}>
          {inicial ? 'Salvar alterações' : 'Criar encomenda'}
        </button>
        <button className="btn ghost" type="button" onClick={cancelar}>Cancelar</button>
      </div>
    </form>
  );
}

/* ───────────── Cartão da encomenda ───────────── */

interface PropsCartao {
  e: Encomenda;
  bloqueado: boolean;
  alternar: (itemId: string) => void;
  editar: () => void;
  apagar: () => void;
}

function CartaoEncomenda({ e, bloqueado, alternar, editar, apagar }: PropsCartao) {
  const { feitos, total, pecas, valor, pronta } = progresso(e);
  const atrasada = !pronta && !!e.entrega && e.entrega < hojeIso();

  return (
    <article className={`enc-cartao ${pronta ? 'pronta' : ''}`}>
      <div className="enc-cabeca">
        <div>
          <h3>{e.cliente}</h3>
          <p className="enc-meta">
            {e.entrega && <span className={`enc-data ${atrasada ? 'atrasada' : ''}`}>
              {atrasada ? 'Atrasada · ' : 'Entrega '}{dataCurta(e.entrega)}
            </span>}
            <span>{total} {total === 1 ? 'produto' : 'produtos'} · {pecas} {pecas === 1 ? 'peça' : 'peças'}</span>
            {valor > 0 && <span>{brl(valor)}</span>}
            {e.soLocal && <span className="enc-local" title="Ainda não foi para a planilha">só neste aparelho</span>}
          </p>
        </div>
        <div className="enc-botoes">
          <button className="icon-btn" type="button" title="Editar" aria-label={`Editar encomenda de ${e.cliente}`} onClick={editar}>✎</button>
          <button className="icon-btn" type="button" title="Apagar" aria-label={`Apagar encomenda de ${e.cliente}`} onClick={apagar}>×</button>
        </div>
      </div>

      <div className="enc-progresso" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={feitos}
        aria-label={`${feitos} de ${total} prontos`}>
        <span style={{ width: `${total ? (feitos / total) * 100 : 0}%` }} />
      </div>
      <p className="enc-status">{pronta ? '✓ Tudo pronto!' : `${feitos} de ${total} prontos`}</p>

      <ul className="enc-itens">
        {e.itens.map(i => (
          <li key={i.id} className={i.feito ? 'feito' : ''}>
            <label>
              <input type="checkbox" className="enc-check" checked={i.feito} disabled={bloqueado}
                onChange={() => alternar(i.id)} />
              <span className="enc-thumb">{i.foto ? <FotoProduto url={i.foto} vazio={SEM_FOTO} /> : SEM_FOTO}</span>
              <span className="enc-item-nome">
                <b>{i.quantidade > 1 && <em>{i.quantidade}×</em>}{i.nome}</b>
                {i.preco > 0 && <small>{brl(i.preco)} cada</small>}
              </span>
            </label>
            {/^https?:\/\//.test(i.link) && (
              <a className="enc-link" href={i.link} target="_blank" rel="noopener noreferrer" title="Abrir o modelo">↗</a>
            )}
          </li>
        ))}
      </ul>
      {e.obs && <p className="enc-obs-texto">{e.obs}</p>}
    </article>
  );
}

/* ───────────── Aba ───────────── */

export function AbaEncomendas({ conexao, historico, setHistorico, aviso }: Props) {
  useCarregarHistorico(conexao, historico, setHistorico);
  const [lista, setLista] = useState<Encomenda[]>([]);
  const [modo, setModo] = useState<Modo>('carregando');
  const [avisoModo, setAvisoModo] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('abertas');
  const [editando, setEditando] = useState<Encomenda | 'nova' | null>(null);
  const [recarga, setRecarga] = useState(0);
  /** Gravações na planilha em fila, para não chegarem fora de ordem. */
  const fila = useRef<Promise<unknown>>(Promise.resolve());

  /** Cálculos salvos por nome (o mais recente vence quando há nomes repetidos). */
  const produtos = useMemo(() => {
    const m = new Map<string, ItemHistorico>();
    for (const p of historico ?? []) {
      const chave = String(p.produto || '').trim().toLowerCase();
      if (chave && !m.has(chave)) m.set(chave, p);
    }
    return m;
  }, [historico]);

  useEffect(() => {
    let ativo = true;
    const locais = encomendasLocais().map(normalizar);
    setLista(locais);
    if (!conexao.url) {
      setModo('local');
      setAvisoModo('Planilha não conectada: as encomendas ficam salvas só neste aparelho.');
      return;
    }
    setModo('carregando');
    (async () => {
      try {
        const remotas = await listarEncomendas(conexao);
        // O que foi criado ou mudado sem planilha sobe agora.
        const pendentes = locais.filter(e => e.soLocal);
        for (const p of pendentes) await salvarEncomenda(conexao, p);
        if (!ativo) return;
        const ids = new Set(pendentes.map(p => p.id));
        const juntas = [...pendentes.map(p => ({ ...p, soLocal: false })), ...remotas.filter(r => !ids.has(r.id))];
        setLista(juntas);
        guardarLocais(juntas);
        setModo('planilha');
        setAvisoModo('');
        if (pendentes.length) aviso(`${pendentes.length} encomenda(s) deste aparelho enviada(s) para a planilha ♥`, 'ok');
      } catch (e) {
        if (!ativo) return;
        const msg = (e as Error).message;
        setModo('local');
        setAvisoModo(/desconhecida/i.test(msg)
          ? 'Para guardar as encomendas na planilha, atualize o Apps Script e publique uma Nova versão. Até lá, elas ficam salvas só neste aparelho.'
          : `Não deu para ler a planilha (${msg}). Mostrando o que está salvo neste aparelho.`);
      }
    })();
    return () => { ativo = false; };
  }, [conexao, aviso, recarga]);

  function atualizar(fn: (l: Encomenda[]) => Encomenda[]) {
    setLista(l => { const nova = fn(l); guardarLocais(nova); return nova; });
  }

  function gravar(e: Encomenda) {
    const marcada = { ...e, soLocal: true };
    atualizar(l => (l.some(x => x.id === e.id) ? l.map(x => (x.id === e.id ? marcada : x)) : [marcada, ...l]));
    if (modo !== 'planilha') return;
    fila.current = fila.current.then(async () => {
      try {
        await salvarEncomenda(conexao, marcada);
        atualizar(l => l.map(x => (x === marcada ? { ...x, soLocal: false } : x)));
      } catch (err) {
        aviso('Ficou salva só neste aparelho: ' + (err as Error).message, 'err');
      }
    });
  }

  function alternar(e: Encomenda, itemId: string) {
    const itens = e.itens.map(i => (i.id === itemId ? { ...i, feito: !i.feito } : i));
    const nova = { ...e, itens };
    gravar(nova);
    if (progresso(nova).pronta) aviso(`Encomenda de ${e.cliente} prontinha! ♥`, 'ok');
  }

  function apagar(e: Encomenda) {
    if (!confirm(`Apagar a encomenda de ${e.cliente}?`)) return;
    atualizar(l => l.filter(x => x.id !== e.id));
    if (modo !== 'planilha' || e.soLocal) return;
    fila.current = fila.current.then(() =>
      apagarEncomenda(conexao, e.id).catch(err => aviso('Não apagou da planilha: ' + (err as Error).message, 'err'))
    );
  }

  const bloqueado = modo === 'carregando';
  const ordenadas = ordenar(lista);
  const prontas = ordenadas.filter(e => progresso(e).pronta);
  const abertas = ordenadas.filter(e => !progresso(e).pronta);
  const visiveis = filtro === 'abertas' ? abertas : filtro === 'prontas' ? prontas : ordenadas;
  const pecasAbertas = abertas.reduce((s, e) => s + e.itens.filter(i => !i.feito).reduce((t, i) => t + i.quantidade, 0), 0);

  return (
    <div className="stack">
      {editando && (
        <FormEncomenda
          key={editando === 'nova' ? 'nova' : editando.id}
          inicial={editando === 'nova' ? null : editando}
          produtos={produtos}
          bloqueado={bloqueado}
          cancelar={() => setEditando(null)}
          aoSalvar={e => {
            gravar(e);
            aviso(editando === 'nova' ? `Encomenda de ${e.cliente} criada ♥` : 'Encomenda atualizada', 'ok');
            setEditando(null);
            setFiltro(f => (f === 'prontas' && !progresso(e).pronta ? 'abertas' : f));
          }}
        />
      )}

      <div className="card">
        <h2><span className="ico">✉</span>Encomendas</h2>
        <div className="toolbar enc-toolbar">
          <nav className="enc-filtros abas" aria-label="Filtrar encomendas">
            <button type="button" aria-pressed={filtro === 'abertas'} onClick={() => setFiltro('abertas')}>
              Em produção <span>{abertas.length}</span>
            </button>
            <button type="button" aria-pressed={filtro === 'prontas'} onClick={() => setFiltro('prontas')}>
              Prontas <span>{prontas.length}</span>
            </button>
            <button type="button" aria-pressed={filtro === 'todas'} onClick={() => setFiltro('todas')}>
              Todas <span>{lista.length}</span>
            </button>
          </nav>
          <button className="btn ghost small" type="button" disabled={bloqueado} onClick={() => setRecarga(n => n + 1)}>↻ Atualizar</button>
          <button className="btn primary small" type="button" onClick={() => setEditando('nova')}>+ Nova encomenda</button>
        </div>

        {avisoModo && <p className="enc-aviso">{avisoModo}</p>}
        {modo === 'carregando' && <p className="hint">Buscando as encomendas na planilha...</p>}
        {filtro === 'abertas' && pecasAbertas > 0 && (
          <p className="hint">Faltam {pecasAbertas} {pecasAbertas === 1 ? 'peça' : 'peças'} para imprimir.</p>
        )}

        {visiveis.length ? (
          <div className="enc-lista">
            {visiveis.map(e => (
              <CartaoEncomenda key={e.id} e={e} bloqueado={bloqueado}
                alternar={id => alternar(e, id)}
                editar={() => { setEditando(e); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                apagar={() => apagar(e)} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <b>{filtro === 'prontas' ? 'Nada pronto ainda' : 'Nenhuma encomenda aberta'}</b>
            {filtro === 'prontas' ? 'Marque os produtos feitos e a encomenda vem para cá.' : 'Clique em “+ Nova encomenda” para começar.'}
          </div>
        )}
      </div>
    </div>
  );
}

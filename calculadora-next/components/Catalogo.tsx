'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { carregarCatalogo, linkFaleConosco, linkWhatsapp } from '@/lib/catalogo';
import { brl } from '@/lib/formato';
import type { ItemCatalogo } from '@/lib/tipos';
import { FotoProduto } from './FotoProduto';
import { IconeWhatsapp } from './IconeWhatsapp';
import { TopoLoja } from './TopoLoja';

/** Sem nenhum produto marcado como destaque, a mesa mostra os mais novos. */
const DESTAQUES_PADRAO = 3;
/** Mesmo tempo da animação da peça "subindo" (oficina.css). */
const TROCA_MESA_MS = 5500;
const CORES_CARRETEL = ['#4fae66', '#ee9bb0', '#f4c95d', '#8fc9e8', '#c7a6e6', '#ff9f6b'];

/** Bichinho de reserva quando o produto não tem foto. */
function Bicho() {
  return (
    <svg className="lj-bicho" viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="58" rx="34" ry="28" fill="#fff" stroke="#1f3a2b" strokeWidth="3.5" />
      <circle cx="26" cy="34" r="11" fill="#fff" stroke="#1f3a2b" strokeWidth="3.5" />
      <circle cx="74" cy="34" r="11" fill="#fff" stroke="#1f3a2b" strokeWidth="3.5" />
      <circle cx="40" cy="55" r="3.6" fill="#1f3a2b" /><circle cx="60" cy="55" r="3.6" fill="#1f3a2b" />
      <circle cx="32" cy="64" r="4.5" fill="#ee9bb0" /><circle cx="68" cy="64" r="4.5" fill="#ee9bb0" />
      <path d="M45 64 q5 5 10 0" fill="none" stroke="#1f3a2b" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
const SEM_FOTO = <span className="lj-sem-foto"><Bicho /></span>;

function Carretel({ cor }: { cor: string }) {
  return (
    <svg viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="17" cy="17" r="15" fill={cor} stroke="#1f3a2b" strokeWidth="2.5" />
      <circle cx="17" cy="17" r="10" fill="none" stroke="#1f3a2b" strokeWidth="1" opacity=".35" />
      <circle cx="17" cy="17" r="5" fill="#fbf7ec" stroke="#1f3a2b" strokeWidth="2.5" />
    </svg>
  );
}

/** Endereço desta página apontando para o produto (vai na mensagem do WhatsApp). */
function usePaginaProduto(id: string) {
  const [pagina, setPagina] = useState('');
  useEffect(() => { setPagina(`${location.origin}${location.pathname}#produto-${id}`); }, [id]);
  return pagina;
}

function BotaoQuero({ p, texto = 'Quero', classe = 'lj-quero' }: { p: ItemCatalogo; texto?: string; classe?: string }) {
  const pagina = usePaginaProduto(p.id);
  return (
    <a className={classe} href={linkWhatsapp(p, pagina)} target="_blank" rel="noopener noreferrer"
      aria-label={`Pedir ${p.nome} pelo WhatsApp`}>
      {texto}
    </a>
  );
}

/** Faixa do topo: contador de camadas da peça que está "na impressora". */
function FilaImpressao({ nome }: { nome: string }) {
  const total = 210;
  const [camada, setCamada] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setCamada(total); return; }
    const t = setInterval(() => setCamada(c => (c >= total ? 0 : c + 3)), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="lj-fila" aria-hidden="true">
      <div className="lj-miolo">
        <span className="lj-ponto" />
        <span>IMPRIMINDO AGORA: <b>{nome}</b> · camada <b>{camada}</b>/{total}</span>
        <span className="lj-barra"><span style={{ width: `${(camada / total) * 100}%` }} /></span>
        <span className="lj-fila-dir">feito à mão, uma camada de cada vez</span>
      </div>
    </div>
  );
}

function Detalhes({ p, fechar }: { p: ItemCatalogo; fechar: () => void }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', tecla);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', tecla); document.body.style.overflow = ''; };
  }, [fechar]);

  return (
    <div className="lj-modal-fundo" onClick={fechar}>
      <div className="lj-modal" role="dialog" aria-modal="true" aria-label={p.nome} onClick={e => e.stopPropagation()}>
        <button className="lj-fechar" type="button" aria-label="Fechar" onClick={fechar}>×</button>
        <div className="lj-modal-foto"><FotoProduto url={p.foto} alt={p.nome} vazio={SEM_FOTO} /></div>
        <div className="lj-modal-info">
          <div className="lj-tags">
            {p.destaque && <span className="lj-chip">★ queridinho</span>}
            {p.categoria && <span className="lj-chip menta">{p.categoria}</span>}
          </div>
          <h2>{p.nome}</h2>
          <div className="lj-preco">{brl(p.preco)}</div>
          {p.descricao && <p className="lj-descricao">{p.descricao}</p>}
          <BotaoQuero p={p} classe="lj-botao verde" texto="Pedir pelo WhatsApp" />
        </div>
      </div>
    </div>
  );
}

function CardProduto({ p, abrir }: { p: ItemCatalogo; abrir: () => void }) {
  return (
    <article className="lj-card" id={`produto-${p.id}`}>
      {p.destaque && <span className="lj-chip lj-chip-card">★ queridinho</span>}
      <button type="button" className="lj-foto" onClick={abrir} aria-label={`Ver ${p.nome}`}>
        <FotoProduto url={p.foto} alt={p.nome} vazio={SEM_FOTO} />
      </button>
      <h3>{p.nome}</h3>
      {p.categoria && <span className="lj-categoria">{p.categoria}</span>}
      <div className="lj-rodape-card">
        <div className="lj-preco">{brl(p.preco)}</div>
        <BotaoQuero p={p} />
      </div>
    </article>
  );
}

/** A peça em destaque "sendo impressa" na mesa; troca a cada volta da animação. */
function Mesa({ destaques, abrir }: { destaques: ItemCatalogo[]; abrir: (p: ItemCatalogo) => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (destaques.length < 2) return;
    const t = setInterval(() => setI(n => (n + 1) % destaques.length), TROCA_MESA_MS);
    return () => clearInterval(t);
  }, [destaques.length]);
  const p = destaques[i % Math.max(1, destaques.length)];

  return (
    <div className="lj-mesa-caixa">
      <div className="lj-portico" aria-hidden="true" />
      <svg className="lj-bico" viewBox="0 0 54 60" aria-hidden="true">
        <rect x="3" y="2" width="48" height="30" rx="8" fill="#fff" stroke="#1f3a2b" strokeWidth="2.5" />
        <circle cx="16" cy="17" r="2.6" fill="#1f3a2b" /><circle cx="38" cy="17" r="2.6" fill="#1f3a2b" />
        <path d="M22 23 q5 4 10 0" fill="none" stroke="#1f3a2b" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="11" cy="23" r="3" fill="#ee9bb0" /><circle cx="43" cy="23" r="3" fill="#ee9bb0" />
        <path d="M20 32 h14 l-4 12 h-6 z" fill="#f4c95d" stroke="#1f3a2b" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M27 46 v10" stroke="#4fae66" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="lj-mesa">
        {p ? (
          <button type="button" key={p.id} className="lj-peca" onClick={() => abrir(p)} aria-label={`Ver ${p.nome}`}>
            <FotoProduto url={p.foto} alt="" vazio={SEM_FOTO} />
          </button>
        ) : <div className="lj-peca carregando" />}
      </div>
      <div className="lj-adesivo" aria-hidden="true">feito com amor ♥</div>
      {p && (
        <button type="button" className="lj-ficha" onClick={() => abrir(p)}>
          <span>{brl(p.preco)}</span><b>{p.nome}</b>
        </button>
      )}
    </div>
  );
}

function Carregando({ n }: { n: number }) {
  return (
    <div className="lj-vitrine" aria-busy="true" aria-label="Carregando produtos">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="lj-card carregando"><div className="lj-foto" /></div>
      ))}
    </div>
  );
}

const PASSOS = [
  { n: '01', titulo: 'Você escolhe', texto: 'do catálogo ou uma ideia sua', w: '100%', cor: 'var(--menta)' },
  { n: '02', titulo: 'A gente fatia', texto: 'cor, tamanho e prazo combinados', w: '90%', cor: '#fff' },
  { n: '03', titulo: 'A impressora trabalha', texto: 'camada por camada, por horas', w: '78%', cor: 'var(--rosa-claro)' },
  { n: '04', titulo: 'Acabamento e laço', texto: 'pronto pra presentear', w: '64%', cor: '#fff4d6' }
];

export function Catalogo() {
  const [produtos, setProdutos] = useState<ItemCatalogo[] | null>(null);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [aberto, setAberto] = useState<ItemCatalogo | null>(null);

  useEffect(() => {
    carregarCatalogo()
      .then(itens => {
        setProdutos(itens);
        // O link do WhatsApp aponta para #produto-ID: já abre o produto.
        const id = decodeURIComponent(location.hash.replace(/^#produto-/, ''));
        const alvo = id && itens.find(i => i.id === id);
        if (alvo) setAberto(alvo);
      })
      .catch(e => setErro((e as Error).message));
  }, []);

  const fechar = useCallback(() => setAberto(null), []);
  const lista = useMemo(() => produtos ?? [], [produtos]);
  const categorias = useMemo(() => [...new Set(lista.map(p => p.categoria).filter(Boolean))].sort(), [lista]);
  const destaques = useMemo(() => {
    const marcados = lista.filter(p => p.destaque);
    const base = marcados.length ? marcados : lista.slice(0, DESTAQUES_PADRAO);
    // Na mesa, os que têm foto ficam mais bonitos.
    const comFoto = base.filter(p => p.foto);
    return comFoto.length ? comFoto : base;
  }, [lista]);

  const termo = busca.trim().toLowerCase();
  const itens = lista.filter(p =>
    (!categoria || p.categoria === categoria) &&
    (!termo || `${p.nome} ${p.descricao} ${p.categoria}`.toLowerCase().includes(termo))
  );

  let vitrine;
  if (erro) {
    vitrine = <div className="lj-vazio"><b>Não foi possível carregar o catálogo</b>Tente de novo em instantes.</div>;
  } else if (!produtos) {
    vitrine = <Carregando n={6} />;
  } else if (!itens.length) {
    vitrine = (
      <div className="lj-vazio">
        <b>{lista.length ? 'Nada encontrado' : 'Em breve, novidades por aqui'}</b>
        {lista.length ? 'Tente outra palavra ou categoria.' : 'Ainda não há produtos no catálogo.'}
      </div>
    );
  } else {
    vitrine = (
      <div className="lj-vitrine">
        {itens.map(p => <CardProduto key={p.id} p={p} abrir={() => setAberto(p)} />)}
      </div>
    );
  }

  return (
    <div className="lj">
      <FilaImpressao nome={destaques[0]?.nome ?? 'um mimo novo'} />
      <div className="lj-miolo">
        <TopoLoja pagina="catalogo" subtitulo="ateliê de impressão 3D" />

        <section className="lj-abertura">
          <div>
            <h1>Mimos que nascem <span className="lj-camadas">camada por camada.</span></h1>
            <p className="lj-lead">Chaveiros, fidgets, enfeites e presentes impressos em 3D, nas cores que você escolher.</p>
            <div className="lj-acoes">
              <a className="lj-botao verde" href="#catalogo">Ver o catálogo</a>
              <Link className="lj-rabisco" href="/orcamento/">
                Quero um personalizado
                <svg viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 6 C 30 1, 50 9, 80 5 S 140 2, 198 6" fill="none" stroke="#ee9bb0" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </Link>
            </div>
          </div>
          <Mesa destaques={destaques} abrir={setAberto} />
        </section>

        <section className="lj-secao" id="catalogo" aria-labelledby="titulo-catalogo">
          <div className="lj-titulo">
            <h2 id="titulo-catalogo">{termo ? `Resultados para “${busca.trim()}”` : 'Saindo da impressora'}</h2>
            <span className="lj-contagem">
              {produtos ? `${itens.length} ${itens.length === 1 ? 'peça' : 'peças'} na vitrine` : 'carregando o catálogo…'}
            </span>
          </div>
          <div className="lj-filtros">
            <label className="lj-busca">
              <span className="sr-only">Buscar no catálogo</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
              <input type="search" placeholder="Procurar uma peça…" value={busca} onChange={e => setBusca(e.target.value)} />
            </label>
            {categorias.length > 1 && (
              <div className="lj-carreteis" role="group" aria-label="Categorias">
                <button type="button" className="lj-carretel" aria-pressed={!categoria} onClick={() => setCategoria('')}>
                  <Carretel cor="#fff" />Tudo
                </button>
                {categorias.map((c, i) => (
                  <button key={c} type="button" className="lj-carretel" aria-pressed={categoria === c}
                    onClick={() => setCategoria(categoria === c ? '' : c)}>
                    <Carretel cor={CORES_CARRETEL[i % CORES_CARRETEL.length]} />{c}
                  </button>
                ))}
              </div>
            )}
          </div>
          {vitrine}
        </section>

        <section className="lj-secao lj-nasce" id="como" aria-labelledby="titulo-como">
          <div>
            <div className="lj-titulo"><h2 id="titulo-como">Como nasce um mimo</h2></div>
            <p>Cada peça é escolhida, fatiada e impressa aqui, camada sobre camada. Depois ganha acabamento e vai embalada com carinho.</p>
          </div>
          <ol className="lj-pilha">
            {PASSOS.map(s => (
              <li key={s.n} className="lj-camada" style={{ '--w': s.w, '--c': s.cor } as React.CSSProperties}>
                <span className="lj-num">{s.n}</span><b>{s.titulo}</b><span>{s.texto}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="lj-secao" aria-labelledby="titulo-bilhete">
          <div className="lj-bilhete">
            <h2 id="titulo-bilhete">Tem uma ideia? A gente imprime.</h2>
            <p>Nome no chaveiro, a cor do time, um bichinho igual ao seu. Mande uma foto ou descreva, e respondemos com o orçamento.</p>
            <div className="lj-acoes">
              <Link className="lj-botao verde" href="/orcamento/">Pedir orçamento</Link>
              <a className="lj-botao" href={linkFaleConosco()} target="_blank" rel="noopener noreferrer">
                <IconeWhatsapp /> Falar no WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>

      <RodapeLoja />
      {aberto && <Detalhes p={aberto} fechar={fechar} />}
    </div>
  );
}

export function RodapeLoja() {
  return (
    <footer className="lj-rodape">
      <div className="lj-miolo">
        <b>Mimos da Ana</b>
        <span>impressão 3D · pedidos pelo WhatsApp</span>
      </div>
    </footer>
  );
}

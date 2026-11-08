'use client';

import { useEffect, useMemo, useState } from 'react';
import { brl } from '@/lib/formato';
import { linkWhatsapp, precoProduto, PRODUTOS, type Produto } from '@/lib/catalogo';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH;

function IconeWhatsapp() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5.01c0-5.19 4.23-9.42 9.42-9.42 2.52 0 4.88.98 6.66 2.76a9.36 9.36 0 0 1 2.76 6.67c0 5.19-4.23 9.41-9.43 9.41zm8.02-17.44A11.27 11.27 0 0 0 12.05.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.52 5.66L.62 23.25l5.65-1.48a11.3 11.3 0 0 0 5.78 1.47h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.01z"/>
    </svg>
  );
}

function BotaoWhatsapp({ p, texto }: { p: Produto; texto?: string }) {
  const [pagina, setPagina] = useState('');
  useEffect(() => { setPagina(`${location.origin}${location.pathname}#produto-${p.id}`); }, [p.id]);
  return (
    <a className="btn whatsapp" href={linkWhatsapp(p, precoProduto(p), pagina)} target="_blank" rel="noopener noreferrer"
      aria-label={`Pedir ${p.nome} pelo WhatsApp`}>
      <IconeWhatsapp />{texto}
    </a>
  );
}


function Detalhes({ p, fechar }: { p: Produto; fechar: () => void }) {
  const [foto, setFoto] = useState(0);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', tecla);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', tecla); document.body.style.overflow = ''; };
  }, [fechar]);

  return (
    <div className="modal-fundo" onClick={fechar}>
      <div className="modal card" role="dialog" aria-modal="true" aria-label={p.nome} onClick={e => e.stopPropagation()}>
        <button className="icon-btn fechar" type="button" aria-label="Fechar" onClick={fechar}>×</button>
        <div className="modal-grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="foto-grande" src={p.imagens[foto]} alt={p.nome} />
            {p.imagens.length > 1 && (
              <div className="miniaturas">
                {p.imagens.map((src, i) => (
                  <button key={src} type="button" className={i === foto ? 'ativa' : ''} onClick={() => setFoto(i)}
                    aria-label={`Foto ${i + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="modal-info">
            <div className="tags">{p.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
            <h2 className="produto-nome">{p.nome}</h2>
            <div className="preco-produto">{brl(precoProduto(p))}</div>
            <BotaoWhatsapp p={p} texto="Pedir pelo WhatsApp" />
            <p>{p.descricao}</p>
            <ul className="destaques">{p.destaques.map(d => <li key={d}>{d}</li>)}</ul>
            <ul className="lines">
              <li><span>Material</span><span>{[...new Set(p.perfil.filamentos.map(f => f.tipo))].join(', ')}</span></li>
            </ul>
            <p className="credito">
              Modelo de <a href={p.link} target="_blank" rel="noopener noreferrer">{p.designer}</a> no MakerWorld · {p.licenca}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Catalogo() {
  const [busca, setBusca] = useState('');
  const [tag, setTag] = useState('');
  const [aberto, setAberto] = useState<Produto | null>(null);

  const tags = useMemo(() => [...new Set(PRODUTOS.flatMap(p => p.tags))].sort(), []);
  const termo = busca.trim().toLowerCase();
  const itens = PRODUTOS.filter(p =>
    (!tag || p.tags.includes(tag)) &&
    (!termo || `${p.nome} ${p.descricao} ${p.tags.join(' ')}`.toLowerCase().includes(termo))
  );

  return (
    <div className="wrap">
      <header>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src={`${BASE}/logo.jpg`} alt="Logo Mimos da Ana" />
        <div className="brand">
          <h1>Mimos da Ana</h1>
          <p>Catálogo · peças impressas em 3D</p>
        </div>
        <span className="status ok">{PRODUTOS.length} {PRODUTOS.length === 1 ? 'produto' : 'produtos'}</span>
      </header>

      <div className="filtros">
        <input type="search" placeholder="Buscar no catálogo..." value={busca} onChange={e => setBusca(e.target.value)} />
        {tags.length > 1 && (
          <nav aria-label="Categorias">
            <button type="button" aria-pressed={!tag} onClick={() => setTag('')}>Todos</button>
            {tags.map(t => (
              <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(tag === t ? '' : t)}>{t}</button>
            ))}
          </nav>
        )}
      </div>

      {itens.length ? (
        <div className="vitrine">
          {itens.map(p => (
            <article className="produto card" key={p.id} id={`produto-${p.id}`}>
              <button type="button" className="produto-foto" onClick={() => setAberto(p)} aria-label={`Ver ${p.nome}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imagens[0]} alt={p.nome} loading="lazy" />
              </button>
              <div className="tags">{p.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}</div>
              <h2 className="produto-nome">{p.nome}</h2>
              <div className="produto-rodape">
                <div className="preco-produto">{brl(precoProduto(p))}</div>
                <BotaoWhatsapp p={p} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card empty"><b>Nada encontrado</b>Tente outra palavra ou categoria.</div>
      )}

      {aberto && <Detalhes p={aberto} fechar={() => setAberto(null)} />}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { carregarCatalogo, linkWhatsapp } from '@/lib/catalogo';
import { brl } from '@/lib/formato';
import type { ItemCatalogo } from '@/lib/tipos';
import { FotoProduto } from './FotoProduto';
import { IconeWhatsapp } from './IconeWhatsapp';
import { TopoLoja } from './TopoLoja';

const SEM_FOTO = <span className="sem-foto-grande" aria-hidden="true">✿</span>;
/** Sem nenhum produto marcado como destaque, mostra os mais novos. */
const DESTAQUES_PADRAO = 3;

function BotaoWhatsapp({ p, texto }: { p: ItemCatalogo; texto?: string }) {
  const [pagina, setPagina] = useState('');
  useEffect(() => { setPagina(`${location.origin}${location.pathname}#produto-${p.id}`); }, [p.id]);
  return (
    <a className="btn whatsapp" href={linkWhatsapp(p, pagina)} target="_blank" rel="noopener noreferrer"
      aria-label={`Pedir ${p.nome} pelo WhatsApp`}>
      <IconeWhatsapp />{texto}
    </a>
  );
}

/** Tags do produto: "★ Destaque" (se marcado) e a categoria. */
function Tags({ p }: { p: ItemCatalogo }) {
  if (!p.destaque && !p.categoria) return null;
  return (
    <div className="tags">
      {p.destaque && <span className="tag destaque">★ Destaque</span>}
      {p.categoria && <span className="tag">{p.categoria}</span>}
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
    <div className="modal-fundo" onClick={fechar}>
      <div className="modal card" role="dialog" aria-modal="true" aria-label={p.nome} onClick={e => e.stopPropagation()}>
        <button className="icon-btn fechar" type="button" aria-label="Fechar" onClick={fechar}>×</button>
        <div className="modal-grid">
          <div className="foto-grande"><FotoProduto url={p.foto} alt={p.nome} vazio={SEM_FOTO} /></div>
          <div className="modal-info">
            <Tags p={p} />
            <h2 className="produto-nome">{p.nome}</h2>
            <div className="preco-produto">{brl(p.preco)}</div>
            <BotaoWhatsapp p={p} texto="Pedir pelo WhatsApp" />
            {p.descricao && <p className="descricao">{p.descricao}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Card do produto. `grande` = versão da faixa de destaques. */
function CardProduto({ p, abrir, grande = false }: { p: ItemCatalogo; abrir: () => void; grande?: boolean }) {
  return (
    <article className={`produto card ${grande ? 'grande' : ''}`} id={grande ? undefined : `produto-${p.id}`}>
        <button type="button" className="produto-foto" onClick={abrir} aria-label={`Ver ${p.nome}`}>
          <FotoProduto url={p.foto} alt={p.nome} vazio={SEM_FOTO} />
        </button>
        <Tags p={p} />
        <h3 className="produto-nome">{p.nome}</h3>
        {grande && p.descricao && <p className="produto-resumo">{p.descricao}</p>}
        <div className="produto-rodape">
          <div className="preco-produto">{brl(p.preco)}</div>
          <BotaoWhatsapp p={p} texto={grande ? 'Pedir' : undefined} />
        </div>
    </article>
  );
}

function Carregando({ n }: { n: number }) {
  return (
    <div className="vitrine" aria-busy="true" aria-label="Carregando produtos">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="produto card carregando"><div className="produto-foto" /></div>
      ))}
    </div>
  );
}

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
    return marcados.length ? marcados : lista.slice(0, DESTAQUES_PADRAO);
  }, [lista]);

  const termo = busca.trim().toLowerCase();
  const itens = lista.filter(p =>
    (!categoria || p.categoria === categoria) &&
    (!termo || `${p.nome} ${p.descricao} ${p.categoria}`.toLowerCase().includes(termo))
  );

  let catalogo;
  if (erro) {
    catalogo = <div className="card empty"><b>Não foi possível carregar o catálogo</b>Tente de novo em instantes.</div>;
  } else if (!produtos) {
    catalogo = <Carregando n={3} />;
  } else if (!itens.length) {
    catalogo = (
      <div className="card empty">
        <b>{lista.length ? 'Nada encontrado' : 'Em breve, novidades por aqui ✿'}</b>
        {lista.length ? 'Tente outra palavra ou categoria.' : 'Ainda não há produtos no catálogo.'}
      </div>
    );
  } else {
    catalogo = (
      <div className="vitrine">
        {itens.map(p => <CardProduto key={p.id} p={p} abrir={() => setAberto(p)} />)}
      </div>
    );
  }

  // Durante a busca, os destaques saem da frente para os resultados aparecerem logo.
  const mostrarDestaques = !termo && !erro && (!produtos || destaques.length > 0);

  return (
    <div className="wrap loja">
      <TopoLoja
        pagina="catalogo"
        subtitulo="Catálogo · peças impressas em 3D"
        busca={{ valor: busca, mudar: setBusca }}
      />

      {mostrarDestaques && (
        <section className="secao" aria-labelledby="titulo-destaques">
          <h2 className="titulo-secao" id="titulo-destaques"><span aria-hidden="true">★</span> Produtos em destaque</h2>
          {produtos ? (
            <div className="vitrine destaques">
              {destaques.map(p => <CardProduto key={p.id} p={p} grande abrir={() => setAberto(p)} />)}
            </div>
          ) : <Carregando n={2} />}
        </section>
      )}

      <section className="secao" aria-labelledby="titulo-catalogo">
        <h2 className="titulo-secao" id="titulo-catalogo">
          <span aria-hidden="true">✿</span> {termo ? `Resultados para “${busca.trim()}”` : 'Catálogo'}
        </h2>
        {categorias.length > 1 && (
          <nav className="categorias" aria-label="Categorias">
            <button type="button" aria-pressed={!categoria} onClick={() => setCategoria('')}>Todos</button>
            {categorias.map(c => (
              <button key={c} type="button" aria-pressed={categoria === c}
                onClick={() => setCategoria(categoria === c ? '' : c)}>{c}</button>
            ))}
          </nav>
        )}
        {catalogo}
      </section>

      {aberto && <Detalhes p={aberto} fechar={fechar} />}
    </div>
  );
}

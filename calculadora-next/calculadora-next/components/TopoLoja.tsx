'use client';

import Link from 'next/link';
import { linkFaleConosco } from '@/lib/catalogo';
import { IconeWhatsapp } from './IconeWhatsapp';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH;

interface Props {
  subtitulo: string;
  /** Com busca: mostra a barra de pesquisa. Sem: mostra "Voltar ao catálogo". */
  busca?: { valor: string; mudar: (v: string) => void };
  /** Página atual, para marcar o botão. */
  pagina: 'catalogo' | 'orcamento';
}

/** Cabeçalho + barra com pesquisa, Fale conosco e Orçamento. */
export function TopoLoja({ subtitulo, busca, pagina }: Props) {
  return (
    <>
      <header className="topo-loja">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src={`${BASE}/logo.jpg`} alt="Logo Mimos da Ana" />
        <div className="brand">
          <h1>Mimos da Ana</h1>
          <p>{subtitulo}</p>
        </div>
      </header>

      <div className="barra-topo">
        {busca ? (
          <label className="busca">
            <span className="sr-only">Buscar no catálogo</span>
            <span className="lupa" aria-hidden="true">⌕</span>
            <input type="search" placeholder="Buscar no catálogo..." value={busca.valor}
              onChange={e => busca.mudar(e.target.value)} />
          </label>
        ) : (
          <Link className="btn ghost voltar" href="/">← Voltar ao catálogo</Link>
        )}
        <div className="barra-botoes">
          <a className="btn whatsapp" href={linkFaleConosco()} target="_blank" rel="noopener noreferrer">
            <IconeWhatsapp /> Fale conosco
          </a>
          <Link className="btn pink" href="/orcamento/" aria-current={pagina === 'orcamento' ? 'page' : undefined}>
            ✎ Orçamento
          </Link>
        </div>
      </div>
    </>
  );
}

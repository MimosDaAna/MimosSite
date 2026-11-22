'use client';

import Link from 'next/link';
import { linkFaleConosco } from '@/lib/catalogo';
import { IconeWhatsapp } from './IconeWhatsapp';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH;

interface Props {
  /** Linha pequena embaixo do nome (etiqueta em fonte de máquina). */
  subtitulo: string;
  /** Página atual, para marcar o link. */
  pagina: 'catalogo' | 'orcamento';
}

/** Cabeçalho da loja: marca, menu e botão do WhatsApp. */
export function TopoLoja({ subtitulo, pagina }: Props) {
  return (
    <header className="lj-topo">
      <Link className="lj-marca" href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${BASE}/logo.jpg`} alt="" />
        <span><b>Mimos da Ana</b><small>{subtitulo}</small></span>
      </Link>
      <nav className="lj-menu" aria-label="Seções">
        <Link href="/#catalogo" aria-current={pagina === 'catalogo' ? 'page' : undefined}>Catálogo</Link>
        <Link href="/#como">Como é feito</Link>
        <Link href="/orcamento/" aria-current={pagina === 'orcamento' ? 'page' : undefined}>Orçamento</Link>
      </nav>
      <a className="lj-botao zap" href={linkFaleConosco()} target="_blank" rel="noopener noreferrer">
        <IconeWhatsapp /><span>Chamar no zap</span>
      </a>
    </header>
  );
}

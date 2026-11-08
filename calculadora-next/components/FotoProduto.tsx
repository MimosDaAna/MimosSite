'use client';

import { useState, type ReactNode } from 'react';
import { fontesFoto } from '@/lib/foto';

interface Props {
  url: string;
  alt?: string;
  /** Mostrado quando não há foto ou nenhum endereço carregou. */
  vazio?: ReactNode;
}

/** Mostra a foto tentando cada endereço até um carregar. */
export function FotoProduto({ url, alt = '', vazio = null }: Props) {
  const fontes = fontesFoto(url);
  const [tentativa, setTentativa] = useState(0);
  const [chave, setChave] = useState(url);

  if (chave !== url) { setChave(url); setTentativa(0); }
  if (tentativa >= fontes.length) return <>{vazio}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={fontes[tentativa]}
      src={fontes[tentativa]}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setTentativa(t => t + 1)}
    />
  );
}

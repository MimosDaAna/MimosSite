'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { fontesFoto } from '@/lib/foto';

/** Se um endereço não carregar nesse tempo, tenta o próximo. */
const ESPERA_MS = 8000;

interface Props {
  url: string;
  alt?: string;
  /** Mostrado quando não há foto ou nenhum endereço carregou. */
  vazio?: ReactNode;
}

/** Mostra a foto tentando cada endereço até um carregar (por erro ou por demora). */
export function FotoProduto({ url, alt = '', vazio = null }: Props) {
  const fontes = fontesFoto(url);
  const [tentativa, setTentativa] = useState(0);
  const [chave, setChave] = useState(url);
  const carregou = useRef(false);

  if (chave !== url) { setChave(url); setTentativa(0); }

  const atual = fontes[tentativa];
  useEffect(() => {
    if (!atual) return;
    carregou.current = false;
    const t = setTimeout(() => { if (!carregou.current) setTentativa(n => n + 1); }, ESPERA_MS);
    return () => clearTimeout(t);
  }, [atual]);

  if (!atual) return <>{vazio}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={atual}
      src={atual}
      alt={alt}
      referrerPolicy="no-referrer"
      onLoad={() => { carregou.current = true; }}
      onError={() => setTentativa(n => n + 1)}
    />
  );
}

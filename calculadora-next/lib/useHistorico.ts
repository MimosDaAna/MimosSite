'use client';

import { useEffect, useState } from 'react';
import { api } from './planilha';
import type { Conexao, ItemHistorico } from './tipos';

/** Busca os cálculos salvos quando ainda não foram carregados (historico === null). */
export function useCarregarHistorico(
  conexao: Conexao,
  historico: ItemHistorico[] | null,
  setHistorico: (h: ItemHistorico[] | null) => void
) {
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!conexao.url || historico) return;
    let ativo = true;
    setErro('');
    api<{ itens: ItemHistorico[] }>(conexao, 'list', { limit: 200 })
      .then(r => { if (ativo) setHistorico(r.itens); })
      .catch(e => { if (ativo) setErro((e as Error).message); });
    return () => { ativo = false; };
  }, [conexao, historico, setHistorico]);

  return [erro, setErro] as const;
}

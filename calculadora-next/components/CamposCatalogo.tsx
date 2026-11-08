'use client';

import { useId } from 'react';

export interface DadosCatalogo {
  catalogo: boolean;
  descricao: string;
  categoria: string;
  destaque: boolean;
}

interface Props extends DadosCatalogo {
  mudar: (m: Partial<DadosCatalogo>) => void;
  /** Categorias já usadas, sugeridas ao digitar. */
  categorias?: string[];
}

/** "Mostrar no catálogo" + descrição e categoria que aparecem para o cliente. */
export function CamposCatalogo({ catalogo, descricao, categoria, destaque, mudar, categorias = [] }: Props) {
  const lista = useId();
  return (
    <div className="catalogo-campos full">
      <label className="check">
        <input type="checkbox" checked={catalogo} onChange={e => mudar({ catalogo: e.target.checked })} />
        <span>
          <b>Mostrar no catálogo</b>
          <small>Aparece no catálogo público com a foto, o nome e o preço final.</small>
        </span>
      </label>
      {catalogo && (
        <div className="fields">
          <label className="check full">
            <input type="checkbox" checked={destaque} onChange={e => mudar({ destaque: e.target.checked })} />
            <span>
              <b>★ Destacar no topo</b>
              <small>Aparece em “Produtos em destaque”, em tamanho maior.</small>
            </span>
          </label>
          <label className="full">Categoria (opcional)
            <input list={lista} placeholder="Ex.: Natal, Chaveiros, Decoração" value={categoria}
              onChange={e => mudar({ categoria: e.target.value })} />
            <datalist id={lista}>{categorias.map(c => <option key={c} value={c} />)}</datalist>
          </label>
          <label className="full">Descrição para o cliente (opcional)
            <textarea placeholder="Tamanho, cores disponíveis, para que serve..." value={descricao}
              onChange={e => mudar({ descricao: e.target.value })} />
          </label>
        </div>
      )}
    </div>
  );
}

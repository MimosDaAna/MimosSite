import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  /** Texto à esquerda do valor, ex.: "R$". */
  prefixo?: string;
  /** Texto à direita do valor, ex.: "g", "h", "%". */
  sufixo?: string;
};

/** Input numérico com a unidade desenhada dentro do campo. */
export function CampoUnidade({ prefixo, sufixo, ...props }: Props) {
  return (
    <div className={prefixo ? 'unit pre' : 'unit'}>
      {prefixo && <span>{prefixo}</span>}
      <input type="number" {...props} />
      {sufixo && <span>{sufixo}</span>}
    </div>
  );
}

export const brl = (v: number): string =>
  (Number.isFinite(v) ? v : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Converte texto de input em número, aceitando vírgula decimal. */
export const num = (v: unknown): number => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export const arred = (v: number, casas = 2): number => Math.round(v * 10 ** casas) / 10 ** casas;

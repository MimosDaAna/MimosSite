import type { Conexao } from './tipos';

/**
 * Link do app da web do Apps Script (termina em /exec). Com ele aqui, a página
 * já abre conectada em qualquer aparelho.
 */
export const PLANILHA_URL =
  'https://script.google.com/macros/s/AKfycbyYFBX7wBzpDgy6oBnpP-McXeg0oGuQVAJDLVBRR3kJbk3ZaAqj5Y7nfHGPaF8C7R0UAQ/exec';

/**
 * Senha enviada automaticamente. Fica vazia porque o script (Codigo.gs) está
 * com CHAVE = '' (sem senha). Se um dia colocar senha no script, NÃO a escreva
 * aqui: o site é público e qualquer pessoa conseguiria lê-la. Digite-a em
 * Configurações, uma vez em cada aparelho.
 */
export const PLANILHA_SENHA = '';

/** Guarda no navegador; falha em silêncio em aba anônima ou com o armazenamento bloqueado. */
export function ler<T>(chave: string, padrao: T): T {
  try {
    const v = localStorage.getItem(chave);
    return v ? (JSON.parse(v) as T) : padrao;
  } catch {
    return padrao;
  }
}

export function gravar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {}
}

/**
 * Chama o app da web do Apps Script. O corpo vai como text/plain (padrão do fetch
 * para string), o que evita a requisição de preflight que o Apps Script não atende.
 */
export async function api<T = Record<string, unknown>>(
  conexao: Conexao,
  action: string,
  extra: Record<string, unknown> = {}
): Promise<T> {
  if (!conexao.url) throw new Error('Planilha não conectada. Veja a aba Configurações.');
  const r = await fetch(conexao.url, {
    method: 'POST',
    body: JSON.stringify({ action, key: conexao.key, ...extra })
  });
  const dados = await r.json();
  if (!dados.ok) throw new Error(dados.erro || 'Erro na planilha');
  return dados as T;
}

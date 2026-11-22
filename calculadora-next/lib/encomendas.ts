import { api, gravar, ler } from './planilha';
import type { Conexao } from './tipos';

/** Um produto dentro da encomenda. */
export interface ItemEncomenda {
  id: string;
  nome: string;
  quantidade: number;
  /** ID do cálculo salvo a que este item está ligado ('' = produto avulso). */
  produtoId: string;
  /** Cópia da foto, link e preço do cálculo: continuam aparecendo se ele for apagado. */
  foto: string;
  link: string;
  preco: number;
  /** Já foi impresso / está pronto. */
  feito: boolean;
}

export interface Encomenda {
  id: string;
  cliente: string;
  /** Data combinada para entregar (AAAA-MM-DD) ou ''. */
  entrega: string;
  obs: string;
  /** Quando foi criada (ISO). */
  criada: string;
  itens: ItemEncomenda[];
  /** Ainda não chegou à planilha (só está neste aparelho). */
  soLocal?: boolean;
}

const CHAVE_LOCAL = 'mda.encomendas';

export const encomendasLocais = (): Encomenda[] => ler<Encomenda[]>(CHAVE_LOCAL, []);
export const guardarLocais = (lista: Encomenda[]): void => gravar(CHAVE_LOCAL, lista);

export const novoId = (prefixo: string): string =>
  `${prefixo}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export async function listarEncomendas(cx: Conexao): Promise<Encomenda[]> {
  const r = await api<{ itens: Encomenda[] }>(cx, 'listEncomendas');
  return r.itens.map(normalizar);
}

export async function salvarEncomenda(cx: Conexao, e: Encomenda): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { soLocal, ...dados } = e;
  await api(cx, 'saveEncomenda', { data: dados });
}

export async function apagarEncomenda(cx: Conexao, id: string): Promise<void> {
  await api(cx, 'deleteEncomenda', { id });
}

/** Garante os tipos certos no que veio da planilha ou do navegador. */
export function normalizar(e: Partial<Encomenda>): Encomenda {
  return {
    id: String(e.id ?? novoId('ENC')),
    cliente: String(e.cliente ?? ''),
    entrega: String(e.entrega ?? ''),
    obs: String(e.obs ?? ''),
    criada: String(e.criada ?? new Date().toISOString()),
    soLocal: !!e.soLocal,
    itens: (e.itens ?? []).map(i => ({
      id: String(i.id ?? novoId('IT')),
      nome: String(i.nome ?? ''),
      quantidade: Math.max(1, Math.round(Number(i.quantidade) || 1)),
      produtoId: String(i.produtoId ?? ''),
      foto: String(i.foto ?? ''),
      link: String(i.link ?? ''),
      preco: Number(i.preco) || 0,
      feito: !!i.feito
    }))
  };
}

export function progresso(e: Encomenda) {
  const feitos = e.itens.filter(i => i.feito).length;
  const total = e.itens.length;
  const pecas = e.itens.reduce((s, i) => s + i.quantidade, 0);
  const valor = e.itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
  return { feitos, total, pecas, valor, pronta: total > 0 && feitos === total };
}

/** Abertas primeiro (entrega mais próxima no topo), depois as prontas. */
export function ordenar(lista: Encomenda[]): Encomenda[] {
  return [...lista].sort((a, b) => {
    const pa = progresso(a).pronta, pb = progresso(b).pronta;
    if (pa !== pb) return pa ? 1 : -1;
    if (!pa && a.entrega !== b.entrega) {
      if (!a.entrega) return 1;
      if (!b.entrega) return -1;
      return a.entrega < b.entrega ? -1 : 1;
    }
    return a.criada < b.criada ? 1 : -1;
  });
}

/** "25/11" a partir de "2026-11-25". */
export function dataCurta(iso: string): string {
  const [, m, d] = iso.split('-');
  return d && m ? `${d}/${m}` : iso;
}

export function hojeIso(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`;
}

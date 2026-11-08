import { calcular, OUTRO, PADRAO } from './calculo';
import type { Config } from './tipos';

/**
 * Produtos do catálogo, copiados da coleção pública do MakerWorld:
 * https://makerworld.com/pt/collections/39263028-catalog
 *
 * O site não consegue ler o MakerWorld sozinho (o MakerWorld bloqueia),
 * então, ao adicionar um modelo na coleção, inclua um item novo aqui.
 */
/**
 * Número do WhatsApp que recebe os pedidos: só dígitos, com 55 + DDD.
 * Ex.: '5511912345678'. Vazio = o WhatsApp pede para escolher o contato.
 */
export const WHATSAPP = '5513996675721';

export interface FilamentoProduto {
  tipo: string;
  /** Cor em hexadecimal, como aparece no perfil de impressão. */
  cor: string;
  gramas: number;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  destaques: string[];
  tags: string[];
  imagens: string[];
  /** Perfil de impressão usado para calcular o preço. */
  perfil: { nome: string; segundos: number; filamentos: FilamentoProduto[] };
  designer: string;
  licenca: string;
  link: string;
  /** Use para fixar um preço diferente do calculado. */
  precoManual?: number;
}

const IMG = 'https://makerworld.bblmw.com/makerworld/model/US5b4d59e85f2adc/design/';

export const PRODUTOS: Produto[] = [
  {
    id: 2305926,
    nome: 'Esqueleto Wither articulado (Minecraft)',
    descricao:
      'Esqueleto Wither com braços, pernas e cabeça móveis, inspirado no brinquedo oficial do Minecraft. Vem com a espada do jogo, que encaixa em qualquer uma das mãos.',
    destaques: [
      'Totalmente articulado',
      'Relevo e textura na cabeça e no corpo',
      'Espada encaixa nos dois braços',
      'Impresso em 4 cores'
    ],
    tags: ['Minecraft', 'Articulado', 'Games'],
    imagens: [
      IMG + '41d3e87b3373bda5.png',
      IMG + '63e83d54363851c9.png',
      IMG + '083b88a6b15837f6.png',
      IMG + '519df17f9a198505.png',
      IMG + 'b90a82446516a207.png'
    ],
    perfil: {
      nome: '0,2 mm, 2 paredes, 15% de preenchimento',
      segundos: 8931,
      filamentos: [
        { tipo: 'PLA', cor: '#545454', gramas: 29 },
        { tipo: 'PLA', cor: '#000000', gramas: 7 },
        { tipo: 'PLA', cor: '#FFFFFF', gramas: 4 },
        { tipo: 'PLA', cor: '#6F5034', gramas: 4 }
      ]
    },
    designer: 'RoboDIYer',
    licenca: 'Standard Digital File License',
    link: 'https://makerworld.com/pt/models/2305926-minecraft-wither-skeleton-articulated'
  }
];

/** Preço pela mesma fórmula da calculadora, com os valores padrão. */
export function precoProduto(p: Produto, config: Config = PADRAO): number {
  if (p.precoManual) return p.precoManual;
  const precoKg = (tipo: string) =>
    config.filamentos.find(f => f.nome.toLowerCase().startsWith(tipo.toLowerCase()))?.preco
    ?? config.filamentos[0]?.preco ?? 0;
  const horas = p.perfil.segundos / 3600;
  return calcular({
    produto: p.nome, link: p.link, quantidade: '1', obs: '',
    horas: String(Math.floor(horas)), minutos: String((horas % 1) * 60),
    mult: String(config.mult), taxa: '0',
    filamentos: p.perfil.filamentos.map((f, i) => ({
      id: i, nome: OUTRO, preco: String(precoKg(f.tipo)), gramas: String(f.gramas)
    })),
    foto: ''
  }, config).precoFinal;
}

/** Link que abre a conversa no WhatsApp com o produto já escrito. */
export function linkWhatsapp(p: Produto, preco: number, paginaProduto: string): string {
  const valor = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const texto = `Olá, Mimos da Ana! 🐘\nTenho interesse neste produto:\n*${p.nome}* (${valor})\n${paginaProduto}`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

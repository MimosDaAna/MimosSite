import { PLANILHA_URL } from './planilha';
import type { ItemCatalogo } from './tipos';

/**
 * Número do WhatsApp que recebe os pedidos: só dígitos, com 55 + DDD.
 * Ex.: '5511912345678'. Vazio = o WhatsApp pede para escolher o contato.
 */
export const WHATSAPP = '5513996675721';

/**
 * Busca na planilha os produtos marcados com "Mostrar no catálogo".
 * O cadastro é feito na calculadora (aba Calcular ou Histórico → ✎ editar).
 * Esta ação do script é pública e não devolve custos, só nome, foto, preço,
 * descrição e categoria.
 */
export async function carregarCatalogo(): Promise<ItemCatalogo[]> {
  const r = await fetch(PLANILHA_URL, { method: 'POST', body: JSON.stringify({ action: 'catalogo' }) });
  const dados = await r.json();
  if (!dados.ok) throw new Error(dados.erro || 'Erro na planilha');
  return (dados.itens as ItemCatalogo[]).map(i => ({
    ...i,
    id: String(i.id),
    nome: String(i.nome ?? ''),
    preco: Number(i.preco) || 0,
    foto: String(i.foto ?? ''),
    descricao: String(i.descricao ?? ''),
    categoria: String(i.categoria ?? '').trim(),
    destaque: !!i.destaque
  }));
}

/** Link que abre a conversa no WhatsApp com o produto já escrito. */
export function linkWhatsapp(p: ItemCatalogo, paginaProduto: string): string {
  const valor = p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const texto = `Olá, Mimos da Ana! 🐘\nTenho interesse neste produto:\n*${p.nome}* (${valor})\n${paginaProduto}`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

/** "Fale conosco": abre a conversa sem produto. */
export function linkFaleConosco(): string {
  const texto = 'Olá, Mimos da Ana! 🐘\nVim pelo catálogo e gostaria de falar com vocês.';
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

export interface PedidoOrcamento {
  nome: string;
  quantidade: number;
  descricao: string;
}

/** Mensagem do pedido de orçamento, com o número e o link da foto (se houver). */
export function linkOrcamento(p: PedidoOrcamento, numero: string, foto: string): string {
  const linhas = [
    'Olá, Mimos da Ana! 🐘',
    'Gostaria de um orçamento:',
    '',
    `*Nome:* ${p.nome}`,
    `*Quantidade:* ${p.quantidade} ${p.quantidade === 1 ? 'peça' : 'peças'}`,
    `*Descrição:* ${p.descricao}`
  ];
  if (foto) linhas.push(`*Foto:* ${foto}`);
  if (numero) linhas.push('', `Pedido ${numero}`);
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(linhas.join('\n'))}`;
}

/** Grava o pedido de orçamento na aba Orçamentos da planilha (ação pública do script). */
export async function enviarOrcamento(
  p: PedidoOrcamento, fotoBase64: string
): Promise<{ id: string; foto: string }> {
  const r = await fetch(PLANILHA_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'orcamento',
      data: { ...p, ...(fotoBase64 ? { fotoBase64, fotoTipo: 'image/jpeg' } : {}) }
    })
  });
  const dados = await r.json();
  if (!dados.ok) throw new Error(dados.erro || 'Erro na planilha');
  return { id: String(dados.id || ''), foto: String(dados.foto || '') };
}

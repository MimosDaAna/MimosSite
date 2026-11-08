import { arred, brl, num } from './formato';
import type { Config, DadosCalculo, EntradaCalculo } from './tipos';

export const PADRAO: Config = {
  valorHora: 0.77,
  watts: 220,
  kwh: 0.95,
  mult: 2,
  taxa: 0,
  filamentos: [
    { nome: 'PLA Basic', preco: 240 },
    { nome: 'PLA Silk', preco: 240 },
    { nome: 'PETG', preco: 240 }
  ]
};

export const OUTRO = '__outro';

export interface Resultado {
  custoFil: number;
  custoHoras: number;
  base: number;
  precoUn: number;
  precoFinal: number;
  taxa: number;
  qtd: number;
  gramas: number;
  dados: DadosCalculo;
}

/**
 * Custo base = filamento (R$/kg ÷ 1000 × gramas) + horas × valor por hora.
 * Preço = custo base × multiplicador; com taxa de venda, o preço sobe para
 * que o valor líquido depois da taxa continue o mesmo.
 */
export function calcular(e: EntradaCalculo, config: Config): Resultado {
  const fils = e.filamentos
    .map(f => ({ nome: f.nome === OUTRO ? 'Outro' : f.nome, preco: num(f.preco), gramas: num(f.gramas) }))
    .filter(f => f.gramas > 0);
  const gramas = fils.reduce((s, f) => s + f.gramas, 0);
  const custoFil = fils.reduce((s, f) => s + (f.preco / 1000) * f.gramas, 0);
  const horas = num(e.horas) + num(e.minutos) / 60;
  const custoHoras = horas * num(config.valorHora);
  const base = custoFil + custoHoras;
  const mult = Math.max(1, num(e.mult) || 1);
  const precoUn = base * mult;
  const taxa = Math.min(90, Math.max(0, num(e.taxa)));
  const precoFinal = taxa > 0 ? precoUn / (1 - taxa / 100) : precoUn;
  const qtd = Math.max(1, Math.round(num(e.quantidade)) || 1);

  return {
    custoFil, custoHoras, base, precoUn, precoFinal, taxa, qtd, gramas,
    dados: {
      produto: e.produto.trim(),
      link: e.link.trim(),
      quantidade: qtd,
      filamentos: fils.map(f => `${f.nome}: ${f.gramas} g a ${brl(f.preco)}/kg`).join(' | '),
      gramas: arred(gramas, 1),
      horas: arred(horas, 2),
      custoFilamento: arred(custoFil),
      custoHoras: arred(custoHoras),
      custoBase: arred(base),
      multiplicador: mult,
      precoUnitario: arred(precoUn),
      taxaMarketplace: taxa,
      precoFinal: arred(precoFinal),
      precoTotal: arred(precoFinal * qtd),
      observacoes: e.obs.trim()
    }
  };
}

export interface Filamento {
  nome: string;
  /** Preço do rolo de 1 kg, em R$. */
  preco: number;
}

export interface Config {
  /** Valor cobrado por hora de impressão, em R$. */
  valorHora: number;
  /** Consumo da impressora em W (só para referência). */
  watts: number;
  /** Tarifa de energia em R$/kWh (só para referência). */
  kwh: number;
  mult: number;
  /** Taxa de venda padrão, em %. */
  taxa: number;
  filamentos: Filamento[];
}

export interface Conexao {
  url: string;
  key: string;
}

/** Linha de filamento no formulário. Os valores ficam como texto, igual aos inputs. */
export interface LinhaFilamento {
  id: number;
  nome: string;
  preco: string;
  gramas: string;
}

export interface EntradaCalculo {
  produto: string;
  link: string;
  quantidade: string;
  obs: string;
  horas: string;
  minutos: string;
  mult: string;
  taxa: string;
  filamentos: LinhaFilamento[];
  /** Foto do produto: imagem já reduzida (data URL) ou link de uma imagem. */
  foto: string;
}

/** Formato gravado na planilha (mesmos nomes que o Apps Script espera). */
export interface DadosCalculo {
  produto: string;
  link: string;
  quantidade: number;
  filamentos: string;
  gramas: number;
  horas: number;
  custoFilamento: number;
  custoHoras: number;
  custoBase: number;
  multiplicador: number;
  precoUnitario: number;
  taxaMarketplace: number;
  precoFinal: number;
  precoTotal: number;
  observacoes: string;
  /** Foto enviada do aparelho (base64, sem o prefixo data:). */
  fotoBase64?: string;
  fotoTipo?: string;
  /** Ou um link de imagem já publicado. */
  fotoUrl?: string;
}

export interface ItemHistorico {
  id: string;
  data: string;
  produto: string;
  link: string;
  quantidade: number;
  filamentos: string;
  gramas: number;
  horas: number;
  custoBase: number;
  multiplicador: number;
  precoFinal: number;
  precoTotal: number;
  observacoes: string;
  foto: string;
}

export type TipoAviso = '' | 'ok' | 'err';
export type StatusConexao = 'desconectado' | 'semSenha' | 'conectando' | 'ok' | 'err';

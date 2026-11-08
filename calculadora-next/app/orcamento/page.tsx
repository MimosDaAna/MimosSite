import type { Metadata } from 'next';
import { Orcamento } from '@/components/Orcamento';

export const metadata: Metadata = {
  title: 'Mimos da Ana · Orçamento',
  description: 'Peça um orçamento de peça impressa em 3D sob medida'
};

export default function Page() {
  return <Orcamento />;
}

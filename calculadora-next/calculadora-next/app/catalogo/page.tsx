import type { Metadata } from 'next';
import { Catalogo } from '@/components/Catalogo';

export const metadata: Metadata = {
  title: 'Mimos da Ana · Catálogo',
  description: 'Catálogo de peças impressas em 3D da Mimos da Ana'
};

export default function Page() {
  return <Catalogo />;
}

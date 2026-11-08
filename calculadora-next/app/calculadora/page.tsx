import type { Metadata } from 'next';
import { Calculadora } from '@/components/Calculadora';

export const metadata: Metadata = {
  title: 'Mimos da Ana · Calculadora 3D',
  description: 'Calculadora de preços de impressão 3D da Mimos da Ana',
  // Página interna: pede aos buscadores para não listar.
  robots: { index: false, follow: false }
};

export default function Page() {
  return <Calculadora />;
}

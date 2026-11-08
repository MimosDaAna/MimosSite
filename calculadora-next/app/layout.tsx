import type { Metadata } from 'next';
import { Dancing_Script, Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-nunito' });
const dancing = Dancing_Script({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-dancing' });

export const metadata: Metadata = {
  title: 'Mimos da Ana · Calculadora 3D',
  description: 'Calculadora de preços de impressão 3D da Mimos da Ana',
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/logo.jpg` }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${dancing.variable}`}>
      <body>{children}</body>
    </html>
  );
}

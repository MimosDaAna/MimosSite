import type { Metadata } from 'next';
import { Figtree, Grandstander, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import './oficina.css';
import './loja.css';

// Fontes do design "oficina": títulos fofos, texto simples e etiquetas de máquina.
const grandstander = Grandstander({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--font-grand' });
const figtree = Figtree({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-figtree' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Mimos da Ana',
  description: 'Peças impressas em 3D da Mimos da Ana',
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH}/logo.jpg` }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${grandstander.variable} ${figtree.variable} ${mono.variable}`}>
      <body className="tema-oficina">{children}</body>
    </html>
  );
}

import type { NextConfig } from 'next';

// No GitHub Pages o site fica em /nome-do-repositorio; o workflow preenche BASE_PATH.
const basePath = process.env.BASE_PATH || '';

const nextConfig: NextConfig = {
  // Gera um site estático na pasta "out", que pode ser hospedado em qualquer lugar.
  output: 'export',
  // Cada página vira uma pasta com index.html (funciona melhor no GitHub Pages).
  trailingSlash: true,
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: { unoptimized: true }
};

export default nextConfig;

# Mimos da Ana · Calculadora 3D (Next.js)

Versão em Next.js + React + TypeScript da calculadora `index.html`. Mesmo visual, mesmas contas e a mesma ligação com a Planilha Google (usa o mesmo `Codigo.gs` do Apps Script).

## Rodar no computador

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Gerar o site para hospedar

```bash
npm run build
```

O site pronto fica na pasta **`out/`**. Ele é estático: dá para subir essa pasta no Netlify, GitHub Pages, Vercel ou qualquer hospedagem de arquivos.

Na Vercel também dá para importar o projeto direto do GitHub, sem rodar o build no seu computador.

## Publicar no GitHub Pages

O projeto já traz o workflow `.github/workflows/deploy.yml`, que gera e publica o site sozinho a cada envio para a branch `main`.

1. Crie um repositório no GitHub (ex.: `calculadora`) e envie todos os arquivos desta pasta, incluindo a pasta `.github`.
2. No repositório, vá em **Settings → Pages** e, em **Build and deployment → Source**, escolha **GitHub Actions**.
3. Vá na aba **Actions**: o workflow **Publicar no GitHub Pages** roda (se não rodar, clique nele e em **Run workflow**).
4. Quando ficar verde, o site estará em `https://SEU-USUARIO.github.io/calculadora/`.

O caminho do site (`/calculadora`) é ajustado automaticamente pelo nome do repositório.

## Estrutura

| Caminho | O que tem |
|---|---|
| `app/layout.tsx` | Fontes (Nunito e Dancing Script), título da aba e ícone. |
| `app/globals.css` | Todo o visual (cores da marca no topo, em `:root`). |
| `app/page.tsx` | Página inicial; só renderiza a calculadora. |
| `components/Calculadora.tsx` | Cabeçalho, abas, conexão com a planilha e avisos. |
| `components/AbaCalcular.tsx` | Formulário do produto, filamentos, tempo e o resumo do preço. |
| `components/AbaHistorico.tsx` | Lista dos cálculos salvos na planilha. |
| `components/AbaConfiguracoes.tsx` | Custos padrão, catálogo de filamentos e conexão. |
| `lib/calculo.ts` | **Valores padrão e a fórmula do preço.** |
| `lib/planilha.ts` | **Link fixo da planilha (`PLANILHA_URL`)**, chamadas ao Apps Script e armazenamento no navegador. |
| `components/CampoFoto.tsx` | Foto do produto: escolher do aparelho (reduzida para 1200 px) ou colar um link. |
| `apps-script/Codigo.gs` | Código para colar no Apps Script da planilha (grava as fotos no Drive). |
| `app/catalogo/page.tsx` | Página do catálogo. |
| `components/Catalogo.tsx` | Vitrine, busca, detalhes do produto e botão de WhatsApp. |
| `lib/catalogo.ts` | **Produtos do catálogo e número do WhatsApp.** |
| `public/logo.jpg` | Logo da marca. |
| `.github/workflows/deploy.yml` | Publicação automática no GitHub Pages. |

## Catálogo

Fica em `/catalogo/` (no GitHub Pages: `https://SEU-USUARIO.github.io/NOME-DO-REPO/catalogo/`). Mostra foto, preço e um botão de WhatsApp que abre a conversa com o nome, o preço e o link do produto já escritos.

- **Número do WhatsApp:** em `lib/catalogo.ts`, preencha `WHATSAPP` só com dígitos, com 55 e DDD (ex.: `'5511912345678'`).
- **Produtos:** ficam na lista `PRODUTOS`, no mesmo arquivo. O site não consegue ler o MakerWorld sozinho, então, ao adicionar um modelo na coleção, inclua um item novo na lista (ou peça ao Claude para ler a coleção e atualizar).
- **Preço:** calculado com a mesma fórmula e os valores padrão da calculadora (`PADRAO` em `lib/calculo.ts`). Para fixar outro valor num produto, use `precoManual`.
- **Fotos:** vêm direto do MakerWorld.

## Mudar os valores padrão

Em `lib/calculo.ts`, no objeto `PADRAO`:

```ts
valorHora: 0.77,   // R$ por hora de impressão
watts: 220,        // consumo da impressora (só referência)
kwh: 0.95,         // tarifa de energia (só referência)
mult: 2,           // cobrar o dobro do custo
filamentos: [{ nome: 'PLA Basic', preco: 240 }, ...]
```

Esses valores só valem até a primeira vez que você salva em **Configurações**. Depois disso, valem os da planilha.

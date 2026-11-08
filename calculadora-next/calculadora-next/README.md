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
| `app/page.tsx` | Página inicial: o **catálogo**. |
| `app/calculadora/page.tsx` | A **calculadora** (endereço `/calculadora/`, fora dos buscadores). |
| `app/orcamento/page.tsx` | Pedido de orçamento. |
| `app/catalogo/page.tsx` | Endereço antigo do catálogo, mantido para links já enviados. |
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
| `lib/catalogo.ts` | Busca os produtos do catálogo na planilha e **número do WhatsApp**. |
| `components/CamposCatalogo.tsx` | "Mostrar no catálogo", categoria e descrição. |
| `components/EditorCatalogo.tsx` | Edição de foto e catálogo de um cálculo já salvo (Histórico). |
| `components/FotoProduto.tsx` / `lib/foto.ts` | Mostra fotos do Drive com plano B. |
| `public/logo.jpg` | Logo da marca. |
| `.github/workflows/deploy.yml` | Publicação automática no GitHub Pages. |

## Catálogo

Fica na **página inicial** do site (o endereço antigo `/catalogo/` continua funcionando). A calculadora fica em `/calculadora/`. No topo: pesquisa, **Fale conosco** (WhatsApp) e **Orçamento**. Depois vem **Produtos em destaque** e o catálogo completo, com categorias, foto, preço e botão de WhatsApp.

- **Os produtos vêm da planilha.** Na calculadora, marque **Mostrar no catálogo** ao salvar um cálculo (com categoria e descrição opcionais). Para um cálculo já salvo, vá em **Histórico** e clique em **+ Catálogo · ✎ editar**: dá para ligar/desligar, trocar a foto, a categoria e a descrição.
- **Destaque:** marque **★ Destacar no topo** para o produto aparecer em "Produtos em destaque". Sem nenhum marcado, aparecem os 3 mais novos.
- **Preço:** o preço final do cálculo salvo.
- **Direto na planilha:** as colunas **No catálogo** (`Sim` ou vazio), **Descrição (catálogo)** e **Categoria** também podem ser editadas à mão.
- **Número do WhatsApp:** em `lib/catalogo.ts`, `WHATSAPP` (só dígitos, com 55 e DDD).
- A ação `catalogo` do Apps Script é pública e só devolve os produtos marcados, sem custos.

## Orçamento

Fica em `/orcamento/`. O cliente informa nome, quantidade, descrição com medidas e, se quiser, uma foto. O pedido vai para a aba **Orçamentos** da planilha (foto no Drive) e o WhatsApp abre com tudo preenchido. A coluna **Situação** começa como "Novo" para você acompanhar.

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

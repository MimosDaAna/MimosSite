/**
 * Mimos da Ana — Calculadora de Preços 3D
 * Script que liga a página (index.html) à Planilha Google.
 *
 * SENHA: deixe vazia ('') para a página conectar sozinha, sem pedir senha.
 * Atenção: sem senha, quem descobrir o link do app da web consegue ler,
 * gravar e apagar cálculos (dá para desfazer pelo histórico de versões
 * da planilha). Para exigir senha, coloque uma entre as aspas e digite
 * a mesma na página, em "Configurações".
 */
const CHAVE = '';

const ABA_CALCULOS = 'Cálculos';
const ABA_CONFIG = 'Configurações';
const PASTA_FOTOS = 'Mimos da Ana - Fotos';
const ABA_ORCAMENTOS = 'Orçamentos';
const COLUNAS_ORCAMENTO = ['ID', 'Data', 'Nome', 'Quantidade', 'Descrição', 'Foto', 'Situação'];

const COLUNAS = [
  'ID', 'Data', 'Produto', 'Link MakerWorld', 'Quantidade', 'Filamentos',
  'Gramas (un.)', 'Tempo (h)', 'Custo filamento', 'Custo horas', 'Custo base',
  'Multiplicador', 'Preço unitário', 'Taxa marketplace (%)', 'Preço final (un.)',
  'Preço total', 'Observações', 'Foto', 'No catálogo', 'Descrição (catálogo)', 'Categoria', 'Destaque'
];
const COL_FOTO = COLUNAS.indexOf('Foto');
const COL_NO_CATALOGO = COLUNAS.indexOf('No catálogo');
const COL_DESCRICAO = COLUNAS.indexOf('Descrição (catálogo)');
const COL_CATEGORIA = COLUNAS.indexOf('Categoria');
const COL_DESTAQUE = COLUNAS.indexOf('Destaque');
const COL_PRECO_FINAL = COLUNAS.indexOf('Preço final (un.)');

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    // O catálogo é público: só devolve os produtos marcados, sem custos.
    if (req.action === 'catalogo') return resposta(listarCatalogo());
    // Pedido de orçamento feito pelo cliente no catálogo: também é público.
    if (req.action === 'orcamento') return resposta(salvarOrcamento(req.data || {}));
    if (CHAVE && req.key !== CHAVE) return resposta({ ok: false, erro: 'Senha inválida' });

    switch (req.action) {
      case 'ping':       return resposta({ ok: true });
      case 'save':       return resposta(salvarCalculo(req.data));
      case 'list':       return resposta(listarCalculos(req.limit || 100));
      case 'delete':     return resposta(apagarCalculo(req.id));
      case 'editCatalogo': return resposta(editarCatalogo(req.id, req.data));
      case 'getConfig':  return resposta(lerConfig());
      case 'saveConfig': return resposta(salvarConfig(req.config));
      default:           return resposta({ ok: false, erro: 'Ação desconhecida' });
    }
  } catch (err) {
    return resposta({ ok: false, erro: String(err) });
  }
}

function doGet() {
  return resposta({ ok: true, mensagem: 'Calculadora Mimos da Ana conectada.' });
}

function salvarCalculo(d) {
  const aba = abaCalculos();
  const id = Utilities.getUuid().slice(0, 8);
  const foto = d.fotoBase64 ? salvarFoto(id, d.produto, d.fotoBase64, d.fotoTipo) : (d.fotoUrl || '');
  aba.appendRow([
    id, new Date(), d.produto, d.link, d.quantidade, d.filamentos,
    d.gramas, d.horas, d.custoFilamento, d.custoHoras, d.custoBase,
    d.multiplicador, d.precoUnitario, d.taxaMarketplace, d.precoFinal,
    d.precoTotal, d.observacoes, foto,
    d.catalogo ? 'Sim' : '', d.descricao || '', d.categoria || '', d.destaque ? 'Sim' : ''
  ]);
  return { ok: true, id: id, foto: foto };
}

/** Grava a foto no Drive, libera a visualização por link e devolve um endereço de imagem. */
function salvarFoto(id, produto, base64, tipo) {
  const mime = tipo || 'image/jpeg';
  const nome = id + ' - ' + (produto || 'produto') + '.' + (mime.split('/')[1] || 'jpg');
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, nome);
  const arquivo = pastaFotos().createFile(blob);
  arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?id=' + arquivo.getId() + '&sz=w1200';
}

function pastaFotos() {
  const pastas = DriveApp.getFoldersByName(PASTA_FOTOS);
  return pastas.hasNext() ? pastas.next() : DriveApp.createFolder(PASTA_FOTOS);
}

/** Manda para a lixeira do Drive a foto de um cálculo apagado (só as que este script gravou). */
function apagarFoto(url) {
  const m = String(url).match(/drive\.google\.com\/thumbnail\?id=([\w-]+)/);
  if (!m) return;
  try { DriveApp.getFileById(m[1]).setTrashed(true); } catch (err) {}
}

function listarCalculos(limite) {
  const aba = abaCalculos();
  const total = aba.getLastRow() - 1;
  if (total < 1) return { ok: true, itens: [] };
  const inicio = Math.max(2, aba.getLastRow() - limite + 1);
  const linhas = aba.getRange(inicio, 1, aba.getLastRow() - inicio + 1, COLUNAS.length).getValues();
  const itens = linhas.reverse().map(function (l) {
    return {
      id: l[0], data: l[1] instanceof Date ? l[1].toISOString() : l[1],
      produto: l[2], link: l[3], quantidade: l[4], filamentos: l[5],
      gramas: l[6], horas: l[7], custoBase: l[10], multiplicador: l[11],
      precoFinal: l[14], precoTotal: l[15], observacoes: l[16], foto: l[COL_FOTO],
      catalogo: marcado(l[COL_NO_CATALOGO]), descricao: l[COL_DESCRICAO], categoria: l[COL_CATEGORIA],
      destaque: marcado(l[COL_DESTAQUE])
    };
  });
  return { ok: true, itens: itens };
}

/** "Sim", "x", VERDADEIRO... qualquer marcação feita na página ou direto na planilha. */
function marcado(v) {
  return v === true || /^(sim|s|x|true|verdadeiro|1)$/i.test(String(v).trim());
}

/** Linha (1 = cabeçalho) do cálculo com esse ID, ou 0. */
function linhaDoId(aba, id) {
  const ids = aba.getRange(1, 1, aba.getLastRow(), 1).getValues();
  for (let i = ids.length - 1; i >= 1; i--) {
    if (String(ids[i][0]) === String(id)) return i + 1;
  }
  return 0;
}

/** Liga/desliga o produto no catálogo e troca descrição, categoria e foto. */
function editarCatalogo(id, d) {
  const aba = abaCalculos();
  const linha = linhaDoId(aba, id);
  if (!linha) return { ok: false, erro: 'Cálculo não encontrado' };
  aba.getRange(linha, COL_NO_CATALOGO + 1, 1, 4).setValues([[
    d.catalogo ? 'Sim' : '', d.descricao || '', d.categoria || '', d.catalogo && d.destaque ? 'Sim' : ''
  ]]);

  const celFoto = aba.getRange(linha, COL_FOTO + 1);
  let foto = celFoto.getValue();
  if (d.fotoBase64 || d.fotoUrl !== undefined) {
    const nova = d.fotoBase64
      ? salvarFoto(id, aba.getRange(linha, 3).getValue(), d.fotoBase64, d.fotoTipo)
      : d.fotoUrl;
    if (nova !== foto) { apagarFoto(foto); celFoto.setValue(nova); foto = nova; }
  }
  return { ok: true, foto: foto };
}

/** Produtos marcados para o catálogo, do mais novo para o mais antigo. Sem custos. */
function listarCatalogo() {
  const aba = abaCalculos();
  if (aba.getLastRow() < 2) return { ok: true, itens: [] };
  const linhas = aba.getRange(2, 1, aba.getLastRow() - 1, COLUNAS.length).getValues();
  const itens = linhas.reverse()
    .filter(function (l) { return l[0] && marcado(l[COL_NO_CATALOGO]); })
    .map(function (l) {
      return {
        id: String(l[0]), nome: l[2], preco: l[COL_PRECO_FINAL], foto: l[COL_FOTO],
        descricao: l[COL_DESCRICAO], categoria: String(l[COL_CATEGORIA] || '').trim(),
        destaque: marcado(l[COL_DESTAQUE])
      };
    });
  return { ok: true, itens: itens };
}

function apagarCalculo(id) {
  const aba = abaCalculos();
  const ids = aba.getRange(1, 1, aba.getLastRow(), 1).getValues();
  for (let i = ids.length - 1; i >= 1; i--) {
    if (String(ids[i][0]) === String(id)) {
      apagarFoto(aba.getRange(i + 1, COL_FOTO + 1).getValue());
      aba.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, erro: 'Cálculo não encontrado' };
}

function lerConfig() {
  const valor = abaConfig().getRange('B1').getValue();
  return { ok: true, config: valor ? JSON.parse(valor) : null };
}

function salvarConfig(config) {
  const aba = abaConfig();
  aba.getRange('A1:B1').setValues([['config', JSON.stringify(config)]]);
  return { ok: true };
}

function abaCalculos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aba = ss.getSheetByName(ABA_CALCULOS);
  if (!aba) {
    aba = ss.insertSheet(ABA_CALCULOS);
    aba.appendRow(COLUNAS);
    aba.getRange(1, 1, 1, COLUNAS.length)
      .setFontWeight('bold').setBackground('#cdeed8').setFontColor('#2f6b45');
    aba.setFrozenRows(1);
    aba.getRange('B:B').setNumberFormat('dd/mm/yyyy hh:mm');
    aba.getRange('I:K').setNumberFormat('R$ #,##0.00');
    aba.getRange('M:M').setNumberFormat('R$ #,##0.00');
    aba.getRange('O:P').setNumberFormat('R$ #,##0.00');
  } else {
    // Planilha criada antes de alguma coluna existir (Foto, catálogo...): acrescenta os cabeçalhos.
    const atual = aba.getRange(1, 1, 1, COLUNAS.length).getValues()[0];
    COLUNAS.forEach(function (nome, i) {
      if (atual[i] !== nome) {
        aba.getRange(1, i + 1).setValue(nome)
          .setFontWeight('bold').setBackground('#cdeed8').setFontColor('#2f6b45');
      }
    });
  }
  return aba;
}

/** Grava o pedido de orçamento (e a foto, se houver) na aba Orçamentos. */
function salvarOrcamento(d) {
  const nome = String(d.nome || '').trim().slice(0, 120);
  const descricao = String(d.descricao || '').trim().slice(0, 4000);
  const quantidade = Math.max(1, Math.min(100000, parseInt(d.quantidade, 10) || 1));
  if (!nome || !descricao) return { ok: false, erro: 'Preencha o nome e a descrição.' };
  // Foto já vem reduzida pela página; recusa arquivos grandes demais (~6 MB).
  if (d.fotoBase64 && String(d.fotoBase64).length > 8000000) return { ok: false, erro: 'Foto grande demais.' };

  const id = 'ORC-' + Utilities.getUuid().slice(0, 6).toUpperCase();
  const foto = d.fotoBase64 ? salvarFoto(id, 'orcamento ' + nome, d.fotoBase64, d.fotoTipo) : '';
  abaOrcamentos().appendRow([id, new Date(), nome, quantidade, descricao, foto, 'Novo']);
  return { ok: true, id: id, foto: foto };
}

function abaOrcamentos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aba = ss.getSheetByName(ABA_ORCAMENTOS);
  if (!aba) {
    aba = ss.insertSheet(ABA_ORCAMENTOS);
    aba.appendRow(COLUNAS_ORCAMENTO);
    aba.getRange(1, 1, 1, COLUNAS_ORCAMENTO.length)
      .setFontWeight('bold').setBackground('#fdeaf0').setFontColor('#c9617c');
    aba.setFrozenRows(1);
    aba.getRange('B:B').setNumberFormat('dd/mm/yyyy hh:mm');
  }
  return aba;
}

function abaConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(ABA_CONFIG) || ss.insertSheet(ABA_CONFIG);
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Rode esta função pelo editor para criar as abas e autorizar o script (planilha e Drive). */
function configurarPlanilha() {
  abaCalculos();
  abaConfig();
  abaOrcamentos();
  pastaFotos();
}

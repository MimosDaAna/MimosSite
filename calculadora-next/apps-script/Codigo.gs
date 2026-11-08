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

const COLUNAS = [
  'ID', 'Data', 'Produto', 'Link MakerWorld', 'Quantidade', 'Filamentos',
  'Gramas (un.)', 'Tempo (h)', 'Custo filamento', 'Custo horas', 'Custo base',
  'Multiplicador', 'Preço unitário', 'Taxa marketplace (%)', 'Preço final (un.)',
  'Preço total', 'Observações', 'Foto'
];
const COL_FOTO = COLUNAS.indexOf('Foto');

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (CHAVE && req.key !== CHAVE) return resposta({ ok: false, erro: 'Senha inválida' });

    switch (req.action) {
      case 'ping':       return resposta({ ok: true });
      case 'save':       return resposta(salvarCalculo(req.data));
      case 'list':       return resposta(listarCalculos(req.limit || 100));
      case 'delete':     return resposta(apagarCalculo(req.id));
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
    d.precoTotal, d.observacoes, foto
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
      precoFinal: l[14], precoTotal: l[15], observacoes: l[16], foto: l[COL_FOTO]
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
  } else if (aba.getRange(1, COL_FOTO + 1).getValue() !== 'Foto') {
    // Planilha criada antes da foto existir: acrescenta o cabeçalho da coluna nova.
    aba.getRange(1, COL_FOTO + 1).setValue('Foto')
      .setFontWeight('bold').setBackground('#cdeed8').setFontColor('#2f6b45');
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
  pastaFotos();
}

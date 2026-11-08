/** Tira o ID do arquivo de qualquer formato de link do Google Drive. */
export function idDrive(url: string): string | null {
  const s = String(url || '');
  if (!/drive\.google\.com|docs\.google\.com|googleusercontent\.com/.test(s)) return null;
  const m =
    s.match(/\/d\/([\w-]{20,})/) ||          // .../file/d/ID/view  e  lh3.../d/ID
    s.match(/[?&]id=([\w-]{20,})/);          // ...open?id=ID, uc?id=ID, thumbnail?id=ID
  return m ? m[1] : null;
}

/**
 * Endereços para mostrar a foto, do mais confiável para o menos.
 * Links do Drive (inclusive o de "compartilhar", que abre uma página e não uma imagem)
 * viram endereços diretos de imagem; outros links ficam como estão.
 */
export function fontesFoto(url: string): string[] {
  if (!url) return [];
  const id = idDrive(url);
  if (!id) return [url];
  // O "thumbnail" do Drive é o mais estável; o lh3 fica de reserva
  // (às vezes ele fica carregando sem dar erro, então não pode ser o primeiro).
  return [
    `https://drive.google.com/thumbnail?id=${id}&sz=w1200`,
    `https://lh3.googleusercontent.com/d/${id}=w1200`
  ];
}

/** Link para abrir a foto ao clicar: o arquivo no Drive ou o próprio endereço. */
export function linkFoto(url: string): string {
  const id = idDrive(url);
  return id ? `https://drive.google.com/file/d/${id}/view` : url;
}

'use client';

import { useState } from 'react';

const LADO_MAX = 1200;

/** Reduz a foto para no máximo 1200 px e converte em JPEG, para o envio à planilha ficar leve. */
export async function reduzirImagem(arquivo: File): Promise<string> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível ler a imagem.');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

interface Props {
  foto: string;
  setFoto: (foto: string) => void;
  aviso: (msg: string, tipo?: 'err') => void;
}

export function CampoFoto({ foto, setFoto, aviso }: Props) {
  const [lendo, setLendo] = useState(false);
  const daqui = foto.startsWith('data:');

  async function escolher(arquivo?: File) {
    if (!arquivo) return;
    setLendo(true);
    try {
      setFoto(await reduzirImagem(arquivo));
    } catch {
      aviso('Não consegui abrir essa imagem. Tente uma foto JPG ou PNG.', 'err');
    }
    setLendo(false);
  }

  return (
    <div className="foto-campo full">
      <div className="foto-previa">
        {foto
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={foto} alt="Foto do produto" onError={() => !daqui && aviso('Esse link não abriu uma imagem.', 'err')} />
          : <span>{lendo ? 'Carregando...' : 'Sem foto'}</span>}
      </div>
      <div className="foto-acoes">
        <span className="foto-titulo">Foto do produto</span>
        <div className="actions">
          <label className="btn ghost small">
            📷 {foto ? 'Trocar foto' : 'Escolher foto'}
            <input type="file" accept="image/*" hidden onChange={e => { escolher(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          {foto && <button className="btn ghost small" type="button" onClick={() => setFoto('')}>Remover</button>}
        </div>
        <label>ou cole o link de uma imagem
          <input type="url" placeholder="https://..." value={daqui ? '' : foto}
            disabled={daqui} onChange={e => setFoto(e.target.value.trim())} />
        </label>
      </div>
    </div>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { enviarOrcamento, linkOrcamento } from '@/lib/catalogo';
import { linkFoto } from '@/lib/foto';
import { reduzirImagem } from './CampoFoto';
import { IconeWhatsapp } from './IconeWhatsapp';
import { TopoLoja } from './TopoLoja';

interface Enviado {
  numero: string;
  whatsapp: string;
}

/** Pedido de orçamento: grava na planilha (aba Orçamentos) e abre o WhatsApp com o resumo. */
export function Orcamento() {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [descricao, setDescricao] = useState('');
  const [foto, setFoto] = useState('');
  const [lendoFoto, setLendoFoto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviado, setEnviado] = useState<Enviado | null>(null);

  async function escolherFoto(arquivo?: File) {
    if (!arquivo) return;
    setErro('');
    setLendoFoto(true);
    try {
      setFoto(await reduzirImagem(arquivo));
    } catch {
      setErro('Não consegui abrir essa imagem. Tente uma foto JPG ou PNG.');
    }
    setLendoFoto(false);
  }

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    const pedido = {
      nome: nome.trim(),
      quantidade: Math.max(1, Math.round(Number(quantidade) || 1)),
      descricao: descricao.trim()
    };
    if (!pedido.nome || !pedido.descricao) { setErro('Preencha seu nome e a descrição do produto.'); return; }

    setErro('');
    setEnviando(true);
    // Abre a aba já no clique (senão o navegador bloqueia como pop-up) e preenche depois.
    const aba = window.open('', '_blank');
    let numero = '';
    let linkDaFoto = '';
    try {
      const r = await enviarOrcamento(pedido, foto ? foto.split(',')[1] : '');
      numero = r.id;
      linkDaFoto = r.foto ? linkFoto(r.foto) : '';
    } catch {
      // Mesmo se a planilha falhar, o pedido segue pelo WhatsApp (só sem o link da foto).
    }
    const whatsapp = linkOrcamento(pedido, numero, linkDaFoto);
    if (aba) aba.location.href = whatsapp; else window.location.href = whatsapp;
    setEnviado({ numero, whatsapp });
    setEnviando(false);
  }

  function novo() {
    setNome(''); setQuantidade('1'); setDescricao(''); setFoto(''); setEnviado(null);
  }

  return (
    <div className="wrap loja">
      <TopoLoja pagina="orcamento" subtitulo="Orçamento · peças sob medida" />

      <section className="card orcamento orcamento-caixa" aria-labelledby="titulo-orcamento">
          {enviado ? (
            <div className="orcamento-ok" role="status">
              <span className="ok-icone" aria-hidden="true">♥</span>
              <h2 id="titulo-orcamento">Pedido enviado!</h2>
              <p>
                {enviado.numero && <>Seu pedido é o <b>{enviado.numero}</b>. </>}
                Abrimos o WhatsApp com tudo preenchido: é só tocar em <b>enviar</b> por lá.
              </p>
              <div className="acoes-ok">
                <a className="btn whatsapp" href={enviado.whatsapp} target="_blank" rel="noopener noreferrer">
                  <IconeWhatsapp /> Abrir o WhatsApp de novo
                </a>
                <button className="btn ghost" type="button" onClick={novo}>Fazer outro orçamento</button>
              </div>
            </div>
          ) : (
            <form onSubmit={enviar} noValidate>
              <h2 className="titulo-secao" id="titulo-orcamento"><span aria-hidden="true">✎</span> Peça seu orçamento</h2>
              <p className="hint">
                Conte como você imagina a peça. Respondemos pelo WhatsApp com o valor e o prazo.
              </p>

              <div className="fields">
                <label className="full">Seu nome
                  <input required autoComplete="name" placeholder="Como podemos te chamar?" value={nome}
                    onChange={e => setNome(e.target.value)} />
                </label>
                <label>Quantidade de peças
                  <input type="number" required min={1} step={1} inputMode="numeric" value={quantidade}
                    onChange={e => setQuantidade(e.target.value)} />
                </label>
                <label className="full">Como seria o produto?
                  <textarea required rows={5} value={descricao} onChange={e => setDescricao(e.target.value)}
                    placeholder={'Descreva a peça e as medidas que gostaria.\nEx.: chaveiro de coração com o nome “Ana”, 5 cm de largura, rosa e branco.'} />
                  <small className="dica">Inclua as dimensões (altura × largura × profundidade, em cm), cores e para que vai usar.</small>
                </label>

                <div className="full">
                  <span className="rotulo">Foto do produto (opcional)</span>
                  <label className={`envio-foto ${foto ? 'com-foto' : ''}`}>
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={e => { escolherFoto(e.target.files?.[0]); e.target.value = ''; }} />
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={foto} alt="Foto escolhida" />
                    ) : (
                      <span className="envio-vazio">
                        <span className="envio-icone" aria-hidden="true">📷</span>
                        <b>{lendoFoto ? 'Carregando...' : 'Toque para enviar uma foto'}</b>
                        <small>Uma referência, um desenho ou a peça que você quer</small>
                      </span>
                    )}
                  </label>
                  {foto && (
                    <button className="btn ghost small trocar" type="button" onClick={() => setFoto('')}>Remover foto</button>
                  )}
                </div>
              </div>

              {erro && <p className="erro" role="alert">{erro}</p>}

              <button className="btn primary enviar" type="submit" disabled={enviando || lendoFoto}>
                {enviando ? 'Enviando...' : <><IconeWhatsapp /> Enviar pedido de orçamento</>}
              </button>
            </form>
          )}
      </section>
    </div>
  );
}

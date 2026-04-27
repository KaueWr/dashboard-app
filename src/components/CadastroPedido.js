import React, { useState, useEffect } from 'react';

function CadastroPedido({ clientKey, onSuccess }) {

  const [artigos, setArtigos] = useState([]);
  const [form, setForm] = useState({
    cliente: '',
    representante: '',
    artigo: '',
    cor: '',
    quantidade: '',
    valor: '',
    status: '',
    data: '',
    observacao: ''
  });

  // 🔄 BUSCA ARTIGOS DA API
  useEffect(() => {
    fetch('/api/data', {
      headers: { 'x-api-key': clientKey }
    })
      .then(res => res.json())
      .then(data => {
        setArtigos(data.artigosCores || []);
      });
  }, []);

  const handleArtigoChange = (artigoSelecionado) => {
    const item = artigos.find(a => a.artigo === artigoSelecionado);

    setForm({
      ...form,
      artigo: artigoSelecionado,
      cor: item ? item.cor : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      tipo: "pedido",
      "CLIENTE": form.cliente,
      "REPRESENTANTE": form.representante,
      "PRODUTO": form.artigo,
      "COR": form.cor,
      "QUANTIDADE": form.quantidade,
      "VALOR": form.valor,
      "STATUS": form.status,
      "DATA PEDIDO": form.data,
      "OBSERVAÇÃO": form.observacao
    };

    await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': clientKey
      },
      body: JSON.stringify(payload)
    });

    alert("Pedido cadastrado!");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Cadastro de Pedido</h3>

      <input placeholder="Cliente" onChange={e => setForm({...form, cliente: e.target.value})} />
      <input placeholder="Representante" onChange={e => setForm({...form, representante: e.target.value})} />

      <select onChange={(e) => handleArtigoChange(e.target.value)}>
        <option value="">Selecione o artigo</option>
        {artigos.map((item, index) => (
          <option key={index} value={item.artigo}>
            {item.artigo}
          </option>
        ))}
      </select>

      <input value={form.cor} readOnly placeholder="Cor automática" />

      <input placeholder="Quantidade" onChange={e => setForm({...form, quantidade: e.target.value})} />
      <input placeholder="Valor" onChange={e => setForm({...form, valor: e.target.value})} />
      <input placeholder="Status" onChange={e => setForm({...form, status: e.target.value})} />

      <input type="date" onChange={e => setForm({...form, data: e.target.value})} />

      <textarea placeholder="Observação" onChange={e => setForm({...form, observacao: e.target.value})} />

      <button type="submit">Cadastrar Pedido</button>
    </form>
  );
}

export default CadastroPedido;
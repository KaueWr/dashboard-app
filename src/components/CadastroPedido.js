import React, { useState, useEffect } from 'react';

function CadastroPedido({ clientKey, onSuccess }) {

  const [artigos, setArtigos] = useState([]);
  const [success, setSuccess] = useState(false);

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

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);

    onSuccess();
  };

  const styles = {
    container: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '10px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    },
    title: {
      fontSize: '1.5rem',
      marginBottom: '1.5rem',
      fontWeight: 'bold'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1rem',
      marginBottom: '1rem'
    },
    input: {
      padding: '0.6rem',
      borderRadius: '6px',
      border: '1px solid #d1d5db'
    },
    textarea: {
      gridColumn: 'span 3',
      padding: '0.6rem',
      borderRadius: '6px',
      border: '1px solid #d1d5db'
    },
    button: {
      backgroundColor: '#10b981',
      color: 'white',
      padding: '0.7rem 1.5rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 'bold',
      marginTop: '1rem'
    },
    success: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      padding: '0.8rem',
      borderRadius: '6px',
      marginBottom: '1rem'
    }
  };

  return (
    <div style={styles.container}>

      <div style={styles.title}>Cadastro de Pedido</div>

      {success && (
        <div style={styles.success}>
          ✅ Pedido cadastrado com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div style={styles.grid}>
          <input style={styles.input} placeholder="Cliente"
            onChange={e => setForm({...form, cliente: e.target.value})} />

          <input style={styles.input} placeholder="Representante"
            onChange={e => setForm({...form, representante: e.target.value})} />

          <select style={styles.input}
            onChange={(e) => handleArtigoChange(e.target.value)}>
            <option value="">Selecione o artigo</option>
            {artigos.map((item, index) => (
              <option key={index} value={item.artigo}>
                {item.artigo}
              </option>
            ))}
          </select>

          <input style={styles.input} value={form.cor} readOnly placeholder="Cor" />

          <input style={styles.input} placeholder="Quantidade"
            onChange={e => setForm({...form, quantidade: e.target.value})} />

          <input style={styles.input} placeholder="Valor"
            onChange={e => setForm({...form, valor: e.target.value})} />

          <input style={styles.input} placeholder="Status"
            onChange={e => setForm({...form, status: e.target.value})} />

          <input style={styles.input} type="date"
            onChange={e => setForm({...form, data: e.target.value})} />
        </div>

        <textarea style={styles.textarea} placeholder="Observação"
          onChange={e => setForm({...form, observacao: e.target.value})} />

        <button type="submit" style={styles.button}>
          Cadastrar Pedido
        </button>

      </form>
    </div>
  );
}

export default CadastroPedido;
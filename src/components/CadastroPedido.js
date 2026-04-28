import React, { useState, useEffect } from 'react';

function CadastroPedido({ clientKey, onSuccess }) {

  // 🔥 ALTERADO
  const [produtos, setProdutos] = useState([]);
  const [cores, setCores] = useState([]);
  const [clientes, setClientes] = useState([]);

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

        // 🔥 ALTERADO
        setProdutos(data.produtos || []);
        setCores(data.cores || []);
        setClientes(data.clientes || []);

      });
  }, []);

  // 🔥 ALTERADO (agora pega preço)
  const handleArtigoChange = (artigoSelecionado) => {
    const item = produtos.find(p => p.artigo === artigoSelecionado);

    setForm({
      ...form,
      artigo: artigoSelecionado,
      valor: item ? item.preco : ''
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

  const styles = { /* 🔥 NÃO ALTERADO */ };

  return (
    <div style={styles.container}>

      <div style={styles.title}>Cadastro de Pedido</div>

      {success && (
        <div style={styles.success}>
          ✅ Pedido cadastrado com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* 🔥 CLIENTE AGORA DROPDOWN */}
        <div style={styles.group}>
          <label style={styles.label}>Cliente</label>
          <select style={styles.input}
            onChange={e => setForm({...form, cliente: e.target.value})}
          >
            <option value="">Selecione</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.group}>
          <label style={styles.label}>Representante</label>
          <input style={styles.input}
            onChange={e => setForm({...form, representante: e.target.value})}
          />
        </div>

        <div style={styles.row}>

          {/* 🔥 PRODUTO */}
          <div>
            <label style={styles.label}>Artigo</label>
            <select style={styles.input}
              onChange={(e) => handleArtigoChange(e.target.value)}>
              <option value="">Selecione</option>
              {produtos.map((item) => (
                <option key={item.id} value={item.artigo}>
                  {item.artigo}
                </option>
              ))}
            </select>
          </div>

          {/* 🔥 COR AGORA DROPDOWN */}
          <div>
            <label style={styles.label}>Cor</label>
            <select style={styles.input}
              onChange={e => setForm({...form, cor: e.target.value})}
            >
              <option value="">Selecione</option>
              {cores.map((c, index) => (
                <option key={index} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div style={styles.row}>

          <div>
            <label style={styles.label}>Quantidade</label>
            <input style={styles.input}
              onChange={e => setForm({...form, quantidade: e.target.value})}
            />
          </div>

          {/* 🔥 VALOR AUTOMÁTICO */}
          <div>
            <label style={styles.label}>Valor</label>
            <input style={styles.input}
              value={form.valor}
              readOnly
            />
          </div>

        </div>

        <div style={styles.row}>

          <div>
            <label style={styles.label}>Status</label>
            <input style={styles.input}
              onChange={e => setForm({...form, status: e.target.value})}
            />
          </div>

          <div>
            <label style={styles.label}>Data do Pedido</label>
            <input type="date" style={styles.input}
              onChange={e => setForm({...form, data: e.target.value})}
            />
          </div>

        </div>

        <div style={styles.group}>
          <label style={styles.label}>Observação</label>
          <textarea style={styles.textarea}
            onChange={e => setForm({...form, observacao: e.target.value})}
          />
        </div>

        <button type="submit" style={styles.button}>
          Cadastrar Pedido
        </button>

      </form>
    </div>
  );
}

export default CadastroPedido;
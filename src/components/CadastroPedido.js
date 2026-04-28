import React, { useState, useEffect } from 'react';

function CadastroPedido({ clientKey, onSuccess }) {

  // 🔥 LÓGICA MANTIDA INTEGRALMENTE
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
  observacao: '',
  comissao: '' // 🔥 NOVO
});

  useEffect(() => {
  fetch('/api/data', {
    headers: { 'x-api-key': clientKey }
  })
    .then(res => res.json())
    .then(data => {

      console.log("DADOS API:", data); // 👈 ADICIONA ISSO

      setProdutos(data.produtos || []);
      setCores(data.cores || []);
      setClientes(data.clientes || []);

    });
}, [clientKey]);

 const handleArtigoChange = (artigoSelecionado) => {
  const produto = produtos.find(p => p.artigo === artigoSelecionado);

  let preco = '';

  if (produto && form.comissao) {
    preco = produto.precos?.[form.comissao] || '';
  }

  setForm({
    ...form,
    artigo: artigoSelecionado,
    valor: preco
  });
};

useEffect(() => {
  if (!form.artigo || !form.comissao) return;

  const produto = produtos.find(p => p.artigo === form.artigo);

  if (produto) {
    setForm(prev => ({
      ...prev,
      valor: produto.precos?.[form.comissao] || ''
    }));
  }

}, [form.comissao, form.artigo]);

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
  "COMISSAO": form.comissao, // 🔥 AQUI
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

  // 🎨 NOVO LAYOUT PROFISSIONAL (CSS-in-JS)
  const styles = {
    container: {
      maxWidth: '850px',
      margin: '2rem auto',
      padding: '2.5rem',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      fontFamily: '"Inter", -apple-system, sans-serif',
      border: '1px solid #f0f0f0'
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '800',
      color: '#111827',
      marginBottom: '2rem',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      borderBottom: '2px solid #f3f4f6',
      paddingBottom: '1rem'
    },
    success: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      padding: '1rem',
      borderRadius: '12px',
      marginBottom: '2rem',
      textAlign: 'center',
      fontWeight: '600',
      border: '1px solid #bbf7d0',
      animation: 'fadeIn 0.3s ease-in'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem'
    },
    fullWidth: {
      gridColumn: 'span 2'
    },
    group: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#374151',
      marginLeft: '4px'
    },
    input: {
      padding: '0.8rem 1rem',
      borderRadius: '10px',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      color: '#1f2937',
      transition: 'all 0.2s',
      backgroundColor: '#f9fafb',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box'
    },
    textarea: {
      padding: '0.8rem 1rem',
      borderRadius: '10px',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      minHeight: '120px',
      backgroundColor: '#f9fafb',
      width: '100%',
      boxSizing: 'border-box',
      resize: 'vertical',
      outline: 'none'
    },
    button: {
      width: '100%',
      padding: '1.1rem',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '1.1rem',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s',
      marginTop: '2rem',
      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
    },
    row: {
      display: 'contents' // Mantém o grid pai controlando
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        <span>📦</span> Cadastro de Pedido
      </div>

      {success && (
        <div style={styles.success}>
          ✅ Pedido cadastrado com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.formGrid}>
        
        {/* CLIENTE */}
        <div style={styles.group}>
          <label style={styles.label}>Cliente</label>
          <select 
            style={styles.input}
            value={form.cliente}
            onChange={e => setForm({...form, cliente: e.target.value})}
            required
          >
            <option value="">Selecione o Cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.nome}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* REPRESENTANTE */}
        <div style={styles.group}>
          <label style={styles.label}>Representante</label>
          <input 
            style={styles.input}
            placeholder="Nome do Representante"
            value={form.representante}
            onChange={e => setForm({...form, representante: e.target.value})}
            required
          />
        </div>

        {/* ARTIGO */}
        <div style={styles.group}>
          <label style={styles.label}>Artigo</label>
          <select 
            style={styles.input}
            value={form.artigo}
            onChange={(e) => handleArtigoChange(e.target.value)}
            required
          >
            <option value="">Selecione o Artigo</option>
            {produtos.map((item) => (
              <option key={item.id} value={item.artigo}>{item.artigo}</option>
            ))}
          </select>
        </div>

        {/* COR */}
        <div style={styles.group}>
          <label style={styles.label}>Cor</label>
          <select 
            style={styles.input}
            value={form.cor}
            onChange={e => setForm({...form, cor: e.target.value})}
            required
          >
            <option value="">Selecione a Cor</option>
            {cores.map((c, index) => (
              <option key={index} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {/* 🔥 COMISSÃO */}
<div style={styles.group}>
  <label style={styles.label}>Comissão</label>
  <select
    style={styles.input}
    value={form.comissao}
    onChange={e => setForm({...form, comissao: e.target.value})}
    required
  >
    <option value="">Selecione a Comissão</option>
    <option value="2">2%</option>
    <option value="3">3%</option>
    <option value="4">4%</option>
    <option value="5">5%</option>
    <option value="6">6%</option>
    <option value="7">7%</option>
    <option value="8">8%</option>
    <option value="9">9%</option>
  </select>
</div>

        {/* QUANTIDADE */}
        <div style={styles.group}>
          <label style={styles.label}>Quantidade</label>
          <input 
            style={styles.input}
            type="number"
            placeholder="0.00"
            value={form.quantidade}
            onChange={e => setForm({...form, quantidade: e.target.value})}
            required
          />
        </div>

        {/* VALOR (READ ONLY) */}
        <div style={styles.group}>
          <label style={styles.label}>Valor Unitário</label>
          <input 
            style={{...styles.input, backgroundColor: '#f3f4f6', cursor: 'not-allowed'}}
            value={form.valor ? `R$ ${form.valor}` : ''}
            readOnly
            placeholder="Valor automático"
          />
        </div>

        {/* STATUS */}
        <div style={styles.group}>
          <label style={styles.label}>Status</label>
          <select 
            style={styles.input}
            value={form.status}
            onChange={e => setForm({...form, status: e.target.value})}
            required
          >
            <option value="">Selecione o Status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em Produção">Em Produção</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        {/* DATA DO PEDIDO */}
        <div style={styles.group}>
          <label style={styles.label}>Data do Pedido</label>
          <input 
            type="date" 
            style={styles.input}
            value={form.data}
            onChange={e => setForm({...form, data: e.target.value})}
            required
          />
        </div>

        {/* OBSERVAÇÃO */}
        <div style={{...styles.group, ...styles.fullWidth}}>
          <label style={styles.label}>Observações</label>
          <textarea 
            style={styles.textarea}
            placeholder="Detalhes adicionais do pedido..."
            value={form.observacao}
            onChange={e => setForm({...form, observacao: e.target.value})}
          />
        </div>

        {/* BOTÃO */}
        <div style={styles.fullWidth}>
          <button type="submit" style={styles.button}>
            Confirmar e Cadastrar Pedido
          </button>
        </div>

      </form>
    </div>
    
  );

}
export default CadastroPedido;
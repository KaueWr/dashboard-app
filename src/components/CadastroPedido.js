import React, { useState, useEffect } from 'react';
import { apiJson } from '../services/apiClient';

function CadastroPedido({ onSuccess }) {

  // 🔥 LÓGICA MANTIDA INTEGRALMENTE
  const [produtos, setProdutos] = useState([]);
  const [cores, setCores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [step, setStep] = useState(1);

  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const [itens, setItens] = useState([
    { artigo: '', cor: '', quantidade: '', peso: '', valor: '' }
  ]);

  const [form, setForm] = useState({
    cliente: '',
    representante: '',
    comissao: '',
    status: '',
    data: '',
    observacao: ''
  });

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const data = await apiJson('/api/data');

        if (active) {
          setProdutos(data.produtos || []);
          setCores(data.cores || []);
          setClientes(data.clientes || []);
        }
      } catch (err) {
        if (active) {
          setMessage({ type: 'error', text: err.message });
        }
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  const addItem = () => {
    setItens(currentItems => [...currentItems, { artigo: '', cor: '', quantidade: '', peso: '', valor: '' }]);
  };

  const updateItem = (index, field, value) => {
    const novosItens = [...itens];
    novosItens[index][field] = value;

    if (field === 'artigo') {
      const produto = produtos.find(p => p.artigo === value);
      if (produto && form.comissao) {
        novosItens[index].valor = produto.precos?.[form.comissao] || '';
      }
    }

    setItens(novosItens);
  };

  // Atualiza preços de todos os itens se a comissão mudar
  useEffect(() => {
    if (!form.comissao) return;
    setItens(currentItems => currentItems.map(item => {
      const produto = produtos.find(p => p.artigo === item.artigo);
      if (produto) {
        return { ...item, valor: produto.precos?.[form.comissao] || '' };
      }
      return item;
    }));
  }, [form.comissao, produtos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const payload = {
      tipo: "pedido",
      cliente: form.cliente,
      representante: form.representante,
      comissao: form.comissao,
      data: form.data,
      status: form.status,
      observacao: form.observacao,
      itens: itens
    };

    try {
      await apiJson('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      setMessage({ type: 'success', text: 'Pedido cadastrado com sucesso!' });
      setTimeout(() => setMessage(currentMessage => (
        currentMessage.type === 'success' ? { type: '', text: '' } : currentMessage
      )), 3000);
      onSuccess();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

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
      border: '1px solid #bbf7d0'
    },
    error: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      padding: '1rem',
      borderRadius: '12px',
      marginBottom: '2rem',
      textAlign: 'center',
      fontWeight: '600',
      border: '1px solid #fecaca'
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
      minHeight: '100px',
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
      marginTop: '1rem',
      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
    },
    buttonSecondary: {
      padding: '0.8rem 1.5rem',
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '10px',
      fontSize: '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: '1.5rem'
    },
    buttonAction: {
      width: '100%',
      padding: '1.1rem',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '1.1rem',
      fontWeight: '700',
      cursor: 'pointer',
      marginTop: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
    },
    buttonOutline: {
      padding: '0.6rem 1rem',
      backgroundColor: 'transparent',
      color: '#2563eb',
      border: '2px solid #2563eb',
      borderRadius: '10px',
      fontSize: '0.9rem',
      fontWeight: '700',
      cursor: 'pointer'
    },
    gridHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.2fr',
      gap: '10px',
      fontWeight: '700',
      marginBottom: '10px',
      color: '#4b5563',
      fontSize: '0.85rem',
      textTransform: 'uppercase',
      padding: '0 10px'
    },
    gridRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.2fr',
      gap: '10px',
      marginBottom: '10px',
      alignItems: 'center',
      backgroundColor: '#f9fafb',
      padding: '10px',
      borderRadius: '10px',
      border: '1px solid #f0f0f0'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>
        <span>📦</span> Cadastro de Pedido
      </div>

      {message.text && (
        <div style={message.type === 'success' ? styles.success : styles.error}>
          {message.text}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} style={styles.formGrid}>
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

          <div style={styles.group}>
            <label style={styles.label}>Comissão</label>
            <select
              style={styles.input}
              value={form.comissao}
              onChange={e => setForm({...form, comissao: e.target.value})}
              required
            >
              <option value="">Selecione a Comissão</option>
              {[2,3,4,5,6,7,8,9].map(val => (
                <option key={val} value={val}>{val}%</option>
              ))}
            </select>
          </div>

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

          <div style={{...styles.group, ...styles.fullWidth}}>
            <label style={styles.label}>Observações</label>
            <textarea 
              style={styles.textarea}
              placeholder="Detalhes adicionais do pedido..."
              value={form.observacao}
              onChange={e => setForm({...form, observacao: e.target.value})}
            />
          </div>

          <div style={styles.fullWidth}>
            <button type="submit" style={styles.button}>
              Próximo Passo: Adicionar Itens →
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div>
          <button 
            type="button" 
            onClick={() => setStep(1)} 
            style={styles.buttonSecondary}
          >
            ← Voltar para Informações Gerais
          </button>

          <div style={styles.gridHeader}>
            <div>Artigo</div>
            <div>Cor</div>
            <div>Qtd</div>
            <div>Peso</div>
            <div>Valor</div>
          </div>

          {itens.map((item, index) => (
            <div key={index} style={styles.gridRow}>
              <select
                style={{...styles.input, padding: '0.5rem'}}
                value={item.artigo}
                onChange={e => updateItem(index, 'artigo', e.target.value)}
                required
              >
                <option value="">Artigo</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.artigo}>{p.artigo}</option>
                ))}
              </select>

              <select
                style={{...styles.input, padding: '0.5rem'}}
                value={item.cor}
                onChange={e => updateItem(index, 'cor', e.target.value)}
                required
              >
                <option value="">Cor</option>
                {cores.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>

              <input 
                style={{...styles.input, padding: '0.5rem'}}
                type="number" 
                placeholder="Qtd"
                value={item.quantidade}
                onChange={e => updateItem(index, 'quantidade', e.target.value)} 
                required
              />
              
              <input 
                style={{...styles.input, padding: '0.5rem'}}
                type="number" 
                placeholder="Peso"
                value={item.peso}
                onChange={e => updateItem(index, 'peso', e.target.value)} 
                required
              />

              <input 
                style={{...styles.input, padding: '0.5rem', backgroundColor: '#f3f4f6', cursor: 'not-allowed'}}
                value={item.valor ? `R$ ${item.valor}` : ''} 
                readOnly 
                placeholder="R$"
              />
            </div>
          ))}

          <div style={{ marginTop: '1.5rem' }}>
            <button 
              type="button" 
              onClick={addItem} 
              style={styles.buttonOutline}
            >
              + Adicionar Nova Linha
            </button>
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={submitting}
            style={styles.buttonAction}
          >
            {submitting ? 'Enviando...' : '✅ Finalizar e Enviar Pedido'}
          </button>
        </div>
      )}
    </div>
  );
}

export default CadastroPedido;

import React, { useState } from 'react';

function CadastroTemp({ clientKey, onSuccess, colors }) {
  const [formArtigo, setFormArtigo] = useState({
    nomeProduto: '',
    malharia: '',
    representante: '',
    cliente: '',
    dataProjeto: '',
    dataEnvio: '',
    situacao: '',
    observacoes: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const styles = {
    card: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' },
    formGroup: { marginBottom: '1rem' },
    formLabel: { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' },
    formInput: { width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' },
    formButton: { backgroundColor: '#10b981', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '600', width: '100%' },
    messageSuccess: { backgroundColor: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' },
    messageError: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formArtigo.nomeProduto || !formArtigo.cliente || !formArtigo.situacao) {
      setMessage({ type: 'error', text: 'Preencha os campos obrigatórios (*)' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const now = new Date();

      const payload = {
        "NOME DO PROJETO": formArtigo.nomeProduto,
        "MALHARIA": formArtigo.malharia,
        "REPRESENTANTE": formArtigo.representante,
        "CLIENTE": formArtigo.cliente,
        "DATA DO PROJETO": formArtigo.dataProjeto,
        "DATA DE ENVIO": formArtigo.dataEnvio,
        "SITUAÇÃO": formArtigo.situacao,
        "OBSERVAÇÃO": formArtigo.observacoes,
        "DATA DE CADASTRO": now.toLocaleDateString('pt-BR')
      };

      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': clientKey
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // ✅ sucesso real
      setMessage({ type: 'success', text: 'Artigo cadastrado com sucesso!' });

      setFormArtigo({
        nomeProduto: '',
        malharia: '',
        representante: '',
        cliente: '',
        dataProjeto: '',
        dataEnvio: '',
        situacao: '',
        observacoes: ''
      });

      setTimeout(() => onSuccess(), 1500);

    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3>Cadastro</h3>

      {message.text && (
        <div style={message.type === 'success' ? styles.messageSuccess : styles.messageError}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Nome do Produto: *</label>
          <input type="text" value={formArtigo.nomeProduto}
            onChange={(e) => setFormArtigo({ ...formArtigo, nomeProduto: e.target.value })}
            style={styles.formInput} required />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Malharia:</label>
          <input type="text" value={formArtigo.malharia}
            onChange={(e) => setFormArtigo({ ...formArtigo, malharia: e.target.value })}
            style={styles.formInput} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Representante:</label>
          <input type="text" value={formArtigo.representante}
            onChange={(e) => setFormArtigo({ ...formArtigo, representante: e.target.value })}
            style={styles.formInput} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Cliente: *</label>
          <input type="text" value={formArtigo.cliente}
            onChange={(e) => setFormArtigo({ ...formArtigo, cliente: e.target.value })}
            style={styles.formInput} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Data do Projeto:</label>
            <input type="date" value={formArtigo.dataProjeto}
              onChange={(e) => setFormArtigo({ ...formArtigo, dataProjeto: e.target.value })}
              style={styles.formInput} />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Data de Envio:</label>
            <input type="date" value={formArtigo.dataEnvio}
              onChange={(e) => setFormArtigo({ ...formArtigo, dataEnvio: e.target.value })}
              style={styles.formInput} />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Situação: *</label>
          <select value={formArtigo.situacao}
            onChange={(e) => setFormArtigo({ ...formArtigo, situacao: e.target.value })}
            style={styles.formInput} required>

            <option value="">Selecione uma situação</option>
            {Object.keys(colors).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Observação:</label>
          <textarea value={formArtigo.observacoes}
            onChange={(e) => setFormArtigo({ ...formArtigo, observacoes: e.target.value })}
            style={{ ...styles.formInput, minHeight: '80px' }} />
        </div>

        <button type="submit" disabled={submitting} style={styles.formButton}>
          {submitting ? 'Enviando...' : 'Cadastrar Artigo'}
        </button>

      </form>
    </div>
  );
}

export default CadastroTemp;
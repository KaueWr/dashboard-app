import React, { useState } from 'react';
import logoGroupTextil from '../assets/logo_group_textil.png';
import { apiJson } from '../services/apiClient';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Segoe UI, sans-serif'
    },
    card: {
      width: '100%',
      maxWidth: '420px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
      border: '1px solid #e5e7eb'
    },
    logo: {
      height: '54px',
      objectFit: 'contain',
      marginBottom: '1.5rem'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#111827',
      margin: '0 0 0.5rem'
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '0.95rem',
      margin: '0 0 1.5rem'
    },
    label: {
      display: 'block',
      color: '#374151',
      fontSize: '0.9rem',
      fontWeight: '600',
      marginBottom: '0.5rem'
    },
    input: {
      width: '100%',
      padding: '0.85rem 1rem',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '1rem',
      boxSizing: 'border-box',
      outline: 'none'
    },
    button: {
      width: '100%',
      padding: '0.9rem 1rem',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: '#1f2937',
      color: '#ffffff',
      fontWeight: '700',
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: '1rem'
    },
    error: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      padding: '0.85rem 1rem',
      borderRadius: '6px',
      marginBottom: '1rem',
      fontWeight: '600'
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await apiJson('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      setPassword('');
      onLogin(result);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <img src={logoGroupTextil} alt="Group Textil" style={styles.logo} />
        <h1 style={styles.title}>Acesso ao Dashboard</h1>
        <p style={styles.subtitle}>Entre para continuar.</p>

        {message && (
          <div style={styles.error}>
            {message}
          </div>
        )}

        <label style={styles.label} htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={styles.input}
          autoComplete="current-password"
          required
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default Login;

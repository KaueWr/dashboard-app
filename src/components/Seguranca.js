import React from 'react';

function Seguranca({ session, onLogout, loggingOut }) {
  const expiresAt = session?.expiresAt
    ? new Date(session.expiresAt).toLocaleString('pt-BR')
    : 'Sessao atual';

  const styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '1rem'
    },
    card: {
      backgroundColor: '#ffffff',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb'
    },
    title: {
      margin: '0 0 1rem',
      color: '#111827',
      fontSize: '1.25rem'
    },
    label: {
      color: '#6b7280',
      fontSize: '0.85rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      marginBottom: '0.35rem'
    },
    value: {
      color: '#111827',
      fontSize: '1rem',
      fontWeight: '600',
      marginBottom: '1rem'
    },
    badge: {
      display: 'inline-block',
      backgroundColor: '#dcfce7',
      color: '#166534',
      padding: '0.35rem 0.65rem',
      borderRadius: '999px',
      fontWeight: '700',
      fontSize: '0.85rem'
    },
    button: {
      width: '100%',
      padding: '0.85rem 1rem',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: '#991b1b',
      color: '#ffffff',
      fontWeight: '700',
      cursor: 'pointer'
    },
    list: {
      paddingLeft: '1rem',
      margin: 0,
      color: '#374151',
      lineHeight: 1.7
    }
  };

  return (
    <div style={styles.grid}>
      <section style={styles.card}>
        <h3 style={styles.title}>Seguranca</h3>
        <div style={styles.label}>Status</div>
        <div style={styles.value}>
          <span style={styles.badge}>Sessao ativa</span>
        </div>

        <div style={styles.label}>Expira em</div>
        <div style={styles.value}>{expiresAt}</div>

        <button type="button" style={styles.button} onClick={onLogout} disabled={loggingOut}>
          {loggingOut ? 'Saindo...' : 'Sair'}
        </button>
      </section>

      <section style={styles.card}>
        <h3 style={styles.title}>Protecoes ativas</h3>
        <ul style={styles.list}>
          <li>Login por senha no servidor</li>
          <li>Cookie HttpOnly</li>
          <li>API protegida por sessao</li>
          <li>Apps Script com segredo interno</li>
        </ul>
      </section>
    </div>
  );
}

export default Seguranca;

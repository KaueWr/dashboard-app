import React from 'react';
import logoGroupTextil from '../assets/logo_group_textil.png';

function Header({ activeTab, setActiveTab, syncData, loading, lastSync }) {
  const styles = {
    header: { 
      backgroundColor: '#1f2937', 
      color: 'white', 
      padding: '0.5rem 2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
    },
    headerContent: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      maxWidth: '1200px', 
      margin: '0 auto' 
    },
    logo: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0' 
    },
    logoImage: { 
      height: '50px',
      width: 'auto', 
      objectFit: 'contain',
      padding: '0.5rem 0'
    },
    headerRight: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem' 
    },
    button: { 
      padding: '0.5rem 1rem', 
      borderRadius: '0.375rem', 
      border: 'none', 
      cursor: 'pointer', 
      fontWeight: '600', 
      transition: 'all 0.2s', 
      backgroundColor: '#3b82f6', 
      color: 'white' 
    },
    lastSyncText: { 
      fontSize: '0.875rem', 
      color: '#9ca3af' 
    },
    tabsContainer: { 
      display: 'flex', 
      gap: '1rem', 
      maxWidth: '1200px', 
      margin: '0.5rem auto 0' 
    },
    tab: { 
      padding: '0.5rem 1rem', 
      backgroundColor: 'transparent', 
      border: 'none', 
      color: '#9ca3af', 
      cursor: 'pointer', 
      borderBottom: '2px solid transparent',
      fontSize: '0.95rem'
    },
    tabActive: { 
      color: '#3b82f6', 
      borderBottom: '2px solid #3b82f6' 
    }
  };

  return (
    <header style={styles.header}>
      <div style={styles.headerContent}>
        <div style={styles.logo}>
          <img 
            src={logoGroupTextil} 
            alt="Logo" 
            style={styles.logoImage}
          />
        </div>
        <div style={styles.headerRight}>
          <button onClick={syncData} disabled={loading} style={styles.button}>
            {loading ? '⏳ Sincronizando...' : '🔄 Atualizar'}
          </button>
          {lastSync && <span style={styles.lastSyncText}>Atualizado: {lastSync}</span>}
        </div>
      </div>
      <div style={styles.tabsContainer}>
        <button 
          onClick={() => setActiveTab('dashboard')} 
          style={{...styles.tab, ...(activeTab === 'dashboard' ? styles.tabActive : {})}}
        >
          Painel
        </button>
        <button 
          onClick={() => setActiveTab('tabela')} 
          style={{...styles.tab, ...(activeTab === 'tabela' ? styles.tabActive : {})}}
        >
          Lista de Itens
        </button>
        <button 
          onClick={() => setActiveTab('cadastro')} 
          style={{...styles.tab, ...(activeTab === 'cadastro' ? styles.tabActive : {})}}
        >
          Cadastro de Artigo
        </button>
      </div>
    </header>
  );
}

export default Header;
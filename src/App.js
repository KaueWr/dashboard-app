import React, { useState, useEffect } from 'react';
import Header from './components/Header.js';
import Dashboard from './components/Dashboard.js';
import TabelaItens from './components/TabelaItens.js';
import Cadastro from './components/CadastroTemp.js';
import CadastroPedido from './components/CadastroPedido';

// 🔐 CONFIGURAÇÃO SEGURA
const API_URL = "/api/data";
const CLIENT_KEY = "123456"; // mesma chave do Vercel

const COLORS = {
  'APROVADO': '#10b981',
  'REPROVADO': '#ef4444',
  'AJUSTAR': '#f97316',
  'AG. RETORNO': '#eab308'
};

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // 🔄 BUSCAR DADOS DA API SEGURA
  const syncData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'x-api-key': CLIENT_KEY
        }
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
      setLastSync(new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 CARREGA AUTOMATICAMENTE
  useEffect(() => {
    syncData();
  }, []);

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        syncData={syncData} 
        loading={loading} 
        lastSync={lastSync} 
      />

      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard data={data} loading={loading} />
        )}

        {activeTab === 'tabela' && (
          <TabelaItens data={data} colors={COLORS} />
        )}

        {activeTab === 'cadastro' && (
          <Cadastro 
            onSuccess={syncData}
            colors={COLORS}
            clientKey={CLIENT_KEY}
          />
        )}
        {activeTab === 'pedido' && (
          <CadastroPedido 
           clientKey={CLIENT_KEY}
          onSuccess={syncData}
          />
        )}

      </main>
    </div>
  );
}

export default App;
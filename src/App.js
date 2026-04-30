import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.js';
import Dashboard from './components/Dashboard.js';
import TabelaItens from './components/TabelaItens.js';
import Cadastro from './components/CadastroTemp.js';
import CadastroPedido from './components/CadastroPedido';
import Login from './components/Login.js';
import Seguranca from './components/Seguranca.js';
import { apiJson } from './services/apiClient.js';

const API_URL = "/api/data";

const COLORS = {
  'APROVADO': '#10b981',
  'REPROVADO': '#ef4444',
  'AJUSTAR': '#f97316',
  'AG. RETORNO': '#eab308'
};

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const syncData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiJson(API_URL);

      setData(result);
      setLastSync(new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }));
    } catch (err) {
      if (err.status === 401) {
        setAuthenticated(false);
        setSession(null);
        setData(null);
      }

      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSession = useCallback(async () => {
    setCheckingSession(true);
    setError(null);

    try {
      const result = await apiJson('/api/auth/session');

      if (result.authenticated) {
        setAuthenticated(true);
        setSession(result);
        await syncData();
      } else {
        setAuthenticated(false);
        setSession(null);
        setData(null);
        setLoading(false);
      }
    } catch (err) {
      setAuthenticated(false);
      setSession(null);
      setData(null);
      setLoading(false);
      setError(err.message);
    } finally {
      setCheckingSession(false);
    }
  }, [syncData]);

  const handleLogin = async (loginResult) => {
    setAuthenticated(true);
    setSession(loginResult);
    setActiveTab('dashboard');
    await syncData();
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await apiJson('/api/auth/logout', {
        method: 'POST'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthenticated(false);
      setSession(null);
      setData(null);
      setLastSync(null);
      setActiveTab('dashboard');
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (checkingSession) {
    return (
      <div style={{ fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Carregando...
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

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

        {activeTab === 'dashboard' ? (
          <Dashboard data={data} loading={loading} />
        ) : activeTab === 'tabela' ? (
          <TabelaItens data={data} colors={COLORS} />
        ) : activeTab === 'cadastro' ? (
          <Cadastro
            onSuccess={syncData}
            colors={COLORS}
          />
        ) : activeTab === 'pedido' ? (
          <CadastroPedido
            onSuccess={syncData}
          />
        ) : activeTab === 'seguranca' ? (
          <Seguranca
            session={session}
            onLogout={handleLogout}
            loggingOut={loggingOut}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;

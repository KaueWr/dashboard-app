import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = {
  'APROVADO': '#10b981',
  'REPROVADO': '#ef4444',
  'AJUSTAR': '#f97316',
  'AG. RETORNO': '#eab308'
};

// ⭐ LINK DO GOOGLE SHEETS INTEGRADO AQUI
const GOOGLE_SHEET_LINK = 'https://docs.google.com/spreadsheets/d/1urzSyHpTI9QvP3xG7k4OmocVEaTKcaDjuwat1xdN38Y/edit?usp=drive_link';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Função para sincronizar dados
  const syncData = async () => {
    setLoading(true);
    setError(null);

    try {
      const sheetId = GOOGLE_SHEET_LINK.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

      const response = await fetch(csvUrl);

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: Não conseguiu acessar a planilha`);
      }

      const csvText = await response.text();

      if (csvText.includes('<!DOCTYPE html>') || csvText.includes('Page Not Found')) {
        throw new Error('Planilha não encontrada. Verifique se está compartilhada publicamente.');
      }

      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rows = results.data;
            const items = [];
            const counts = {};

            for (let i = 2; i < rows.length; i++) {
              const row = rows[i];

              if (!row || row.length < 7) continue;

              const itemName = String(row[0] || '').trim();
              const situacao = String(row[6] || '').trim();

              if (!itemName || !situacao) continue;

              items.push({
                item: itemName,
                situacao: situacao,
              });

              counts[situacao] = (counts[situacao] || 0) + 1;
            }

            if (items.length === 0) {
              throw new Error('Nenhum item encontrado na planilha');
            }

            const chartData = Object.entries(counts).map(([name, value]) => ({
              name,
              value,
              fill: COLORS[name] || '#6b7280'
            }));

            setData({
              items,
              counts,
              chartData,
              totalItems: items.length
            });

            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            setLastSync(timeStr);

            setLoading(false);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
            setError(`Erro ao processar: ${errorMsg}`);
            setLoading(false);
          }
        },
        error: (error) => {
          setError(`Erro ao processar CSV: ${error.message}`);
          setLoading(false);
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      setLoading(false);
    }
  };

  // Sincronizar ao carregar
  useEffect(() => {
    syncData();
  }, []);

  // Atualizar automaticamente a cada 30 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      syncData();
    }, 30 * 60 * 1000); // 30 minutos

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>📊</span>
            <span style={styles.logoText}>Dashboard</span>
          </div>
          <div style={styles.headerRight}>
            <button
              onClick={syncData}
              disabled={loading}
              style={{...styles.button, ...styles.buttonSync}}
            >
              {loading ? '⏳ Sincronizando...' : '🔄 Atualizar'}
            </button>
            {lastSync && (
              <span style={styles.lastSyncText}>Atualizado: {lastSync}</span>
            )}
          </div>
        </div>

        {/* ABAS DE NAVEGAÇÃO */}
        <div style={styles.tabsContainer}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              ...styles.tab,
              ...(activeTab === 'dashboard' ? styles.tabActive : {})
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('tabela')}
            style={{
              ...styles.tab,
              ...(activeTab === 'tabela' ? styles.tabActive : {})
            }}
          >
            Lista de Itens
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        {error && (
          <div style={styles.messageError}>
            <p style={styles.messageTitle}>❌ Erro ao carregar dados</p>
            <p style={styles.messageText}>{error}</p>
          </div>
        )}

        {loading && !data && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Carregando dados...</p>
          </div>
        )}

        {data && activeTab === 'dashboard' && (
          <div style={styles.content}>
            {/* KPI CARDS */}
            <section style={styles.kpiSection}>
              <div style={styles.kpiGrid}>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiLabel}>Total de Itens</div>
                  <div style={styles.kpiValue}>{data.totalItems}</div>
                  <div style={styles.kpiBar} style={{width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px'}}></div>
                </div>

                {Object.entries(data.counts).map(([situacao, count]) => (
                  <div key={situacao} style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>{situacao}</div>
                    <div style={{...styles.kpiValue, color: COLORS[situacao]}}>
                      {count}
                    </div>
                    <div style={{...styles.kpiPercentage, color: COLORS[situacao]}}>
                      {((count / data.totalItems) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* GRÁFICOS */}
            <section style={styles.chartsSection}>
              <div style={styles.chartsGrid}>
                <div style={styles.chartCard}>
                  <h3 style={styles.chartTitle}>Distribuição por Situação</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={styles.chartCard}>
                  <h3 style={styles.chartTitle}>Contagem por Situação</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                        {data.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>
        )}

        {data && activeTab === 'tabela' && (
          <div style={styles.content}>
            <section style={styles.tableSection}>
              <h3 style={styles.tableTitle}>Lista de Itens</h3>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.tableHeader}>Item</th>
                      <th style={styles.tableHeader}>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, idx) => (
                      <tr key={idx} style={styles.tableRow}>
                        <td style={styles.tableCell}>{item.item}</td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: COLORS[item.situacao]
                            }}
                          >
                            {item.situacao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f7fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  },
  header: {
    background: '#1e3a5f',
    color: 'white',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  headerContent: {
    padding: '20px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.3rem',
    fontWeight: '700'
  },
  logoIcon: {
    fontSize: '1.8rem'
  },
  logoText: {
    letterSpacing: '0.5px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  },
  buttonSync: {
    backgroundColor: '#0ea5e9',
    color: 'white'
  },
  lastSyncText: {
    fontSize: '0.85rem',
    opacity: 0.8
  },
  tabsContainer: {
    display: 'flex',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingLeft: '30px'
  },
  tab: {
    padding: '15px 20px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s'
  },
  tabActive: {
    color: 'white',
    borderBottomColor: '#0ea5e9'
  },
  main: {
    flex: 1,
    padding: '30px'
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    width: '100%'
  },
  messageError: {
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '20px',
    color: '#991b1b'
  },
  messageTitle: {
    fontWeight: '600',
    fontSize: '1.1rem',
    margin: '0 0 10px 0'
  },
  messageText: {
    margin: 0
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '20px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #0ea5e9',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: '1.1rem',
    color: '#6b7280'
  },
  kpiSection: {
    padding: '0'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '15px'
  },
  kpiCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb'
  },
  kpiLabel: {
    fontSize: '0.8rem',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    marginBottom: '10px'
  },
  kpiValue: {
    fontSize: '2.2rem',
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: '8px'
  },
  kpiPercentage: {
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  chartsSection: {
    padding: '0'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px'
  },
  chartCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb'
  },
  chartTitle: {
    marginBottom: '20px',
    color: '#1e3a5f',
    fontSize: '1rem',
    margin: '0 0 20px 0',
    fontWeight: '600'
  },
  tableSection: {
    padding: '0'
  },
  tableTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1e3a5f',
    marginBottom: '20px',
    margin: '0 0 20px 0'
  },
  tableWrapper: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeaderRow: {
    backgroundColor: '#f5f7fa'
  },
  tableHeader: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#1e3a5f',
    borderBottom: '2px solid #e5e7eb',
    fontSize: '0.9rem'
  },
  tableRow: {
    borderBottom: '1px solid #e5e7eb',
    transition: 'background-color 0.2s'
  },
  tableCell: {
    padding: '12px',
    color: '#4b5563',
    fontSize: '0.95rem'
  },
  badge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'white'
  }
};

export default App;
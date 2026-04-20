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
      {/* HEADER SOFISTICADO */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerTop}>
            <div>
              <h1 style={styles.title}>Dashboard de Desenvolvimento</h1>
              <p style={styles.subtitle}>Análise em tempo real de itens de desenvolvimento</p>
            </div>
            <div style={styles.syncInfo}>
              {lastSync && (
                <div style={styles.lastSyncBox}>
                  <p style={styles.lastSyncLabel}>Última atualização</p>
                  <p style={styles.lastSyncTime}>{lastSync}</p>
                </div>
              )}
              <button
                onClick={syncData}
                disabled={loading}
                style={{...styles.button, ...styles.buttonRefresh}}
              >
                {loading ? '⏳ Atualizando...' : '🔄 Atualizar Agora'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={styles.main}>
        <div style={styles.content}>
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

          {data && (
            <>
              {/* CARDS DE ESTATÍSTICAS */}
              <section style={styles.statsSection}>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>📊</div>
                    <div style={styles.statLabel}>Total de Itens</div>
                    <div style={styles.statValue}>{data.totalItems}</div>
                  </div>

                  {Object.entries(data.counts).map(([situacao, count]) => (
                    <div key={situacao} style={styles.statCard}>
                      <div style={{...styles.statIcon, color: COLORS[situacao]}}>●</div>
                      <div style={styles.statLabel}>{situacao}</div>
                      <div style={{...styles.statValue, color: COLORS[situacao]}}>
                        {count}
                      </div>
                      <div style={styles.statPercentage}>
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
                    <h3 style={styles.chartTitle}>📈 Distribuição por Situação</h3>
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
                    <h3 style={styles.chartTitle}>📊 Contagem por Situação</h3>
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

              {/* TABELA */}
              <section style={styles.tableSection}>
                <h3 style={styles.tableTitle}>📋 Lista de Itens</h3>
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
            </>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>Dashboard de Desenvolvimento • Atualização automática a cada 30 minutos</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '40px 20px',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto'
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    margin: '0 0 10px 0'
  },
  subtitle: {
    fontSize: '1rem',
    opacity: 0.9,
    margin: 0
  },
  syncInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  lastSyncBox: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  lastSyncLabel: {
    fontSize: '0.85rem',
    opacity: 0.8,
    margin: 0
  },
  lastSyncTime: {
    fontSize: '1.2rem',
    fontWeight: '600',
    margin: '5px 0 0 0'
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  },
  buttonRefresh: {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)'
  },
  main: {
    flex: 1,
    padding: '40px 20px'
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  messageError: {
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
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
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: '1.1rem',
    color: '#6b7280'
  },
  statsSection: {
    padding: '0'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  statIcon: {
    fontSize: '2rem',
    marginBottom: '10px'
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '10px'
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '5px'
  },
  statPercentage: {
    fontSize: '0.9rem',
    color: '#9ca3af'
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
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb'
  },
  chartTitle: {
    marginBottom: '20px',
    color: '#1f2937',
    fontSize: '1.1rem',
    margin: '0 0 20px 0'
  },
  tableSection: {
    padding: '0'
  },
  tableTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
    margin: '0 0 20px 0'
  },
  tableWrapper: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeaderRow: {
    backgroundColor: '#f3f4f6'
  },
  tableHeader: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#1f2937',
    borderBottom: '2px solid #e5e7eb'
  },
  tableRow: {
    borderBottom: '1px solid #e5e7eb',
    transition: 'background-color 0.2s'
  },
  tableCell: {
    padding: '12px',
    color: '#4b5563'
  },
  badge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'white'
  },
  footer: {
    background: '#1f2937',
    color: '#9ca3af',
    padding: '20px',
    textAlign: 'center',
    fontSize: '0.9rem'
  }
};

export default App;
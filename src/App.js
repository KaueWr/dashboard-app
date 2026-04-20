import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
 
const COLORS = {
  'APROVADO': '#10b981',
  'REPROVADO': '#ef4444',
  'AJUSTAR': '#f97316',
  'AG. RETORNO': '#eab308'
};
 
function App() {
  const [data, setData] = useState(null);
  const [link, setLink] = useState(localStorage.getItem('sheetLink') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [lastSync, setLastSync] = useState(localStorage.getItem('lastSync') || null);
  const [isEditing, setIsEditing] = useState(!link);
 
  const handleSaveLink = () => {
    if (!link.trim()) {
      setError('Cole o link da planilha');
      return;
    }
 
    const sheetId = link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetId) {
      setError('Link inválido. Use o link do Google Sheets');
      return;
    }
 
    localStorage.setItem('sheetLink', link);
    setIsEditing(false);
    setError(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };
 
  const handleSync = async () => {
    if (!link) {
      setError('Configure o link da planilha primeiro');
      return;
    }
 
    setLoading(true);
    setError(null);
    setSuccess(false);
 
    try {
      const sheetId = link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)[1];
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
            localStorage.setItem('lastSync', timeStr);
 
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
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
 
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Dashboard de Desenvolvimento</h1>
          <p style={styles.subtitle}>Análise em tempo real de itens de desenvolvimento</p>
        </div>
      </header>
 
      <main style={styles.main}>
        <div style={styles.content}>
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>🔗 Sincronizar Google Sheets</h2>
            </div>
 
            {isEditing ? (
              <div style={styles.form}>
                <label style={styles.label}>Cole o link da sua planilha Google Sheets</label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  disabled={loading}
                  style={styles.input}
                />
                <div style={styles.buttonGroup}>
                  <button
                    onClick={handleSaveLink}
                    disabled={loading || !link.trim()}
                    style={{...styles.button, ...styles.buttonPrimary}}
                  >
                    💾 Salvar Link
                  </button>
                  <button
                    onClick={() => {
                      setLink(localStorage.getItem('sheetLink') || '');
                      setIsEditing(false);
                    }}
                    disabled={loading}
                    style={{...styles.button, ...styles.buttonSecondary}}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.controls}>
                {link && (
                  <div style={styles.linkSaved}>
                    <p style={styles.linkSavedText}>✓ Link salvo</p>
                    <small style={styles.linkSavedSmall}>{link.substring(0, 50)}...</small>
                  </div>
                )}
 
                <div style={styles.actions}>
                  <button
                    onClick={handleSync}
                    disabled={loading || !link}
                    style={{...styles.button, ...styles.buttonPrimary, ...styles.buttonLarge}}
                  >
                    {loading ? '⏳ Sincronizando...' : '🔄 Atualizar Agora'}
                  </button>
 
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                    style={{...styles.button, ...styles.buttonSecondary}}
                  >
                    ✏️ Editar
                  </button>
                </div>
 
                {lastSync && (
                  <div style={styles.lastSync}>
                    <p>Última sincronização: <strong>{lastSync}</strong></p>
                  </div>
                )}
              </div>
            )}
 
            {error && (
              <div style={styles.messageError}>
                ❌ {error}
              </div>
            )}
 
            {success && (
              <div style={styles.messageSuccess}>
                ✅ Sincronização realizada com sucesso!
              </div>
            )}
 
            {!link && !isEditing && (
              <div style={styles.instructions}>
                <p><strong>Como usar:</strong></p>
                <ol>
                  <li>Abra sua planilha Google Sheets</li>
                  <li>Compartilhe como "Qualquer pessoa com o link"</li>
                  <li>Copie o link da planilha</li>
                  <li>Cole aqui e clique em "Salvar Link"</li>
                  <li>Clique em "Atualizar Agora" para sincronizar</li>
                </ol>
              </div>
            )}
          </section>
 
          {data && (
            <section style={styles.dataSection}>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statLabel}>Total de Itens</div>
                  <div style={styles.statValue}>{data.totalItems}</div>
                </div>
 
                {Object.entries(data.counts).map(([situacao, count]) => (
                  <div key={situacao} style={styles.statCard}>
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
 
              <div style={styles.chartsGrid}>
                <div style={styles.chartContainer}>
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
 
                <div style={styles.chartContainer}>
                  <h3 style={styles.chartTitle}>Contagem por Situação</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8">
                        {data.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
 
              <div style={styles.tableContainer}>
                <h3 style={styles.tableTitle}>Lista de Itens</h3>
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
          )}
        </div>
      </main>
    </div>
  );
}
 
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '40px 20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '10px',
    fontWeight: '700',
    margin: 0
  },
  subtitle: {
    fontSize: '1.1rem',
    opacity: 0.9,
    margin: '10px 0 0 0'
  },
  main: {
    flex: 1,
    padding: '40px 20px'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  section: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  sectionHeader: {
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    color: '#1f2937',
    margin: 0
  },
  form: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  label: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '0.95rem'
  },
  input: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  },
  buttonPrimary: {
    backgroundColor: '#667eea',
    color: 'white'
  },
  buttonSecondary: {
    backgroundColor: '#e5e7eb',
    color: '#1f2937'
  },
  buttonLarge: {
    flex: 1,
    minHeight: '44px',
    fontSize: '1rem'
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  linkSaved: {
    background: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: '6px',
    padding: '12px',
    color: '#166534'
  },
  linkSavedText: {
    fontWeight: '600',
    marginBottom: '5px',
    margin: '0 0 5px 0'
  },
  linkSavedSmall: {
    fontSize: '0.85rem',
    opacity: 0.8,
    wordBreak: 'break-all'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  lastSync: {
    textAlign: 'right',
    color: '#6b7280',
    fontSize: '0.9rem'
  },
  messageError: {
    padding: '15px',
    borderRadius: '6px',
    fontWeight: '500',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#991b1b'
  },
  messageSuccess: {
    padding: '15px',
    borderRadius: '6px',
    fontWeight: '500',
    backgroundColor: '#dcfce7',
    border: '1px solid #86efac',
    color: '#166534'
  },
  instructions: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '15px',
    color: '#1e40af',
    fontSize: '0.9rem'
  },
  dataSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    borderLeft: '4px solid #667eea'
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
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px'
  },
  chartContainer: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  chartTitle: {
    marginBottom: '20px',
    color: '#1f2937',
    fontSize: '1.1rem',
    margin: '0 0 20px 0'
  },
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflowX: 'auto'
  },
  tableTitle: {
    marginBottom: '20px',
    color: '#1f2937',
    fontSize: '1.1rem',
    margin: '0 0 20px 0'
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
    borderBottom: '1px solid #e5e7eb'
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
  }
};
 
export default App;

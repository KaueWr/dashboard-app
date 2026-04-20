import React, { useState } from 'react';
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
  
  // Filtros
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Função para calcular dias passados
  const calcularDiasPassados = (dataString) => {
    try {
      if (!dataString) return 0;
      
      // Tenta vários formatos de data
      let data;
      
      // Formato DD/MM/YYYY
      if (dataString.includes('/')) {
        const [dia, mes, ano] = dataString.split('/');
        data = new Date(ano, mes - 1, dia);
      }
      // Formato YYYY-MM-DD
      else if (dataString.includes('-')) {
        data = new Date(dataString);
      }
      // Outro formato
      else {
        data = new Date(dataString);
      }
      
      if (isNaN(data.getTime())) return 0;
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      data.setHours(0, 0, 0, 0);
      
      const diferenca = hoje - data;
      const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
      
      return dias > 0 ? dias : 0;
    } catch (e) {
      return 0;
    }
  };

  // Função para calcular lead time em dias
  const calcularLeadTime = (dataInicial, dataFinal) => {
    try {
      if (!dataInicial || !dataFinal) return 0;
      
      let data1, data2;
      
      // Formato DD/MM/YYYY
      if (dataInicial.includes('/')) {
        const [dia, mes, ano] = dataInicial.split('/');
        data1 = new Date(ano, mes - 1, dia);
        const [dia2, mes2, ano2] = dataFinal.split('/');
        data2 = new Date(ano2, mes2 - 1, dia2);
      }
      // Formato YYYY-MM-DD
      else if (dataInicial.includes('-')) {
        data1 = new Date(dataInicial);
        data2 = new Date(dataFinal);
      }
      else {
        data1 = new Date(dataInicial);
        data2 = new Date(dataFinal);
      }
      
      if (isNaN(data1.getTime()) || isNaN(data2.getTime())) return 0;
      
      data1.setHours(0, 0, 0, 0);
      data2.setHours(0, 0, 0, 0);
      
      const diferenca = data2 - data1;
      const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
      
      return dias >= 0 ? dias : 0;
    } catch (e) {
      return 0;
    }
  };

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
            const leadTimesByMonth = {};
            let diasAgRetorno = 0;
            let countAgRetorno = 0;

            for (let i = 2; i < rows.length; i++) {
              const row = rows[i];

              if (!row || row.length < 7) continue;

              const itemName = String(row[0] || '').trim();
              const situacao = String(row[6] || '').trim();
              const dataInicial = String(row[4] || '').trim(); // Coluna E
              const dataFinal = String(row[5] || '').trim();   // Coluna F

              if (!itemName || !situacao) continue;

              items.push({
                item: itemName,
                situacao: situacao,
                dataInicial: dataInicial,
                dataFinal: dataFinal
              });

              counts[situacao] = (counts[situacao] || 0) + 1;

              // Calcular lead time por mês
              if (dataInicial && dataFinal) {
                const leadTime = calcularLeadTime(dataInicial, dataFinal);
                try {
                  let mes = '';
                  if (dataFinal.includes('/')) {
                    const [dia, mesNum, ano] = dataFinal.split('/');
                    mes = `${mesNum}/${ano}`;
                  } else if (dataFinal.includes('-')) {
                    const [ano, mesNum, dia] = dataFinal.split('-');
                    mes = `${mesNum}/${ano}`;
                  }
                  
                  if (mes) {
                    if (!leadTimesByMonth[mes]) {
                      leadTimesByMonth[mes] = { total: 0, count: 0 };
                    }
                    leadTimesByMonth[mes].total += leadTime;
                    leadTimesByMonth[mes].count += 1;
                  }
                } catch (e) {
                  // Ignorar erros de parsing
                }
              }

              // Calcular dias para AG. RETORNO
              if (situacao === 'AG. RETORNO' && dataFinal) {
                const dias = calcularDiasPassados(dataFinal);
                diasAgRetorno += dias;
                countAgRetorno++;
              }
            }

            if (items.length === 0) {
              throw new Error('Nenhum item encontrado na planilha');
            }

            const chartData = Object.entries(counts).map(([name, value]) => ({
              name,
              value,
              fill: COLORS[name] || '#6b7280'
            }));

            // Preparar dados de lead time por mês
            const leadTimeChartData = Object.entries(leadTimesByMonth)
              .map(([mes, dados]) => ({
                mes,
                leadTime: Math.round(dados.total / dados.count)
              }))
              .sort((a, b) => {
                const [mesA, anoA] = a.mes.split('/');
                const [mesB, anoB] = b.mes.split('/');
                if (anoA !== anoB) return anoA - anoB;
                return mesA - mesB;
              });

            const mediaAgRetorno = countAgRetorno > 0 ? Math.round(diasAgRetorno / countAgRetorno) : 0;

            setData({
              items,
              counts,
              chartData,
              totalItems: items.length,
              leadTimeChartData: leadTimeChartData,
              mediaAgRetorno: mediaAgRetorno,
              countAgRetorno: countAgRetorno
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

  // Filtrar itens
  const filteredItems = data?.items.filter(item => {
    const matchName = item.item.toLowerCase().includes(filterName.toLowerCase());
    const matchStatus = filterStatus === '' || item.situacao === filterStatus;
    return matchName && matchStatus;
  }) || [];

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
            Painel
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

                {data.countAgRetorno > 0 && (
                  <div style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>Dias Ag. Retorno (Média)</div>
                    <div style={{...styles.kpiValue, color: '#f97316'}}>
                      {data.mediaAgRetorno}
                    </div>
                  </div>
                )}
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
            {/* GRÁFICO DE LEAD TIME POR MÊS */}
            {data.leadTimeChartData && data.leadTimeChartData.length > 0 && (
              <section style={styles.chartsSection}>
                <div style={styles.chartCard}>
                  <h3 style={styles.chartTitle}>Lead Time Médio por Mês (dias)</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data.leadTimeChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="leadTime" fill="#0ea5e9" radius={[8, 8, 0, 0]} label={{ position: 'top', fill: '#1e3a5f', fontWeight: 'bold', fontSize: 12 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </div>
        )}

        {data && activeTab === 'tabela' && (
          <div style={styles.content}>
            {/* FILTROS */}
            <section style={styles.filterSection}>
              <div style={styles.filterGrid}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Filtrar por Nome:</label>
                  <input
                    type="text"
                    placeholder="Digite o nome do item..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    style={styles.filterInput}
                  />
                </div>

                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Filtrar por Status:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="">Todos os Status</option>
                    {Object.keys(COLORS).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.filterGroup}>
                  <div style={styles.filterLabel}>Resultados: {filteredItems.length}</div>
                </div>
              </div>
            </section>

            {/* TABELA */}
            <section style={styles.tableSection}>
              <h3 style={styles.tableTitle}>Lista de Itens</h3>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.tableHeader}>Item</th>
                      <th style={styles.tableHeader}>Status</th>
                      <th style={styles.tableHeader}>Lead Time (dias)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => {
                      const leadTime = calcularLeadTime(item.dataInicial, item.dataFinal);
                      return (
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
                          <td style={styles.tableCell}>{leadTime} dias</td>
                        </tr>
                      );
                    })}
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

// Media Query Helper
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f7fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    '@media (max-width: 768px)': {
      fontSize: '14px'
    }
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
    width: '100%',
    flexWrap: 'wrap',
    gap: '10px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.3rem',
    fontWeight: '700',
    '@media (max-width: 768px)': {
      fontSize: '1.1rem'
    }
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
    gap: '20px',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      gap: '10px',
      width: '100%',
      justifyContent: 'space-between'
    }
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    '@media (max-width: 768px)': {
      padding: '10px 14px',
      fontSize: '0.85rem'
    }
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
    paddingLeft: '30px',
    overflowX: 'auto',
    '@media (max-width: 768px)': {
      paddingLeft: '15px'
    }
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
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    '@media (max-width: 768px)': {
      padding: '12px 15px',
      fontSize: '0.85rem'
    }
  },
  tabActive: {
    color: 'white',
    borderBottomColor: '#0ea5e9'
  },
  main: {
    flex: 1,
    padding: '30px',
    '@media (max-width: 768px)': {
      padding: '15px'
    }
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
    gap: '15px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px'
    },
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
      gap: '10px'
    }
  },
  kpiCard: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb',
    '@media (max-width: 480px)': {
      padding: '15px'
    }
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
    marginBottom: '8px',
    '@media (max-width: 768px)': {
      fontSize: '1.8rem'
    },
    '@media (max-width: 480px)': {
      fontSize: '1.5rem'
    }
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
    gap: '20px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '15px'
    }
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
  filterSection: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e5e7eb'
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '15px'
    }
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  filterLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1e3a5f'
  },
  filterInput: {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    '@media (max-width: 768px)': {
      padding: '12px 14px',
      fontSize: '1rem'
    }
  },
  filterSelect: {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    cursor: 'pointer'
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
    overflowX: 'auto',
    '@media (max-width: 768px)': {
      padding: '15px',
      overflowX: 'scroll'
    }
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
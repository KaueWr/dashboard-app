import React, { useState, useEffect, useCallback } from 'react';
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
      
      let data;
      if (dataString.includes('/')) {
        const [dia, mes, ano] = dataString.split('/');
        data = new Date(ano, mes - 1, dia);
      } else if (dataString.includes('-')) {
        data = new Date(dataString);
      } else {
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
      if (dataInicial.includes('/')) {
        const [dia, mes, ano] = dataInicial.split('/');
        data1 = new Date(ano, mes - 1, dia);
        const [dia2, mes2, ano2] = dataFinal.split('/');
        data2 = new Date(ano2, mes2 - 1, dia2);
      } else if (dataInicial.includes('-')) {
        data1 = new Date(dataInicial);
        data2 = new Date(dataFinal);
      } else {
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

  // Função para sincronizar dados - Envolvida em useCallback para evitar avisos de dependência
  const syncData = useCallback(async () => {
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
              const dataInicial = String(row[4] || '').trim();
              const dataFinal = String(row[5] || '').trim();

              if (!itemName || !situacao) continue;

              items.push({
                item: itemName,
                situacao: situacao,
                dataInicial: dataInicial,
                dataFinal: dataFinal
              });

              counts[situacao] = (counts[situacao] || 0) + 1;

              if (dataInicial && dataFinal) {
                const leadTime = calcularLeadTime(dataInicial, dataFinal);
                try {
                  let mes = '';
                  if (dataFinal.includes('/')) {
                    const [_, mesNum, ano] = dataFinal.split('/'); // Corrigido: dia para _
                    mes = `${mesNum}/${ano}`;
                  } else if (dataFinal.includes('-')) {
                    const [ano, mesNum, _] = dataFinal.split('-'); // Corrigido: dia para _
                    mes = `${mesNum}/${ano}`;
                  }
                  
                  if (mes) {
                    if (!leadTimesByMonth[mes]) {
                      leadTimesByMonth[mes] = { total: 0, count: 0 };
                    }
                    leadTimesByMonth[mes].total += leadTime;
                    leadTimesByMonth[mes].count += 1;
                  }
                } catch (e) {}
              }

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
            setError(`Erro ao processar: ${err.message}`);
            setLoading(false);
          }
        },
        error: (error) => {
          setError(`Erro ao processar CSV: ${error.message}`);
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []); // Dependências vazias para useCallback

  // Sincronizar ao carregar
  useEffect(() => {
    syncData();
  }, [syncData]); // Adicionado syncData como dependência

  // Atualizar automaticamente a cada 30 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      syncData();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [syncData]); // Adicionado syncData como dependência

  // Filtrar itens
  const filteredItems = data?.items.filter(item => {
    const matchName = item.item.toLowerCase().includes(filterName.toLowerCase());
    const matchStatus = filterStatus === '' || item.situacao === filterStatus;
    return matchName && matchStatus;
  }) || [];

  const styles = {
    container: { fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh' },
    header: { backgroundColor: '#1f2937', color: 'white', padding: '1rem 2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' },
    logo: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    logoIcon: { fontSize: '1.5rem' },
    logoText: { fontSize: '1.25rem', fontWeight: 'bold' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    button: { padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
    buttonSync: { backgroundColor: '#3b82f6', color: 'white' },
    lastSyncText: { fontSize: '0.875rem', color: '#9ca3af' },
    tabsContainer: { display: 'flex', gap: '1rem', maxWidth: '1200px', margin: '1rem auto 0' },
    tab: { padding: '0.5rem 1rem', backgroundColor: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', borderBottom: '2px solid transparent' },
    tabActive: { color: '#3b82f6', borderBottom: '2px solid #3b82f6' },
    main: { maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' },
    messageError: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' },
    card: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' },
    statCard: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' },
    statValue: { fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' },
    statLabel: { color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' },
    chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #e5e7eb', color: '#374151' },
    td: { padding: '0.75rem', borderBottom: '1px solid #e5e7eb' },
    badge: { padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' },
    filterContainer: { display: 'flex', gap: '1rem', marginBottom: '1rem' },
    input: { padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', flex: 1 }
  };

  if (loading && !data) return <div style={{...styles.container, display: 'flex', justifyContent: 'center', alignItems: 'center'}}><h2>Carregando Dashboard...</h2></div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>📊</span>
            <span style={styles.logoText}>Dashboard de Desenvolvimento</span>
          </div>
          <div style={styles.headerRight}>
            <button onClick={syncData} disabled={loading} style={{...styles.button, ...styles.buttonSync}}>
              {loading ? '⏳ Sincronizando...' : '🔄 Atualizar'}
            </button>
            {lastSync && <span style={styles.lastSyncText}>Atualizado: {lastSync}</span>}
          </div>
        </div>
        <div style={styles.tabsContainer}>
          <button onClick={() => setActiveTab('dashboard')} style={{...styles.tab, ...(activeTab === 'dashboard' ? styles.tabActive : {})}}>Painel</button>
          <button onClick={() => setActiveTab('tabela')} style={{...styles.tab, ...(activeTab === 'tabela' ? styles.tabActive : {})}}>Lista de Itens</button>
        </div>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.messageError}>{error}</div>}

        {activeTab === 'dashboard' ? (
          <>
            <div style={styles.grid}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{data?.totalItems || 0}</div>
                <div style={styles.statLabel}>Total de Itens</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{data?.countAgRetorno || 0}</div>
                <div style={styles.statLabel}>Aguardando Retorno</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{data?.mediaAgRetorno || 0} dias</div>
                <div style={styles.statLabel}>Média de Espera (AG. RETORNO)</div>
              </div>
            </div>

            <div style={styles.chartGrid}>
              <div style={styles.card}>
                <h3>Situação Geral</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data?.chartData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {data?.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={styles.card}>
                <h3>Lead Time Médio por Mês (Dias)</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.leadTimeChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="leadTime" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.card}>
            <div style={styles.filterContainer}>
              <input type="text" placeholder="Filtrar por nome..." value={filterName} onChange={(e) => setFilterName(e.target.value)} style={styles.input} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.input}>
                <option value="">Todos os Status</option>
                {Object.keys(COLORS).map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Situação</th>
                    <th style={styles.th}>Data Inicial</th>
                    <th style={styles.th}>Data Final</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{item.item}</td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, backgroundColor: COLORS[item.situacao] + '20', color: COLORS[item.situacao]}}>
                          {item.situacao}
                        </span>
                      </td>
                      <td style={styles.td}>{item.dataInicial}</td>
                      <td style={styles.td}>{item.dataFinal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
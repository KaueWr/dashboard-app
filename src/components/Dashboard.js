import React from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function Dashboard({ data, loading }) {
  const styles = {
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' },
    statCard: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' },
    statValue: { fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' },
    statLabel: { color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' },
    chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' },
    card: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }
  };

  if (loading && !data) return <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando dados...</div>;

  return (
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
                  {data?.chartData?.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
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
  );
}

export default Dashboard;
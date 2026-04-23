import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TabelaItens from './components/TabelaItens';
import Cadastro from './components/Cadastro';

// ⭐ CONFIGURAÇÃO: Centralizada no App.js
const GOOGLE_SHEET_LINK = process.env.REACT_APP_GOOGLE_SHEET_LINK || 'https://docs.google.com/spreadsheets/d/1ihDtW4T7nELD0EVzbgQg6J3XPvB9uI5BAltPh26uytg/edit?usp=sharing';
const GOOGLE_APPS_SCRIPT_URL = process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzQRY2Kcc_JlI1SHthDawvyO1356FFOilzCErqkJiXyGBj00-UXczvUdBjK0Tj7kPagQQ/exec';
const API_KEY = process.env.REACT_APP_API_KEY || 'kaue1012';

const COLORS = {
  'APROVADO': '#10b981',
  'REPROVADO': '#ef4444',
  'AJUSTAR': '#f97316',
  'AG. RETORNO': '#eab308'
};

const parseDate = (dateString) => {
  if (!dateString) return null;
  let dateObj = null;
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/').map(Number);
    dateObj = new Date(year, month - 1, day);
  } else if (dateString.includes('-')) {
    dateObj = new Date(dateString);
  } else {
    dateObj = new Date(dateString);
  }
  return isNaN(dateObj.getTime()) ? null : dateObj;
};

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const syncData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const match = GOOGLE_SHEET_LINK.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) throw new Error('Link da planilha inválido');
      const sheetId = match[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=DESENVOLVIMENTO&apiKey=${API_KEY}`;

      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Não conseguiu acessar a planilha.');
      const csvText = await response.text();

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

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length < 7 || !row[0] || !row[6] || String(row[0]).trim() === 'NOME DO PRODUTO') continue;

              const item = {
                item: String(row[0]).trim(),
                malharia: String(row[1]).trim(),
                representante: String(row[2]).trim(),
                cliente: String(row[3]).trim(),
                dataInicial: String(row[4]).trim(),
                dataFinal: String(row[5]).trim(),
                situacao: String(row[6]).trim(),
                observacoes: String(row[7]).trim()
              };

              items.push(item);
              counts[item.situacao] = (counts[item.situacao] || 0) + 1;

              if (item.dataInicial && item.dataFinal) {
                const d1 = parseDate(item.dataInicial);
                const d2 = parseDate(item.dataFinal);
                if (d1 && d2) {
                  const leadTime = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
                  const mes = `${(d2.getMonth() + 1).toString().padStart(2, '0')}/${d2.getFullYear()}`;
                  if (!leadTimesByMonth[mes]) leadTimesByMonth[mes] = { total: 0, count: 0 };
                  leadTimesByMonth[mes].total += leadTime;
                  leadTimesByMonth[mes].count += 1;
                }
              }

              if (item.situacao === 'AG. RETORNO' && item.dataFinal) {
                const dEnvio = parseDate(item.dataFinal);
                if (dEnvio) {
                  const hoje = new Date();
                  hoje.setHours(0,0,0,0);
                  dEnvio.setHours(0,0,0,0);
                  diasAgRetorno += Math.floor((hoje - dEnvio) / (1000 * 60 * 60 * 24));
                  countAgRetorno++;
                }
              }
            }

            const chartData = Object.entries(counts).map(([name, value]) => ({
              name, value, fill: COLORS[name] || '#6b7280'
            }));

            const leadTimeChartData = Object.entries(leadTimesByMonth)
              .map(([mes, d]) => ({ mes, leadTime: Math.round(d.total / d.count) }))
              .sort((a, b) => {
                const [m1, y1] = a.mes.split('/').map(Number);
                const [m2, y2] = b.mes.split('/').map(Number);
                return (y1 * 12 + m1) - (y2 * 12 + m2);
              });

            setData({ items, counts, chartData, leadTimeChartData, totalItems: items.length, mediaAgRetorno: countAgRetorno > 0 ? Math.round(diasAgRetorno / countAgRetorno) : 0, countAgRetorno });
            setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setLoading(false);
          } catch (err) { setError(err.message); setLoading(false); }
        }
      });
    } catch (err) { setError(err.message); setLoading(false); }
  }, []);

  useEffect(() => { syncData(); }, [syncData]);

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
        {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}
        
        {activeTab === 'dashboard' && <Dashboard data={data} loading={loading} />}
        {activeTab === 'tabela' && <TabelaItens data={data} colors={COLORS} />}
        {activeTab === 'cadastro' && (
          <Cadastro 
            apiUrl={GOOGLE_APPS_SCRIPT_URL} 
            apiKey={API_KEY} 
            onSuccess={syncData} 
            colors={COLORS} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
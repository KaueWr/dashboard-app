import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ⭐ CONFIGURAÇÃO: Use variáveis de ambiente para URLs e API Key
// Certifique-se de configurar estas variáveis no seu ambiente de desenvolvimento/produção.
// Ex: REACT_APP_GOOGLE_SHEET_LINK, REACT_APP_GOOGLE_APPS_SCRIPT_URL, REACT_APP_API_KEY
const GOOGLE_SHEET_LINK = process.env.REACT_APP_GOOGLE_SHEET_LINK || 'https://docs.google.com/spreadsheets/d/1ihDtW4T7nELD0EVzbgQg6J3XPvB9uI5BAltPh26uytg/edit?usp=sharing';
const GOOGLE_APPS_SCRIPT_URL = process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyn5xr7cPZm1D8cib7KKL6C4o3Gv1S8LeoC1z1IfHgXtkYK0u6FnK5dCrHHww9GWIbCbw/exec';
const API_KEY = process.env.REACT_APP_API_KEY || 'SUA_CHAVE_API_AQUI'; // Deve ser a mesma chave configurada no Google Apps Script

const COLORS = {
  'APROVADO': '#10b981',
  'REPROVADO': '#ef4444',
  'AJUSTAR': '#f97316',
  'AG. RETORNO': '#eab308'
};

// Função auxiliar para parsear datas em diferentes formatos para um objeto Date
const parseDate = (dateString) => {
  if (!dateString) return null;
  let dateObj = null;
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/').map(Number);
    dateObj = new Date(year, month - 1, day);
  } else if (dateString.includes('-')) {
    dateObj = new Date(dateString); // Assume YYYY-MM-DD
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
  
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formArtigo, setFormArtigo] = useState({
    nomeProduto: '', malharia: '', representante: '', cliente: '',
    dataProjeto: '', dataEnvio: '', situacao: '', observacoes: ''
  });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  // Função para calcular dias passados
  const calcularDiasPassados = (dataString) => {
    const dataObj = parseDate(dataString);
    if (!dataObj) return 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataObj.setHours(0, 0, 0, 0);
    const diferenca = hoje - dataObj;
    return Math.floor(diferenca / (1000 * 60 * 60 * 24));
  };

  // Função para calcular lead time
  const calcularLeadTime = (dataInicialString, dataFinalString) => {
    const d1 = parseDate(dataInicialString);
    const d2 = parseDate(dataFinalString);
    if (!d1 || !d2) return 0;
    const diferenca = d2 - d1;
    return Math.floor(diferenca / (1000 * 60 * 60 * 24));
  };

  // Função para sincronizar dados
  const syncData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const match = GOOGLE_SHEET_LINK.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) throw new Error('Link da planilha inválido');
      const sheetId = match[1];
      // Adiciona a chave de API à URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=DESENVOLVIMENTO&apiKey=${API_KEY}`;

      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error('Não conseguiu acessar a planilha. Verifique o compartilhamento e a chave de API.');
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

            // Começa da linha 2 (índice 1) e ignora linhas vazias ou incompletas
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length < 7 || !row[0] || !row[6] || String(row[0]).trim() === 'NOME DO PRODUTO') continue;

              const nomeProduto = String(row[0] || '').trim();
              const malharia = String(row[1] || '').trim();
              const representante = String(row[2] || '').trim();
              const cliente = String(row[3] || '').trim();
              const dataProjeto = String(row[4] || '').trim();
              const dataEnvio = String(row[5] || '').trim();
              const situacao = String(row[6] || '').trim();
              const observacoes = String(row[7] || '').trim();

              items.push({
                item: nomeProduto, malharia, representante, cliente, situacao,
                dataInicial: dataProjeto, dataFinal: dataEnvio, observacoes
              });

              counts[situacao] = (counts[situacao] || 0) + 1;

              if (dataProjeto && dataEnvio) {
                const leadTime = calcularLeadTime(dataProjeto, dataEnvio);
                const dataEnvioObj = parseDate(dataEnvio);
                if (dataEnvioObj) {
                  const mes = `${(dataEnvioObj.getMonth() + 1).toString().padStart(2, '0')}/${dataEnvioObj.getFullYear()}`;
                  if (!leadTimesByMonth[mes]) leadTimesByMonth[mes] = { total: 0, count: 0 };
                  leadTimesByMonth[mes].total += leadTime;
                  leadTimesByMonth[mes].count += 1;
                }
              }

              if (situacao === 'AG. RETORNO' && dataEnvio) {
                diasAgRetorno += calcularDiasPassados(dataEnvio);
                countAgRetorno++;
              }
            }

            if (items.length === 0) throw new Error('Nenhum item encontrado na planilha. Verifique se os dados começam na linha 2.');

            const chartData = Object.entries(counts).map(([name, value]) => ({
              name, value, fill: COLORS[name] || '#6b7280'
            }));

            const leadTimeChartData = Object.entries(leadTimesByMonth)
              .map(([mes, dados]) => ({ mes, leadTime: Math.round(dados.total / dados.count) }))
              .sort((a, b) => {
                const [m1, y1] = b.mes.split('/').map(Number);
                const [m2, y2] = a.mes.split('/').map(Number);
                return (y1 * 12 + m1) - (y2 * 12 + m2); // Ordena por ano e mês
              });

            setData({
              items, counts, chartData, totalItems: items.length,
              leadTimeChartData, mediaAgRetorno: countAgRetorno > 0 ? Math.round(diasAgRetorno / countAgRetorno) : 0,
              countAgRetorno
            });
            const now = new Date();
            setLastSync(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
            setLoading(false);
          } catch (err) { setError(err.message); setLoading(false); }
        }
      });
    } catch (err) { setError(err.message); setLoading(false); }
  }, []);

  useEffect(() => { syncData(); }, [syncData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage({ type: '', text: '' });
    try {
      // Validação básica do formulário antes de enviar
      if (!formArtigo.nomeProduto || !formArtigo.cliente || !formArtigo.situacao) {
        throw new Error('Por favor, preencha os campos obrigatórios: Nome do Produto, Cliente e Situação.');
      }

      const now = new Date();
      const dataCadastro = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
      const payload = {
        "NOME DO PRODUTO": formArtigo.nomeProduto,
        "MALHARIA": formArtigo.malharia,
        "REPRESENTANTE": formArtigo.representante,
        "CLIENTE": formArtigo.cliente,
        "DATA DO PROJETO": formArtigo.dataProjeto,
        "DATA DE ENVIO": formArtigo.dataEnvio,
        "SITUAÇÃO": formArtigo.situacao,
        "OBSERVAÇÃO": formArtigo.observacoes,
        "DATA DE CADASTRO": dataCadastro
      };
      
      // Adiciona a chave de API à URL do Apps Script
      const appsScriptUrlWithKey = `${GOOGLE_APPS_SCRIPT_URL}?apiKey=${API_KEY}`;

      const response = await fetch(appsScriptUrlWithKey, {
        method: 'POST', mode: 'no-cors', cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Como mode: 'no-cors', a resposta não pode ser lida diretamente. Assume sucesso se não houver erro de rede.
      setFormMessage({ type: 'success', text: 'Artigo cadastrado com sucesso!' });
      setFormArtigo({ nomeProduto: '', malharia: '', representante: '', cliente: '', dataProjeto: '', dataEnvio: '', situacao: '', observacoes: '' });
      setTimeout(() => syncData(), 2000); // Sincroniza os dados após o cadastro
    } catch (err) { setFormMessage({ type: 'error', text: err.message }); }
    finally { setSubmitting(false); }
  };

  const filteredItems = data?.items.filter(item => 
    item.item.toLowerCase().includes(filterName.toLowerCase()) && (filterStatus === '' || item.situacao === filterStatus)
  ) || [];

  // Estilos permanecem inline para manter a essência do código original, mas podem ser refatorados.
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
    input: { padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', flex: 1 },
    formGroup: { marginBottom: '1rem' },
    formLabel: { display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' },
    formInput: { width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' },
    formSelect: { width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' },
    formTextarea: { width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box', minHeight: '80px' },
    formButton: { backgroundColor: '#10b981', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '600', transition: 'background-color 0.2s' },
    messageSuccess: { backgroundColor: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' },
    messageErrorForm: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }
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
          <button onClick={() => setActiveTab('cadastro')} style={{...styles.tab, ...(activeTab === 'cadastro' ? styles.tabActive : {})}}>Cadastro de Artigo</button>
        </div>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.messageError}>{error}</div>}

        {activeTab === 'dashboard' && (
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
        )}

        {activeTab === 'tabela' && (
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
                    <th style={styles.th}>Nome do Produto</th>
                    <th style={styles.th}>Malharia</th>
                    <th style={styles.th}>Representante</th>
                    <th style={styles.th}>Cliente</th>
                    <th style={styles.th}>Situação</th>
                    <th style={styles.th}>Data do Projeto</th>
                    <th style={styles.th}>Data de Envio</th>
                    <th style={styles.th}>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{item.item}</td>
                      <td style={styles.td}>{item.malharia}</td>
                      <td style={styles.td}>{item.representante}</td>
                      <td style={styles.td}>{item.cliente}</td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, backgroundColor: COLORS[item.situacao] + '20', color: COLORS[item.situacao]}}>
                          {item.situacao}
                        </span>
                      </td>
                      <td style={styles.td}>{item.dataInicial}</td>
                      <td style={styles.td}>{item.dataFinal}</td>
                      <td style={styles.td}>{item.observacoes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'cadastro' && (
          <div style={styles.card}>
            <h3>Cadastro de Novo Artigo</h3>
            {formMessage.type === 'success' && <div style={styles.messageSuccess}>{formMessage.text}</div>}
            {formMessage.type === 'error' && <div style={styles.messageErrorForm}>{formMessage.text}</div>}
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label htmlFor="nomeProduto" style={styles.formLabel}>Nome do Produto:</label>
                <input type="text" id="nomeProduto" name="nomeProduto" value={formArtigo.nomeProduto} onChange={(e) => setFormArtigo({...formArtigo, nomeProduto: e.target.value})} style={styles.formInput} required />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="malharia" style={styles.formLabel}>Malharia:</label>
                <input type="text" id="malharia" name="malharia" value={formArtigo.malharia} onChange={(e) => setFormArtigo({...formArtigo, malharia: e.target.value})} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="representante" style={styles.formLabel}>Representante:</label>
                <input type="text" id="representante" name="representante" value={formArtigo.representante} onChange={(e) => setFormArtigo({...formArtigo, representante: e.target.value})} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="cliente" style={styles.formLabel}>Cliente:</label>
                <input type="text" id="cliente" name="cliente" value={formArtigo.cliente} onChange={(e) => setFormArtigo({...formArtigo, cliente: e.target.value})} style={styles.formInput} required />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="dataProjeto" style={styles.formLabel}>Data do Projeto:</label>
                <input type="date" id="dataProjeto" name="dataProjeto" value={formArtigo.dataProjeto} onChange={(e) => setFormArtigo({...formArtigo, dataProjeto: e.target.value})} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="dataEnvio" style={styles.formLabel}>Data de Envio:</label>
                <input type="date" id="dataEnvio" name="dataEnvio" value={formArtigo.dataEnvio} onChange={(e) => setFormArtigo({...formArtigo, dataEnvio: e.target.value})} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="situacao" style={styles.formLabel}>Situação:</label>
                <select id="situacao" name="situacao" value={formArtigo.situacao} onChange={(e) => setFormArtigo({...formArtigo, situacao: e.target.value})} style={styles.formSelect} required>
                  <option value="">Selecione uma situação</option>
                  {Object.keys(COLORS).map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="observacoes" style={styles.formLabel}>Observação:</label>
                <textarea id="observacoes" name="observacoes" value={formArtigo.observacoes} onChange={(e) => setFormArtigo({...formArtigo, observacoes: e.target.value})} style={styles.formTextarea}></textarea>
              </div>
              <button type="submit" disabled={submitting} style={styles.formButton}>
                {submitting ? 'Enviando...' : 'Cadastrar Artigo'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
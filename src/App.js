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

// ⭐ ATENÇÃO: ESTES LINKS SERÃO SUBSTITUÍDOS POR VARIÁVEIS DE AMBIENTE NO VERCEl
const GOOGLE_SHEET_LINK = process.env.REACT_APP_GOOGLE_SHEET_LINK; 
const GOOGLE_APPS_SCRIPT_URL = process.env.REACT_APP_GOOGLE_APPS_SCRIPT_URL; 
const MASTER_PASSWORD = process.env.REACT_APP_MASTER_PASSWORD;

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formArtigo, setFormArtigo] = useState({
    nomeProduto: '', malharia: '', representante: '', cliente: '',
    dataProjeto: '', dataEnvio: '', situacao: '', observacoes: ''
  });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  // --- NOVA FUNÇÃO: Formatar data para exibição resumida (DD/MM/AAAA) ---
  const formatarDataExibicao = (dataString) => {
    if (!dataString || dataString.trim() === "" || dataString === "-") return "-";
    try {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) return dataString;
      const dataObj = new Date(dataString);
      if (isNaN(dataObj.getTime())) return dataString;
      const dia = dataObj.getDate().toString().padStart(2, '0');
      const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
      const ano = dataObj.getFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch (e) { return dataString; }
  };

  const calcularDiasPassados = (dataString) => {
    try {
      if (!dataString) return 0;
      let dataObj;
      if (dataString.includes('/')) {
        const partes = dataString.split('/');
        dataObj = new Date(partes[2], partes[1] - 1, partes[0]);
      } else {
        dataObj = new Date(dataString);
      }
      if (isNaN(dataObj.getTime())) return 0;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      dataObj.setHours(0, 0, 0, 0);
      const diferenca = hoje.getTime() - dataObj.getTime();
      return Math.floor(diferenca / (1000 * 60 * 60 * 24));
    } catch (e) { return 0; }
  };

  const calcularLeadTime = (dataInicial, dataFinal) => {
    try {
      if (!dataInicial || !dataFinal) return 0;
      let d1, d2;
      if (dataInicial.includes('/')) {
        const p1 = dataInicial.split('/');
        d1 = new Date(p1[2], p1[1] - 1, p1[0]);
      } else { d1 = new Date(dataInicial); }
      
      if (dataFinal.includes('/')) {
        const p2 = dataFinal.split('/');
        d2 = new Date(p2[2], p2[1] - 1, p2[0]);
      } else { d2 = new Date(dataFinal); }

      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
      d1.setHours(0, 0, 0, 0);
      d2.setHours(0, 0, 0, 0);
      const diferenca = d2.getTime() - d1.getTime();
      return Math.floor(diferenca / (1000 * 60 * 60 * 24));
    } catch (e) { return 0; }
  };

  const syncData = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
      if (!response.ok) throw new Error('Erro ao acessar o Apps Script.');
      const csvText = await response.text();
      if (csvText.includes('"error"')) throw new Error('Erro no script da planilha.');

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
              if (!row || row.length < 7) continue;
              const nomeProduto = String(row[0] || '').trim();
              const malharia = String(row[1] || '').trim();
              const representante = String(row[2] || '').trim();
              const cliente = String(row[3] || '').trim();
              const dataProjeto = String(row[4] || '').trim();
              const dataEnvio = String(row[5] || '').trim();
              const situacao = String(row[6] || '').trim();
              const observacoes = String(row[7] || '').trim();

              if (!nomeProduto || !situacao) continue;
              items.push({
                item: nomeProduto, malharia, representante, cliente, situacao,
                dataInicial: dataProjeto, dataFinal: dataEnvio, observacoes
              });
              counts[situacao] = (counts[situacao] || 0) + 1;

              if (dataProjeto && dataEnvio) {
                const leadTime = calcularLeadTime(dataProjeto, dataEnvio);
                let mes = '';
                if (dataEnvio.includes('/')) {
                  const partes = dataEnvio.split('/');
                  mes = `${partes[1]}/${partes[2]}`;
                } else {
                  const d = new Date(dataEnvio);
                  if (!isNaN(d.getTime())) mes = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                }
                if (mes) {
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

            const chartData = Object.entries(counts).map(([name, value]) => ({
              name, value, fill: COLORS[name] || '#6b7280'
            }));

            const leadTimeChartData = Object.entries(leadTimesByMonth)
              .map(([mes, dados]) => ({ mes, leadTime: Math.round(dados.total / dados.count) }))
              .sort((a, b) => {
                const pA = a.mes.split('/'); const pB = b.mes.split('/');
                return pA[1] !== pB[1] ? pA[1] - pB[1] : pA[0] - pB[0];
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
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      syncData();
      const interval = setInterval(() => syncData(), 30 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, syncData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage({ type: '', text: '' });
    try {
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
      await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors', cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setFormMessage({ type: 'success', text: 'Artigo cadastrado com sucesso!' });
      setFormArtigo({ nomeProduto: '', malharia: '', representante: '', cliente: '', dataProjeto: '', dataEnvio: '', situacao: '', observacoes: '' });
      setTimeout(() => syncData(), 2000);
    } catch (err) { setFormMessage({ type: 'error', text: err.message }); }
    finally { setSubmitting(false); }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === MASTER_PASSWORD) { setIsLoggedIn(true); setLoginError(''); }
    else { setLoginError('Senha incorreta.'); }
  };

  const filteredItems = data?.items.filter(item => 
    item.item.toLowerCase().includes(filterName.toLowerCase()) && (filterStatus === '' || item.situacao === filterStatus)
  ) || [];

  const styles = {
    container: { fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh' },
    header: { backgroundColor: '#1f2937', color: 'white', padding: '1rem 2rem' },
    headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' },
    logo: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold' },
    button: { padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '600' },
    buttonSync: { backgroundColor: '#3b82f6', color: 'white' },
    tabsContainer: { display: 'flex', gap: '1rem', maxWidth: '1200px', margin: '1rem auto 0' },
    tab: { padding: '0.5rem 1rem', backgroundColor: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', borderBottom: '2px solid transparent' },
    tabActive: { color: '#3b82f6', borderBottom: '2px solid #3b82f6' },
    main: { maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' },
    card: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' },
    statCard: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center' },
    statValue: { fontSize: '2rem', fontWeight: 'bold' },
    statLabel: { color: '#6b7280', fontSize: '0.875rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #e5e7eb' },
    td: { padding: '0.75rem', borderBottom: '1px solid #e5e7eb' },
    badge: { padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' },
    input: { padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', flex: 1 },
    formGroup: { marginBottom: '1rem' },
    formInput: { width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' },
    loginContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' },
    loginCard: { backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', textAlign: 'center', width: '100%', maxWidth: '400px' }
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h2>Acesso Restrito</h2>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.formInput} required />
            {loginError && <div style={{color: 'red', margin: '1rem 0'}}>{loginError}</div>}
            <button type="submit" style={{...styles.button, ...styles.buttonSync, width: '100%', marginTop: '1rem'}}>Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !data) return <div style={{textAlign: 'center', marginTop: '20%'}}><h2>Carregando...</h2></div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>📊 Dashboard de Desenvolvimento</div>
          <div>
            <button onClick={syncData} disabled={loading} style={{...styles.button, ...styles.buttonSync}}>
              {loading ? '⏳ Sincronizando...' : '🔄 Atualizar'}
            </button>
          </div>
        </div>
        <div style={styles.tabsContainer}>
          <button onClick={() => setActiveTab('dashboard')} style={{...styles.tab, ...(activeTab === 'dashboard' ? styles.tabActive : {})}}>Painel</button>
          <button onClick={() => setActiveTab('tabela')} style={{...styles.tab, ...(activeTab === 'tabela' ? styles.tabActive : {})}}>Lista de Itens</button>
          <button onClick={() => setActiveTab('cadastro')} style={{...styles.tab, ...(activeTab === 'cadastro' ? styles.tabActive : {})}}>Cadastro</button>
        </div>
      </header>

      <main style={styles.main}>
        {activeTab === 'dashboard' && (
          <>
            <div style={styles.grid}>
              <div style={styles.statCard}><div style={styles.statValue}>{data?.totalItems || 0}</div><div style={styles.statLabel}>Total de Itens</div></div>
              <div style={styles.statCard}><div style={styles.statValue}>{data?.countAgRetorno || 0}</div><div style={styles.statLabel}>Aguardando Retorno</div></div>
              <div style={styles.statCard}><div style={styles.statValue}>{data?.mediaAgRetorno || 0} dias</div><div style={styles.statLabel}>Média de Espera</div></div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem'}}>
              <div style={styles.card}>
                <h3>Situação Geral</h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data?.chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {data?.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={styles.card}>
                <h3>Lead Time Médio (Dias)</h3>
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
            <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
              <input type="text" placeholder="Filtrar nome..." value={filterName} onChange={(e) => setFilterName(e.target.value)} style={styles.input} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.input}>
                <option value="">Todos os Status</option>
                {Object.keys(COLORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Produto</th>
                    <th style={styles.th}>Cliente</th>
                    <th style={styles.th}>Situação</th>
                    <th style={styles.th}>Data Projeto</th>
                    <th style={styles.th}>Data Envio</th>
                    <th style={styles.th}>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{item.item}</td>
                      <td style={styles.td}>{item.cliente}</td>
                      <td style={styles.td}>
                        <span style={{...styles.badge, backgroundColor: COLORS[item.situacao] + '20', color: COLORS[item.situacao]}}>{item.situacao}</span>
                      </td>
                      <td style={styles.td}>{formatarDataExibicao(item.dataInicial)}</td>
                      <td style={styles.td}>{formatarDataExibicao(item.dataFinal)}</td>
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
            <h3>Novo Artigo</h3>
            {formMessage.text && <div style={{padding: '1rem', marginBottom: '1rem', borderRadius: '0.5rem', backgroundColor: formMessage.type === 'success' ? '#d1fae5' : '#fee2e2'}}>{formMessage.text}</div>}
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}><label>Produto:</label><input type="text" value={formArtigo.nomeProduto} onChange={e => setFormArtigo({...formArtigo, nomeProduto: e.target.value})} style={styles.formInput} required /></div>
              <div style={styles.formGroup}><label>Cliente:</label><input type="text" value={formArtigo.cliente} onChange={e => setFormArtigo({...formArtigo, cliente: e.target.value})} style={styles.formInput} required /></div>
              <div style={styles.formGroup}><label>Data Projeto:</label><input type="date" value={formArtigo.dataProjeto} onChange={e => setFormArtigo({...formArtigo, dataProjeto: e.target.value})} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label>Data Envio:</label><input type="date" value={formArtigo.dataEnvio} onChange={e => setFormArtigo({...formArtigo, dataEnvio: e.target.value})} style={styles.formInput} /></div>
              <div style={styles.formGroup}>
                <label>Situação:</label>
                <select value={formArtigo.situacao} onChange={e => setFormArtigo({...formArtigo, situacao: e.target.value})} style={styles.formInput} required>
                  <option value="">Selecione...</option>
                  {Object.keys(COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}><label>Observação:</label><textarea value={formArtigo.observacoes} onChange={e => setFormArtigo({...formArtigo, observacoes: e.target.value})} style={{...styles.formInput, minHeight: '80px'}}></textarea></div>
              <button type="submit" disabled={submitting} style={{...styles.button, backgroundColor: '#10b981', color: 'white'}}>{submitting ? 'Enviando...' : 'Cadastrar'}</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
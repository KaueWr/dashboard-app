import React, { useState } from 'react';

function TabelaItens({ data, colors }) {
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const styles = {
    card: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' },
    filterContainer: { display: 'flex', gap: '1rem', marginBottom: '1rem' },
    input: { padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', flex: 1 },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid #e5e7eb', color: '#374151' },
    td: { padding: '0.75rem', borderBottom: '1px solid #e5e7eb' },
    badge: { padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }
  };

  const filteredItems = data?.items.filter(item => 
    item.item.toLowerCase().includes(filterName.toLowerCase()) && (filterStatus === '' || item.situacao === filterStatus)
  ) || [];

  return (
    <div style={styles.card}>
      <div style={styles.filterContainer}>
        <input type="text" placeholder="Filtrar por nome..." value={filterName} onChange={(e) => setFilterName(e.target.value)} style={styles.input} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.input}>
          <option value="">Todos os Status</option>
          {Object.keys(colors).map(status => <option key={status} value={status}>{status}</option>)}
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
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <tr key={index}>
                  <td style={styles.td}>{item.item}</td>
                  <td style={styles.td}>{item.malharia}</td>
                  <td style={styles.td}>{item.representante}</td>
                  <td style={styles.td}>{item.cliente}</td>
                  <td style={styles.td}>
                    <span style={{...styles.badge, backgroundColor: colors[item.situacao] + '20', color: colors[item.situacao]}}>
                      {item.situacao}
                    </span>
                  </td>
                  <td style={styles.td}>{item.dataInicial}</td>
                  <td style={styles.td}>{item.dataFinal}</td>
                  <td style={styles.td}>{item.observacoes}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Nenhum item encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TabelaItens;
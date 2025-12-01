import React, { useState, useEffect } from 'react'
import api from '../../services/api'

export default function Reports(){
  const [ocupacao, setOcupacao] = useState([])
  const [valores, setValores] = useState([])
  const [mensal, setMensal] = useState(null)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [ano, setAno] = useState(new Date().getFullYear())

  useEffect(() => {
    loadOcupacao()
    loadValores()
    loadMensal()
  }, [mes, ano])

  async function loadOcupacao(){
    try {
      const { data } = await api.get('/admin/reports/occupation')
      setOcupacao(data)
    } catch (e) {
      console.error('Erro ao carregar ocupação:', e)
    }
  }

  async function loadValores(){
    try {
      const { data } = await api.get('/admin/reports/flight-value')
      setValores(data)
    } catch (e) {
      console.error('Erro ao carregar valores:', e)
    }
  }

  async function loadMensal(){
    try {
      const { data } = await api.get('/admin/reports/monthly-by-type', {
        params: { mes, ano }
      })
      setMensal(data)
    } catch (e) {
      console.error('Erro ao carregar relatório mensal:', e)
    }
  }

  return (
    <div className="grid">
      <h2>Relatórios (F15)</h2>

      <div className="card">
        <h3>Ocupação de Voos</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Voo</th>
              <th>Assentos Ocupados</th>
              <th>Total de Assentos</th>
              <th>Disponíveis</th>
              <th>Ocupação</th>
              <th>Reservas</th>
            </tr>
          </thead>
          <tbody>
            {ocupacao.map((v, idx) => (
              <tr key={idx}>
                <td>{v.voo}</td>
                <td>{v.assentosOcupados}</td>
                <td>{v.totalAssentos}</td>
                <td>{v.assentosDisponiveis}</td>
                <td>{v.percentualOcupacao}%</td>
                <td>{v.reservas}</td>
              </tr>
            ))}
            {ocupacao.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Nenhum dado disponível</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Valor Total por Voo</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Voo</th>
              <th>Origem</th>
              <th>Destino</th>
              <th>Data do Voo</th>
              <th>Valor Total (R$)</th>
              <th>Reservas</th>
            </tr>
          </thead>
          <tbody>
            {valores.map((v, idx) => (
              <tr key={idx}>
                <td>{v.voo}</td>
                <td>{v.origem}</td>
                <td>{v.destino}</td>
                <td>{new Date(v.dataVoo).toLocaleDateString()}</td>
                <td>R$ {v.valorTotal.toFixed(2)}</td>
                <td>{v.reservas}</td>
              </tr>
            ))}
            {valores.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>Nenhum dado disponível</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Valor Mensal por Tipo de Voo</h3>
        <div className="row" style={{marginBottom: 12}}>
          <label>Mês:
            <select value={mes} onChange={e => setMes(Number(e.target.value))}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label>Ano:
            <input type="number" value={ano} onChange={e => setAno(Number(e.target.value))} min="2020" max="2030"/>
          </label>
        </div>
        {mensal && (
          <div>
            <p><strong>Período:</strong> {mensal.mes}/{mensal.ano}</p>
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo de Voo</th>
                  <th>Valor Total (R$)</th>
                  <th>Reservas</th>
                  <th>Passagens</th>
                </tr>
              </thead>
              <tbody>
                {mensal.dados.map((d, idx) => (
                  <tr key={idx}>
                    <td>{d.tipo}</td>
                    <td>R$ {d.valorTotal.toFixed(2)}</td>
                    <td>{d.reservas}</td>
                    <td>{d.passagens}</td>
                  </tr>
                ))}
                {mensal.dados.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign: 'center'}}>Nenhum dado disponível para este período</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


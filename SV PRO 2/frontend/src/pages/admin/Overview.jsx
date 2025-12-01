import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function AdminOverview(){
  const [msg, setMsg] = useState('')
  const [voos, setVoos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadVoos()
  }, [])

  async function loadVoos(){
    setLoading(true)
    try {
      const { data } = await api.get('/flights')
      setVoos(data)
    } catch(e){
      console.error('Erro ao carregar voos:', e)
    } finally {
      setLoading(false)
    }
  }

  async function seed(){
    setMsg('Populando dados de teste...')
    try {
      const { data } = await api.post('/admin/seed/londrina')
      setMsg('Ok! Voos criados: '+data.created)
      await loadVoos() // Recarregar voos após popular
    } catch(e){
      setMsg('Erro: ' + (e?.response?.data?.error || e.message))
    }
  }

  async function updateFlightsTeams(){
    setMsg('Atualizando voos com equipes...')
    try {
      const { data } = await api.post('/admin/seed/update-flights-teams')
      setMsg(`Ok! ${data.updated} voos atualizados com equipes`)
      await loadVoos()
    } catch(e){
      setMsg('Erro: ' + (e?.response?.data?.error || e.message))
    }
  }

  async function deleteVoo(id){
    if (!confirm('Tem certeza que deseja excluir este voo?')) return
    try {
      await api.delete(`/admin/flights/${id}`)
      setMsg('Voo excluído com sucesso!')
      await loadVoos()
    } catch(e){
      setMsg('Erro ao excluir: ' + (e?.response?.data?.error || e.message))
    }
  }

  return (
    <div className="grid">
      <h2>Visão Geral (Mantenedor)</h2>
      
      <div className="card" style={{marginBottom: 16}}>
        <h3>Popular Dados de Teste</h3>
        <p>Crie rapidamente aeroportos (inclui LDB), aeronaves, funcionários e ~20 voos partindo de Londrina-PR (diretos e com escala).</p>
        <div className="row" style={{gap: 8}}>
          <button className="btn" onClick={seed}>Popular dados de teste</button>
          <button className="btn ghost" onClick={updateFlightsTeams}>Atualizar voos com equipes</button>
        </div>
        {!!msg && <div className="badge" style={{marginTop:8}}>{msg}</div>}
      </div>

      <div className="card">
        <div className="row" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
          <h3>Voos Cadastrados ({voos.length})</h3>
          <Link to="/dashboard/admin/search" className="btn ghost">Ver todos</Link>
        </div>
        
        {loading ? (
          <div style={{textAlign: 'center', padding: 20}}>Carregando voos...</div>
        ) : voos.length === 0 ? (
          <div className="badge" style={{textAlign: 'center', padding: 20}}>
            Nenhum voo cadastrado. Use o botão acima para popular dados de teste ou crie voos manualmente.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Data/Hora Saída</th>
                <th>Tipo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {voos.slice(0, 10).map(v => (
                <tr key={v._id}>
                  <td>{v.numero}</td>
                  <td>{v.origem?.sigla || '-'}</td>
                  <td>{v.destino?.sigla || '-'}</td>
                  <td>{v.horarioSaida ? new Date(v.horarioSaida).toLocaleString('pt-BR') : '-'}</td>
                  <td>
                    {(v.escalas && v.escalas.length > 0) ? (
                      <span style={{color: '#f59e0b'}}>Com escala</span>
                    ) : (
                      <span style={{color: '#10b981'}}>Direto</span>
                    )}
                  </td>
                  <td>
                    <Link className="btn ghost" to={`/dashboard/admin/search`} style={{marginRight:'0.5rem'}}>Ver</Link>
                    <Link className="btn ghost" to={`/dashboard/admin/edit-flight/${v._id}`} style={{marginRight:'0.5rem'}}>Editar</Link>
                    <button className="btn ghost" onClick={()=>deleteVoo(v._id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {voos.length > 10 && (
          <div style={{marginTop: 12, textAlign: 'center'}}>
            <Link to="/dashboard/admin/search" className="btn ghost">
              Ver todos os {voos.length} voos
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

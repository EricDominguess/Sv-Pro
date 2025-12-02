import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/Auth'

export default function Flights(){
  const { user } = useAuth()
  const [date, setDate] = useState('')
  const [origem, setOrigem] = useState('')
  const [destino, setDestino] = useState('')
  const [timeFrom, setTimeFrom] = useState('00:00')
  const [timeTo, setTimeTo] = useState('23:59')
  const [stops, setStops] = useState('any')
  const [list, setList] = useState([])
  const [airports, setAirports] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(()=>{
    async function loadAirports(){
      try {
        const { data } = await api.get('/flights/airports')
        setAirports(data || [])
      } catch(e){
        console.error('Erro ao carregar aeroportos:', e)
      }
    }
    loadAirports()
  }, [])

  async function search(){
    setLoading(true)
    try {
      // Se não há filtros, buscar todos os voos
      if (!date && (!origem || !origem.trim()) && (!destino || !destino.trim())) {
        const { data } = await api.get('/flights')
        setList(data || [])
      } else {
        // Com filtros, usar a busca
        const params = { stops }
        if (date) params.date = date
        if (origem && origem.trim()) params.origem = origem.trim()
        if (destino && destino.trim()) params.destino = destino.trim()
        if (date && timeFrom) params.timeFrom = timeFrom
        if (date && timeTo) params.timeTo = timeTo
        const { data } = await api.get('/flights/search', { params })
        setList(data || [])
      }
    } catch (e) {
      console.error('Erro ao buscar voos:', e)
      setList([])
    } finally {
      setLoading(false)
    }
  }

  // Carregar todos os voos na inicialização
  useEffect(()=>{ 
    search() 
  }, [])

  async function deleteVoo(id){
    if (!confirm('Tem certeza que deseja excluir este voo?')) return
    try {
      await api.delete(`/admin/flights/${id}`)
      setMsg('Voo excluído com sucesso!')
      await search()
    } catch(e){
      setMsg('Erro ao excluir: ' + (e?.response?.data?.error || e.message))
    }
  }

  const isAdmin = user?.role === 'mantenedor'

  return (
    <div className="grid">
      <h2>Buscar voos</h2>
      {!!msg && <div className="badge" style={{marginBottom: 12}}>{msg}</div>}
      <div className="card" style={{marginBottom: 16}}>
        <div className="row" style={{flexWrap: 'wrap', gap: 8}}>
          <input 
            type="date" 
            value={date} 
            onChange={e=>setDate(e.target.value)} 
            placeholder="Data (opcional)"
            style={{flex: '0 0 auto'}}
          />
          <select 
            value={origem} 
            onChange={e=>setOrigem(e.target.value)}
            style={{flex: '1 1 120px'}}
          >
            <option value="">Origem (ex: LDB)</option>
            {airports.map(a => (
              <option key={a._id} value={a.sigla}>
                {a.sigla} - {a.cidade}
              </option>
            ))}
          </select>
          <select 
            value={destino} 
            onChange={e=>setDestino(e.target.value)}
            style={{flex: '1 1 120px'}}
          >
            <option value="">Destino (ex: GRU, GIG)</option>
            {airports.map(a => (
              <option key={a._id} value={a.sigla}>
                {a.sigla} - {a.cidade}
              </option>
            ))}
          </select>
          {date && (
            <>
              <label style={{flex: '0 0 auto'}}>
                De <input type="time" value={timeFrom} onChange={e=>setTimeFrom(e.target.value)} />
              </label>
              <label style={{flex: '0 0 auto'}}>
                Até <input type="time" value={timeTo} onChange={e=>setTimeTo(e.target.value)} />
              </label>
            </>
          )}
          <select value={stops} onChange={e=>setStops(e.target.value)} style={{flex: '0 0 auto'}}>
            <option value="any">Todos</option>
            <option value="direct">Direto</option>
            <option value="scale">Com escala</option>
          </select>
          <button className="btn" onClick={search} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>
      
      {list.length === 0 && !loading && (
        <div className="badge" style={{textAlign: 'center', padding: 20, background: '#fef3c7', color: '#92400e'}}>
          {!date && !origem && !destino ? (
            <div>
              <strong>Nenhum voo cadastrado.</strong><br/>
              Se você é mantenedor, acesse "Visão Geral" para popular dados de teste ou crie voos manualmente.
            </div>
          ) : (
            'Nenhum voo encontrado com os filtros selecionados. Tente ajustar a data, origem ou destino.'
          )}
        </div>
      )}
      
      {loading && (
        <div style={{textAlign: 'center', padding: 20}}>
          Carregando voos...
        </div>
      )}
      
      {list.length > 0 && (
        <table className="table">
          <thead><tr><th>Número</th><th>Origem</th><th>Destino</th><th>Saída</th><th>Chegada</th><th>Tipo</th><th></th></tr></thead>
          <tbody>
          {list.map(v => (
            <tr key={v._id}>
              <td>{v.numero}</td>
              <td>{v.origem?.sigla || '-'}</td>
              <td>{v.destino?.sigla || '-'}</td>
              <td>{v.horarioSaida ? new Date(v.horarioSaida).toLocaleString('pt-BR') : '-'}</td>
              <td>{v.horarioChegada ? new Date(v.horarioChegada).toLocaleString('pt-BR') : '-'}</td>
              <td>
                {(v.escalas && v.escalas.length > 0) ? (
                  <span style={{color: '#f59e0b'}}>Com escala</span>
                ) : (
                  <span style={{color: '#10b981'}}>Direto</span>
                )}
              </td>
              <td>
                <Link className="btn ghost" to={`/dashboard/flights/${v._id}`} style={{marginRight:'0.5rem'}}>Detalhes</Link>
                {isAdmin && <Link className="btn ghost" to={`/dashboard/admin/edit-flight/${v._id}`} style={{marginRight:'0.5rem'}}>Editar</Link>}
                {isAdmin && <button className="btn ghost" onClick={()=>deleteVoo(v._id)}>Excluir</button>}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import api from '../../services/api'

export default function AdminNewFlight(){
  const [airports, setAirports] = useState([])
  const [employees, setEmployees] = useState([])
  const [aircrafts, setAircrafts] = useState([])
  const [types, setTypes] = useState([])
  const [teams, setTeams] = useState([])
  const [withScale, setWithScale] = useState('nao')
  const [msg, setMsg] = useState('')

  const [form, setForm] = useState({
    numero:'', tipoVoo:'', aeronave:'', origem:'', destino:'',
    escalas:[], funcionarios:[], equipe:'', horarioSaida:'', horarioChegada:'', duracaoMinutos:60
  })

  useEffect(()=>{ load() }, [])

  async function load(){
    try {
      const [a1,a2,a3,a4,a5] = await Promise.all([
        api.get('/admin/airports'),
        api.get('/admin/employees'),
        api.get('/admin/aircrafts'),
        api.get('/admin/flight-types'),
        api.get('/admin/teams')
      ])
      setAirports(a1.data); setEmployees(a2.data); setAircrafts(a3.data); setTypes(a4.data); setTeams(a5.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setMsg('Erro ao carregar dados: ' + (error.response?.data?.error || error.message))
    }
  }

  async function submit(){
    try {
      if(!(form.numero && form.tipoVoo && form.aeronave && form.origem && form.destino && form.horarioSaida && form.horarioChegada))
        return setMsg('Preencha todos os campos obrigatórios.')
      
      // validação adicional: garantir que origem/destino/escala sejam compatíveis com tipo de voo
      const flightType = types.find(t => t._id === form.tipoVoo)
      const name = (flightType?.nome || '').toLowerCase()
      const isDomesticType = name.includes('doméstico') || name.includes('domestico')
      const isInternationalType = name.includes('internacional') || name.includes('international')

      function findAirportById(id){ return airports.find(a=>a._id === id) }
      function isBrazil(a){
        if(!a) return false
        const p = (a.pais||'').toString().toLowerCase().trim()
        if(!p) return true // se não tiver país, assume local (compatível com DB atual)
        // aceitar várias variantes
        return p === 'brasil' || p === 'brazil' || p === 'br' || p.startsWith('br') || p.includes('bra')
      }

      // checar origem/destino/escala conforme tipo
      const origemA = findAirportById(form.origem)
      const destinoA = findAirportById(form.destino)
      const escalaA = form.escalaAeroporto ? findAirportById(form.escalaAeroporto) : null
      if(isDomesticType){
        if(!isBrazil(origemA) || !isBrazil(destinoA) || (withScale==='sim' && escalaA && !isBrazil(escalaA)))
          return setMsg('Voos domésticos só podem usar aeroportos no Brasil.')
      }
      if(isInternationalType){
        if(isBrazil(origemA) || isBrazil(destinoA) || (withScale==='sim' && escalaA && isBrazil(escalaA)))
          return setMsg('Voos internacionais não podem usar aeroportos do Brasil.')
      }

      const body = { ...form }
      
      // Processar escalas no novo formato
      if (withScale === 'sim' && form.escalaAeroporto) {
        body.escalas = [{
          aeroporto: form.escalaAeroporto,
          horarioSaida: form.escalaSaida ? new Date(form.escalaSaida) : undefined,
          horarioChegada: form.escalaChegada ? new Date(form.escalaChegada) : undefined
        }]
      } else {
        body.escalas = []
      }
      
      // Converter strings de data para Date
      body.horarioSaida = new Date(form.horarioSaida)
      body.horarioChegada = new Date(form.horarioChegada)
      
      // Limpar campos temporários
      delete body.escalaAeroporto
      delete body.escalaSaida
      delete body.escalaChegada
      
      const { data } = await api.post('/admin/flights', body)
      setMsg('Voo incluído: ' + data.numero)
      
      // Limpar formulário
      setForm({
        numero:'', tipoVoo:'', aeronave:'', origem:'', destino:'',
        escalas:[], funcionarios:[], equipe:'', horarioSaida:'', horarioChegada:'', duracaoMinutos:60
      })
      setWithScale('nao')
    } catch (e) {
      setMsg('Erro ao incluir voo: ' + (e.response?.data?.error || e.message))
    }
  }

  // Função para obter o tipo de voo selecionado
  function getSelectedFlightType() {
    return types.find(t => t._id === form.tipoVoo)
  }

  // helper para identificar Brasil (aceita variantes)
  function isBrazilAirport(a){
    if(!a) return false
    const p = (a.pais||'').toString().toLowerCase().trim()
    if(!p) return true
    return p === 'brasil' || p === 'brazil' || p === 'br' || p.startsWith('br') || p.includes('bra')
  }

  // Função para filtrar aeroportos baseado no tipo de voo (bidirecional)
  function getFilteredAirports() {
    const flightType = getSelectedFlightType()
    if (!flightType) return airports
    const name = (flightType.nome||'').toLowerCase()
    if (name.includes('doméstico') || name.includes('domestico')){
      return airports.filter(a => isBrazilAirport(a))
    }
    if (name.includes('internacional') || name.includes('international')){
      return airports.filter(a => !isBrazilAirport(a))
    }
    return airports
  }

  return (
    <div className="grid">
      <h2>Incluir Novo Voo</h2>
      <div className="row">
        <div className="grid" style={{flex:1}}><label>Número</label><input value={form.numero} onChange={e=>setForm(p=>({...p,numero:e.target.value}))}/></div>
        <div className="grid" style={{flex:1}}><label>Tipo de voo</label>
          <select value={form.tipoVoo} onChange={e=>setForm(p=>({...p,tipoVoo:e.target.value}))}>
            <option value="">Selecione</option>
            {types.map(t=><option key={t._id} value={t._id}>{t.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="grid" style={{flex:1}}><label>Origem</label>
          <select value={form.origem} onChange={e=>setForm(p=>({...p,origem:e.target.value}))}>
            <option value="">Selecione</option>
              {getFilteredAirports().map(a=><option key={a._id} value={a._id}>{a.nome} ({a.sigla})</option>)}
          </select>
        </div>
        <div className="grid" style={{flex:1}}><label>Destino</label>
          <select value={form.destino} onChange={e=>setForm(p=>({...p,destino:e.target.value}))}>
            <option value="">Selecione</option>
              {getFilteredAirports().map(a=><option key={a._id} value={a._id}>{a.nome} ({a.sigla})</option>)}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="grid" style={{flex:1}}><label>Possui escala?</label>
          <select value={withScale} onChange={e=>setWithScale(e.target.value)}>
            <option value="nao">Não</option>
            <option value="sim">Sim</option>
          </select>
        </div>
        {withScale==='sim' && (
          <>
            <div className="grid" style={{flex:1}}><label>Aeroporto da Escala</label>
              <select value={form.escalaAeroporto||''} onChange={e=>setForm(p=>({...p,escalaAeroporto:e.target.value}))}>
                <option value="">Selecione</option>
                  {getFilteredAirports().map(a=><option key={a._id} value={a._id}>{a.nome} ({a.sigla})</option>)}
              </select>
            </div>
            <div className="grid" style={{flex:1}}><label>Horário de saída da escala</label>
              <input type="datetime-local" value={form.escalaSaida||''} onChange={e=>setForm(p=>({...p,escalaSaida:e.target.value}))}/>
            </div>
            <div className="grid" style={{flex:1}}><label>Horário de chegada da escala</label>
              <input type="datetime-local" value={form.escalaChegada||''} onChange={e=>setForm(p=>({...p,escalaChegada:e.target.value}))}/>
            </div>
          </>
        )}
      </div>

      <div className="row">
        <div className="grid" style={{flex:1}}><label>Piloto</label>
          <select value={form.funcionarios[0]||''} onChange={e=>setForm(p=>({...p,funcionarios:[e.target.value, ...(p.funcionarios.slice(1))]}))}>
            <option value="">Selecione</option>
            {employees.filter(e => e.categoria === 'piloto' || e.categoria === 'co-piloto').map(e=><option key={e._id} value={e._id}>{e.nome || e.nomeCompleto} - {e.categoria}</option>)}
          </select>
        </div>
        <div className="grid" style={{flex:1}}><label>Equipe Responsável</label>
          <select value={form.equipe||''} onChange={e=>setForm(p=>({...p,equipe:e.target.value}))}>
            <option value="">Selecione</option>
            {teams.map(t=><option key={t._id} value={t._id}>{t.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="grid" style={{flex:1}}><label>Horário de partida</label><input type="datetime-local" value={form.horarioSaida} onChange={e=>setForm(p=>({...p,horarioSaida:e.target.value}))}/></div>
        <div className="grid" style={{flex:1}}><label>Horário de chegada (previsão)</label><input type="datetime-local" value={form.horarioChegada} onChange={e=>setForm(p=>({...p,horarioChegada:e.target.value}))}/></div>
      </div>

      <div className="row">
        <div className="grid" style={{flex:1}}><label>Aeronave</label>
          <select value={form.aeronave} onChange={e=>setForm(p=>({...p,aeronave:e.target.value}))}>
            <option value="">Selecione</option>
            {aircrafts.map(a=><option key={a._id} value={a._id}>{a.codigo || a.numero} - {a.nome}</option>)}
          </select>
        </div>
        <div className="grid" style={{flex:1}}><label>Duração (min)</label><input type="number" value={form.duracaoMinutos} onChange={e=>setForm(p=>({...p,duracaoMinutos:Number(e.target.value)}))}/></div>
        <div className="grid" style={{flex:1}}><label>Preço base (R$)</label><input type="number" value={form.precoBase||500} onChange={e=>setForm(p=>({...p,precoBase:Number(e.target.value)}))}/></div>
      </div>
      <button className="btn" onClick={submit} style={{width: 'fit-content'}}>Salvar Voo</button>
      {!!msg && <div className="badge">{msg}</div>}
    </div>
  )

}

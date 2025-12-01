import React, {useEffect, useState} from 'react'
import api from '../../services/api'
export default function Home(){
  const [flights,setFlights] = useState([])
  const [msg,setMsg] = useState('')
  async function load(){ const {data} = await api.get('/flights/search', { params:{ date:'', origem:'', destino:'', timeFrom:'00:00', timeTo:'23:59', stops:'any' } }); setFlights(data||[]) }
  async function seed(){ const {data} = await api.post('/admin/seed/quick'); setMsg(data?.message||`Criados ${data?.created||0} voos`); load() }
  useEffect(()=>{ load() },[])
  return (
    <div className='page'>
      <div className='row' style={{justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{margin:0}}>Sistema De Voos</h1>
        <button className='btn' onClick={seed}>Popular dados de teste</button>
      </div>
      {msg && <div className='badge' style={{margin:'12px 0'}}>{msg}</div>}
      <div className='card' style={{marginTop:12}}>
        <table className='table'>
          <thead><tr><th>Nº</th><th>Origem</th><th>Destino</th><th>Tipo</th><th>Saída</th><th>Chegada</th></tr></thead>
          <tbody>
            {flights.map((f,i)=> (
              <tr key={i}>
                <td>{f.numero}</td>
                <td>{f.origem?.sigla || f.origem?.nome}</td>
                <td>{f.destino?.sigla || f.destino?.nome}</td>
                <td>{f.tipoVoo}</td>
                <td>{new Date(f.horarioSaida).toLocaleString()}</td>
                <td>{new Date(f.horarioChegada).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

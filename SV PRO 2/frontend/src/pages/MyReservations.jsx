import React, { useEffect, useState } from 'react'
import api from '../services/api'

function useDeterministic(id){
  const seed = Array.from((id||'').slice(0,12)).reduce((a,c)=>a+c.charCodeAt(0),0)
  function rand(min,max){ const x = Math.abs(Math.sin(seed + min*13 + max*7)); return Math.floor(min + x*(max-min+1)) }
  return { seed, rand }
}

export default function MyReservations(){
  const [list, setList] = useState([])
  const [sel, setSel] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(()=>{ load() }, [])

  async function load(){
    try {
      const { data } = await api.get('/reservations/mine')
      setList(data)
    } catch {}
  }

  async function cancel(id){
    try {
      const { data } = await api.post(`/reservations/${id}/cancel`)
      setMsg(data.mensagem || 'Reserva cancelada e assentos liberados.')
      await load()
    } catch (e) {
      setMsg(e.response?.data?.error || 'Não foi possível cancelar.')
    }
  }

  function Details({ r }){
    const { rand } = useDeterministic(r._id)
    const bag = [ '1 mala 23kg + 1 item pessoal', '1 mala 23kg + 1 de mão 10kg', 'Somente 1 de mão 10kg' ][rand(0,2)]
    const gate = 'G' + rand(1,19)
    const embarque = new Date(new Date(r.voo?.horarioSaida).getTime() - 40*60*1000)
    const chegadaPrev = new Date(r.voo?.horarioChegada)
    const piloto = (r.voo?.funcionarios||[])[0]?.nome || (r.voo?.funcionarios||[])[0]?.nomeCompleto || ['Ana Lima','Carlos Souza','Bruno Neri'][rand(0,2)]
    const responsavel = r.voo?.equipe?.nome || 'Equipe não definida'
    const aviao = r.voo?.aeronave?.codigo || r.voo?.aeronave?.numero || 'AC-' + rand(1,99)
    const escala = (r.voo?.escalas||[]).length ? { 
      local: r.voo.escalas[0]?.aeroporto?.sigla || r.voo.escalas[0]?.sigla || 'ESC-'+rand(1,9), 
      janela:`${rand(30,90)} min` 
    } : null
    return (
      <div className="grid">
        <div><strong>Número da Reserva:</strong> {r.numeroReserva}</div>
        <div><strong>Voo:</strong> {r.voo?.numero}</div>
        <div><strong>Origem:</strong> {r.voo?.origem?.sigla} | <strong>Destino:</strong> {r.voo?.destino?.sigla}</div>
        <div><strong>Saída:</strong> {new Date(r.voo?.horarioSaida).toLocaleString()}</div>
        <div><strong>Previsão de chegada:</strong> {chegadaPrev.toLocaleString()}</div>
        <div><strong>Embarque:</strong> {embarque.toLocaleString()} • <strong>Portão:</strong> {gate}</div>
        <div><strong>Assentos:</strong> {(r.assentos||[]).join(', ')}</div>
        <div><strong>Passageiros:</strong> {(r.ocupantes||[]).map(o => o.nomeCompleto).join(', ') || 'N/A'}</div>
        <div><strong>Bagagem permitida:</strong> {bag}</div>
        {escala && <div><strong>Escala:</strong> {escala.local} • Janela: {escala.janela}</div>}
        <div><strong>Piloto:</strong> {piloto} • <strong>Avião:</strong> {aviao}</div>
        <div><strong>Responsável pelo voo:</strong> {responsavel}</div>
        <div style={{marginTop: 12, padding: 12, background: '#f3f4f6', borderRadius: 8, color: '#1f2937'}}>
          <strong>Informações de Pagamento:</strong>
          <div><strong>Método:</strong> {r.pagamento?.metodo === 'cartao' ? 'Cartão de Crédito' : 'Ficha de Compensação'}</div>
          <div><strong>Status:</strong> {r.pagamento?.status}</div>
          <div><strong>Valor Total:</strong> R$ {(r.pagamento?.valorTotal || 0).toFixed(2)}</div>
          {r.pagamento?.metodo === 'cartao' && r.pagamento?.cartao && (
            <div><strong>Cartão:</strong> {r.pagamento.cartao.tipo} terminado em {r.pagamento.cartao.numero}</div>
          )}
          {r.pagamento?.metodo === 'ficha' && r.pagamento?.ficha && (
            <>
              <div><strong>Número da Ficha:</strong> {r.pagamento.ficha.numero}</div>
              <div><strong>Vencimento:</strong> {new Date(r.pagamento.ficha.dataVencimento).toLocaleDateString()}</div>
              <div><strong>Status do Pagamento:</strong> {r.pagamento.ficha.paga ? 'Paga' : 'Pendente'}</div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid">
      <h2>Minhas Reservas</h2>
      {!!msg && <div className="badge">{msg}</div>}
      <table className="table">
        <thead><tr><th>Reserva</th><th>Voo</th><th>Assentos</th><th>Pagamento</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {list.map(r => (
            <tr key={r._id}>
              <td>{r.numeroReserva}</td>
              <td>{r.voo?.numero} ({r.voo?.origem?.sigla}→{r.voo?.destino?.sigla})</td>
              <td>{(r.assentos||[]).join(', ')}</td>
              <td>
                {r.pagamento?.metodo === 'cartao' ? 'Cartão' : 'Ficha'}
                {r.pagamento?.metodo === 'ficha' && r.pagamento?.ficha && (
                  <div style={{fontSize: '0.85em', color: '#666'}}>
                    {r.pagamento.ficha.numero}
                  </div>
                )}
              </td>
              <td>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: r.pagamento?.status === 'confirmado' ? '#10b981' : 
                              r.pagamento?.status === 'pendente' ? '#f59e0b' : '#ef4444',
                  color: 'white',
                  fontSize: '0.85em'
                }}>
                  {r.pagamento?.status}
                </span>
              </td>
              <td className="row">
                <button className="btn ghost" onClick={()=>setSel(r)}>Detalhes</button>
                <button className="btn" onClick={()=>cancel(r._id)}>Cancelar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sel && (
        <div className="card" style={{marginTop:12}}>
          <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
            <h3>Detalhes da reserva {sel.numeroReserva}</h3>
            <button className="btn ghost" onClick={()=>setSel(null)}>Fechar</button>
          </div>
          <Details r={sel}/>
        </div>
      )}
    </div>
  )
}

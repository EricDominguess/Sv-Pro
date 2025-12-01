import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Checkout(){
  const nav = useNavigate()
  const [info, setInfo] = useState(null)
  const [voo, setVoo] = useState(null)
  const [seatmap, setSeatmap] = useState({ classes: [], precoBase: 500 })
  const [metodo, setMetodo] = useState('cartao')
  const [valorTotal, setValorTotal] = useState(0)
  const [msg, setMsg] = useState('')
  const [ocupantes, setOcupantes] = useState([])
  const [cartao, setCartao] = useState({
    tipo: 'Visa',
    numero: '',
    validade: '',
    nomeTitular: ''
  })

  useEffect(()=>{
    const i = sessionStorage.getItem('checkout')
    if (i) {
      const data = JSON.parse(i)
      setInfo(data)
      setOcupantes(data.ocupantes || data.assentos?.map((_, idx) => ({ nomeCompleto: '' })) || [])
      loadFlight(data.vooId, data.assentos || [])
    }
  }, [])

  // Função para determinar a classe de um assento
  function getSeatClass(fila) {
    if (!seatmap.classes || seatmap.classes.length === 0) return 'economy'
    for (const cls of seatmap.classes) {
      if (fila >= cls.filasInicio && fila <= cls.filasFim) {
        return cls.nome
      }
    }
    return 'economy'
  }

  // Calcular preço total baseado nas classes
  function calcularPrecoTotal() {
    if (!info || !info.assentos || info.assentos.length === 0) return 0
    let total = 0
    info.assentos.forEach(assento => {
      const match = assento.match(/^(\d+)([A-Z])$/)
      if (match) {
        const fila = parseInt(match[1])
        const classe = getSeatClass(fila)
        const classeData = seatmap.classes.find(c => c.nome === classe)
        const multiplicador = classeData?.multiplicadorPreco || 1.0
        total += (seatmap.precoBase || 500) * multiplicador
      }
    })
    return total
  }

  async function loadFlight(vooId, assentos){
    try {
      const [flightData, seatmapData] = await Promise.all([
        api.get(`/flights/${vooId}`),
        api.get(`/flights/${vooId}/seatmap`)
      ])
      setVoo(flightData.data)
      setSeatmap(seatmapData.data)
      
      // Calcular valor total baseado nas classes
      const total = calcularPrecoTotalComClasses(assentos, seatmapData.data)
      setValorTotal(total)
    } catch (e) {
      setMsg('Erro ao carregar dados do voo')
    }
  }

  function calcularPrecoTotalComClasses(assentos, seatmapData) {
    if (!assentos || assentos.length === 0) return 0
    let total = 0
    assentos.forEach(assento => {
      const match = assento.match(/^(\d+)([A-Z])$/)
      if (match) {
        const fila = parseInt(match[1])
        let classe = 'economy'
        if (seatmapData.classes && seatmapData.classes.length > 0) {
          for (const cls of seatmapData.classes) {
            if (fila >= cls.filasInicio && fila <= cls.filasFim) {
              classe = cls.nome
              break
            }
          }
        }
        const classeData = seatmapData.classes?.find(c => c.nome === classe)
        const multiplicador = classeData?.multiplicadorPreco || 1.0
        total += (seatmapData.precoBase || 500) * multiplicador
      }
    })
    return total
  }

  // Recalcular quando seatmap for carregado
  useEffect(() => {
    if (info && info.assentos && seatmap.classes && seatmap.classes.length > 0) {
      const total = calcularPrecoTotalComClasses(info.assentos, seatmap)
      setValorTotal(total)
    }
  }, [seatmap.classes])

  async function comprar(){
    try {
      if (ocupantes.some(o => !o.nomeCompleto.trim())) {
        return setMsg('Preencha o nome completo de todos os ocupantes')
      }

      if (metodo === 'cartao') {
        if (!cartao.numero || !cartao.validade || !cartao.nomeTitular) {
          return setMsg('Preencha todos os dados do cartão')
        }
      }

      const body = {
        vooId: info.vooId,
        assentos: info.assentos,
        ocupantes: ocupantes,
        metodoPagamento: metodo,
        valorTotal,
        cartao: metodo === 'cartao' ? cartao : undefined
      }
      const { data } = await api.post('/reservations', body)
      setMsg(`Reserva criada com sucesso! Número: ${data.numeroReserva}`)
      sessionStorage.removeItem('checkout')
      
      if (metodo === 'ficha' && data.pagamento?.ficha) {
        setMsg(`Reserva criada! Número: ${data.numeroReserva}\nFicha de compensação: ${data.pagamento.ficha.numero}\nVencimento: ${new Date(data.pagamento.ficha.dataVencimento).toLocaleDateString()}`)
      }
      
      setTimeout(() => {
        nav('/dashboard/reservations')
      }, 2000)
    } catch (e) {
      setMsg(e.response?.data?.error || 'Falha na compra')
    }
  }

  if (!info) return <div>Nenhuma seleção</div>
  if (!voo) return <div>Carregando...</div>

  return (
    <div className="grid" style={{maxWidth:600}}>
      <h2>Checkout</h2>
      <div className="card">
        <h3>Resumo da Viagem</h3>
        <p><strong>Voo:</strong> {voo.numero} - {voo.origem?.sigla} → {voo.destino?.sigla}</p>
        <p><strong>Data:</strong> {new Date(voo.horarioSaida).toLocaleString('pt-BR')}</p>
        <div><strong>Assentos selecionados:</strong>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8}}>
            {info.assentos?.map(assento => {
              const match = assento.match(/^(\d+)([A-Z])$/)
              if (match) {
                const fila = parseInt(match[1])
                const classe = getSeatClass(fila)
                const classeData = seatmap.classes.find(c => c.nome === classe)
                const multiplicador = classeData?.multiplicadorPreco || 1.0
                const preco = (seatmap.precoBase || 500) * multiplicador
                const classeNome = classe === 'first' ? 'First Class' : 
                                   classe === 'executive' ? 'Executivo' : 
                                   'Econômico'
                return (
                  <span key={assento} className="badge" style={{
                    background: classe === 'first' ? '#fbbf24' : 
                                classe === 'executive' ? '#3b82f6' : 
                                '#6b7280',
                    color: classe === 'first' ? '#78350f' : 
                           classe === 'executive' ? '#1e3a8a' : 
                           '#1f2937',
                    fontWeight: 'bold'
                  }}>
                    {assento} ({classeNome}) - R$ {preco.toFixed(2)}
                  </span>
                )
              }
              return <span key={assento} className="badge">{assento}</span>
            })}
          </div>
        </div>
      </div>

      <h3>Dados dos Passageiros</h3>
      {ocupantes.map((ocupante, idx) => (
        <div key={idx} className="card">
          <label>Passageiro {idx + 1} (Assento {info.assentos[idx]}):</label>
          <input
            type="text"
            value={ocupante.nomeCompleto}
            onChange={e => {
              const novos = [...ocupantes]
              novos[idx] = { nomeCompleto: e.target.value }
              setOcupantes(novos)
            }}
            placeholder="Nome completo"
          />
        </div>
      ))}

      <h3>Pagamento</h3>
      <div className="card">
        <label>Valor Total: R$ {valorTotal.toFixed(2)}</label>
        <label>Método de pagamento:
          <select value={metodo} onChange={e=>setMetodo(e.target.value)}>
            <option value="cartao">Cartão de Crédito</option>
            <option value="ficha">Ficha de Compensação</option>
          </select>
        </label>

        {metodo === 'cartao' && (
          <div className="grid">
            <label>Tipo de cartão:
              <select value={cartao.tipo} onChange={e=>setCartao({...cartao, tipo: e.target.value})}>
                <option value="Visa">Visa</option>
                <option value="MasterCard">MasterCard</option>
                <option value="American Express">American Express</option>
                <option value="Elo">Elo</option>
              </select>
            </label>
            <label>Número do cartão:
              <input
                type="text"
                value={cartao.numero}
                onChange={e=>setCartao({...cartao, numero: e.target.value.replace(/\D/g, '').slice(0, 16)})}
                placeholder="0000 0000 0000 0000"
                maxLength={16}
              />
            </label>
            <label>Validade (MM/AA):
              <input
                type="text"
                value={cartao.validade}
                onChange={e=>{
                  let val = e.target.value.replace(/\D/g, '')
                  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4)
                  setCartao({...cartao, validade: val})
                }}
                placeholder="12/29"
                maxLength={5}
              />
            </label>
            <label>Nome do titular:
              <input
                type="text"
                value={cartao.nomeTitular}
                onChange={e=>setCartao({...cartao, nomeTitular: e.target.value})}
                placeholder="Nome como está no cartão"
              />
            </label>
          </div>
        )}

        {metodo === 'ficha' && (
          <div className="badge" style={{background: '#fef3c7', color: '#92400e'}}>
            <strong>Atenção:</strong> A ficha de compensação só está disponível para voos com mais de 3 dias úteis de antecedência.
            Após a confirmação, você receberá o número da ficha e a data de vencimento.
          </div>
        )}
      </div>

      <button className="btn" onClick={comprar}>Confirmar Compra</button>
      {!!msg && <div className="badge" style={{marginTop: 12}}>{msg}</div>}
    </div>
  )
}

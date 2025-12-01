import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function FlightDetails(){
  const { id } = useParams()
  const nav = useNavigate()
  const [voo, setVoo] = useState(null)
  const [seatmap, setSeatmap] = useState({ 
    filas: 0, 
    assentosPorFila: 0, 
    ocupados: [], 
    classes: [],
    precoBase: 500
  })
  const [selecionados, setSelecionados] = useState([])

  useEffect(()=>{
    async function load(){
      const { data } = await api.get(`/flights/${id}`)
      setVoo(data)
      const sm = await api.get(`/flights/${id}/seatmap`)
      setSeatmap(sm.data)
    }
    load()
  }, [id])

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

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

  // Função para determinar o tipo de assento (janela, corredor, meio)
  function getSeatType(fila, letra) {
    const seatClass = seatmap.classes.find(cls => 
      fila >= cls.filasInicio && fila <= cls.filasFim
    )
    if (!seatClass) return 'meio'
    
    if (seatClass.assentosJanela && seatClass.assentosJanela.includes(letra)) {
      return 'janela'
    }
    if (seatClass.assentosCorredor && seatClass.assentosCorredor.includes(letra)) {
      return 'corredor'
    }
    return 'meio'
  }

  // Função para obter cor da classe
  function getClassColor(className) {
    const colors = {
      'first': { bg: '#fbbf24', text: '#78350f', border: '#f59e0b' },
      'executive': { bg: '#3b82f6', text: '#1e3a8a', border: '#2563eb' },
      'economy': { bg: '#6b7280', text: '#1f2937', border: '#4b5563' }
    }
    return colors[className] || colors.economy
  }

  function toggleSeat(code){
    if (seatmap.ocupados.includes(code)) return
    setSelecionados(prev => prev.includes(code) ? prev.filter(x=>x!==code) : [...prev, code])
  }

  function gotoCheckout(){
    const ocupantes = selecionados.map((_, idx) => ({ nomeCompleto: '' }))
    sessionStorage.setItem('checkout', JSON.stringify({ 
      vooId: id, 
      assentos: selecionados,
      ocupantes: ocupantes
    }))
    nav('/dashboard/checkout')
  }

  // Calcular preço total
  function calcularPrecoTotal() {
    if (selecionados.length === 0) return 0
    let total = 0
    selecionados.forEach(assento => {
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

  if (!voo) return <div>Carregando...</div>

  // IMPORTANTE: Os campos no backend estão com nomes trocados
  // seatmap.assentosPorFila = número de filas (30)
  // seatmap.filas = assentos por fila (6)
  
  // Número de assentos por fila (letras: A, B, C, D, E, F...)
  const assentosPorFila = seatmap.assentosPorFila || 6
  // Número de filas (1, 2, 3, 4...)
  const numeroDeFilas = seatmap.filas || 30
  
  // Dividir assentos em grupos (esquerda, corredor, direita) baseado no número de assentos
  let leftSeats, rightSeats, middleSeats = ''
  
  if (assentosPorFila === 1) {
    // Layout 1: apenas corredor central
    leftSeats = ''
    middleSeats = letters.slice(0, 1) // A
    rightSeats = ''
  } else if (assentosPorFila === 2) {
    // Layout 1-1: A | B
    leftSeats = letters.slice(0, 1)  // A
    rightSeats = letters.slice(1, 2) // B
  } else if (assentosPorFila === 3) {
    // Layout 1-1-1: A | B | C
    leftSeats = letters.slice(0, 1)  // A
    middleSeats = letters.slice(1, 2) // B
    rightSeats = letters.slice(2, 3) // C
  } else if (assentosPorFila === 4) {
    // Layout 2-2: A,B | C,D
    leftSeats = letters.slice(0, 2)  // A, B
    rightSeats = letters.slice(2, 4) // C, D
  } else if (assentosPorFila === 5) {
    // Layout 2-1-2: A,B | C | D,E
    leftSeats = letters.slice(0, 2)  // A, B
    middleSeats = letters.slice(2, 3) // C
    rightSeats = letters.slice(3, 5) // D, E
  } else if (assentosPorFila === 6) {
    // Layout 3-3: A,B,C | D,E,F
    leftSeats = letters.slice(0, 3)  // A, B, C
    rightSeats = letters.slice(3, 6) // D, E, F
  } else if (assentosPorFila === 7) {
    // Layout 3-1-3: A,B,C | D | E,F,G
    leftSeats = letters.slice(0, 3)  // A, B, C
    middleSeats = letters.slice(3, 4) // D
    rightSeats = letters.slice(4, 7) // E, F, G
  } else if (assentosPorFila === 8) {
    // Layout 3-2-3: A,B,C | D,E | F,G,H
    leftSeats = letters.slice(0, 3)  // A, B, C
    middleSeats = letters.slice(3, 5) // D, E
    rightSeats = letters.slice(5, 8) // F, G, H
  } else if (assentosPorFila === 9) {
    // Layout 3-3-3: A,B,C | D,E,F | G,H,I
    leftSeats = letters.slice(0, 3)  // A, B, C
    middleSeats = letters.slice(3, 6) // D, E, F
    rightSeats = letters.slice(6, 9) // G, H, I
  } else {
    // Layout padrão: dividir em 3 grupos proporcionalmente
    const terco = Math.floor(assentosPorFila / 3)
    const resto = assentosPorFila % 3
    leftSeats = letters.slice(0, terco + (resto > 0 ? 1 : 0))
    const startMiddle = terco + (resto > 0 ? 1 : 0)
    middleSeats = letters.slice(startMiddle, startMiddle + terco + (resto > 1 ? 1 : 0))
    rightSeats = letters.slice(startMiddle + terco + (resto > 1 ? 1 : 0), assentosPorFila)
  }

  return (
    <div className="grid" style={{maxWidth: '1200px', margin: '0 auto'}}>
      <div className="card">
      <h2>Voo {voo.numero} — {voo.origem?.sigla} → {voo.destino?.sigla}</h2>
        <div className="row" style={{gap: 8, marginBottom: 8}}>
          <span className="badge">{(voo.escalas||[]).length ? 'Com escala' : 'Direto'}</span>
          <span className="badge">Aeronave: {voo.aeronave?.nome || voo.aeronave?.codigo || 'N/A'}</span>
        </div>
        <p><strong>Saída:</strong> {new Date(voo.horarioSaida).toLocaleString('pt-BR')} | 
           <strong> Chegada (prev.):</strong> {new Date(voo.horarioChegada).toLocaleString('pt-BR')}</p>
      </div>

      <div className="card">
        <h3>Mapa de Assentos</h3>
        
        {/* Legenda */}
        <div style={{marginBottom: 20, padding: 16, background: '#0c152a', borderRadius: 8, border: '1px solid #1f2b4a'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12}}>
            <div>
              <strong style={{display: 'block', marginBottom: 8}}>Classes:</strong>
              <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <div style={{width: 20, height: 20, background: '#fbbf24', border: '2px solid #f59e0b', borderRadius: 4}}></div>
                  <span>First Class</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <div style={{width: 20, height: 20, background: '#3b82f6', border: '2px solid #2563eb', borderRadius: 4}}></div>
                  <span>Executivo</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <div style={{width: 20, height: 20, background: '#6b7280', border: '2px solid #4b5563', borderRadius: 4}}></div>
                  <span>Econômico</span>
                </div>
              </div>
            </div>
            <div>
              <strong style={{display: 'block', marginBottom: 8}}>Status:</strong>
              <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <div style={{width: 20, height: 20, background: '#1d4ed8', border: '2px solid #3b82f6', borderRadius: 4}}></div>
                  <span>Selecionado</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <div style={{width: 20, height: 20, background: '#334155', border: '2px solid #475569', borderRadius: 4}}></div>
                  <span>Ocupado</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <div style={{width: 20, height: 20, background: '#0c152a', border: '2px solid #1f2b4a', borderRadius: 4}}></div>
                  <span>Disponível</span>
                </div>
              </div>
            </div>
            <div>
              <strong style={{display: 'block', marginBottom: 8}}>Localização:</strong>
              <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <span>🪟 Janela</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <span>🚪 Corredor</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <span>⚪ Meio</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visualização do Avião */}
        <div style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          border: '3px solid #475569',
          borderRadius: 20,
          padding: '32px 16px',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          {/* Cabeça do avião (proa) */}
          <div style={{
            position: 'absolute',
            top: -25,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '20px solid transparent',
            borderRight: '20px solid transparent',
            borderBottom: '25px solid #475569',
            zIndex: 10
          }}></div>

          {/* Janelas laterais (decoração) */}
          <div style={{
            position: 'absolute',
            left: 8,
            top: '10%',
            bottom: '10%',
            width: 4,
            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.3))',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            padding: '10px 0'
          }}>  
            {Array.from({length: Math.floor(numeroDeFilas / 2)}).map((_, i) => (
              <div key={i} style={{
                width: '100%',
                height: 3,
                background: 'rgba(59, 130, 246, 0.5)',
                borderRadius: 2
              }}></div>
            ))}
          </div>
          <div style={{
            position: 'absolute',
            right: 8,
            top: '10%',
            bottom: '10%',
            width: 4,
            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.3))',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            padding: '10px 0'
          }}>  
            {Array.from({length: Math.floor(numeroDeFilas / 2)}).map((_, i) => (
              <div key={i} style={{
                width: '100%',
                height: 3,
                background: 'rgba(59, 130, 246, 0.5)',
                borderRadius: 2
              }}></div>
            ))}
          </div>

          {/* Assentos */}
          <div style={{
            display: 'flex', 
            flexDirection: 'column', 
            gap: 10, 
            marginTop: 30,
            padding: '0 20px',
            position: 'relative',
            zIndex: 5
          }}>
            {Array.from({length: numeroDeFilas}).map((_, filaIndex) => {
              const fila = filaIndex + 1
              const classeNome = getSeatClass(fila)
              const classeData = seatmap.classes.find(c => c.nome === classeNome)
              const classColor = getClassColor(classeNome)
              const isDivider = seatmap.classes.some(c => c.filasFim === fila && c.filasFim < numeroDeFilas)

              return (
                <div key={fila}>
                  {/* Divisor entre classes */}
                  {isDivider && (
                    <div style={{
                      height: 2,
                      background: 'linear-gradient(90deg, transparent, #475569, transparent)',
                      margin: '12px 0',
                      position: 'relative'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: -8,
                        background: '#0f172a',
                        padding: '0 8px',
                        fontSize: 12,
                        color: '#94a3b8'
                      }}>
                        {classeData?.nome === 'first' ? '━━ First Class ━━' : 
                         classeData?.nome === 'executive' ? '━━ Executivo ━━' : 
                         '━━ Econômico ━━'}
                      </span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    position: 'relative'
                  }}>
                    {/* Número da fileira */}
                    <div style={{
                      minWidth: 30,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#cbd5e1',
                      fontSize: 14
                    }}>
                      {fila}
                    </div>

                    {/* Assentos da esquerda */}
                    <div style={{
                      display: 'flex',
                      gap: 4,
                      flex: 1,
                      justifyContent: 'flex-end'
                    }}>
                      {leftSeats.split('').map((letra, idx) => {
                        const code = `${fila}${letra}`
                        const ocupado = seatmap.ocupados.includes(code)
                        const sel = selecionados.includes(code)
                        const seatType = getSeatType(fila, letra)
                        const isWindow = seatType === 'janela'
                        const isAisle = seatType === 'corredor'

                        return (
                          <button
                            key={code}
                            onClick={() => toggleSeat(code)}
                            disabled={ocupado}
                            title={`${code} - ${classeNome} - ${seatType}`}
                            style={{
                              width: 36,
                              height: 36,
                              padding: 0,
                              border: `2px solid ${ocupado ? '#475569' : sel ? '#60a5fa' : classColor.border}`,
                              background: ocupado 
                                ? '#334155' 
                                : sel 
                                  ? '#1d4ed8' 
                                  : classColor.bg,
                              color: ocupado ? '#64748b' : sel ? 'white' : classColor.text,
                              borderRadius: isWindow && leftSeats[0] === letra ? '6px 0 0 6px' : 
                                            isAisle && leftSeats[leftSeats.length - 1] === letra ? '0 6px 6px 0' : 
                                            '6px',
                              cursor: ocupado ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold',
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              transition: 'all 0.2s',
                              opacity: ocupado ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!ocupado) {
                                e.currentTarget.style.transform = 'scale(1.1)'
                                e.currentTarget.style.zIndex = 10
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.zIndex = 1
                            }}
                          >
                            {letra}
                            {isWindow && leftSeats[0] === letra && !ocupado && (
                              <span style={{
                                position: 'absolute',
                                left: -18,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: 12,
                                opacity: 0.7
                              }}>🪟</span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Corredor ou assentos do meio */}
                    {middleSeats.length > 0 ? (
                      <>
                        {/* Corredor esquerdo */}
                        <div style={{
                          width: 24,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: 2,
                            height: '80%',
                            background: 'linear-gradient(180deg, transparent, #475569, transparent)'
                          }}></div>
                          <span style={{
                            position: 'absolute',
                            fontSize: 10,
                            opacity: 0.7
                          }}>🚪</span>
                        </div>
                        
                        {/* Assentos do meio */}
                        <div style={{
                          display: 'flex',
                          gap: 4
                        }}>
                          {(middleSeats || '').split('').filter(Boolean).map((letra) => {
                            const code = `${fila}${letra}`
                            const ocupado = seatmap.ocupados.includes(code)
                            const sel = selecionados.includes(code)
                            const seatType = getSeatType(fila, letra)

                            return (
                              <button
                                key={code}
                                onClick={() => toggleSeat(code)}
                                disabled={ocupado}
                                title={`${code} - ${classeNome} - ${seatType}`}
                                style={{
                                  width: 36,
                                  height: 36,
                                  padding: 0,
                                  border: `2px solid ${ocupado ? '#475569' : sel ? '#60a5fa' : classColor.border}`,
                                  background: ocupado 
                                    ? '#334155' 
                                    : sel 
                                      ? '#1d4ed8' 
                                      : classColor.bg,
                                  color: ocupado ? '#64748b' : sel ? 'white' : classColor.text,
                                  borderRadius: '6px',
                                  cursor: ocupado ? 'not-allowed' : 'pointer',
                                  fontWeight: 'bold',
                                  fontSize: 11,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative',
                                  transition: 'all 0.2s',
                                  opacity: ocupado ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                  if (!ocupado) {
                                    e.currentTarget.style.transform = 'scale(1.1)'
                                    e.currentTarget.style.zIndex = 10
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)'
                                  e.currentTarget.style.zIndex = 1
                                }}
                              >
                                {letra}
                              </button>
                            )
                          })}
                        </div>

                        {/* Corredor direito */}
                        <div style={{
                          width: 24,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: 2,
                            height: '80%',
                            background: 'linear-gradient(180deg, transparent, #475569, transparent)'
                          }}></div>
                          <span style={{
                            position: 'absolute',
                            fontSize: 10,
                            opacity: 0.7
                          }}>🚪</span>
                        </div>
                      </>
                    ) : (
                      /* Corredor simples (layout par sem meio, ex: 2-2 ou 3-3) */
                      <div style={{
                        width: 32,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: 2,
                          height: '80%',
                          background: 'linear-gradient(180deg, transparent, #475569, transparent)'
                        }}></div>
                        <span style={{
                          position: 'absolute',
                          fontSize: 10,
                          opacity: 0.7
                        }}>🚪</span>
                      </div>
                    )}

                    {/* Assentos da direita */}
                    <div style={{
                      display: 'flex',
                      gap: 4,
                      flex: 1,
                      justifyContent: 'flex-start'
                    }}>
                      {rightSeats.split('').map((letra, idx) => {
                        const code = `${fila}${letra}`
            const ocupado = seatmap.ocupados.includes(code)
            const sel = selecionados.includes(code)
                        const seatType = getSeatType(fila, letra)
                        const isWindow = seatType === 'janela'
                        const isAisle = seatType === 'corredor'

            return (
                          <button
                            key={code}
                            onClick={() => toggleSeat(code)}
                disabled={ocupado}
                            title={`${code} - ${classeNome} - ${seatType}`}
                            style={{
                              width: 36,
                              height: 36,
                              padding: 0,
                              border: `2px solid ${ocupado ? '#475569' : sel ? '#60a5fa' : classColor.border}`,
                              background: ocupado 
                                ? '#334155' 
                                : sel 
                                  ? '#1d4ed8' 
                                  : classColor.bg,
                              color: ocupado ? '#64748b' : sel ? 'white' : classColor.text,
                              borderRadius: isAisle && rightSeats[0] === letra ? '6px 0 0 6px' : 
                                            isWindow && rightSeats[rightSeats.length - 1] === letra ? '0 6px 6px 0' : 
                                            '6px',
                              cursor: ocupado ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold',
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              transition: 'all 0.2s',
                              opacity: ocupado ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!ocupado) {
                                e.currentTarget.style.transform = 'scale(1.1)'
                                e.currentTarget.style.zIndex = 10
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.zIndex = 1
                            }}
                          >
                            {letra}
                            {isWindow && rightSeats[rightSeats.length - 1] === letra && !ocupado && (
                              <span style={{
                                position: 'absolute',
                                right: -18,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: 12,
                                opacity: 0.7
                              }}>🪟</span>
                            )}
              </button>
            )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cauda do avião */}
          <div style={{
            marginTop: 30,
            textAlign: 'center',
            color: '#64748b',
            fontSize: 12,
            padding: '12px',
            borderTop: '2px dashed #475569',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              bottom: -15,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '15px solid transparent',
              borderRight: '15px solid transparent',
              borderTop: '20px solid #475569'
            }}></div>
            ↙️ Parte traseira do avião
          </div>
        </div>

        {/* Resumo da seleção */}
        {selecionados.length > 0 && (
          <div className="card" style={{
            background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
            border: '2px solid #3b82f6'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12}}>
              <div>
                <strong style={{display: 'block', marginBottom: 4}}>Assentos Selecionados:</strong>
                <div style={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>
                  {selecionados.map(assento => {
                    const match = assento.match(/^(\d+)([A-Z])$/)
                    if (match) {
                      const fila = parseInt(match[1])
                      const classe = getSeatClass(fila)
                      const classeData = seatmap.classes.find(c => c.nome === classe)
                      const multiplicador = classeData?.multiplicadorPreco || 1.0
                      const preco = (seatmap.precoBase || 500) * multiplicador
                      return (
                        <span key={assento} className="badge" style={{
                          background: '#60a5fa',
                          color: '#1e3a8a',
                          fontWeight: 'bold'
                        }}>
                          {assento} - R$ {preco.toFixed(2)}
                        </span>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
              <div style={{textAlign: 'right'}}>
                <strong style={{display: 'block', fontSize: 18, marginBottom: 4}}>
                  Total: R$ {calcularPrecoTotal().toFixed(2)}
                </strong>
                <button 
                  className="btn" 
                  onClick={gotoCheckout}
                  style={{background: 'white', color: '#1e40af', fontWeight: 'bold'}}
                >
                  Continuar com {selecionados.length} assento{selecionados.length > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {selecionados.length === 0 && (
          <div style={{textAlign: 'center', padding: 20, color: '#94a3b8'}}>
            Selecione os assentos desejados clicando neles
          </div>
        )}
      </div>
    </div>
  )
}

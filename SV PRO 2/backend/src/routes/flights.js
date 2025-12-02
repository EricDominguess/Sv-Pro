import { Router } from 'express'
import Flight from '../models/Flight.js'
import Airport from '../models/Airport.js'
const r = Router()

// Listar aeroportos (rota pública)
r.get('/airports', async (req,res)=>{
  try {
    const airports = await Airport.find().sort({ sigla: 1 })
    res.json(airports)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Listar todos os voos (para tela inicial)
r.get('/', async (req,res)=>{
  try {
    const { limit = 200 } = req.query
    // Buscar todos os voos (últimos 30 dias e futuros)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const list = await Flight.find({
      horarioSaida: { $gte: thirtyDaysAgo }
    })
    .populate([
      'aeronave',
      'origem',
      'destino',
      { path: 'escalas.aeroporto' },
      'funcionarios',
      'tipoVoo'
    ])
    .sort({ horarioSaida: 1 })
    .limit(Number(limit))
    
    res.json(list)
  } catch (error) {
    console.error('Erro ao listar voos:', error)
    res.status(500).json({ error: error.message })
  }
})

r.get('/search', async (req,res)=>{
  try {
    const { date, origem, destino, timeFrom, timeTo, stops='any' } = req.query
    const filter = {}
    
    // Se data for fornecida, filtrar por data; caso contrário, buscar voos futuros
    if (date) {
      const day = new Date(date)
      day.setHours(0, 0, 0, 0)
      const next = new Date(day.getTime() + 24 * 60 * 60 * 1000)
      filter.horarioSaida = { $gte: day, $lt: next }
      
      // Se houver filtro de horário, aplicar dentro do dia
      if (timeFrom || timeTo){
        const [fh,fm] = (timeFrom||'00:00').split(':').map(Number)
        const [th,tm] = (timeTo||'23:59').split(':').map(Number)
        const from = new Date(day)
        from.setHours(fh||0, fm||0, 0, 0)
        const to = new Date(day)
        to.setHours(th||23, tm||59, 59, 999)
        filter.horarioSaida = { $gte: from, $lte: to }
      }
    } else {
      // Sem data, buscar voos dos últimos 30 dias e futuros
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filter.horarioSaida = { $gte: thirtyDaysAgo }
    }
    
    // Filtro de origem
    if (origem && origem.trim()) {
      const a = await Airport.findOne({ sigla: origem.toUpperCase() })
      if (a) {
        filter.origem = a._id
      } else {
        // Se aeroporto não encontrado, retornar array vazio
        return res.json([])
      }
    }
    
    // Filtro de destino
    if (destino && destino.trim()) {
      const a = await Airport.findOne({ sigla: destino.toUpperCase() })
      if (a) {
        filter.destino = a._id
      } else {
        // Se aeroporto não encontrado, retornar array vazio
        return res.json([])
      }
    }
    
    // Filtro de escalas (direto ou com escala)
    // Como escalas é um array de objetos, usamos $expr para verificar o tamanho
    if (stops === 'direct') {
      filter.$expr = { $eq: [{ $size: '$escalas' }, 0] }
    } else if (stops === 'scale') {
      filter.$expr = { $gt: [{ $size: '$escalas' }, 0] }
    }
    // Se stops === 'any', não aplicar filtro de escalas
    
    const list = await Flight.find(filter).populate([
      'aeronave',
      'origem',
      'destino',
      { path: 'escalas.aeroporto' },
      'funcionarios',
      'tipoVoo'
    ]).sort({ horarioSaida: 1 })
    
    res.json(list)
  } catch (error) {
    console.error('Erro na busca de voos:', error)
    res.status(500).json({ error: error.message })
  }
})

r.get('/:id', async (req,res)=>{
  const f = await Flight.findById(req.params.id).populate([
    'aeronave',
    'origem',
    'destino',
    { path: 'escalas.aeroporto' },
    'funcionarios',
    'tipoVoo',
    'equipe'
  ])
  if (!f) return res.status(404).json({ error:'not found' })
  res.json(f)
})

r.get('/:id/seatmap', async (req,res)=>{
  try {
    const f = await Flight.findById(req.params.id).populate({ path:'aeronave', populate:{ path:'tipo', model:'AircraftType' } })
    if (!f) return res.status(404).json({ error:'not found' })
    const t = f.aeronave?.tipo
    
    // Se não houver classes definidas, usar layout padrão
    let classes = t?.classes || []
    if (classes.length === 0) {
      // Criar classes padrão baseadas no layout
      const totalFilas = t?.filas || 25
      const assentosPorFila = t?.assentosPorFila || 6
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, assentosPorFila)
      
      // First Class: primeiras 2 fileiras
      if (totalFilas >= 2) {
        classes.push({
          nome: 'first',
          filasInicio: 1,
          filasFim: 2,
          assentosJanela: [letters[0], letters[letters.length - 1]],
          assentosCorredor: letters.length >= 4 ? [letters[Math.floor(letters.length/2)-1], letters[Math.floor(letters.length/2)]] : [],
          multiplicadorPreco: 3.0
        })
      }
      
      // Executive: próximas 4 fileiras
      if (totalFilas >= 6) {
        classes.push({
          nome: 'executive',
          filasInicio: 3,
          filasFim: 6,
          assentosJanela: [letters[0], letters[letters.length - 1]],
          assentosCorredor: letters.length >= 4 ? [letters[Math.floor(letters.length/2)-1], letters[Math.floor(letters.length/2)]] : [],
          multiplicadorPreco: 1.8
        })
      }
      
      // Economy: resto das fileiras
      if (totalFilas > 6) {
        classes.push({
          nome: 'economy',
          filasInicio: 7,
          filasFim: totalFilas,
          assentosJanela: [letters[0], letters[letters.length - 1]],
          assentosCorredor: letters.length >= 4 ? [letters[Math.floor(letters.length/2)-1], letters[Math.floor(letters.length/2)]] : [],
          multiplicadorPreco: 1.0
        })
      } else if (totalFilas <= 2) {
        // Se houver poucas fileiras, tudo é economy
        classes = [{
          nome: 'economy',
          filasInicio: 1,
          filasFim: totalFilas,
          assentosJanela: [letters[0], letters[letters.length - 1]],
          assentosCorredor: letters.length >= 4 ? [letters[Math.floor(letters.length/2)-1], letters[Math.floor(letters.length/2)]] : [],
          multiplicadorPreco: 1.0
        }]
      }
    }
    
    res.json({ 
      filas: t?.filas||25, 
      assentosPorFila: t?.assentosPorFila||6, 
      ocupados: f.assentosOcupados||[],
      classes: classes,
      precoBase: f.precoBase || 500
    })
  } catch (error) {
    console.error('Erro ao buscar seatmap:', error)
    res.status(500).json({ error: error.message })
  }
})

export default r

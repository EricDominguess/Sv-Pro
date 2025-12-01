import { Router } from 'express'
import { ensureAuth, ensureAdmin } from '../mw/auth.js'
import Airport from '../models/Airport.js'
import FlightType from '../models/FlightType.js'
import AircraftType from '../models/AircraftType.js'
import Aircraft from '../models/Aircraft.js'
import Employee from '../models/Employee.js'
import Flight from '../models/Flight.js'
import Reservation from '../models/Reservation.js'
import Team from '../models/Team.js'

const r = Router()
r.use(ensureAuth, ensureAdmin)

function crud(model, name, populateField = null){
  r.get('/'+name, async (req,res)=>{ 
    try {
      let query = model.find({})
      if (populateField) {
        query = query.populate(populateField)
      }
      const list = await query; 
      res.json(list) 
    } catch(e) {
      res.status(500).json({ error: e.message })
    }
  })
  r.post('/'+name, async (req,res)=>{ 
    try { 
      const it = await model.create(req.body); 
      res.json(it) 
    } catch(e){ 
      console.error('Erro ao criar '+name+':', e.message)
      // Melhorar mensagens de erro
      let errorMsg = e.message
      if (e.code === 11000) {
        // Erro de duplicata
        const field = Object.keys(e.keyPattern || {})[0]
        errorMsg = `${field} já está em uso`
      } else if (e.name === 'ValidationError') {
        // Erro de validação
        const fields = Object.keys(e.errors || {})
        const fieldNames = fields.map(f => e.errors[f].path).join(', ')
        errorMsg = `Erro de validação: ${fieldNames}`
      }
      res.status(400).json({ error: errorMsg }) 
    }
  })
  r.delete('/'+name+'/:id', async (req,res)=>{ 
    try {
      await model.findByIdAndDelete(req.params.id); 
      res.json({ok:true}) 
    } catch(e) {
      res.status(500).json({ error: e.message })
    }
  })
}
// Airports
r.get('/airports', async (req,res)=>{ 
  try {
    const list = await Airport.find({})
    res.json(list) 
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
r.post('/airports', async (req,res)=>{ 
  try { 
    const it = await Airport.create(req.body); 
    res.json(it) 
  } catch(e){ 
    console.error('Erro ao criar airport:', e.message)
    let errorMsg = e.message
    if (e.code === 11000) {
      const field = Object.keys(e.keyPattern || {})[0]
      errorMsg = `${field} já está em uso`
    }
    res.status(400).json({ error: errorMsg }) 
  }
})
r.delete('/airports/:id', async (req,res)=>{ 
  try {
    await Airport.findByIdAndDelete(req.params.id); 
    res.json({ok:true}) 
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

// ensure airport
r.post('/airports/ensure', async (req,res)=>{
  const { sigla, nome, cidade, estado, pais } = req.body
  if(!sigla) return res.status(400).json({ error:'sigla é obrigatória' })
  const up = await Airport.findOneAndUpdate({ sigla }, { sigla, nome, cidade, estado, pais }, { upsert:true, new:true })
  res.json(up)
})

// PUT para AircraftType com atualização automática nos voos (DEVE vir ANTES do crud)
r.put('/aircraft-types/:id', async (req,res)=>{ 
  try {
    const oldType = await AircraftType.findById(req.params.id)
    if (!oldType) return res.status(404).json({ error: 'Tipo de aeronave não encontrado' })
    
    // Atualizar o tipo de aeronave
    const updated = await AircraftType.findByIdAndUpdate(req.params.id, req.body, { new: true })
    
    // Buscar todas as aeronaves deste tipo
    const aircrafts = await Aircraft.find({ tipo: req.params.id })
    
    // Atualizar a capacidade de cada aeronave
    for (const aircraft of aircrafts) {
      await Aircraft.findByIdAndUpdate(aircraft._id, { 
        capacidade: updated.totalAssentos 
      })
    }
    
    // Buscar e atualizar todos os voos que usam essas aeronaves
    const aircraftIds = aircrafts.map(a => a._id)
    await Flight.updateMany(
      { aeronave: { $in: aircraftIds } },
      { $set: {} } // Força um update para recalcular a capacidade quando populado
    )
    
    res.json({ 
      updated, 
      aircraftsUpdated: aircrafts.length,
      message: 'Tipo de aeronave atualizado com sucesso. Voos atualizados automaticamente.' 
    }) 
  } catch(e) {
    console.error('Erro ao atualizar aircraft-type:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// PUT para Employee (DEVE vir ANTES do crud)
r.put('/employees/:id', async (req,res)=>{ 
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ error: 'Funcionário não encontrado' })
    res.json(updated)
  } catch(e) {
    console.error('Erro ao atualizar employee:', e.message)
    let errorMsg = e.message
    if (e.code === 11000) {
      const field = Object.keys(e.keyPattern || {})[0]
      errorMsg = `${field} já está em uso`
    }
    res.status(400).json({ error: errorMsg })
  }
})

crud(FlightType, 'flight-types')
crud(AircraftType, 'aircraft-types')
crud(Employee, 'employees')

// Teams - com populate de membros
// PUT deve vir ANTES
r.put('/teams/:id', async (req,res)=>{ 
  try {
    const updated = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('membros')
    if (!updated) return res.status(404).json({ error: 'Equipe não encontrada' })
    res.json(updated)
  } catch(e) {
    console.error('Erro ao atualizar team:', e.message)
    res.status(400).json({ error: e.message })
  }
})

r.get('/teams', async (req,res)=>{ 
  try {
    const list = await Team.find({}).populate('membros'); 
    res.json(list) 
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
r.post('/teams', async (req,res)=>{ 
  try { 
    const it = await Team.create(req.body); 
    const populated = await Team.findById(it._id).populate('membros')
    res.json(populated) 
  } catch(e){ 
    console.error('Erro ao criar team:', e.message)
    let errorMsg = e.message
    if (e.code === 11000) {
      const field = Object.keys(e.keyPattern || {})[0]
      errorMsg = `${field} já está em uso`
    }
    res.status(400).json({ error: errorMsg }) 
  }
})
r.delete('/teams/:id', async (req,res)=>{ 
  try {
    await Team.findByIdAndDelete(req.params.id); 
    res.json({ok:true}) 
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

// Aircrafts - specialized with populate
// PUT deve vir ANTES das outras rotas
r.put('/aircrafts/:id', async (req,res)=>{ 
  try {
    const updated = await Aircraft.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ error: 'Aeronave não encontrada' })
    res.json(updated)
  } catch(e){ 
    console.error('Erro ao atualizar aircraft:', e.message)
    let errorMsg = e.message
    if (e.code === 11000) {
      const field = Object.keys(e.keyPattern || {})[0]
      errorMsg = `${field} já está em uso`
    }
    res.status(400).json({ error: errorMsg }) 
  }
})

r.get('/aircrafts', async (req,res)=>{ 
  try {
    const list = await Aircraft.find({}).populate('tipo'); 
    res.json(list) 
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})
r.post('/aircrafts', async (req,res)=>{ 
  try { 
    const it = await Aircraft.create(req.body); 
    res.json(it) 
  } catch(e){ 
    console.error('Erro ao criar aircraft:', e.message)
    let errorMsg = e.message
    if (e.code === 11000) {
      const field = Object.keys(e.keyPattern || {})[0]
      errorMsg = `${field} já está em uso`
    }
    res.status(400).json({ error: errorMsg }) 
  }
})
r.delete('/aircrafts/:id', async (req,res)=>{ 
  try {
    await Aircraft.findByIdAndDelete(req.params.id); 
    res.json({ok:true}) 
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT para Flight (DEVE vir ANTES)
r.put('/flights/:id', async (req,res)=>{
  try {
    const updated = await Flight.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('origem destino aeronave tipoVoo equipe')
    if (!updated) return res.status(404).json({ error: 'Voo não encontrado' })
    res.json(updated)
  } catch(e) {
    console.error('Erro ao atualizar flight:', e.message)
    res.status(400).json({ error: e.message })
  }
})

r.post('/flights', async (req,res)=>{
  const it = await Flight.create(req.body)
  res.json(it)
})
r.get('/flights', async (req,res)=>{
  const list = await Flight.find({}).populate('origem destino aeronave')
  res.json(list)
})
r.delete('/flights/:id', async (req,res)=>{
  await Flight.findByIdAndDelete(req.params.id); res.json({ok:true})
})

// Seed: create airports incl. LDB and ~20 flights from LDB (direct and with scale)
r.post('/seed/londrina', async (req,res)=>{
  const airports = [
    { sigla:'LDB', nome:'Londrina', cidade:'Londrina', estado:'PR', pais:'Brasil' },
    { sigla:'GRU', nome:'Guarulhos', cidade:'São Paulo', estado:'SP', pais:'Brasil' },
    { sigla:'GIG', nome:'Galeão', cidade:'Rio de Janeiro', estado:'RJ', pais:'Brasil' },
    { sigla:'BSB', nome:'Brasília', cidade:'Brasília', estado:'DF', pais:'Brasil' },
    { sigla:'CWB', nome:'Afonso Pena', cidade:'Curitiba', estado:'PR', pais:'Brasil' },
    { sigla:'JFK', nome:'John F. Kennedy', cidade:'New York', estado:'NY', pais:'USA' }
  ]
  for (const a of airports){
    await Airport.updateOne({ sigla:a.sigla }, a, { upsert:true })
  }
  const [LDB] = await Airport.find({ sigla:'LDB' })
  const others = await Airport.find({ sigla: { $ne:'LDB' } })

  const dom = await FlightType.findOneAndUpdate({ nome:'Doméstico' }, { nome:'Doméstico', descricao:'Voos dentro do Brasil' }, { upsert:true, new:true })
  const a320 = await AircraftType.findOneAndUpdate({ nome:'A320' }, { nome:'A320', descricao:'Airbus A320', totalAssentos:180, filas:30, assentosPorFila:6 }, { upsert:true, new:true })
  const b737 = await AircraftType.findOneAndUpdate({ nome:'B737' }, { nome:'B737', descricao:'Boeing 737', totalAssentos:186, filas:31, assentosPorFila:6 }, { upsert:true, new:true })
  const acs = []
  for (let i=1;i<=4;i++){
    const tipo = (i%2===0) ? b737._id : a320._id
    // Criar aeronave com todos os campos necessários
    const acData = {
      nome: (i%2===0) ? 'Boeing 737' : 'Airbus A320',
      codigo: 'AC-' + String(i).padStart(3,'0'),
      capacidade: (i%2===0) ? 186 : 180,
      tipo: tipo
    }
    const ac = await Aircraft.findOneAndUpdate(
      { codigo: acData.codigo }, 
      acData, 
      { upsert:true, new:true }
    )
    acs.push(ac)
  }
  const cats = ['piloto','co-piloto','comissario']
  const emps = []
  for (let i=0;i<8;i++){
    const emp = await Employee.findOneAndUpdate(
      { nome:`Funcionario ${i+1}` }, 
      { 
        nome:`Funcionario ${i+1}`, 
        categoria:cats[i%cats.length],
        cargo: cats[i%cats.length] === 'piloto' || cats[i%cats.length] === 'co-piloto' ? 'piloto' : 'funcionario_bordo',
        matricula: `EMP${String(i+1).padStart(3,'0')}`
      }, 
      { upsert:true, new:true }
    )
    emps.push(emp)
  }

  // Buscar ou criar equipes
  const teams = await Team.find({})
  let teamsList = teams
  if (teams.length === 0) {
    const team1 = await Team.create({ nome:'Equipe Alpha', descricao:'Equipe principal', membros: emps.slice(0,3).map(e=>e._id) })
    const team2 = await Team.create({ nome:'Equipe Beta', descricao:'Equipe secundária', membros: emps.slice(3,6).map(e=>e._id) })
    const team3 = await Team.create({ nome:'Equipe Gamma', descricao:'Equipe de apoio', membros: emps.slice(6,8).map(e=>e._id) })
    teamsList = [team1, team2, team3]
  }

  function addHours(d,h){ return new Date(d.getTime()+h*60*60*1000) }
  const today = new Date(); today.setHours(0,0,0,0)
  let created = 0
  for (let i=0;i<20;i++){
    const destino = others[Math.floor(Math.random()*others.length)]
    const aeronave = acs[Math.floor(Math.random()*acs.length)]
    const equipe = teamsList[Math.floor(Math.random()*teamsList.length)]
    const dayOffset = Math.floor(Math.random()*5)+1
    const partida = new Date(today.getTime()+dayOffset*24*60*60*1000)
    partida.setHours(Math.floor(Math.random()*20)+3, 0, 0, 0)
    const dur = Math.floor(Math.random()*4)+1
    const chegada = addHours(partida, dur)
    const withScale = Math.random() < 0.5
    let escalas = []
    if (withScale) {
      const escalaAeroporto = others.filter(o=>o._id.toString()!==destino._id.toString())[Math.floor(Math.random()* Math.max(1, others.length-1))]
      if (escalaAeroporto) {
        const escalaSaida = addHours(partida, dur/2)
        const escalaChegada = addHours(partida, dur/2 + 0.5)
        escalas = [{
          aeroporto: escalaAeroporto._id,
          horarioSaida: escalaSaida,
          horarioChegada: escalaChegada
        }]
      }
    }
    const numero = 'LD' + String(i+1000)
    const exists = await Flight.findOne({ numero })
    if (!exists){
      await Flight.create({
        numero, tipoVoo:dom._id, aeronave:aeronave._id,
        origem:LDB._id, destino:destino._id, escalas:escalas,
        funcionarios:emps.slice(0,3).map(e=>e._id),
        equipe: equipe._id,
        horarioSaida: partida, horarioChegada: chegada, duracaoMinutos: dur*60, assentosOcupados: [],
        precoBase: 500 + Math.floor(Math.random() * 500)
      })
      created++
    }
  }
  res.json({ ok:true, created })
})


// Atualizar funcionários com nomes reais
r.post('/seed/update-employees', async (req,res)=>{
  try {
    const employees = await Employee.find({})
    const nomes = [
      'Carlos Silva', 'Ana Souza', 'Roberto Santos', 'Maria Oliveira', 
      'João Costa', 'Paula Lima', 'Ricardo Alves', 'Fernanda Rocha'
    ]
    
    for (let i = 0; i < employees.length && i < nomes.length; i++) {
      await Employee.findByIdAndUpdate(employees[i]._id, { 
        nome: nomes[i],
        nomeCompleto: nomes[i]
      })
    }
    
    res.json({ ok: true, updated: Math.min(employees.length, nomes.length) })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Atualizar voos existentes com equipes
r.post('/seed/update-flights-teams', async (req,res)=>{
  try {
    const teams = await Team.find({})
    if (teams.length === 0) {
      return res.status(400).json({ error: 'Nenhuma equipe encontrada. Crie equipes primeiro.' })
    }
    
    const flights = await Flight.find({ equipe: { $exists: false } })
    let updated = 0
    
    for (const flight of flights) {
      const randomTeam = teams[Math.floor(Math.random() * teams.length)]
      await Flight.findByIdAndUpdate(flight._id, { equipe: randomTeam._id })
      updated++
    }
    
    res.json({ ok: true, updated, totalTeams: teams.length })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Popular dados básicos (aeronaves e funcionários)
r.post('/seed/basic-data', async (req,res)=>{
  try {
    let created = { aircraftTypes: 0, aircrafts: 0, employees: 0 }
    
    // Tipos de aeronave
    const typeCount = await AircraftType.countDocuments()
    if (typeCount === 0) {
      await AircraftType.insertMany([
        { nome:'A320', descricao:'Airbus A320', totalAssentos:180, filas:30, assentosPorFila:6 },
        { nome:'B737', descricao:'Boeing 737', totalAssentos:186, filas:31, assentosPorFila:6 },
        { nome:'E195', descricao:'Embraer E195', totalAssentos:124, filas:31, assentosPorFila:4 }
      ])
      created.aircraftTypes = 3
    }
    
    // Aeronaves
    const aircraftCount = await Aircraft.countDocuments()
    if (aircraftCount === 0) {
      const tipos = await AircraftType.find({})
      const aircrafts = []
      for (let i = 1; i <= 10; i++) {
        const tipo = tipos[i % tipos.length]
        aircrafts.push({
          nome: tipo.nome,
          codigo: `AC-${String(i).padStart(3, '0')}`,
          capacidade: tipo.totalAssentos,
          tipo: tipo._id
        })
      }
      await Aircraft.insertMany(aircrafts)
      created.aircrafts = aircrafts.length
    }
    
    // Funcionários
    const employeeCount = await Employee.countDocuments()
    if (employeeCount === 0) {
      const employees = [
        { nome:'Carlos Silva', categoria:'piloto', matricula:'P001' },
        { nome:'Ana Souza', categoria:'piloto', matricula:'P002' },
        { nome:'Roberto Santos', categoria:'piloto', matricula:'P003' },
        { nome:'Maria Oliveira', categoria:'co-piloto', matricula:'CP001' },
        { nome:'João Costa', categoria:'co-piloto', matricula:'CP002' },
        { nome:'Paula Lima', categoria:'comissario', matricula:'C001' },
        { nome:'Ricardo Alves', categoria:'comissario', matricula:'C002' },
        { nome:'Fernanda Rocha', categoria:'comissario', matricula:'C003' },
        { nome:'Lucas Martins', categoria:'atendente', matricula:'A001' },
        { nome:'Juliana Ferreira', categoria:'atendente', matricula:'A002' }
      ]
      await Employee.insertMany(employees)
      created.employees = employees.length
    }
    
    res.json({ ok: true, created })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// seed principais aeroportos do Brasil (inclui PR)
r.post('/seed/airports-br', async (req,res)=>{
  const list = [
    {sigla:'LDB', nome:'Londrina', cidade:'Londrina', estado:'PR', pais:'Brasil'},
    {sigla:'CWB', nome:'Afonso Pena', cidade:'Curitiba', estado:'PR', pais:'Brasil'},
    {sigla:'IGU', nome:'Foz do Iguaçu', cidade:'Foz do Iguaçu', estado:'PR', pais:'Brasil'},
    {sigla:'MGF', nome:'Maringá', cidade:'Maringá', estado:'PR', pais:'Brasil'},
    {sigla:'CAC', nome:'Cascavel', cidade:'Cascavel', estado:'PR', pais:'Brasil'},
    {sigla:'PGZ', nome:'Ponta Grossa', cidade:'Ponta Grossa', estado:'PR', pais:'Brasil'},
    {sigla:'GPB', nome:'Guarapuava', cidade:'Guarapuava', estado:'PR', pais:'Brasil'},
    {sigla:'FBE', nome:'Francisco Beltrão', cidade:'Francisco Beltrão', estado:'PR', pais:'Brasil'},
    {sigla:'GRU', nome:'Guarulhos', cidade:'São Paulo', estado:'SP', pais:'Brasil'},
    {sigla:'CGH', nome:'Congonhas', cidade:'São Paulo', estado:'SP', pais:'Brasil'},
    {sigla:'VCP', nome:'Viracopos', cidade:'Campinas', estado:'SP', pais:'Brasil'},
    {sigla:'GIG', nome:'Galeão', cidade:'Rio de Janeiro', estado:'RJ', pais:'Brasil'},
    {sigla:'SDU', nome:'Santos Dumont', cidade:'Rio de Janeiro', estado:'RJ', pais:'Brasil'},
    {sigla:'BSB', nome:'Brasília', cidade:'Brasília', estado:'DF', pais:'Brasil'},
    {sigla:'CNF', nome:'Confins', cidade:'Belo Horizonte', estado:'MG', pais:'Brasil'},
    {sigla:'POA', nome:'Salgado Filho', cidade:'Porto Alegre', estado:'RS', pais:'Brasil'}
  ]
  for (const a of list){ await Airport.updateOne({ sigla:a.sigla }, a, { upsert:true }) }
  res.json({ ok:true, count:list.length })
})
export default r

// quick seed with ~20 flights from LDB (directs and with scale)
r.post('/seed/quick', async (req,res)=>{
  const has = await Flight.countDocuments()
  if(has>0) return res.json({ ok:true, message:'já existem voos' })
  // ensure airports
  const ensure = async (a)=>{ const r = await Airport.findOneAndUpdate({sigla:a.sigla},{...a},{upsert:true,new:true}); return r._id }
  const ldb = await ensure({sigla:'LDB', nome:'Londrina', cidade:'Londrina', estado:'PR', pais:'Brasil'})
  const gru = await ensure({sigla:'GRU', nome:'Guarulhos', cidade:'São Paulo', estado:'SP', pais:'Brasil'})
  const cwb = await ensure({sigla:'CWB', nome:'Afonso Pena', cidade:'Curitiba', estado:'PR', pais:'Brasil'})
  const gig = await ensure({sigla:'GIG', nome:'Galeão', cidade:'Rio de Janeiro', estado:'RJ', pais:'Brasil'})
  // employees
  const e1 = await (await (new Employee({nome:'Carlos Silva', cargo:'piloto', categoria:'piloto', matricula:'P001'})).save())._id
  const e2 = await (await (new Employee({nome:'Ana Souza', cargo:'funcionario_bordo', categoria:'comissario', matricula:'B010'})).save())._id
  // aircrafts
  const ac1 = await (await (new Aircraft({nome:'Airbus A320', codigo:'AC320', capacidade:180})).save())._id
  const ac2 = await (await (new Aircraft({nome:'Boeing 737', codigo:'B737-800', capacidade:186})).save())._id
  // teams
  const teams = await Team.find({})
  let team1, team2
  if (teams.length === 0) {
    team1 = await Team.create({ nome:'Equipe Alpha', descricao:'Equipe principal', membros: [e1, e2] })
    team2 = await Team.create({ nome:'Equipe Beta', descricao:'Equipe secundária', membros: [e1] })
  } else {
    team1 = teams[0]
    team2 = teams[1] || teams[0]
  }
  const now = new Date()
  const dom = await FlightType.findOneAndUpdate({ nome:'Doméstico' }, { nome:'Doméstico', descricao:'Voos dentro do Brasil' }, { upsert:true, new:true })
  const mk = (i, dest, escalaAeroporto, equipe)=>{
    const partida = new Date(now.getTime()+ i*3600*1000)
    const chegada = new Date(now.getTime()+ (i*3600+7200)*1000)
    const escalas = escalaAeroporto ? [{
      aeroporto: escalaAeroporto,
      horarioSaida: new Date(partida.getTime() + 3600*1000),
      horarioChegada: new Date(partida.getTime() + 3600*1000 + 30*60*1000)
    }] : []
    return {
      numero: 'LDB'+(100+i),
      tipoVoo: dom._id,
      aeronave: i%2? ac1:ac2,
      origem: ldb,
      destino: dest,
      escalas: escalas,
      funcionarios:[e1,e2],
      equipe: equipe,
      horarioSaida: partida,
      horarioChegada: chegada,
      duracaoMinutos: 120,
      precoBase: 500 + Math.floor(Math.random() * 500)
    }
  }
  const flights = []
  for(let i=0;i<10;i++){ flights.push(mk(i, gru, null, team1._id)) }
  for(let i=10;i<20;i++){ flights.push(mk(i, gig, cwb, team2._id)) }
  await Flight.insertMany(flights)
  res.json({ ok:true, created: flights.length })
})

// Relatórios (F15)
r.get('/reports/occupation', async (req,res)=>{
  try {
    const { vooId, dataInicio, dataFim } = req.query
    const filter = { cancelado: false, 'pagamento.status': 'confirmado' }
    
    if (vooId) {
      filter.voo = vooId
    }
    
    const reservas = await Reservation.find(filter).populate('voo')
    const ocupacaoPorVoo = {}
    
    reservas.forEach(r => {
      if (!r.voo) return
      const vooId = r.voo._id.toString()
      if (!ocupacaoPorVoo[vooId]) {
        ocupacaoPorVoo[vooId] = {
          voo: r.voo.numero,
          assentosOcupados: 0,
          totalAssentos: r.voo.aeronave?.capacidade || 180,
          reservas: 0
        }
      }
      ocupacaoPorVoo[vooId].assentosOcupados += r.assentos.length
      ocupacaoPorVoo[vooId].reservas++
    })
    
    // Calcular percentual de ocupação
    const resultado = Object.values(ocupacaoPorVoo).map(v => ({
      ...v,
      percentualOcupacao: ((v.assentosOcupados / v.totalAssentos) * 100).toFixed(2),
      assentosDisponiveis: v.totalAssentos - v.assentosOcupados
    }))
    
    res.json(resultado)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

r.get('/reports/flight-value', async (req,res)=>{
  try {
    const { vooId } = req.query
    const filter = { cancelado: false, 'pagamento.status': 'confirmado' }
    
    if (vooId) {
      filter.voo = vooId
    }
    
    const reservas = await Reservation.find(filter).populate('voo')
    const valorPorVoo = {}
    
    reservas.forEach(r => {
      if (!r.voo) return
      const vooId = r.voo._id.toString()
      if (!valorPorVoo[vooId]) {
        valorPorVoo[vooId] = {
          voo: r.voo.numero,
          origem: r.voo.origem?.sigla,
          destino: r.voo.destino?.sigla,
          dataVoo: r.voo.horarioSaida,
          valorTotal: 0,
          reservas: 0
        }
      }
      valorPorVoo[vooId].valorTotal += r.pagamento.valorTotal || 0
      valorPorVoo[vooId].reservas++
    })
    
    res.json(Object.values(valorPorVoo))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

r.get('/reports/monthly-by-type', async (req,res)=>{
  try {
    const { mes, ano } = req.query
    const mesNum = parseInt(mes) || new Date().getMonth() + 1
    const anoNum = parseInt(ano) || new Date().getFullYear()
    
    const dataInicio = new Date(anoNum, mesNum - 1, 1)
    const dataFim = new Date(anoNum, mesNum, 0, 23, 59, 59)
    
    const reservas = await Reservation.find({
      cancelado: false,
      'pagamento.status': 'confirmado',
      createdAt: { $gte: dataInicio, $lte: dataFim }
    }).populate({
      path: 'voo',
      populate: { path: 'tipoVoo' }
    })
    
    const valorPorTipo = {}
    
    reservas.forEach(r => {
      if (!r.voo || !r.voo.tipoVoo) return
      const tipoId = r.voo.tipoVoo._id.toString()
      const tipoNome = r.voo.tipoVoo.nome || 'Sem tipo'
      
      if (!valorPorTipo[tipoId]) {
        valorPorTipo[tipoId] = {
          tipo: tipoNome,
          valorTotal: 0,
          reservas: 0,
          passagens: 0
        }
      }
      
      valorPorTipo[tipoId].valorTotal += r.pagamento.valorTotal || 0
      valorPorTipo[tipoId].reservas++
      valorPorTipo[tipoId].passagens += r.assentos.length
    })
    
    res.json({
      mes: mesNum,
      ano: anoNum,
      dados: Object.values(valorPorTipo)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

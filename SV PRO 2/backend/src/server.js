import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import flightRoutes from './routes/flights.js'
import reservationRoutes from './routes/reservations.js'
import { iniciarVerificacaoPeriodica } from './services/paymentChecker.js'
import Airport from './models/Airport.js'
import FlightType from './models/FlightType.js'
import AircraftType from './models/AircraftType.js'
import Aircraft from './models/Aircraft.js'
import Employee from './models/Employee.js'
import Team from './models/Team.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sv_system'
await mongoose.connect(MONGODB_URI)

// Inicializar dados básicos
async function initializeData() {
  const airportCount = await Airport.countDocuments()
  if (airportCount === 0) {
    console.log('[Init] Criando aeroportos...')
    const airports = [
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
    await Airport.insertMany(airports)
    console.log('[Init] Aeroportos criados:', airports.length)
  }
  
  const typeCount = await FlightType.countDocuments()
  if (typeCount === 0) {
    console.log('[Init] Criando tipos de voo...')
    await FlightType.insertMany([
      { nome:'Doméstico', descricao:'Voos dentro do Brasil' },
      { nome:'Internacional', descricao:'Voos para fora do Brasil' },
      { nome:'Regional', descricao:'Voos curta distância' }
    ])
    console.log('[Init] Tipos de voo criados')
  }

  const aircraftTypeCount = await AircraftType.countDocuments()
  if (aircraftTypeCount === 0) {
    console.log('[Init] Criando tipos de aeronave...')
    await AircraftType.insertMany([
      { nome:'A320', descricao:'Airbus A320', totalAssentos:180, filas:30, assentosPorFila:6 },
      { nome:'B737', descricao:'Boeing 737', totalAssentos:186, filas:31, assentosPorFila:6 },
      { nome:'E195', descricao:'Embraer E195', totalAssentos:124, filas:31, assentosPorFila:4 }
    ])
    console.log('[Init] Tipos de aeronave criados')
  }

  const aircraftCount = await Aircraft.countDocuments()
  if (aircraftCount === 0) {
    console.log('[Init] Criando aeronaves...')
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
    console.log('[Init] Aeronaves criadas:', aircrafts.length)
  }

  const employeeCount = await Employee.countDocuments()
  if (employeeCount === 0) {
    console.log('[Init] Criando funcionários...')
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
    console.log('[Init] Funcionários criados:', employees.length)
  }

  const teamCount = await Team.countDocuments()
  if (teamCount === 0) {
    console.log('[Init] Criando equipes...')
    const employees = await Employee.find({})
    const teams = [
      { nome:'Equipe Alpha', descricao:'Equipe principal de voos nacionais', membros: employees.slice(0, 3).map(e => e._id) },
      { nome:'Equipe Beta', descricao:'Equipe de voos internacionais', membros: employees.slice(3, 6).map(e => e._id) },
      { nome:'Equipe Gamma', descricao:'Equipe de voos regionais', membros: employees.slice(6, 9).map(e => e._id) }
    ]
    await Team.insertMany(teams)
    console.log('[Init] Equipes criadas:', teams.length)
  }
}
await initializeData()

// Iniciar verificação periódica de fichas de compensação (F13)
iniciarVerificacaoPeriodica()

app.get('/', (req,res)=>res.json({ok:true}))
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/flights', flightRoutes)
app.use('/api/reservations', reservationRoutes)

const port = process.env.PORT || 4000
app.listen(port, ()=>console.log('SV backend on', port))

import { Router } from 'express'
import { ensureAuth } from '../mw/auth.js'
import Flight from '../models/Flight.js'
import Reservation from '../models/Reservation.js'
import User from '../models/User.js'
const r = Router()
r.use(ensureAuth)

// Função auxiliar: calcular dias úteis entre duas datas
function diasUteisEntre(dataInicio, dataFim) {
  let dias = 0
  const atual = new Date(dataInicio)
  atual.setHours(0, 0, 0, 0)
  const fim = new Date(dataFim)
  fim.setHours(0, 0, 0, 0)
  
  while (atual < fim) {
    const diaSemana = atual.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) { // não é domingo (0) nem sábado (6)
      dias++
    }
    atual.setDate(atual.getDate() + 1)
  }
  return dias
}

// Função auxiliar: adicionar dias úteis a uma data
function adicionarDiasUteis(data, dias) {
  const result = new Date(data)
  let adicionados = 0
  while (adicionados < dias) {
    result.setDate(result.getDate() + 1)
    const diaSemana = result.getDay()
    if (diaSemana !== 0 && diaSemana !== 6) {
      adicionados++
    }
  }
  return result
}

// Função auxiliar: gerar número de reserva
function gerarNumeroReserva() {
  return 'RS' + Math.random().toString(36).substring(2, 8).toUpperCase() + Date.now().toString(36).substring(7).toUpperCase()
}

// Função auxiliar: gerar número de ficha de compensação
function gerarNumeroFicha() {
  return 'FC' + Math.random().toString(36).substring(2, 10).toUpperCase() + Date.now().toString(36).substring(5).toUpperCase()
}

r.get('/mine', async (req,res)=>{
  const list = await Reservation.find({ user:req.user.id, cancelado: false }).populate({ 
    path:'voo', 
    populate:[
      { path:'origem' },
      { path:'destino' },
      { path:'aeronave', populate: { path:'tipo' }},
      { path:'funcionarios' },
      { path:'equipe' },
      { path:'escalas.aeroporto' }
    ] 
  })
  res.json(list)
})

r.post('/', async (req,res)=>{
  try {
    const { vooId, assentos=[], ocupantes=[], metodoPagamento='cartao', valorTotal, cartao } = req.body
    
    if (!vooId || !assentos.length) {
      return res.status(400).json({ error:'Voo e assentos são obrigatórios' })
    }
    
    if (assentos.length !== ocupantes.length) {
      return res.status(400).json({ error:'Número de ocupantes deve corresponder ao número de assentos' })
    }
    
    const voo = await Flight.findById(vooId).populate('aeronave')
    if (!voo) return res.status(404).json({ error:'Voo não encontrado' })
    
    // Verificar se os assentos estão disponíveis
    const duplicados = assentos.filter(a => voo.assentosOcupados?.includes(a))
    if (duplicados.length) {
      return res.status(409).json({ error:'Assentos já ocupados', duplicados })
    }
    
    // Calcular valor total se não fornecido
    const valor = valorTotal || (voo.precoBase || 500) * assentos.length
    
    // Validar ficha de compensação (F11)
    if (metodoPagamento === 'ficha') {
      const agora = new Date()
      const dataVoo = new Date(voo.horarioSaida)
      const diasUteis = diasUteisEntre(agora, dataVoo)
      
      if (diasUteis <= 3) {
        return res.status(400).json({ 
          error:'Ficha de compensação só é permitida para voos com mais de 3 dias úteis de antecedência',
          diasUteisRestantes: diasUteis
        })
      }
    }
    
    // Bloquear assentos
    voo.assentosOcupados = [ ...(voo.assentosOcupados||[]), ...assentos ]
    await voo.save()
    
    // Processar pagamento
    let statusPagamento = 'pendente'
    let dadosPagamento = {
      metodo: metodoPagamento,
      valorTotal: valor
    }
    
    if (metodoPagamento === 'cartao') {
      // Simular processamento de cartão de crédito
      // Em produção, aqui seria feita a integração com gateway de pagamento
      if (cartao && cartao.numero && cartao.validade) {
        // Simular autorização (sempre autoriza para demo)
        statusPagamento = 'autorizado'
        dadosPagamento.cartao = {
          tipo: cartao.tipo || 'Visa',
          numero: cartao.numero.slice(-4), // apenas últimos 4 dígitos
          validade: cartao.validade
        }
        // Status será confirmado automaticamente após criação (F12)
      } else {
        return res.status(400).json({ error:'Dados do cartão são obrigatórios' })
      }
    } else if (metodoPagamento === 'ficha') {
      // Gerar ficha de compensação
      const numeroFicha = gerarNumeroFicha()
      const dataVoo = new Date(voo.horarioSaida)
      // Calcular data de vencimento: 1 dia útil antes do voo
      let dataVencimento = new Date(dataVoo)
      dataVencimento.setDate(dataVencimento.getDate() - 1)
      // Se for fim de semana, voltar até encontrar dia útil
      while (dataVencimento.getDay() === 0 || dataVencimento.getDay() === 6) {
        dataVencimento.setDate(dataVencimento.getDate() - 1)
      }
      
      dadosPagamento.ficha = {
        numero: numeroFicha,
        dataVencimento: dataVencimento,
        paga: false
      }
      statusPagamento = 'pendente'
    }
    
    // Criar reserva
    const numeroReserva = gerarNumeroReserva()
    dadosPagamento.status = statusPagamento
    
    const rsv = await Reservation.create({
      user: req.user.id,
      voo: voo._id,
      assentos,
      ocupantes,
      pagamento: dadosPagamento,
      numeroReserva
    })
    
    // Se pagamento por cartão foi autorizado, confirmar automaticamente (F12)
    if (metodoPagamento === 'cartao' && statusPagamento === 'autorizado') {
      rsv.pagamento.status = 'confirmado'
      await rsv.save()
    }
    
    const ret = await Reservation.findById(rsv._id).populate({ 
      path:'voo', 
      populate:['origem','destino','aeronave'] 
    })
    
    res.json(ret)
  } catch (error) {
    console.error('Erro ao criar reserva:', error)
    res.status(500).json({ error: error.message })
  }
})

r.post('/:id/cancel', async (req,res)=>{
  try {
    const rsv = await Reservation.findById(req.params.id).populate('voo')
    if (!rsv || rsv.user.toString() !== req.user.id) {
      return res.status(404).json({ error:'Reserva não encontrada' })
    }
    
    if (rsv.cancelado) {
      return res.status(400).json({ error:'Reserva já foi cancelada' })
    }
    
    // Validar cancelamento: reservas pendentes podem ser canceladas a qualquer momento
    // Reservas confirmadas só podem ser canceladas com 24h de antecedência (F14)
    const agora = new Date()
    const dataVoo = new Date(rsv.voo.horarioSaida)
    const horasAntes = (dataVoo - agora) / (1000 * 60 * 60)
    
    if (rsv.pagamento.status === 'confirmado' && horasAntes < 24) {
      return res.status(400).json({ 
        error:'Cancelamento de reservas confirmadas só é permitido com pelo menos 24 horas de antecedência',
        horasRestantes: Math.round(horasAntes * 10) / 10
      })
    }
    
    // Liberar assentos
    const voo = await Flight.findById(rsv.voo._id)
    voo.assentosOcupados = (voo.assentosOcupados||[]).filter(a => !(rsv.assentos||[]).includes(a))
    await voo.save()
    
    // Atualizar status da reserva
    rsv.cancelado = true
    rsv.dataCancelamento = agora
    rsv.pagamento.status = rsv.pagamento.metodo === 'cartao' ? 'reembolsado' : 'cancelado'
    await rsv.save()
    
    // Notificar usuário por email (simulado - em produção enviaria email real)
    const user = await User.findById(rsv.user)
    console.log(`Email enviado para ${user.email}: Reserva ${rsv.numeroReserva} cancelada`)
    
    res.json({ ok:true, mensagem:'Reserva cancelada com sucesso' })
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error)
    res.status(500).json({ error: error.message })
  }
})

// Endpoint para confirmar pagamento de ficha de compensação (simula recebimento do banco)
r.post('/:id/confirmar-pagamento-ficha', async (req,res)=>{
  try {
    const rsv = await Reservation.findById(req.params.id)
    if (!rsv) return res.status(404).json({ error:'Reserva não encontrada' })
    
    if (rsv.pagamento.metodo !== 'ficha') {
      return res.status(400).json({ error:'Esta reserva não é de ficha de compensação' })
    }
    
    if (rsv.pagamento.ficha.paga) {
      return res.status(400).json({ error:'Ficha já foi paga' })
    }
    
    rsv.pagamento.ficha.paga = true
    rsv.pagamento.ficha.dataPagamento = new Date()
    rsv.pagamento.status = 'confirmado'
    await rsv.save()
    
    res.json({ ok:true, mensagem:'Pagamento confirmado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default r

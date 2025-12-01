import Reservation from '../models/Reservation.js'
import Flight from '../models/Flight.js'
import User from '../models/User.js'

// Função para verificar e cancelar reservas com fichas não quitadas (F13)
export async function verificarFichasNaoQuitadas() {
  try {
    const agora = new Date()
    const limite24h = new Date(agora.getTime() + 24 * 60 * 60 * 1000) // 24 horas a partir de agora
    
    // Buscar reservas com ficha não quitada para voos que ocorrerão em até 24 horas
    const reservas = await Reservation.find({
      cancelado: false,
      'pagamento.metodo': 'ficha',
      'pagamento.ficha.paga': false,
      'pagamento.status': 'pendente'
    }).populate('voo user')
    
    let canceladas = 0
    
    for (const reserva of reservas) {
      if (!reserva.voo) continue
      
      const dataVoo = new Date(reserva.voo.horarioSaida)
      
      // Se o voo ocorrerá em até 24 horas e a ficha não foi quitada, cancelar
      if (dataVoo <= limite24h && dataVoo > agora) {
        // Liberar assentos
        const voo = await Flight.findById(reserva.voo._id)
        if (voo) {
          voo.assentosOcupados = (voo.assentosOcupados || []).filter(
            a => !(reserva.assentos || []).includes(a)
          )
          await voo.save()
        }
        
        // Cancelar reserva
        reserva.cancelado = true
        reserva.dataCancelamento = agora
        reserva.pagamento.status = 'cancelado'
        await reserva.save()
        
        // Notificar usuário por email (simulado)
        if (reserva.user && reserva.user.email) {
          console.log(`[EMAIL] Reserva ${reserva.numeroReserva} cancelada - Ficha não quitada a tempo`)
          console.log(`Enviar email para: ${reserva.user.email}`)
          console.log(`Mensagem: Sua reserva ${reserva.numeroReserva} foi cancelada porque o pagamento da ficha de compensação não foi confirmado até 24 horas antes do voo.`)
        }
        
        canceladas++
      }
    }
    
    console.log(`[PaymentChecker] Verificação concluída. ${canceladas} reserva(s) cancelada(s).`)
    return { canceladas, total: reservas.length }
  } catch (error) {
    console.error('[PaymentChecker] Erro ao verificar fichas:', error)
    return { canceladas: 0, total: 0, error: error.message }
  }
}

// Executar verificação a cada hora
export function iniciarVerificacaoPeriodica() {
  // Executar imediatamente
  verificarFichasNaoQuitadas()
  
  // Executar a cada hora (3600000 ms)
  setInterval(() => {
    verificarFichasNaoQuitadas()
  }, 60 * 60 * 1000)
  
  console.log('[PaymentChecker] Verificação periódica iniciada (a cada 1 hora)')
}


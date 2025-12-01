import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  user:{ type: mongoose.Schema.Types.ObjectId, ref:'User' },
  voo:{ type: mongoose.Schema.Types.ObjectId, ref:'Flight' },
  assentos:[String],
  ocupantes:[{ nomeCompleto:String }],
  pagamento:{ 
    status:{ type:String, enum:['pendente','autorizado','confirmado','cancelado','reembolsado'], default:'pendente' }, 
    metodo:String, // 'cartao' ou 'ficha'
    valorTotal: Number,
    // Dados do cartão (se aplicável)
    cartao: {
      tipo: String, // MasterCard, Visa, etc.
      numero: String, // apenas últimos 4 dígitos armazenados
      validade: String // MM/AA
    },
    // Dados da ficha de compensação (se aplicável)
    ficha: {
      numero: String,
      dataVencimento: Date,
      paga: { type: Boolean, default: false },
      dataPagamento: Date
    }
  },
  numeroReserva:String,
  cancelado: { type: Boolean, default: false },
  dataCancelamento: Date
}, { timestamps: true })
export default mongoose.model('Reservation', schema)

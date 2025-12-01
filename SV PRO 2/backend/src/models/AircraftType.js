import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  nome: String,
  descricao: String,
  totalAssentos: Number,
  filas: Number,
  assentosPorFila: Number,
  // Configuração de classes de assentos
  classes: [{
    nome: { type: String, enum: ['first', 'executive', 'economy'], required: true },
    filasInicio: { type: Number, required: true }, // Primeira fila da classe (1-based)
    filasFim: { type: Number, required: true },    // Última fila da classe (1-based)
    assentosJanela: [String], // Letras dos assentos de janela (ex: ['A', 'F'])
    assentosCorredor: [String], // Letras dos assentos de corredor (ex: ['C', 'D'])
    multiplicadorPreco: { type: Number, default: 1 } // Multiplicador do preço base
  }],
  // Layout padrão se não houver classes definidas
  layoutPadrao: {
    tipo: { type: String, enum: ['3-3', '2-4-2', '2-3-2', '3-4-3'], default: '3-3' } // Configuração de assentos por fileira
  }
})
export default mongoose.model('AircraftType', schema)

import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  descricao: String,
  membros: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  ativo: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.model('Team', schema)

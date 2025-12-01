import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const UserSchema = new mongoose.Schema({
  role: { type: String, enum: ['passageiro','mantenedor'], default: 'passageiro' },
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senhaHash: { type: String, required: true },

  telefones: [String],
  endereco: { logradouro:String, cidade:String, estado:String, pais:String, cep:String },
  cpf: String,
  rg: { numero:String, dataEmissao:String, orgaoEmissor:String },
  localTrabalho: String,
  enderecoComercial: String,
  dataNascimento: String,

  matricula: String,
  cargo: String
}, { timestamps: true })

UserSchema.methods.checkPassword = async function(p){ return bcrypt.compare(p, this.senhaHash) }
export default mongoose.model('User', UserSchema)

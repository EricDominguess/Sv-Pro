import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  nome:{ type:String, required:true },
  nomeCompleto: String, // alias para nome (compatibilidade)
  dataNascimento: Date,
  telefoneCelular: String,
  email: String,
  categoria:{ type:String, required:true }, // piloto, co-piloto, comissario, atendente, etc.
  cargo:{ type:String, enum:['piloto','funcionario_bordo'], default: 'piloto' }, // mantido para compatibilidade
  matricula:{ type:String, required:true, unique:true }
})

// Pre-validate: garantir que nome e cargo sejam definidos antes da validação
schema.pre('validate', function(next) {
  // Se nomeCompleto for fornecido mas nome não, usar nomeCompleto
  if (this.nomeCompleto && !this.nome) {
    this.nome = this.nomeCompleto
  }
  // Se nome for fornecido mas nomeCompleto não, usar nome
  if (this.nome && !this.nomeCompleto) {
    this.nomeCompleto = this.nome
  }
  // Definir cargo baseado na categoria ANTES da validação
  // Isso garante que o cargo sempre seja válido para o enum
  if (this.categoria) {
    if (this.categoria === 'piloto' || this.categoria === 'co-piloto') {
      this.cargo = 'piloto'
    } else {
      this.cargo = 'funcionario_bordo'
    }
  }
  next()
})

// Pre-save: garantir consistência final
schema.pre('save', function(next) {
  // Garantir que nomeCompleto sempre tenha valor
  if (!this.nomeCompleto && this.nome) {
    this.nomeCompleto = this.nome
  }
  next()
})

export default mongoose.model('Employee', schema)

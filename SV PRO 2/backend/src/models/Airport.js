import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  sigla: { type:String, unique:true },
  nome: String, cidade:String, estado:String, pais:String
})
export default mongoose.model('Airport', schema)

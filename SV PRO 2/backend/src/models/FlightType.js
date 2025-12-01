import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  nome:String, descricao:String
})
export default mongoose.model('FlightType', schema)

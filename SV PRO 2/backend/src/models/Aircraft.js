import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  numero:{ type:String },
  tipo:{ type: mongoose.Schema.Types.ObjectId, ref:'AircraftType', required:false },
  nome:{ type:String, required:true },
  codigo:{ type:String, required:true, unique:true },
  capacidade:{ type:Number, required:true }
})
export default mongoose.model('Aircraft', schema)

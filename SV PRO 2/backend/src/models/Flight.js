import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  numero:String,
  tipoVoo:{ type: mongoose.Schema.Types.ObjectId, ref:'FlightType' },
  aeronave:{ type: mongoose.Schema.Types.ObjectId, ref:'Aircraft' },
  origem:{ type: mongoose.Schema.Types.ObjectId, ref:'Airport' },
  destino:{ type: mongoose.Schema.Types.ObjectId, ref:'Airport' },
  escalas:[{
    aeroporto:{ type: mongoose.Schema.Types.ObjectId, ref:'Airport' },
    horarioSaida: Date,
    horarioChegada: Date
  }],
  funcionarios:[{ type: mongoose.Schema.Types.ObjectId, ref:'Employee' }],
  equipe:{ type: mongoose.Schema.Types.ObjectId, ref:'Team' },
  horarioSaida:Date,
  horarioChegada:Date,
  duracaoMinutos:Number,
  assentosOcupados:[String],
  precoBase: { type: Number, default: 500 } // preço base do voo para cálculo de reservas
})
export default mongoose.model('Flight', schema)

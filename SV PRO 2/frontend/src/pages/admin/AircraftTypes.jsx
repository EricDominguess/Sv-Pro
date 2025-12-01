import React, { useEffect, useState } from 'react'
import api from '../../services/api'

export default function AircraftTypes(){
  const [list, setList] = useState([])
  const [form, setForm] = useState({ nome:'', totalAssentos:0, filas:0, assentosPorFila:0 })
  const [editingId, setEditingId] = useState(null)

  useEffect(()=>{ load() }, [])

  async function load(){ 
    try {
      const { data } = await api.get('/admin/aircraft-types')
      setList(data)
    } catch(e) {
      console.error('Erro ao carregar:', e)
      alert('Erro ao carregar tipos de aeronave')
    }
  }
  
  async function save(){ 
    try {
      console.log('Salvando...', { editingId, form })
      if (editingId) {
        const response = await api.put(`/admin/aircraft-types/${editingId}`, form)
        console.log('Resposta da atualização:', response.data)
        setEditingId(null)
      } else {
        await api.post('/admin/aircraft-types', form)
      }
      setForm({ nome:'', totalAssentos:0, filas:0, assentosPorFila:0 })
      await load()
    } catch(e) {
      console.error('Erro ao salvar:', e)
      alert('Erro ao salvar: ' + (e.response?.data?.error || e.message))
    }
  }
  
  function edit(item){
    setForm({
      nome: item.nome,
      totalAssentos: item.totalAssentos,
      filas: item.filas,
      assentosPorFila: item.assentosPorFila
    })
    setEditingId(item._id)
  }
  
  function cancelEdit(){
    setForm({ nome:'', totalAssentos:0, filas:0, assentosPorFila:0 })
    setEditingId(null)
  }
  
  async function del(id){ await api.delete('/admin/aircraft-types/'+id); load() }

  return (
    <div className="grid">
      <h2>Tipos de Aeronave</h2>
      <div style={{display:'flex', gap:'1rem', alignItems:'flex-end'}}>
        <div style={{flex:1}}>
          <label style={{display:'block', marginBottom:'0.5rem', fontSize:'0.875rem', color:'#9ca3af'}}>Nome do Modelo</label>
          <input placeholder="ex: A320, B737" value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))}/>
        </div>
        <div style={{flex:1}}>
          <label style={{display:'block', marginBottom:'0.5rem', fontSize:'0.875rem', color:'#9ca3af'}}>Total de Assentos</label>
          <input placeholder="180" type="number" value={form.totalAssentos||0} onChange={e=>setForm(p=>({...p,totalAssentos:Number(e.target.value)}))}/>
        </div>
        <div style={{flex:1}}>
          <label style={{display:'block', marginBottom:'0.5rem', fontSize:'0.875rem', color:'#9ca3af'}}>Assentos por Fila</label>
          <input placeholder="6" type="number" value={form.filas||0} onChange={e=>setForm(p=>({...p,filas:Number(e.target.value)}))}/>
        </div>
        <div style={{flex:1}}>
          <label style={{display:'block', marginBottom:'0.5rem', fontSize:'0.875rem', color:'#9ca3af'}}>Número de Filas</label>
          <input placeholder="30" type="number" value={form.assentosPorFila||0} onChange={e=>setForm(p=>({...p,assentosPorFila:Number(e.target.value)}))}/>
        </div>
        <button className="btn" onClick={save}>{editingId ? 'Atualizar' : 'Adicionar'}</button>
        {editingId && <button className="btn ghost" onClick={cancelEdit}>Cancelar</button>}
      </div>
      <table className="table"><thead><tr><th>Nome</th><th>Assentos</th><th>Mapa</th><th></th></tr></thead>
        <tbody>
          {list.map(i=>(
            <tr key={i._id}>
              <td>{i.nome}</td>
              <td>{i.totalAssentos}</td>
              <td>{i.assentosPorFila} x {i.filas}</td>
              <td>
                <button className="btn ghost" onClick={()=>edit(i)} style={{marginRight:'0.5rem'}}>Editar</button>
                <button className="btn ghost" onClick={()=>del(i._id)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

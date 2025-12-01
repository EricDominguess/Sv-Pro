import React, { useEffect, useState } from 'react'
import api from '../../services/api'

export default function Aircrafts(){
  const [list, setList] = useState([])
  const [types, setTypes] = useState([])
  const [form, setForm] = useState({ nome:'', codigo:'', capacidade:'', tipo:'' })
  const [msg, setMsg] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(()=>{ load() }, [])

  async function load(){
    const [a,b] = await Promise.all([api.get('/admin/aircrafts'), api.get('/admin/aircraft-types')])
    setList(a.data); setTypes(b.data)
  }
  async function save(){
    setMsg('') // Limpar mensagem anterior
    if(!form.nome || !form.codigo || !form.capacidade){ 
      setMsg('Preencha nome, código e capacidade.'); 
      return 
    }
    try {
      const capacidade = Number(form.capacidade)
      if (isNaN(capacidade) || capacidade <= 0) {
        setMsg('Capacidade deve ser um número maior que zero.')
        return
      }
      if (editingId) {
        await api.put(`/admin/aircrafts/${editingId}`, { 
          nome: form.nome,
          codigo: form.codigo,
          capacidade: capacidade,
          tipo: form.tipo || undefined
        })
        setMsg('Aeronave atualizada com sucesso!')
        setEditingId(null)
      } else {
        await api.post('/admin/aircrafts', { 
          nome: form.nome,
          codigo: form.codigo,
          capacidade: capacidade,
          tipo: form.tipo || undefined
        })
        setMsg('Aeronave criada com sucesso!')
      }
      setForm({ nome:'', codigo:'', capacidade:'', tipo:'' }); 
      load()
    } catch(e){ 
      setMsg('Erro ao ' + (editingId ? 'atualizar' : 'criar') + ' aeronave: ' + (e?.response?.data?.error || e.message)) 
    }
  }
  
  function edit(item){
    setForm({
      nome: item.nome,
      codigo: item.codigo,
      capacidade: item.capacidade,
      tipo: item.tipo?._id || ''
    })
    setEditingId(item._id)
    setMsg('')
  }
  
  function cancelEdit(){
    setForm({ nome:'', codigo:'', capacidade:'', tipo:'' })
    setEditingId(null)
    setMsg('')
  }
  async function del(id){
    await api.delete('/admin/aircrafts/'+id); load()
  }

  return (
    <div className="grid">
      <h2>Aeronaves</h2>
      {!!msg && <div className="badge" style={{marginBottom: 12}}>{msg}</div>}
      <div className="card">
        <div className="grid">
          <label>Nome da Aeronave:
            <input placeholder="Ex: Airbus A320" value={form.nome} onChange={e=>setForm(p=>({...p, nome:e.target.value}))}/>
          </label>
          <div className="row">
            <div className="grid" style={{flex:1}}>
              <label>Código da Aeronave:
                <input placeholder="Ex: AC320" value={form.codigo} onChange={e=>setForm(p=>({...p, codigo:e.target.value}))}/>
              </label>
            </div>
            <div className="grid" style={{flex:1}}>
              <label>Capacidade de Passageiros:
                <input type="number" placeholder="Ex: 180" value={form.capacidade} onChange={e=>setForm(p=>({...p, capacidade:e.target.value}))}/>
              </label>
            </div>
          </div>
          <label>Tipo de Aeronave (opcional):
            <select value={form.tipo} onChange={e=>setForm(p=>({...p, tipo:e.target.value}))}>
              <option value="">Selecione um tipo (opcional)</option>
              {types.map(t=>(
                <option key={t._id} value={t._id}>{t.nome}</option>
              ))}
            </select>
          </label>
          <div style={{display:'flex', gap:'0.5rem'}}>
            <button className="btn" onClick={save} disabled={!form.nome||!form.codigo||!form.capacidade}>{editingId ? 'Atualizar Aeronave' : 'Adicionar Aeronave'}</button>
            {editingId && <button className="btn ghost" onClick={cancelEdit}>Cancelar</button>}
          </div>
        </div>
      </div>
      <table className="table">
        <thead><tr><th>Nome</th><th>Código</th><th>Capacidade</th><th>Tipo</th><th></th></tr></thead>
        <tbody>
          {list.map(i=>(
            <tr key={i._id}>
              <td>{i.nome}</td>
              <td>{i.codigo}</td>
              <td>{i.capacidade}</td>
              <td>{i.tipo?.nome || '-'}</td>
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

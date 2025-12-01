import React, { useEffect, useState } from 'react'
import api from '../../services/api'

export default function Employees(){
  const [list, setList] = useState([])
  const [form, setForm] = useState({ 
    nome:'', 
    categoria:'piloto', 
    cargo:'piloto',
    matricula:'',
    dataNascimento:'',
    telefoneCelular:'',
    email:'' 
  })
  const [msg, setMsg] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(()=>{ load() }, [])

  async function load(){ 
    try {
      const { data } = await api.get('/admin/employees'); 
      setList(data) 
    } catch (e) {
      setMsg('Erro ao carregar funcionários: ' + (e.response?.data?.error || e.message))
    }
  }
  async function save(){ 
    try {
      setMsg('') // Limpar mensagem anterior
      // Validar campos obrigatórios
      if (!form.nome || !form.matricula || !form.categoria) {
        setMsg('Preencha nome, matrícula e categoria')
        return
      }
      
      const payload = {
        nome: form.nome,
        nomeCompleto: form.nome,
        categoria: form.categoria,
        matricula: form.matricula,
        dataNascimento: form.dataNascimento ? new Date(form.dataNascimento) : undefined,
        telefoneCelular: form.telefoneCelular || undefined,
        email: form.email || undefined
      }
      
      if (editingId) {
        await api.put(`/admin/employees/${editingId}`, payload)
        setMsg('Funcionário atualizado com sucesso!')
        setEditingId(null)
      } else {
        await api.post('/admin/employees', payload)
        setMsg('Funcionário criado com sucesso!')
      }
      
      setForm({ 
        nome:'', 
        categoria:'piloto', 
        cargo:'piloto',
        matricula:'',
        dataNascimento:'',
        telefoneCelular:'',
        email:'' 
      }); 
      load() 
    } catch (e) {
      setMsg('Erro ao ' + (editingId ? 'atualizar' : 'criar') + ' funcionário: ' + (e.response?.data?.error || e.message))
    }
  }
  
  function edit(item){
    setForm({
      nome: item.nome || item.nomeCompleto,
      categoria: item.categoria || item.cargo,
      cargo: item.cargo || item.categoria,
      matricula: item.matricula,
      dataNascimento: item.dataNascimento ? item.dataNascimento.split('T')[0] : '',
      telefoneCelular: item.telefoneCelular || '',
      email: item.email || ''
    })
    setEditingId(item._id)
    setMsg('')
  }
  
  function cancelEdit(){
    setForm({ 
      nome:'', 
      categoria:'piloto', 
      cargo:'piloto',
      matricula:'',
      dataNascimento:'',
      telefoneCelular:'',
      email:'' 
    })
    setEditingId(null)
    setMsg('')
  }
  async function del(id){ await api.delete('/admin/employees/'+id); load() }

  return (
    <div className="grid">
      <h2>Funcionários</h2>
      {!!msg && <div className="badge" style={{marginBottom: 12}}>{msg}</div>}
      <div className="card">
        <div className="grid">
          <label>Nome completo:
            <input value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Nome completo"/>
          </label>
          <div className="row">
            <div className="grid" style={{flex:1}}>
              <label>Matrícula:
                <input value={form.matricula} onChange={e=>setForm(p=>({...p,matricula:e.target.value}))} placeholder="Matrícula"/>
              </label>
            </div>
            <div className="grid" style={{flex:1}}>
              <label>Categoria:
                <select value={form.categoria} onChange={e=>setForm(p=>({...p,categoria:e.target.value}))}>
                  <option value="piloto">Piloto</option>
                  <option value="co-piloto">Co-piloto</option>
                  <option value="comissario">Comissário</option>
                  <option value="atendente">Atendente</option>
                  <option value="outro">Outro</option>
                </select>
              </label>
            </div>
          </div>
          <div className="row">
            <div className="grid" style={{flex:1}}>
              <label>Data de nascimento:
                <input type="date" value={form.dataNascimento} onChange={e=>setForm(p=>({...p,dataNascimento:e.target.value}))}/>
              </label>
            </div>
            <div className="grid" style={{flex:1}}>
              <label>Telefone celular:
                <input value={form.telefoneCelular} onChange={e=>setForm(p=>({...p,telefoneCelular:e.target.value}))} placeholder="(00) 00000-0000"/>
              </label>
            </div>
          </div>
          <label>Email:
            <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="email@exemplo.com"/>
          </label>
          <div style={{display:'flex', gap:'0.5rem'}}>
            <button className="btn" onClick={save}>{editingId ? 'Atualizar' : 'Adicionar'}</button>
            {editingId && <button className="btn ghost" onClick={cancelEdit}>Cancelar</button>}
          </div>
        </div>
      </div>

      <table className="table">
        <thead><tr><th>Nome</th><th>Matrícula</th><th>Categoria</th><th>Email</th><th>Telefone</th><th></th></tr></thead>
        <tbody>
          {list.map(i=>(
            <tr key={i._id}>
              <td>{i.nome || i.nomeCompleto}</td>
              <td>{i.matricula}</td>
              <td>{i.categoria || i.cargo}</td>
              <td>{i.email || '-'}</td>
              <td>{i.telefoneCelular || '-'}</td>
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

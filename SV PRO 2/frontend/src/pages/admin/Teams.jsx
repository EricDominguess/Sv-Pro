import React, { useEffect, useState } from 'react'
import api from '../../services/api'

export default function Teams(){
  const [list, setList] = useState([])
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ 
    nome:'', 
    descricao:'',
    membros: []
  })
  const [msg, setMsg] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(()=>{ load() }, [])

  async function load(){ 
    try {
      const [teamsRes, employeesRes] = await Promise.all([
        api.get('/admin/teams'),
        api.get('/admin/employees')
      ])
      setList(teamsRes.data)
      setEmployees(employeesRes.data)
    } catch (e) {
      setMsg('Erro ao carregar dados: ' + (e.response?.data?.error || e.message))
    }
  }

  async function save(){ 
    try {
      setMsg('')
      if (!form.nome) {
        setMsg('Preencha o nome da equipe')
        return
      }
      
      if (editingId) {
        await api.put(`/admin/teams/${editingId}`, form)
        setMsg('Equipe atualizada com sucesso!')
        setEditingId(null)
      } else {
        await api.post('/admin/teams', form)
        setMsg('Equipe criada com sucesso!')
      }
      
      setForm({ nome:'', descricao:'', membros: [] })
      load()
    } catch (e) {
      setMsg('Erro ao ' + (editingId ? 'atualizar' : 'criar') + ' equipe: ' + (e.response?.data?.error || e.message))
    }
  }
  
  function edit(team){
    setForm({
      nome: team.nome,
      descricao: team.descricao || '',
      membros: team.membros?.map(m => m._id) || []
    })
    setEditingId(team._id)
    setMsg('')
  }
  
  function cancelEdit(){
    setForm({ nome:'', descricao:'', membros: [] })
    setEditingId(null)
    setMsg('')
  }

  async function del(id){ 
    try {
      await api.delete('/admin/teams/'+id)
      load()
    } catch (e) {
      setMsg('Erro ao excluir equipe: ' + (e.response?.data?.error || e.message))
    }
  }

  function toggleMembro(membroId) {
    setForm(prev => {
      const jaExiste = prev.membros.includes(membroId)
      if (jaExiste) {
        return { ...prev, membros: prev.membros.filter(id => id !== membroId) }
      } else {
        return { ...prev, membros: [...prev.membros, membroId] }
      }
    })
  }

  return (
    <div className="grid">
      <h2>Equipes</h2>
      {!!msg && <div className="badge" style={{marginBottom: 12}}>{msg}</div>}
      
      <div className="card">
        <h3>Nova Equipe</h3>
        <div className="grid">
          <label>Nome da equipe:
            <input value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Ex: Equipe Alpha"/>
          </label>
          <label>Descrição:
            <input value={form.descricao} onChange={e=>setForm(p=>({...p,descricao:e.target.value}))} placeholder="Descrição da equipe"/>
          </label>
          
          <label>Membros:</label>
          <div style={{display: 'grid', gap: 8, maxHeight: 200, overflow: 'auto', padding: 8, border: '1px solid #374151', borderRadius: 4}}>
            {employees.map(emp => (
              <label key={emp._id} style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'}}>
                <input
                  type="checkbox"
                  checked={form.membros.includes(emp._id)}
                  onChange={() => toggleMembro(emp._id)}
                />
                <span>{emp.nome || emp.nomeCompleto} - {emp.categoria}</span>
              </label>
            ))}
          </div>
          
          <div style={{display:'flex', gap:'0.5rem'}}>
            <button className="btn" onClick={save}>{editingId ? 'Atualizar Equipe' : 'Adicionar Equipe'}</button>
            {editingId && <button className="btn ghost" onClick={cancelEdit}>Cancelar</button>}
          </div>
        </div>
      </div>

      <h3>Equipes Cadastradas</h3>
      <div style={{display: 'grid', gap: 12}}>
        {list.map(team => (
          <div key={team._id} className="card">
            <div className="row" style={{justifyContent: 'space-between', alignItems: 'start'}}>
              <div style={{flex: 1}}>
                <h4 style={{margin: 0, marginBottom: 8}}>{team.nome}</h4>
                {team.descricao && <p style={{margin: 0, marginBottom: 8, color: '#9ca3af'}}>{team.descricao}</p>}
                <div style={{marginTop: 8}}>
                  <strong>Membros ({team.membros?.length || 0}):</strong>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6}}>
                    {team.membros?.length > 0 ? (
                      team.membros.map(membro => (
                        <span key={membro._id} className="badge" style={{background: '#3b82f6', color: 'white'}}>
                          {membro.nome || membro.nomeCompleto} ({membro.categoria})
                        </span>
                      ))
                    ) : (
                      <span style={{color: '#6b7280', fontSize: '0.9em'}}>Nenhum membro</span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{display:'flex', gap:'0.5rem'}}>
                <button className="btn ghost" onClick={()=>edit(team)}>Editar</button>
                <button className="btn ghost" onClick={()=>del(team._id)}>Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

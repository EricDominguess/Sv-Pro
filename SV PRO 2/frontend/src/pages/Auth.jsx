import React, { useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/Auth'

export default function Auth(){
  const [tab, setTab] = useState('login')
  return (
    <div style={{minHeight:'100vh', display:'grid', placeItems:'center'}}>
      <div className="card" style={{width: 600}}>
        <h1 style={{textAlign:'center'}}>SV — Sistema de Voos</h1>
        <div className="row" style={{justifyContent:'center', margin:'12px 0 16px'}}>
          <button className={tab==='login'?'btn':'btn ghost'} onClick={()=>setTab('login')}>Entrar</button>
          <button className={tab==='register'?'btn':'btn ghost'} onClick={()=>setTab('register')}>Criar conta</button>
        </div>
        {tab==='login' ? <LoginForm/> : <RegisterForm onSwitch={()=>setTab('login')} />}
      </div>
    </div>
  )
}

function LoginForm(){
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [msg, setMsg] = useState('')

  async function handleLogin(e){
    e.preventDefault()
    try {
      const { data } = await api.post('/auth/login', { email, senha })
      login({ token: data.token, role: data.role, nome: data.nome })
    } catch (e) {
      setMsg('Falha no login. Verifique suas credenciais.')
    }
  }

  return (
    <form onSubmit={handleLogin} className="grid">
      <div className="grid"><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" /></div>
      <div className="grid"><label>Senha</label><input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="********" /></div>
      <button className="btn">Entrar</button>
      {!!msg && <div style={{color:'salmon'}}>{msg}</div>}
    </form>
  )
}

function RegisterForm({ onSwitch }){
  const [tipo, setTipo] = useState('passageiro')
  const [formCli, setFormCli] = useState({
    role:'passageiro', nome:'', email:'', senha:'',
    telefones:[''], endereco:{ logradouro:'', cidade:'', estado:'', pais:'', cep:'' },
    dataNascimento:'', tipoDocumento:'cpf', cpf:'', rg:{ numero:'', dataEmissao:'' }
  })

  function formatCPF(value) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return value
  }

  function formatCEP(value) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d)/, '$1-$2')
    }
    return value
  }

  const [formMan, setFormMan] = useState({ role:'mantenedor', nome:'', email:'', senha:'', matricula:'', cargo:'' })
  const [msg, setMsg] = useState('')

  async function handleSubmit(e){
    e.preventDefault()
    try {
      const body = tipo==='passageiro' ? formCli : formMan
      await api.post('/auth/register', body)
      setMsg('Conta criada! Agora faça login.')
      if (onSwitch) setTimeout(onSwitch, 700)
    } catch (e) {
      setMsg('Falha no cadastro (e-mail já utilizado?)')
    }
  }

  return (
    <div className="grid">
      <div className="row" style={{gap:10}}>
        <label className="badge">Tipo de Cadastro</label>
        <select value={tipo} onChange={e=>setTipo(e.target.value)}>
          <option value="passageiro">Cliente</option>
          <option value="mantenedor">Mantenedor</option>
        </select>
      </div>

      {tipo==='passageiro' ? (
        <form onSubmit={handleSubmit} className="grid">
          <div className="row">
            <div className="grid" style={{flex:1}}><label>Nome</label><input value={formCli.nome} onChange={e=>setFormCli(p=>({...p,nome:e.target.value}))}/></div>
            <div className="grid" style={{flex:1}}><label>Email</label><input value={formCli.email} onChange={e=>setFormCli(p=>({...p,email:e.target.value}))}/></div>
          </div>
          <div className="grid"><label>Senha</label><input type="password" value={formCli.senha} onChange={e=>setFormCli(p=>({...p,senha:e.target.value}))}/></div>
          <div className="row">
            <div className="grid" style={{flex:2}}><label>Endereço (logradouro)</label><input value={formCli.endereco.logradouro} onChange={e=>setFormCli(p=>({...p,endereco:{...p.endereco, logradouro:e.target.value}}))}/></div>
            <div className="grid" style={{flex:1}}><label>Cidade</label><input value={formCli.endereco.cidade} onChange={e=>setFormCli(p=>({...p,endereco:{...p.endereco, cidade:e.target.value}}))}/></div>
            <div className="grid" style={{flex:1}}><label>Estado</label><input value={formCli.endereco.estado} onChange={e=>setFormCli(p=>({...p,endereco:{...p.endereco, estado:e.target.value}}))}/></div>
          </div>
          <div className="row">
            <div className="grid" style={{flex:1}}><label>Pais</label><input value={formCli.endereco.pais} onChange={e=>setFormCli(p=>({...p,endereco:{...p.endereco, pais:e.target.value}}))}/></div>
            <div className="grid" style={{flex:1}}>
              <label>CEP</label>
              <input 
                value={formCli.endereco.cep} 
                onChange={e=>setFormCli(p=>({...p,endereco:{...p.endereco, cep:formatCEP(e.target.value)}}))}
                placeholder="00000-000"
                maxLength="9"
              />
            </div>
          </div>
          <div className="row">
            <div className="grid" style={{flex:1}}><label>Telefone</label><input value={formCli.telefones[0]} onChange={e=>setFormCli(p=>({...p,telefones:[e.target.value]}))}/></div>
            <div className="grid" style={{flex:1}}><label>Data de nascimento</label><input type="date" value={formCli.dataNascimento} onChange={e=>setFormCli(p=>({...p,dataNascimento:e.target.value}))}/></div>
          </div>
          <div className="row">
            <div className="grid" style={{flex:1}}>
              <label>Tipo de Documento</label>
              <select value={formCli.tipoDocumento} onChange={e=>setFormCli(p=>({...p,tipoDocumento:e.target.value}))}>
                <option value="cpf">CPF</option>
                <option value="rg">RG</option>
              </select>
            </div>
            {formCli.tipoDocumento === 'cpf' ? (
              <div className="grid" style={{flex:2}}>
                <label>CPF</label>
                <input 
                  value={formCli.cpf} 
                  onChange={e=>setFormCli(p=>({...p,cpf:formatCPF(e.target.value)}))}
                  placeholder="000.000.000-00"
                  maxLength="14"
                />
              </div>
            ) : (
              <>
                <div className="grid" style={{flex:1}}>
                  <label>RG</label>
                  <input value={formCli.rg.numero} onChange={e=>setFormCli(p=>({...p,rg:{...p.rg,numero:e.target.value}}))}/>
                </div>
                <div className="grid" style={{flex:1}}>
                  <label>Data de emissão</label>
                  <input type="date" value={formCli.rg.dataEmissao} onChange={e=>setFormCli(p=>({...p,rg:{...p.rg,dataEmissao:e.target.value}}))}/>
                </div>
              </>
            )}
          </div>
          <button className="btn">Criar conta</button>
          {!!msg && <div style={{color:'lightgreen'}}>{msg}</div>}
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="grid">
          <div className="row">
            <div className="grid" style={{flex:1}}><label>Nome</label><input value={formMan.nome} onChange={e=>setFormMan(p=>({...p,nome:e.target.value}))}/></div>
            <div className="grid" style={{flex:1}}><label>Email</label><input value={formMan.email} onChange={e=>setFormMan(p=>({...p,email:e.target.value}))}/></div>
          </div>
          <div className="row">
            <div className="grid" style={{flex:1}}><label>Matrícula</label><input value={formMan.matricula} onChange={e=>setFormMan(p=>({...p,matricula:e.target.value}))}/></div>
            <div className="grid" style={{flex:1}}><label>Cargo</label><input value={formMan.cargo} onChange={e=>setFormMan(p=>({...p,cargo:e.target.value}))}/></div>
          </div>
          <div className="grid"><label>Senha</label><input type="password" value={formMan.senha} onChange={e=>setFormMan(p=>({...p,senha:e.target.value}))}/></div>
          <button className="btn">Criar conta</button>
          {!!msg && <div style={{color:'lightgreen'}}>{msg}</div>}
        </form>
      )}
    </div>
  )
}

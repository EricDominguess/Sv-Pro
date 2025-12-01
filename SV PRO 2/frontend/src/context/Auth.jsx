import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../services/api'

const Ctx = createContext(null)
export function AuthProvider({ children }){
  const nav = useNavigate()
  const [token, setTok] = useState(()=>localStorage.getItem('token'))
  const [user, setUser] = useState(()=>{
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(()=>{ if(token){ localStorage.setItem('token',token); setToken(token) } else { localStorage.removeItem('token'); setToken(null) } },[token])
  useEffect(()=>{ if(user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user') },[user])

  function login({ token, role, nome }){ setTok(token); setUser({ role, nome }); nav('/dashboard', { replace: true }) }
  function logout(){ setTok(null); setUser(null); nav('/auth', { replace: true }) }

  const value = useMemo(()=>({ token, user, login, logout }),[token,user])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useAuth(){ return useContext(Ctx) }

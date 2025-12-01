import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/Auth'

export default function DashboardLayout(){
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'mantenedor'
  return (
    <div style={{display:'grid', gridTemplateColumns:'260px 1fr', minHeight:'100vh'}}>
      <aside className="sidebar" style={{background:'#0f172a', padding:16}}>
        <div style={{fontWeight:800, marginBottom:8}}>SV — Dashboard</div>
        <div style={{fontSize:12, color:'#9fb0c8', marginBottom:16}}>Bem-vindo, {user?.nome}</div>
        {!isAdmin ? (
          <nav className="grid">
            <Link to="/dashboard/flights">Voos</Link>
            <Link to="/dashboard/reservations">Minhas Reservas</Link>
            <button className="btn ghost" onClick={logout}>Sair</button>
          </nav>
        ) : (
          <nav className="grid">
            <Link to="/dashboard/admin/overview">Visão Geral</Link>
            <Link to="/dashboard/admin/search">Buscar Voos</Link>
            <Link to="/dashboard/reservations">Minhas Reservas</Link>
            <Link to="/dashboard/admin/new-flight">Incluir Novo Voo</Link>
            <Link to="/dashboard/admin/aircraft-types">Tipos de Aeronave</Link>
            <Link to="/dashboard/admin/aircrafts">Aeronaves</Link>
            <Link to="/dashboard/admin/employees">Funcionários</Link>
            <Link to="/dashboard/admin/teams">Equipes</Link>
            <Link to="/dashboard/admin/reports">Relatórios</Link>
            <button className="btn ghost" onClick={logout}>Sair</button>
          </nav>
        )}
      </aside>
      <main style={{padding:20}}>
        <Outlet/>
      </main>
    </div>
  )
}

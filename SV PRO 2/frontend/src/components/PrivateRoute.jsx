import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'
export default function PrivateRoute({ children }){
  const { token } = useAuth()
  if(!token) return <Navigate to="/auth" replace />
  return children
}

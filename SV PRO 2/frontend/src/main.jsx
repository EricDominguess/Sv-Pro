import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/Auth'
import PrivateRoute from './components/PrivateRoute'

import Auth from './pages/Auth'
import DashboardLayout from './pages/Dashboard'
import Flights from './pages/Flights'
import FlightDetails from './pages/FlightDetails'
import Checkout from './pages/Checkout'
import MyReservations from './pages/MyReservations'
import Admin from './pages/Admin'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Auth />} />

        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="flights" replace />} />
          <Route path="flights" element={<Flights />} />
          <Route path="flights/:id" element={<FlightDetails />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="reservations" element={<MyReservations />} />
          <Route path="admin/*" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
)

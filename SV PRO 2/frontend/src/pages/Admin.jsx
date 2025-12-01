import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminOverview from './admin/Overview'
import AdminSearch from './admin/Search'
import AdminNewFlight from './admin/NewFlight'
import AdminEditFlight from './admin/EditFlight'
import Reports from './admin/Reports'

import AircraftTypes from './admin/AircraftTypes'
import Aircrafts from './admin/Aircrafts'
import Employees from './admin/Employees'
import Teams from './admin/Teams'

export default function Admin(){
  return (
    <Routes>
      <Route index element={<Navigate to="overview" replace />} />
      <Route path="overview" element={<AdminOverview/>} />
      <Route path="search" element={<AdminSearch/>} />
      <Route path="new-flight" element={<AdminNewFlight/>} />
      <Route path="edit-flight/:id" element={<AdminEditFlight/>} />
      <Route path="reports" element={<Reports/>} />
      <Route path="aircraft-types" element={<AircraftTypes/>} />
      <Route path="aircrafts" element={<Aircrafts/>} />
      <Route path="employees" element={<Employees/>} />
      <Route path="teams" element={<Teams/>} />
    </Routes>
  )
}

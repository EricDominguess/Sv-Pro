import axios from 'axios'
const api = axios.create({ baseURL: 'http://localhost:4000/api' })
export function setToken(t){ if(t) api.defaults.headers.common['Authorization']='Bearer '+t; else delete api.defaults.headers.common['Authorization'] }
const boot = typeof window !== 'undefined' ? localStorage.getItem('token') : null
if (boot) setToken(boot)
export default api

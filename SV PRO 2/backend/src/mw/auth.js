import jwt from 'jsonwebtoken'
export function ensureAuth(req,res,next){
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return res.status(401).json({error:'no token'})
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET || 'supersecret')
    req.user = data
    next()
  } catch(e){ return res.status(401).json({error:'invalid token'}) }
}
export function ensureAdmin(req,res,next){
  if (req.user?.role !== 'mantenedor') return res.status(403).json({ error:'forbidden' })
  next()
}

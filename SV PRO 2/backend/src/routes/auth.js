import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
const router = Router()

router.post('/register', async (req,res)=>{
  const { role='passageiro', nome, email, senha, ...rest } = req.body
  const exists = await User.findOne({ email })
  if (exists) return res.status(409).json({ error:'Email em uso' })
  const senhaHash = await bcrypt.hash(senha || '123456', 10)
  const user = await User.create({ role, nome, email, senhaHash, ...rest })
  res.json({ ok:true, id:user._id })
})

router.post('/login', async (req,res)=>{
  const { email, senha } = req.body
  const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ error:'invalid' })
  const ok = await user.checkPassword(senha || '')
  if (!ok) return res.status(401).json({ error:'invalid' })
  const token = jwt.sign({ id:user._id.toString(), role:user.role, nome:user.nome }, process.env.JWT_SECRET || 'supersecret', { expiresIn:'7d' })
  res.json({ token, role:user.role, nome:user.nome })
})

export default router

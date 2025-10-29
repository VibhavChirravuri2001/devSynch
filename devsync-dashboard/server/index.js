import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
app.use(cors())
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, { path: '/socket.io', cors: { origin: '*' } })

const PORT = 4000
const JWT_SECRET = process.env.JWT_SECRET || 'devsync-demo-secret'

// in-memory data
const users = [{ id: 1, email: 'demo@devsync.app', password: 'demo', name: 'Demo User' }]
let events = [
  { repo: 'org/api', author: 'alice', message: 'Fix null pointer in auth', ts: Date.now()-5000 },
  { repo: 'org/web', author: 'bob', message: 'Add metrics widget', ts: Date.now()-3000 },
]

function auth(req,res,next){
  const hdr = req.headers.authorization || ''
  const token = hdr.split(' ')[1]
  try {
    const dec = jwt.verify(token, JWT_SECRET)
    req.user = dec
    next()
  } catch(e){
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

app.post('/api/login', (req, res) => {
  const { email, password } = req.body
  const u = users.find(x => x.email === email && x.password === password)
  if(!u) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ id: u.id, email: u.email, name: u.name }, JWT_SECRET, { expiresIn: '2h' })
  res.json({ token, user: { id: u.id, name: u.name, email: u.email } })
})

app.get('/api/events', auth, (req,res) => {
  res.json({ events: events.slice().reverse() })
})

// Emit fake commit events every 2s
setInterval(() => {
  const sample = [
    { repo: 'org/api', author: 'alice', message: 'Refactor routes' },
    { repo: 'org/web', author: 'bob', message: 'Improve accessibility' },
    { repo: 'org/devops', author: 'cara', message: 'Bump node version' }
  ]
  const evt = { ...sample[Math.floor(Math.random()*sample.length)], ts: Date.now() }
  events.push(evt)
  events = events.slice(-100)
  io.emit('commit', evt)
}, 2000)

httpServer.listen(PORT, () => {
  console.log('DevSync server listening on http://localhost:'+PORT)
})

import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'

const socket = io('/', { path: '/socket.io' })

export default function App(){
  const [token, setToken] = useState(null)
  const [events, setEvents] = useState([])
  const [user, setUser] = useState(null)

  useEffect(() => {
    socket.on('commit', (evt) => {
      setEvents(prev => [evt, ...prev].slice(0, 50))
    })
    return () => socket.off('commit')
  }, [])

  async function login(){
    const res = await axios.post('/api/login', { email: 'demo@devsync.app', password: 'demo' })
    setToken(res.data.token)
    setUser(res.data.user)
  }

  async function loadEvents(){
    const res = await axios.get('/api/events', { headers: { Authorization: `Bearer ${token}` } })
    setEvents(res.data.events)
  }

  return (
    <div style={{maxWidth: 900, margin: '2rem auto', fontFamily: 'Inter, system-ui, sans-serif'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1>DevSync Dashboard</h1>
        {!token ? <button onClick={login}>Demo Login</button> : <span>Signed in as {user?.name}</span>}
      </header>

      <section style={{marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
        <div style={{padding:'1rem', border:'1px solid #ddd', borderRadius: 12}}>
          <h3>Live Commits</h3>
          <p style={{marginTop: 0, opacity:.8}}>Incoming Socket.io stream (mocked)</p>
          <ul>
            {events.map((e, i) => (
              <li key={i}>
                <code>{e.repo}</code> — <strong>{e.author}</strong>: {e.message} <em>({new Date(e.ts).toLocaleTimeString()})</em>
              </li>
            ))}
          </ul>
        </div>
        <div style={{padding:'1rem', border:'1px solid #ddd', borderRadius: 12}}>
          <h3>Controls</h3>
          <button onClick={loadEvents} disabled={!token}>Load Recent Events (REST)</button>
          {!token && <p style={{opacity:.7}}>Login first (demo creds auto-filled)</p>}
        </div>
      </section>

      <footer style={{marginTop: '2rem', opacity:.7}}>
        <p>Tip: Run <code>npm run start</code> to boot both client and server. No DB required (in-memory mocks).</p>
      </footer>
    </div>
  )
}

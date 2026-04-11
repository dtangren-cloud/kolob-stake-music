import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function AdminLogin() {
  const { loginAdmin, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  if (isAdmin) { navigate('/admin'); return null }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (loginAdmin(pw)) navigate('/admin')
    else { setErr('Incorrect password.'); setPw('') }
  }

  return (
    <div className="page-sm" style={{ paddingTop:'5rem' }}>
      <div className="card" style={{ padding:'2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>♩</div>
          <h1 style={{ fontSize:26, marginBottom:6 }}>Admin access</h1>
          <p style={{ color:'var(--ink-md)', fontSize:14 }}>Enter the admin password to manage the library.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setErr('') }}
              autoFocus
              required
            />
          </div>
          {err && <div style={{ color:'var(--red)', fontSize:13, marginBottom:'1rem' }}>{err}</div>}
          <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}>
            Sign in
          </button>
        </form>
      </div>
      <p style={{ textAlign:'center', marginTop:'1rem', fontSize:12, color:'var(--ink-lt)' }}>
        Password is set in your .env.local file (VITE_ADMIN_PASSWORD)
      </p>
    </div>
  )
}

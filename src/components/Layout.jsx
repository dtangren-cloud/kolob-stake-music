import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function Layout() {
  const { isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <header style={{
        background:'#fff', borderBottom:'1px solid var(--bd)',
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{
          maxWidth:1200, margin:'0 auto', padding:'0 2rem',
          height:58, display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <NavLink to="/" style={{ display:'flex', alignItems:'baseline', gap:10 }}>
            <span style={{ fontFamily:'Lora,serif', fontSize:22, color:'var(--gold)' }}>♩</span>
            <span style={{ fontFamily:'Lora,serif', fontSize:18, fontWeight:600, color:'var(--ink)' }}>
              Stake Music Library
            </span>
          </NavLink>
          <nav style={{ display:'flex', alignItems:'center', gap:2 }}>
            <NavLink to="/" end style={navLinkStyle}>Browse</NavLink>
            <NavLink to="/checkout" style={navLinkStyle}>Checkout</NavLink>
            {isAdmin
              ? <>
                  <NavLink to="/admin" style={navLinkStyle}>Admin</NavLink>
                  <button
                    onClick={() => { logout(); navigate('/') }}
                    style={{ marginLeft:8, padding:'5px 12px', borderRadius:'var(--r)',
                      fontSize:12, background:'transparent', border:'1px solid var(--bd-dk)',
                      color:'var(--ink-md)', cursor:'pointer' }}
                  >Sign out</button>
                </>
              : <NavLink to="/admin/login" style={navLinkStyle}>Admin</NavLink>
            }
          </nav>
        </div>
      </header>

      <main style={{ flex:1 }}>
        <Outlet />
      </main>

      <footer style={{ borderTop:'1px solid var(--bd)', padding:'1.25rem 2rem' }}>
        <div style={{
          maxWidth:1200, margin:'0 auto',
          display:'flex', justifyContent:'space-between',
          fontSize:12, color:'var(--ink-lt)',
        }}>
          <span>Stake Music Library</span>
          <span>Physical checkout only · Contact your stake music chair with questions</span>
        </div>
      </footer>
    </div>
  )
}

const navLinkStyle = ({ isActive }) => ({
  padding:'5px 13px', borderRadius:'var(--r)', fontSize:13,
  fontWeight: isActive ? 500 : 400,
  color: isActive ? 'var(--gold)' : 'var(--ink-md)',
  background: isActive ? 'var(--gold-bg)' : 'transparent',
  transition:'all .12s',
})

import { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext(null)
const KEY = 'sml_role'

export function AuthProvider({ children }) {
  const [role, setRole] = useState('public')

  useEffect(() => {
    const s = sessionStorage.getItem(KEY)
    if (s === 'admin') setRole('admin')
  }, [])

  const loginAdmin = (pw) => {
    const correct = import.meta.env.VITE_ADMIN_PASSWORD || 'changeme123'
    if (pw === correct) {
      setRole('admin')
      sessionStorage.setItem(KEY, 'admin')
      return true
    }
    return false
  }

  const logout = () => {
    setRole('public')
    sessionStorage.removeItem(KEY)
  }

  return (
    <Ctx.Provider value={{ isAdmin: role === 'admin', loginAdmin, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)

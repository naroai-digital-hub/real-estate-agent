import { useEffect, useState } from 'react'
import Home from './pages/Home'
import AdminApp from './admin/AdminApp'

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash.slice(1) || '/')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash.slice(1) || '/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const route = useHashRoute()
  if (route === '/admin' || route.startsWith('/admin/')) {
    return <AdminApp route={route} />
  }
  return <Home />
}

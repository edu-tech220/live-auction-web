import { LogIn, UserPlus, Zap } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Solo rutas internas: evita "open redirect" hacia otro sitio.
  const from = typeof location.state?.from === 'string' && location.state.from.startsWith('/') ? location.state.from : '/'

  const [form, setForm] = useState({ displayName: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={from} replace />

  const isRegister = mode === 'register'
  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const u = isRegister
        ? await register(form.email.trim(), form.displayName.trim(), form.password)
        : await login(form.email.trim(), form.password)
      toast.success(`¡Hola, ${u.displayName}!`)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo completar la operación.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-5xl items-center gap-10 lg:grid-cols-2">
      <section className="hidden space-y-5 lg:block">
        <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-gold to-gold-2 text-ink shadow-xl shadow-gold/30">
          <Zap className="size-7" fill="currentColor" />
        </span>
        <h1 className="text-4xl font-black leading-tight tracking-tight">Cada segundo cuenta.<br />Cada oferta, en vivo.</h1>
        <p className="text-muted">Mira el precio subir en tiempo real, recibe aviso si te superan y entérate al instante de quién ganó.</p>
      </section>

      <form onSubmit={submit} noValidate className="card w-full space-y-4 p-7">
        <div>
          <h2 className="text-2xl font-extrabold">{isRegister ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}</h2>
          <p className="text-sm text-muted">{isRegister ? 'Empieza a pujar en menos de un minuto.' : 'Inicia sesión para pujar.'}</p>
        </div>

        {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

        {isRegister && (
          <div>
            <label className="label" htmlFor="displayName">Nombre visible</label>
            <input id="displayName" className="input" autoComplete="nickname" maxLength={60} value={form.displayName} onChange={set('displayName')} required />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Correo</label>
          <input id="email" type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input id="password" type="password" className="input" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} required />
          {isRegister && <p className="mt-1.5 text-xs text-muted">Mínimo 8 caracteres, con al menos una letra y un número.</p>}
        </div>

        <button type="submit" className="btn btn-gold w-full py-3" disabled={busy}>
          {isRegister ? <UserPlus className="size-4" /> : <LogIn className="size-4" />}
          {busy ? 'Un momento…' : isRegister ? 'Crear cuenta' : 'Entrar'}
        </button>

        <p className="text-center text-sm text-muted">
          {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
          <Link to={isRegister ? '/login' : '/register'} state={location.state} className="font-semibold text-gold hover:underline">
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </Link>
        </p>
      </form>
    </div>
  )
}

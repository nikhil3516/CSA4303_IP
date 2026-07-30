import { useState } from 'react'
import { useApp } from '../context'
import type { User } from '../types'

export default function Auth() {
  const { login, setPage, users, setUsers } = useApp()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    rollNumber: '', department: '', year: '', semester: '', phone: '',
  })
  const [error, setError] = useState('')

  const inputCls = "w-full px-4 py-2.5 bg-surface2 border border-border rounded-lg text-ink placeholder:text-muted text-sm focus:outline-none focus:border-gold transition-colors"
  const labelCls = "block text-xs font-mono text-muted uppercase tracking-wide mb-1.5"

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!login(loginForm.email, loginForm.password)) {
      setError('Invalid email or password.')
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (regForm.password !== regForm.confirmPassword) {
      setError("Passwords don't match.")
      return
    }
    if (users.some(u => u.email === regForm.email)) {
      setError('An account with this email already exists.')
      return
    }
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: regForm.name,
      email: regForm.email,
      password: regForm.password,
      role: 'user',
      rollNumber: regForm.rollNumber || undefined,
      department: regForm.department || undefined,
      year: regForm.year ? parseInt(regForm.year) : undefined,
      semester: regForm.semester ? parseInt(regForm.semester) : undefined,
      phone: regForm.phone || undefined,
      joinDate: new Date().toISOString().split('T')[0],
    }
    setUsers([...users, newUser])
    login(regForm.email, regForm.password)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-bg text-xl font-bold font-display">L</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">LibraryOS</h1>
          <p className="text-muted text-sm mt-1">College Library Management System</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          {/* Mode tabs */}
          <div className="flex rounded-lg bg-surface2 p-1 mb-6">
            {(['login', 'register'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === tab ? 'bg-gold text-bg' : 'text-muted hover:text-ink'
                }`}
              >
                {tab === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" placeholder="your@email.edu" required
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <input type="password" placeholder="••••••••" required
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  className={inputCls} />
              </div>
              <button type="submit"
                className="w-full py-2.5 bg-gold text-bg font-semibold rounded-lg hover:bg-gold-dim transition-colors text-sm">
                Sign In
              </button>

              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted text-center mb-3">Quick fill demo accounts:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={() => setLoginForm({ email: 'admin@library.edu', password: 'admin123' })}
                    className="px-3 py-2 bg-surface2 border border-border rounded-lg text-xs text-muted hover:text-gold hover:border-gold/30 transition-colors text-left">
                    <div className="font-semibold text-gold/80 mb-0.5">Admin</div>
                    <div className="font-mono opacity-70">admin@library.edu</div>
                  </button>
                  <button type="button"
                    onClick={() => setLoginForm({ email: 'arjun@student.edu', password: 'student123' })}
                    className="px-3 py-2 bg-surface2 border border-border rounded-lg text-xs text-muted hover:text-info hover:border-info/30 transition-colors text-left">
                    <div className="font-semibold text-info/80 mb-0.5">Student</div>
                    <div className="font-mono opacity-70">arjun@student.edu</div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" placeholder="Arjun Mehta" required
                  value={regForm.name}
                  onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" placeholder="your@email.edu" required
                    value={regForm.email}
                    onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="tel" placeholder="+91 98765 43210"
                    value={regForm.phone}
                    onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Roll Number</label>
                <input type="text" placeholder="CS21001"
                  value={regForm.rollNumber}
                  onChange={e => setRegForm(f => ({ ...f, rollNumber: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Department</label>
                <select value={regForm.department} onChange={e => setRegForm(f => ({ ...f, department: e.target.value }))} className={inputCls}>
                  <option value="">Select department</option>
                  {['Computer Science','Electronics','Mechanical','Civil Engineering','Electrical','Chemical','Information Technology'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Year</label>
                  <select value={regForm.year} onChange={e => setRegForm(f => ({ ...f, year: e.target.value }))} className={inputCls}>
                    <option value="">Year</option>
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Semester</label>
                  <select value={regForm.semester} onChange={e => setRegForm(f => ({ ...f, semester: e.target.value }))} className={inputCls}>
                    <option value="">Semester</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <input type="password" placeholder="••••••••" required
                  value={regForm.password}
                  onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <input type="password" placeholder="••••••••" required
                  value={regForm.confirmPassword}
                  onChange={e => setRegForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className={inputCls} />
              </div>
              <button type="submit"
                className="w-full py-2.5 bg-gold text-bg font-semibold rounded-lg hover:bg-gold-dim transition-colors text-sm mt-1">
                Create Account
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          <button onClick={() => setPage('landing')} className="hover:text-ink transition-colors">
            ← Back to home
          </button>
        </p>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import { useApp } from '../context'
import type { Book } from '../types'

// ─── Book Search ─────────────────────────────────────────────────────────────

function BookSearch() {
  const { books } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [onlyAvail, setOnlyAvail] = useState(false)
  const [selected, setSelected] = useState<Book | null>(null)

  const categories = useMemo(() =>
    ['All', ...Array.from(new Set(books.map(b => b.category))).sort()],
    [books]
  )

  const filtered = useMemo(() => books.filter(b => {
    const q = query.toLowerCase()
    const mQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q)
    const mC = category === 'All' || b.category === category
    const mA = !onlyAvail || b.availableCopies > 0
    return mQ && mC && mA
  }), [books, query, category, onlyAvail])

  if (selected) {
    return (
      <div>
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-muted hover:text-ink text-sm mb-6 transition-colors">
          ← Back to search
        </button>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="h-2" style={{ background: selected.coverAccent }} />
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-28 h-36 rounded-lg shrink-0 flex items-center justify-center text-5xl"
                style={{ background: selected.coverAccent }}>
                📖
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-ink mb-1">{selected.title}</h2>
                    <p className="text-muted text-sm">{selected.author}</p>
                  </div>
                  <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono font-medium border ${
                    selected.availableCopies > 0
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-danger/10 text-danger border-danger/20'
                  }`}>
                    {selected.availableCopies > 0 ? `${selected.availableCopies} / ${selected.totalCopies} available` : 'All copies issued'}
                  </span>
                </div>
                <p className="text-sm text-ink/75 leading-relaxed mb-6">{selected.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {[
                    ['ISBN', selected.isbn],
                    ['Category', selected.category],
                    ['Publisher', selected.publisher],
                    ['Year', selected.publishYear.toString()],
                    ['Shelf Location', selected.location],
                    ['Total Copies', selected.totalCopies.toString()],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs font-mono text-muted uppercase tracking-wide mb-0.5">{k}</div>
                      <div className="text-sm text-ink">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-6">Search Books</h2>

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by title, author, or ISBN…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 min-w-56 px-4 py-2.5 bg-surface border border-border rounded-lg text-ink placeholder:text-muted text-sm focus:outline-none focus:border-gold transition-colors"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors"
        >
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-muted cursor-pointer hover:border-gold/30 transition-colors select-none">
          <input type="checkbox" checked={onlyAvail} onChange={e => setOnlyAvail(e.target.checked)} className="accent-gold w-3.5 h-3.5" />
          Available only
        </label>
      </div>

      <p className="text-xs text-muted font-mono mb-4">{filtered.length} books found</p>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(book => (
          <div key={book.id} onClick={() => setSelected(book)}
            className="bg-surface border border-border rounded-lg overflow-hidden hover:border-gold/40 transition-colors cursor-pointer group">
            <div className="h-1" style={{ background: book.coverAccent }} />
            <div className="p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="text-sm font-semibold text-ink group-hover:text-gold transition-colors leading-tight flex-1">
                  {book.title}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-mono ${
                  book.availableCopies > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                  {book.availableCopies > 0 ? `${book.availableCopies} avail.` : 'Issued'}
                </span>
              </div>
              <p className="text-xs text-muted mb-3">{book.author}</p>
              <div className="flex items-center justify-between text-xs font-mono text-muted/60">
                <span>{book.category}</span>
                <span>{book.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm">No books match your search.</p>
        </div>
      )}
    </div>
  )
}

// ─── Borrow History ───────────────────────────────────────────────────────────

function BorrowHistory() {
  const { currentUser, borrows, books } = useApp()
  const myBorrows = borrows
    .filter(b => b.userId === currentUser?.id)
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())

  const statusStyle: Record<string, string> = {
    active: 'bg-info/10 text-info border-info/20',
    returned: 'bg-success/10 text-success border-success/20',
    overdue: 'bg-danger/10 text-danger border-danger/20',
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-6">My Borrow History</h2>

      {myBorrows.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-sm">You haven't borrowed any books yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myBorrows.map(borrow => {
            const book = books.find(b => b.id === borrow.bookId)
            return (
              <div key={borrow.id} className="p-5 bg-surface border border-border rounded-lg">
                <div className="flex items-start gap-4 justify-between">
                  <div className="flex gap-4 items-start flex-1 min-w-0">
                    <div className="w-10 h-12 rounded shrink-0" style={{ background: book?.coverAccent || '#333' }} />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink truncate">{book?.title || 'Unknown Book'}</h3>
                      <p className="text-xs text-muted mb-2">{book?.author}</p>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono text-muted">
                        <span>Issued: <span className="text-ink">{borrow.issueDate}</span></span>
                        <span>Due: <span className={borrow.status === 'overdue' ? 'text-danger' : 'text-ink'}>{borrow.dueDate}</span></span>
                        {borrow.returnDate && <span>Returned: <span className="text-success">{borrow.returnDate}</span></span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-mono capitalize ${statusStyle[borrow.status]}`}>
                      {borrow.status}
                    </span>
                    {borrow.fine > 0 && (
                      <span className={`text-xs font-mono ${borrow.finePaid ? 'text-success' : 'text-danger'}`}>
                        Fine: ₹{borrow.fine} {borrow.finePaid ? '✓' : '(unpaid)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Check Fine ───────────────────────────────────────────────────────────────

function CheckFine() {
  const { currentUser, borrows, books } = useApp()
  const fineBorrows = borrows.filter(b => b.userId === currentUser?.id && b.fine > 0)
  const pending = fineBorrows.filter(b => !b.finePaid).reduce((s, b) => s + b.fine, 0)
  const paid = fineBorrows.filter(b => b.finePaid).reduce((s, b) => s + b.fine, 0)
  const overdueCount = fineBorrows.filter(b => !b.finePaid).length

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-6">My Fines</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending Fine', value: `₹${pending}`, color: pending > 0 ? 'text-danger' : 'text-success' },
          { label: 'Total Paid', value: `₹${paid}`, color: 'text-success' },
          { label: 'Overdue Books', value: overdueCount.toString(), color: 'text-warning' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-5 bg-surface border border-border rounded-lg text-center">
            <div className={`font-display text-2xl font-semibold mb-1 ${color}`}>{value}</div>
            <div className="text-xs text-muted font-mono uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {fineBorrows.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm">No fines! Keep returning books on time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-mono text-muted uppercase tracking-wide mb-2">Fine Details</p>
          {fineBorrows.map(borrow => {
            const book = books.find(b => b.id === borrow.bookId)
            return (
              <div key={borrow.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-ink">{book?.title}</p>
                  <p className="text-xs text-muted font-mono mt-0.5">Due: {borrow.dueDate}</p>
                </div>
                <div className="text-right">
                  <div className={`font-display text-xl font-semibold ${borrow.finePaid ? 'text-success' : 'text-danger'}`}>
                    ₹{borrow.fine}
                  </div>
                  <div className={`text-xs font-mono mt-0.5 ${borrow.finePaid ? 'text-success' : 'text-warning'}`}>
                    {borrow.finePaid ? 'Paid' : 'Unpaid — visit library counter'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pending > 0 && (
        <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-lg text-warning text-sm">
          ⚠ You have a pending fine of <strong>₹{pending}</strong>. Please visit the library counter to clear your dues before issuing new books.
        </div>
      )}
    </div>
  )
}

// ─── Study Materials ──────────────────────────────────────────────────────────

function StudyMaterials() {
  const { materials } = useApp()
  const [yearFilter, setYearFilter] = useState('All')
  const [semFilter, setSemFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  const filtered = useMemo(() => materials.filter(m => {
    const mY = yearFilter === 'All' || m.year === parseInt(yearFilter)
    const mS = semFilter === 'All' || m.semester === parseInt(semFilter)
    const mQ = !query || m.title.toLowerCase().includes(query.toLowerCase()) || m.subject.toLowerCase().includes(query.toLowerCase())
    return mY && mS && mQ
  }), [materials, yearFilter, semFilter, query])

  const fileColor: Record<string, string> = { PDF: 'text-danger', PPT: 'text-warning', DOC: 'text-info' }

  const handleDownload = (id: string, title: string) => {
    setDownloading(id)
    const blob = new Blob([`Study material: ${title}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setTimeout(() => setDownloading(null), 1500)
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-6">Study Materials</h2>

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search materials…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2.5 bg-surface border border-border rounded-lg text-ink placeholder:text-muted text-sm focus:outline-none focus:border-gold transition-colors"
        />
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors">
          <option value="All">All Years</option>
          {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <select value={semFilter} onChange={e => setSemFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors">
          <option value="All">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      <p className="text-xs text-muted font-mono mb-4">{filtered.length} materials found</p>

      <div className="space-y-3">
        {filtered.map(mat => (
          <div key={mat.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg hover:border-gold/30 transition-colors group">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={`text-sm font-mono font-bold shrink-0 w-8 ${fileColor[mat.fileType]}`}>{mat.fileType}</div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-ink group-hover:text-gold transition-colors truncate">{mat.title}</h3>
                <p className="text-xs text-muted mt-0.5">{mat.subject}</p>
                <div className="flex flex-wrap gap-x-4 mt-1 text-xs font-mono text-muted/60">
                  <span>Year {mat.year} · Sem {mat.semester}</span>
                  <span>{mat.fileSize}</span>
                  <span>{mat.uploadDate}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDownload(mat.id, mat.title)}
              className="ml-4 px-4 py-2 bg-gold/10 border border-gold/20 text-gold text-xs font-semibold rounded-lg hover:bg-gold hover:text-bg transition-colors shrink-0"
            >
              {downloading === mat.id ? 'Loading…' : '↓ Download'}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm">No materials found for the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── My Profile ───────────────────────────────────────────────────────────────

function MyProfile() {
  const { currentUser, setCurrentUser, users, setUsers } = useApp()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    department: currentUser?.department || '',
  })

  if (!currentUser) return null

  const handleSave = () => {
    const updated = { ...currentUser, ...form }
    setCurrentUser(updated)
    setUsers(users.map(u => u.id === updated.id ? updated : u))
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputCls = "w-full px-3 py-2 bg-surface2 border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors"

  const fields = [
    { label: 'Full Name', key: 'name', value: form.name, editable: true },
    { label: 'Email Address', key: 'email', value: currentUser.email, editable: false },
    { label: 'Phone Number', key: 'phone', value: form.phone || '—', editable: true },
    { label: 'Department', key: 'department', value: form.department || '—', editable: true },
    { label: 'Roll Number', key: 'rollNumber', value: currentUser.rollNumber || '—', editable: false },
    { label: 'Year / Semester', key: 'yearSem', value: currentUser.year ? `Year ${currentUser.year} / Semester ${currentUser.semester}` : '—', editable: false },
    { label: 'Role', key: 'role', value: 'Student', editable: false },
    { label: 'Member Since', key: 'joinDate', value: currentUser.joinDate, editable: false },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold text-ink">My Profile</h2>
        {saved && <span className="text-xs text-success font-mono">✓ Profile updated</span>}
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="h-24" style={{ background: 'linear-gradient(135deg, #1e3a5f, #161b22)' }} />
        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-8 mb-8">
            <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-bg text-2xl font-display font-bold border-4 border-surface">
              {(form.name || currentUser.name)[0]?.toUpperCase()}
            </div>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              className="px-4 py-2 bg-gold/10 border border-gold/20 text-gold text-xs font-semibold rounded-lg hover:bg-gold hover:text-bg transition-colors"
            >
              {editing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {fields.map(({ label, key, value, editable }) => (
              <div key={key}>
                <div className="text-xs font-mono text-muted uppercase tracking-wide mb-1.5">{label}</div>
                {editing && editable ? (
                  <input
                    type="text"
                    value={form[key as keyof typeof form] ?? ''}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className={inputCls}
                  />
                ) : (
                  <div className="text-sm text-ink">{value}</div>
                )}
              </div>
            ))}
          </div>

          {editing && (
            <div className="mt-6 pt-4 border-t border-border flex gap-3">
              <button onClick={handleSave} className="px-5 py-2 bg-gold text-bg font-semibold text-sm rounded-lg hover:bg-gold-dim transition-colors">
                Save Changes
              </button>
              <button onClick={() => { setEditing(false); setForm({ name: currentUser.name, phone: currentUser.phone || '', department: currentUser.department || '' }) }}
                className="px-5 py-2 bg-surface2 border border-border text-muted text-sm rounded-lg hover:text-ink transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Shell ─────────────────────────────────────────────────────────

export default function UserDashboard() {
  const { currentUser, logout, borrows } = useApp()
  const [activeView, setActiveView] = useState('search')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const activeBorrows = borrows.filter(b => b.userId === currentUser?.id && b.status === 'active').length
  const pendingFine = borrows.filter(b => b.userId === currentUser?.id && b.fine > 0 && !b.finePaid).reduce((s, b) => s + b.fine, 0)
  const overdueCount = borrows.filter(b => b.userId === currentUser?.id && b.status === 'overdue').length

  const navItems = [
    { id: 'search', label: 'Search Books', icon: '🔍' },
    { id: 'borrows', label: 'My Borrows', icon: '📚', badge: activeBorrows > 0 ? activeBorrows : undefined, badgeColor: 'info' as const },
    { id: 'fines', label: 'My Fines', icon: '💰', badge: overdueCount > 0 ? `₹${pendingFine}` : undefined, badgeColor: 'danger' as const },
    { id: 'materials', label: 'Study Materials', icon: '📄' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
  ]

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} shrink-0 bg-surface border-r border-border flex flex-col transition-all duration-200`}
        style={{ minHeight: '100vh' }}>
        <div className="h-16 flex items-center px-4 border-b border-border gap-3 shrink-0">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center shrink-0">
            <span className="text-bg text-sm font-bold font-display">L</span>
          </div>
          {sidebarOpen && <span className="font-display text-sm font-semibold text-ink whitespace-nowrap">LibraryOS</span>}
        </div>

        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors text-sm text-left ${
                activeView === item.id
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-muted hover:text-ink hover:bg-surface2 border border-transparent'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded-full ${
                      item.badgeColor === 'danger' ? 'bg-danger/15 text-danger' : 'bg-info/15 text-info'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border shrink-0">
          {sidebarOpen && currentUser && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold shrink-0">
                {currentUser.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{currentUser.name}</p>
                <p className="text-xs text-muted truncate font-mono">{currentUser.rollNumber || 'Student'}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted hover:text-danger hover:bg-danger/5 transition-colors text-sm"
          >
            <span className="shrink-0 text-base">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0">
          <button onClick={() => setSidebarOpen(s => !s)}
            className="text-muted hover:text-ink transition-colors text-lg w-8 h-8 flex items-center justify-center">
            ☰
          </button>
          <div className="flex items-center gap-4">
            {pendingFine > 0 && (
              <span className="text-xs font-mono text-danger bg-danger/10 px-2.5 py-1 rounded-full border border-danger/20 hidden sm:block">
                Pending fine: ₹{pendingFine}
              </span>
            )}
            <span className="text-sm text-muted hidden md:block">
              Welcome, <span className="text-ink font-medium">{currentUser?.name}</span>
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeView === 'search' && <BookSearch />}
          {activeView === 'borrows' && <BorrowHistory />}
          {activeView === 'fines' && <CheckFine />}
          {activeView === 'materials' && <StudyMaterials />}
          {activeView === 'profile' && <MyProfile />}
        </div>
      </main>
    </div>
  )
}

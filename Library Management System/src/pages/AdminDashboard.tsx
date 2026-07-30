import { useState, useMemo } from 'react'
import { useApp } from '../context'
import type { Book, Material } from '../types'

const FINE_PER_DAY = 5

function calcFine(dueDate: string): number {
  const due = new Date(dueDate)
  const today = new Date()
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff) * FINE_PER_DAY
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function Overview() {
  const { books, borrows, users, materials } = useApp()
  const students = users.filter(u => u.role === 'user')
  const activeIssued = borrows.filter(b => b.status === 'active').length
  const overdue = borrows.filter(b => b.status === 'overdue').length
  const pendingFines = borrows.filter(b => b.fine > 0 && !b.finePaid).reduce((s, b) => s + b.fine, 0)
  const totalAvail = books.reduce((s, b) => s + b.availableCopies, 0)

  const recent = [...borrows]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 7)

  const stats = [
    { label: 'Total Books', value: books.reduce((s, b) => s + b.totalCopies, 0), sub: `${totalAvail} on shelf`, accent: '#c9a84c' },
    { label: 'Currently Issued', value: activeIssued, sub: 'active borrows', accent: '#58a6ff' },
    { label: 'Overdue', value: overdue, sub: 'need attention', accent: '#f85149' },
    { label: 'Pending Fines', value: `₹${pendingFines}`, sub: 'to collect', accent: '#d29922' },
    { label: 'Students', value: students.length, sub: 'registered', accent: '#3fb950' },
    { label: 'Study Materials', value: materials.length, sub: 'uploaded files', accent: '#8b5cf6' },
  ]

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-6">Dashboard Overview</h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, sub, accent }) => (
          <div key={label} className="p-5 bg-surface border border-border rounded-lg">
            <div className="font-display text-2xl font-bold mb-0.5" style={{ color: accent }}>{value}</div>
            <div className="text-xs uppercase font-mono tracking-wide text-muted">{label}</div>
            <div className="text-xs text-muted/50 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <p className="text-xs font-mono text-muted uppercase tracking-wide mb-3">Recent Transactions</p>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Student', 'Book', 'Issue Date', 'Due Date', 'Status', 'Fine'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wide text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(b => {
                const user = users.find(u => u.id === b.userId)
                const book = books.find(bk => bk.id === b.bookId)
                return (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-surface2/40">
                    <td className="px-4 py-3 text-xs text-ink">{user?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-ink max-w-[150px] truncate">{book?.title || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted">{b.issueDate}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted">{b.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                        b.status === 'active' ? 'bg-info/10 text-info' :
                        b.status === 'overdue' ? 'bg-danger/10 text-danger' :
                        'bg-success/10 text-success'
                      }`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {b.fine > 0
                        ? <span className={b.finePaid ? 'text-success' : 'text-danger'}>₹{b.fine} {b.finePaid ? '✓' : '!'}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Book Management ──────────────────────────────────────────────────────────

function ManageBooks() {
  const { books, setBooks } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editBook, setEditBook] = useState<Book | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const emptyForm = { title: '', author: '', isbn: '', category: '', totalCopies: '', description: '', publishYear: '', publisher: '', location: '' }
  const [form, setForm] = useState(emptyForm)

  const categories = ['All', ...Array.from(new Set(books.map(b => b.category))).sort()]
  const filtered = useMemo(() => books.filter(b => {
    const q = query.toLowerCase()
    return (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q)) &&
      (category === 'All' || b.category === category)
  }), [books, query, category])

  const openEdit = (book: Book) => {
    setEditBook(book)
    setForm({ title: book.title, author: book.author, isbn: book.isbn, category: book.category, totalCopies: book.totalCopies.toString(), description: book.description, publishYear: book.publishYear.toString(), publisher: book.publisher, location: book.location })
    setShowForm(true)
  }

  const openAdd = () => { setEditBook(null); setForm(emptyForm); setShowForm(true) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const copies = parseInt(form.totalCopies) || 1
    if (editBook) {
      const diff = copies - editBook.totalCopies
      setBooks(books.map(b => b.id === editBook.id ? {
        ...b, ...form,
        totalCopies: copies,
        availableCopies: Math.max(0, b.availableCopies + diff),
        publishYear: parseInt(form.publishYear) || b.publishYear,
      } : b))
    } else {
      const hue = Math.floor(Math.random() * 360)
      setBooks([...books, {
        id: `b-${Date.now()}`,
        ...form,
        totalCopies: copies,
        availableCopies: copies,
        publishYear: parseInt(form.publishYear) || 2024,
        coverAccent: `hsl(${hue}, 35%, 28%)`,
      }])
    }
    setShowForm(false)
  }

  const inputCls = "w-full px-3 py-2 bg-bg border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold text-ink">Book Inventory</h2>
        <button onClick={openAdd} className="px-4 py-2 bg-gold text-bg text-sm font-semibold rounded-lg hover:bg-gold-dim transition-colors">
          + Add Book
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Search books…" value={query} onChange={e => setQuery(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-lg text-ink placeholder:text-muted text-sm focus:outline-none focus:border-gold transition-colors" />
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <p className="text-xs font-mono text-muted mb-3">{filtered.length} books</p>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Title', 'Author', 'Category', 'Total', 'Avail.', 'Location', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wide text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(book => (
                <tr key={book.id} className="border-b border-border/50 hover:bg-surface2/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: book.coverAccent }} />
                      <span className="text-xs font-medium text-ink max-w-[140px] truncate">{book.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted max-w-[110px] truncate">{book.author}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 bg-surface2 text-muted rounded font-mono">{book.category}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-ink">{book.totalCopies}</td>
                  <td className="px-4 py-3 text-xs font-mono">
                    <span className={book.availableCopies > 0 ? 'text-success' : 'text-danger'}>{book.availableCopies}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted">{book.location}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(book)} className="text-xs px-2.5 py-1 bg-info/10 text-info border border-info/20 rounded hover:bg-info hover:text-bg transition-colors">Edit</button>
                      <button onClick={() => setDeleteId(book.id)} className="text-xs px-2.5 py-1 bg-danger/10 text-danger border border-danger/20 rounded hover:bg-danger hover:text-bg transition-colors">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-semibold text-ink mb-5">{editBook ? 'Edit Book' : 'Add New Book'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Author *</label>
                <input type="text" required value={form.author} onChange={e => setForm(f => ({...f, author: e.target.value}))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">ISBN</label>
                  <input type="text" value={form.isbn} onChange={e => setForm(f => ({...f, isbn: e.target.value}))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Category *</label>
                  <input type="text" required value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className={inputCls} placeholder="e.g. Computer Science" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Total Copies *</label>
                  <input type="number" min="1" required value={form.totalCopies} onChange={e => setForm(f => ({...f, totalCopies: e.target.value}))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Publish Year</label>
                  <input type="number" value={form.publishYear} onChange={e => setForm(f => ({...f, publishYear: e.target.value}))} className={inputCls} placeholder="2024" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Publisher</label>
                  <input type="text" value={form.publisher} onChange={e => setForm(f => ({...f, publisher: e.target.value}))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Shelf Location</label>
                  <input type="text" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} className={inputCls} placeholder="CS-A-12" />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-gold text-bg font-semibold rounded-lg hover:bg-gold-dim transition-colors text-sm">
                  {editBook ? 'Update' : 'Add Book'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-surface2 border border-border text-ink rounded-lg text-sm hover:border-gold/30 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-surface border border-danger/30 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-display text-lg font-semibold text-danger mb-2">Delete Book?</h3>
            <p className="text-sm text-muted mb-5">
              Permanently remove <span className="text-ink">"{books.find(b => b.id === deleteId)?.title}"</span> from the catalog.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setBooks(books.filter(b => b.id !== deleteId)); setDeleteId(null) }}
                className="flex-1 py-2.5 bg-danger text-bg font-semibold rounded-lg text-sm">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 bg-surface2 border border-border text-ink rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Issue Book ────────────────────────────────────────────────────────────────

function IssueBook() {
  const { books, users, borrows, setBorrows, setBooks, currentUser } = useApp()
  const students = users.filter(u => u.role === 'user')
  const today = new Date().toISOString().split('T')[0]
  const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [form, setForm] = useState({ userId: '', bookId: '', issueDate: today, dueDate: defaultDue })
  const [bookQuery, setBookQuery] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const availableBooks = useMemo(() => books.filter(b =>
    b.availableCopies > 0 &&
    (!bookQuery || b.title.toLowerCase().includes(bookQuery.toLowerCase()) || b.author.toLowerCase().includes(bookQuery.toLowerCase()))
  ), [books, bookQuery])

  const selectedBook = books.find(b => b.id === form.bookId)
  const selectedStudent = students.find(s => s.id === form.userId)

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.userId || !form.bookId) { setError('Please select a student and a book.'); return }
    const alreadyActive = borrows.find(b => b.userId === form.userId && b.bookId === form.bookId && (b.status === 'active' || b.status === 'overdue'))
    if (alreadyActive) { setError('This student already has this book borrowed.'); return }
    const newBorrow = {
      id: `br-${Date.now()}`,
      userId: form.userId, bookId: form.bookId,
      issueDate: form.issueDate, dueDate: form.dueDate,
      status: 'active' as const,
      fine: 0, finePaid: false,
      issuedBy: currentUser?.id || 'admin-1',
    }
    setBorrows([...borrows, newBorrow])
    setBooks(books.map(b => b.id === form.bookId ? { ...b, availableCopies: b.availableCopies - 1 } : b))
    setSuccess(`"${selectedBook?.title}" issued to ${selectedStudent?.name}.`)
    setForm({ userId: '', bookId: '', issueDate: today, dueDate: defaultDue })
    setBookQuery('')
    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-6">Issue Book</h2>

      {success && <div className="mb-5 p-4 bg-success/10 border border-success/30 rounded-lg text-success text-sm">✓ {success}</div>}
      {error && <div className="mb-5 p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">{error}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={handleIssue} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1.5">Select Student *</label>
            <select value={form.userId} onChange={e => setForm(f => ({...f, userId: e.target.value}))}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors">
              <option value="">— Choose student —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.rollNumber || s.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1.5">Search Available Book *</label>
            <input type="text" placeholder="Type title or author…" value={bookQuery}
              onChange={e => { setBookQuery(e.target.value); setForm(f => ({...f, bookId: ''})) }}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-ink placeholder:text-muted text-sm focus:outline-none focus:border-gold transition-colors mb-2" />
            <select value={form.bookId} onChange={e => setForm(f => ({...f, bookId: e.target.value}))} size={5}
              className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors">
              <option value="">— Select book —</option>
              {availableBooks.map(b => (
                <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} avail.)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1.5">Issue Date</label>
              <input type="date" value={form.issueDate} onChange={e => setForm(f => ({...f, issueDate: e.target.value}))}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1.5">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))}
                className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors" />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-gold text-bg font-semibold rounded-lg hover:bg-gold-dim transition-colors text-sm">
            Issue Book
          </button>
        </form>

        <div className="space-y-4">
          {selectedStudent ? (
            <div className="p-5 bg-surface border border-border rounded-xl">
              <p className="text-xs font-mono text-muted uppercase tracking-wide mb-3">Selected Student</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-info/15 flex items-center justify-center text-info text-sm font-bold shrink-0">
                  {selectedStudent.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{selectedStudent.name}</p>
                  <p className="text-xs text-muted font-mono">{selectedStudent.rollNumber} · {selectedStudent.department}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-surface border border-dashed border-border rounded-xl text-center text-muted text-sm">
              Student preview will appear here
            </div>
          )}

          {selectedBook ? (
            <div className="p-5 bg-surface border border-border rounded-xl">
              <p className="text-xs font-mono text-muted uppercase tracking-wide mb-3">Selected Book</p>
              <div className="flex gap-3">
                <div className="w-10 h-12 rounded shrink-0" style={{ background: selectedBook.coverAccent }} />
                <div>
                  <p className="text-sm font-semibold text-ink">{selectedBook.title}</p>
                  <p className="text-xs text-muted">{selectedBook.author}</p>
                  <p className="text-xs font-mono text-success mt-1">{selectedBook.availableCopies} copies avail. · {selectedBook.location}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-surface border border-dashed border-border rounded-xl text-center text-muted text-sm">
              Book preview will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Return Book ──────────────────────────────────────────────────────────────

function ReturnBook() {
  const { borrows, setBorrows, books, setBooks, users } = useApp()
  const [success, setSuccess] = useState('')
  const [filterUser, setFilterUser] = useState('')

  const students = users.filter(u => u.role === 'user')
  const active = borrows
    .filter(b => (b.status === 'active' || b.status === 'overdue') && (!filterUser || b.userId === filterUser))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const handleReturn = (borrowId: string) => {
    const borrow = borrows.find(b => b.id === borrowId)
    if (!borrow) return
    const today = new Date().toISOString().split('T')[0]
    const fine = calcFine(borrow.dueDate)
    setBorrows(borrows.map(b => b.id === borrowId ? { ...b, returnDate: today, status: 'returned', fine, finePaid: fine === 0 } : b))
    setBooks(books.map(b => b.id === borrow.bookId ? { ...b, availableCopies: b.availableCopies + 1 } : b))
    const book = books.find(b => b.id === borrow.bookId)
    setSuccess(`"${book?.title}" returned.${fine > 0 ? ` Fine: ₹${fine}` : ' No fine.'}`)
    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-6">Return Books</h2>

      {success && <div className="mb-5 p-4 bg-success/10 border border-success/30 rounded-lg text-success text-sm">✓ {success}</div>}

      <div className="flex gap-3 mb-4">
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors">
          <option value="">All Students</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <p className="flex items-center text-xs font-mono text-muted">{active.length} active borrows</p>
      </div>

      {active.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-sm">No active borrows to return.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Student', 'Book', 'Issued', 'Due Date', 'Overdue', 'Fine', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wide text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {active.map(borrow => {
                  const user = users.find(u => u.id === borrow.userId)
                  const book = books.find(b => b.id === borrow.bookId)
                  const fine = calcFine(borrow.dueDate)
                  const days = Math.max(0, Math.floor((new Date().getTime() - new Date(borrow.dueDate).getTime()) / 86400000))
                  return (
                    <tr key={borrow.id} className="border-b border-border/50 hover:bg-surface2/40">
                      <td className="px-4 py-3 text-xs text-ink">{user?.name}</td>
                      <td className="px-4 py-3 text-xs text-ink max-w-[150px] truncate">{book?.title}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted">{borrow.issueDate}</td>
                      <td className="px-4 py-3 text-xs font-mono">
                        <span className={days > 0 ? 'text-danger' : 'text-ink'}>{borrow.dueDate}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {days > 0 ? <span className="text-danger font-semibold">{days}d</span> : <span className="text-success">On time</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        <span className={fine > 0 ? 'text-danger font-semibold' : 'text-success'}>₹{fine}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleReturn(borrow.id)}
                          className="text-xs px-3 py-1.5 bg-success/10 text-success border border-success/20 rounded hover:bg-success hover:text-bg transition-colors font-medium">
                          Return
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Fine Management ──────────────────────────────────────────────────────────

function ManageFines() {
  const { borrows, setBorrows, books, users } = useApp()
  const fineRecords = borrows.filter(b => b.fine > 0)
    .sort((a, b) => (a.finePaid ? 1 : 0) - (b.finePaid ? 1 : 0) || b.fine - a.fine)

  const totalPending = fineRecords.filter(b => !b.finePaid).reduce((s, b) => s + b.fine, 0)
  const totalCollected = fineRecords.filter(b => b.finePaid).reduce((s, b) => s + b.fine, 0)

  const updateFine = (id: string, amount: number) => setBorrows(borrows.map(b => b.id === id ? { ...b, fine: amount } : b))
  const markPaid = (id: string) => setBorrows(borrows.map(b => b.id === id ? { ...b, finePaid: true } : b))

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-6">Fine Management</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', value: `₹${totalPending}`, color: 'text-danger' },
          { label: 'Collected', value: `₹${totalCollected}`, color: 'text-success' },
          { label: 'Rate', value: `₹${FINE_PER_DAY}/day`, color: 'text-warning' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-5 bg-surface border border-border rounded-lg text-center">
            <div className={`font-display text-2xl font-semibold mb-1 ${color}`}>{value}</div>
            <div className="text-xs text-muted font-mono uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {fineRecords.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm">No fines on record.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Student', 'Book', 'Due Date', 'Fine (₹)', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wide text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fineRecords.map(borrow => {
                  const user = users.find(u => u.id === borrow.userId)
                  const book = books.find(b => b.id === borrow.bookId)
                  return (
                    <tr key={borrow.id} className={`border-b border-border/50 hover:bg-surface2/40 ${borrow.finePaid ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 text-xs text-ink">{user?.name}</td>
                      <td className="px-4 py-3 text-xs text-ink max-w-[140px] truncate">{book?.title}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted">{borrow.dueDate}</td>
                      <td className="px-4 py-3">
                        {!borrow.finePaid ? (
                          <div className="flex items-center gap-1">
                            <span className="text-muted text-xs font-mono">₹</span>
                            <input type="number" value={borrow.fine} onChange={e => updateFine(borrow.id, parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-0.5 bg-bg border border-border rounded text-xs font-mono text-ink focus:outline-none focus:border-gold" />
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-success font-semibold">₹{borrow.fine}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${borrow.finePaid ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {borrow.finePaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!borrow.finePaid && (
                          <button onClick={() => markPaid(borrow.id)}
                            className="text-xs px-3 py-1.5 bg-success/10 text-success border border-success/20 rounded hover:bg-success hover:text-bg transition-colors font-medium">
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Study Materials Admin ────────────────────────────────────────────────────

function AdminMaterials() {
  const { materials, setMaterials } = useApp()
  const [yearFilter, setYearFilter] = useState('All')
  const [semFilter, setSemFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const emptyForm = { title: '', subject: '', year: '1', semester: '1', fileType: 'PDF' as Material['fileType'], fileSize: '', description: '' }
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => materials.filter(m =>
    (yearFilter === 'All' || m.year === parseInt(yearFilter)) &&
    (semFilter === 'All' || m.semester === parseInt(semFilter))
  ), [materials, yearFilter, semFilter])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setMaterials([...materials, {
      id: `m-${Date.now()}`,
      ...form,
      year: parseInt(form.year),
      semester: parseInt(form.semester),
      uploadDate: new Date().toISOString().split('T')[0],
    }])
    setShowForm(false)
    setForm(emptyForm)
  }

  const inputCls = "w-full px-3 py-2 bg-bg border border-border rounded-lg text-ink text-sm focus:outline-none focus:border-gold transition-colors"
  const fileColor: Record<string, string> = { PDF: 'text-danger', PPT: 'text-warning', DOC: 'text-info' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold text-ink">Study Materials</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-gold text-bg text-sm font-semibold rounded-lg hover:bg-gold-dim transition-colors">
          + Add Material
        </button>
      </div>

      <div className="flex gap-3 mb-4">
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
        <p className="flex items-center text-xs font-mono text-muted">{filtered.length} files</p>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Type', 'Title', 'Subject', 'Yr', 'Sem', 'Size', 'Uploaded', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wide text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(mat => (
                <tr key={mat.id} className="border-b border-border/50 hover:bg-surface2/40">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono font-bold ${fileColor[mat.fileType]}`}>{mat.fileType}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink max-w-[160px] truncate">{mat.title}</td>
                  <td className="px-4 py-3 text-xs text-muted max-w-[120px] truncate">{mat.subject}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted">{mat.year}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted">{mat.semester}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted">{mat.fileSize}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted">{mat.uploadDate}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDeleteId(mat.id)}
                      className="text-xs px-2.5 py-1 bg-danger/10 text-danger border border-danger/20 rounded hover:bg-danger hover:text-bg transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6">
            <h3 className="font-display text-lg font-semibold text-ink mb-5">Add Study Material</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Title *</label>
                <input type="text" required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Subject *</label>
                <input type="text" required value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))} className={inputCls} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Year</label>
                  <select value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} className={inputCls}>
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Semester</label>
                  <select value={form.semester} onChange={e => setForm(f => ({...f, semester: e.target.value}))} className={inputCls}>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Type</label>
                  <select value={form.fileType} onChange={e => setForm(f => ({...f, fileType: e.target.value as Material['fileType']}))} className={inputCls}>
                    <option>PDF</option><option>PPT</option><option>DOC</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">File Size</label>
                <input type="text" placeholder="e.g. 4.2 MB" value={form.fileSize} onChange={e => setForm(f => ({...f, fileSize: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-mono text-muted uppercase tracking-wide block mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-gold text-bg font-semibold rounded-lg hover:bg-gold-dim transition-colors text-sm">Add</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-surface2 border border-border text-ink rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-surface border border-danger/30 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-display text-lg font-semibold text-danger mb-2">Delete Material?</h3>
            <p className="text-sm text-muted mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => { setMaterials(materials.filter(m => m.id !== deleteId)); setDeleteId(null) }}
                className="flex-1 py-2.5 bg-danger text-bg font-semibold rounded-lg text-sm">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 bg-surface2 border border-border text-ink rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── User Management ──────────────────────────────────────────────────────────

function ManageUsers() {
  const { users, borrows } = useApp()
  const [query, setQuery] = useState('')
  const students = users.filter(u => u.role === 'user').filter(s => {
    const q = query.toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.rollNumber || '').toLowerCase().includes(q)
  })

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-6">User Management</h2>
      <input type="text" placeholder="Search by name, email, or roll number…" value={query} onChange={e => setQuery(e.target.value)}
        className="w-full mb-4 px-4 py-2.5 bg-surface border border-border rounded-lg text-ink placeholder:text-muted text-sm focus:outline-none focus:border-gold transition-colors" />

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Student', 'Roll No.', 'Department', 'Yr / Sem', 'Active', 'Fine', 'Joined'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wide text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const active = borrows.filter(b => b.userId === student.id && (b.status === 'active' || b.status === 'overdue')).length
                const fine = borrows.filter(b => b.userId === student.id && b.fine > 0 && !b.finePaid).reduce((s, b) => s + b.fine, 0)
                return (
                  <tr key={student.id} className="border-b border-border/50 hover:bg-surface2/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center text-gold text-xs font-bold shrink-0">
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink">{student.name}</p>
                          <p className="text-xs text-muted">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted">{student.rollNumber || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted">{student.department || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted">
                      {student.year ? `Y${student.year} / S${student.semester}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      <span className={active > 0 ? 'text-info' : 'text-muted'}>{active}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {fine > 0 ? <span className="text-danger">₹{fine}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted">{student.joinDate}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Shell ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { currentUser, logout, borrows } = useApp()
  const [activeView, setActiveView] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const overdueCount = borrows.filter(b => b.status === 'overdue').length
  const pendingFineCount = borrows.filter(b => b.fine > 0 && !b.finePaid).length

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'books', label: 'Book Inventory', icon: '📚' },
    { id: 'issue', label: 'Issue Book', icon: '➕' },
    { id: 'return', label: 'Return Books', icon: '↩', badge: overdueCount > 0 ? overdueCount : undefined, badgeColor: 'danger' as const },
    { id: 'fines', label: 'Fines', icon: '💰', badge: pendingFineCount > 0 ? pendingFineCount : undefined, badgeColor: 'warning' as const },
    { id: 'materials', label: 'Study Materials', icon: '📄' },
    { id: 'users', label: 'Users', icon: '👥' },
  ]

  return (
    <div className="min-h-screen bg-bg flex">
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} shrink-0 bg-surface border-r border-border flex flex-col transition-all duration-200`}
        style={{ minHeight: '100vh' }}>
        <div className="h-16 flex items-center px-4 border-b border-border gap-3 shrink-0">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center shrink-0">
            <span className="text-bg text-sm font-bold font-display">L</span>
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-display text-sm font-semibold text-ink whitespace-nowrap leading-tight">LibraryOS</p>
              <p className="text-xs font-mono leading-tight" style={{ color: '#c9a84c', opacity: 0.7 }}>Admin</p>
            </div>
          )}
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
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-xs font-mono w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      item.badgeColor === 'danger' ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'
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
                <p className="text-xs font-mono truncate" style={{ color: '#c9a84c', opacity: 0.7 }}>Librarian</p>
              </div>
            </div>
          )}
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted hover:text-danger hover:bg-danger/5 transition-colors text-sm">
            <span className="shrink-0 text-base">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0">
          <button onClick={() => setSidebarOpen(s => !s)}
            className="text-muted hover:text-ink transition-colors text-lg w-8 h-8 flex items-center justify-center">
            ☰
          </button>
          <div className="flex items-center gap-4">
            {overdueCount > 0 && (
              <span className="text-xs font-mono text-danger bg-danger/10 px-2.5 py-1 rounded-full border border-danger/20 hidden sm:block">
                {overdueCount} overdue
              </span>
            )}
            <span className="text-sm text-muted hidden md:block">
              <span className="text-ink font-medium">{currentUser?.name}</span> · Librarian
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeView === 'overview' && <Overview />}
          {activeView === 'books' && <ManageBooks />}
          {activeView === 'issue' && <IssueBook />}
          {activeView === 'return' && <ReturnBook />}
          {activeView === 'fines' && <ManageFines />}
          {activeView === 'materials' && <AdminMaterials />}
          {activeView === 'users' && <ManageUsers />}
        </div>
      </main>
    </div>
  )
}

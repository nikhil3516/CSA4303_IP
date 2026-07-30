import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User, Book, BorrowRecord, Material, Page } from './types'
import { INITIAL_USERS, INITIAL_BOOKS, INITIAL_BORROWS, INITIAL_MATERIALS } from './mockData'

interface AppContextType {
  users: User[]
  books: Book[]
  borrows: BorrowRecord[]
  materials: Material[]
  currentUser: User | null
  page: Page
  setUsers: (users: User[]) => void
  setBooks: (books: Book[]) => void
  setBorrows: (borrows: BorrowRecord[]) => void
  setMaterials: (materials: Material[]) => void
  setCurrentUser: (user: User | null) => void
  setPage: (page: Page) => void
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS)
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS)
  const [borrows, setBorrows] = useState<BorrowRecord[]>(INITIAL_BORROWS)
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [page, setPage] = useState<Page>('landing')

  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password)
    if (user) {
      setCurrentUser(user)
      setPage(user.role === 'admin' ? 'admin' : 'user')
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
    setPage('landing')
  }

  return (
    <AppContext.Provider value={{
      users, books, borrows, materials, currentUser, page,
      setUsers, setBooks, setBorrows, setMaterials,
      setCurrentUser, setPage, login, logout,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

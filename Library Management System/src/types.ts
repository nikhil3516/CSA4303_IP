export type Role = 'admin' | 'user'
export type BorrowStatus = 'active' | 'returned' | 'overdue'
export type FileType = 'PDF' | 'PPT' | 'DOC'
export type Page = 'landing' | 'login' | 'user' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  rollNumber?: string
  department?: string
  year?: number
  semester?: number
  phone?: string
  joinDate: string
}

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  totalCopies: number
  availableCopies: number
  description: string
  publishYear: number
  publisher: string
  location: string
  coverAccent: string
}

export interface BorrowRecord {
  id: string
  userId: string
  bookId: string
  issueDate: string
  dueDate: string
  returnDate?: string
  status: BorrowStatus
  fine: number
  finePaid: boolean
  issuedBy: string
}

export interface Material {
  id: string
  title: string
  subject: string
  year: number
  semester: number
  fileType: FileType
  fileSize: string
  uploadDate: string
  description: string
}

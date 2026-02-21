import api from './api';

export interface Book {
  id?: number;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publish_year?: number;
  pages?: number;
  cover_url?: string;
  synopsis?: string;
  required_degree: number;
}

export interface LibraryItem {
  id?: number;
  inventory_code?: string;
  condition: string;
  status?: string;
  book_id: number;
  lodge_id?: number;
  book?: Book;
}

export interface Loan {
  id: number;
  item_id: number;
  member_id: number;
  loan_date: string;
  due_date: string;
  return_date?: string;
  status: string;
  item?: LibraryItem;
  member?: any;
}

export interface Waitlist {
  id: number;
  book_id: number;
  lodge_id: number;
  member_id: number;
  request_date: string;
  status: string;
  notification_date?: string;
  expiration_date?: string;
  book?: Book;
  member?: any;
}

export const libraryService = {
  // Books (Global Catalog)
  searchBookByIsbn: (isbn: string) => api.get(`/library/books/search-isbn/${isbn}`),
  listBooks: (params?: { skip?: number; limit?: number; search?: string }) => api.get('/library/books', { params }),
  createBook: (data: Partial<Book>) => api.post('/library/books', data),

  // Library Items (Lodge Inventory)
  listItems: (params?: { book_id?: number; skip?: number; limit?: number }) => api.get('/library/items', { params }),
  createItem: (data: Partial<LibraryItem>) => api.post('/library/items', data),

  // Loans
  listActiveLoans: (params?: { skip?: number; limit?: number }) => api.get('/library/loans/active', { params }),
  listMyLoans: (params?: { skip?: number; limit?: number }) => api.get('/library/loans/me', { params }),
  createLoan: (data: { item_id: number; member_id: number }) => api.post('/library/loans', data),
  returnLoan: (loanId: number) => api.put(`/library/loans/${loanId}/return`),

  // Waitlist
  listMyWaitlists: () => api.get('/library/waitlist/me'),
  enterWaitlist: (data: { book_id: number }) => api.post('/library/waitlist', data),
};

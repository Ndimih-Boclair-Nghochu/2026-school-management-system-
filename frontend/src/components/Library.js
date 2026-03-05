import React, { useMemo, useState } from 'react';
import './Library.css';

const initialBooks = [
  {
    id: 1,
    title: 'Physics for Beginners',
    author: 'Lisa Brown',
    category: 'Science',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=60',
    totalCopies: 6,
    availableCopies: 4
  },
  {
    id: 2,
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    category: 'Literature',
    cover: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=300&q=60',
    totalCopies: 5,
    availableCopies: 3
  },
  {
    id: 3,
    title: 'World History: An Overview',
    author: 'Michael Carter',
    category: 'History',
    cover: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=300&q=60',
    totalCopies: 4,
    availableCopies: 2
  },
  {
    id: 4,
    title: 'Algebra Essentials',
    author: 'Sarah Miller',
    category: 'Mathematics',
    cover: 'https://images.unsplash.com/photo-1455885666463-9c41de0f5e98?auto=format&fit=crop&w=300&q=60',
    totalCopies: 7,
    availableCopies: 5
  },
  {
    id: 5,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    category: 'Literature',
    cover: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=300&q=60',
    totalCopies: 4,
    availableCopies: 2
  },
  {
    id: 6,
    title: 'Chemistry Essentials',
    author: 'John Anderson',
    category: 'Science',
    cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=300&q=60',
    totalCopies: 3,
    availableCopies: 2
  }
];

const initialBorrowed = [
  {
    borrowId: 1001,
    bookId: 4,
    title: 'Algebra Essentials',
    author: 'Sarah Miller',
    borrowedDate: '2026-02-24',
    dueDate: '2026-03-06',
    pickupAt: '2026-02-24 09:30',
    status: 'Due Soon'
  },
  {
    borrowId: 1002,
    bookId: 3,
    title: 'World History: An Overview',
    author: 'Michael Carter',
    borrowedDate: '2026-02-15',
    dueDate: '2026-03-01',
    pickupAt: '2026-02-15 11:00',
    status: 'Overdue'
  }
];

const initialReservations = [
  {
    reservationId: 5001,
    bookId: 2,
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    requestedAt: '2026-03-04',
    pickupAt: '2026-03-07 10:00',
    status: 'Pending'
  }
];

const getStatusFromDueDate = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil((due - now) / msPerDay);

  if (diffDays < 0) return 'Overdue';
  if (diffDays <= 2) return 'Due Soon';
  return 'Active';
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};

const toPickupDateTime = (date, time) => `${date} ${time}`;

const SCHOOL_NAME = 'EduIgnite International School';
const SCHOOL_TAGLINE = 'Excellence • Discipline • Innovation';
const SCHOOL_ADDRESS = 'Central Campus, Molyko - Buea, Cameroon';
const SCHOOL_CONTACT = '+237 6XX XXX XXX  •  library@eduignite.edu';
const SCHOOL_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1b74d3" offset="0"/><stop stop-color="#2e90fa" offset="1"/></linearGradient></defs><rect width="88" height="88" rx="18" fill="url(#g)"/><circle cx="44" cy="44" r="22" fill="#fff" opacity="0.92"/><text x="44" y="50" text-anchor="middle" font-size="22" font-family="Arial" font-weight="700" fill="#1b74d3">EI</text></svg>')}`;
const TEACHER_INFO = {
  name: 'John Smith',
  role: 'Grade 5 Mathematics Teacher',
  id: 'TCH-0501',
  department: 'Science & Mathematics Department',
  avatar: 'https://via.placeholder.com/72'
};

const Library = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [books, setBooks] = useState(initialBooks);
  const [borrowedBooks, setBorrowedBooks] = useState(initialBorrowed);
  const [reservations, setReservations] = useState(initialReservations);
  const [history, setHistory] = useState([]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Title');
  const [yearFilter, setYearFilter] = useState('All Year');
  const [showHistory, setShowHistory] = useState(false);
  const [borrowDraft, setBorrowDraft] = useState(null);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [reservationBookId, setReservationBookId] = useState(initialBooks[0].id);
  const [reservationDate, setReservationDate] = useState(new Date().toISOString().slice(0, 10));
  const [reservationTime, setReservationTime] = useState('10:00');
  const [reservationBorrowId, setReservationBorrowId] = useState(null);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(books.map((book) => book.category)));
    return ['All Categories', ...categories];
  }, [books]);

  const visibleAvailableBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = books.filter((book) => {
      const categoryOk = categoryFilter === 'All Categories' || book.category === categoryFilter;
      const queryOk = !query
        || book.title.toLowerCase().includes(query)
        || book.author.toLowerCase().includes(query)
        || book.category.toLowerCase().includes(query);
      return categoryOk && queryOk;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'Author') return a.author.localeCompare(b.author);
      if (sortBy === 'Availability') return b.availableCopies - a.availableCopies;
      return a.title.localeCompare(b.title);
    });
  }, [books, search, categoryFilter, sortBy]);

  const visibleBorrowedBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const withStatus = borrowedBooks.map((item) => ({
      ...item,
      status: getStatusFromDueDate(item.dueDate)
    }));

    return withStatus.filter((item) => {
      if (yearFilter === 'This Year') {
        const year = new Date(item.borrowedDate).getFullYear();
        if (year !== new Date().getFullYear()) return false;
      }

      if (!query) return true;
      return item.title.toLowerCase().includes(query) || item.author.toLowerCase().includes(query);
    });
  }, [borrowedBooks, search, yearFilter]);

  const overdueCount = visibleBorrowedBooks.filter((item) => item.status === 'Overdue').length;

  const borrowBook = (bookId, pickupAt) => {
    const selectedBook = books.find((book) => book.id === bookId);
    if (!selectedBook || selectedBook.availableCopies < 1) return null;

    if (borrowedBooks.length >= 5) {
      alert('Borrowing limit reached (5 books). Return a book before borrowing a new one.');
      return null;
    }

    const today = new Date().toISOString().slice(0, 10);
    const dueDate = addDays(today, 14);
    const nextBorrow = {
      borrowId: Date.now(),
      bookId,
      title: selectedBook.title,
      author: selectedBook.author,
      borrowedDate: today,
      dueDate,
      pickupAt,
      status: getStatusFromDueDate(dueDate)
    };

    setBooks((prev) => prev.map((book) => (
      book.id === bookId ? { ...book, availableCopies: book.availableCopies - 1 } : book
    )));

    setBorrowedBooks((prev) => [nextBorrow, ...prev]);

    setHistory((prev) => [
      {
        id: Date.now(),
        action: 'Borrowed',
        title: selectedBook.title,
        date: today,
        details: `Pickup ${pickupAt} • Due on ${dueDate}`
      },
      ...prev
    ]);

    setReservations((prev) => prev.filter((entry) => entry.bookId !== bookId));

    return nextBorrow;
  };

  const returnBook = (borrowId) => {
    const selected = borrowedBooks.find((item) => item.borrowId === borrowId);
    if (!selected) return;

    const today = new Date().toISOString().slice(0, 10);

    setBorrowedBooks((prev) => prev.filter((item) => item.borrowId !== borrowId));
    setBooks((prev) => prev.map((book) => (
      book.id === selected.bookId ? { ...book, availableCopies: book.availableCopies + 1 } : book
    )));

    setHistory((prev) => [
      {
        id: Date.now(),
        action: 'Returned',
        title: selected.title,
        date: today,
        details: 'Book returned successfully'
      },
      ...prev
    ]);
  };

  const renewBook = (borrowId) => {
    setBorrowedBooks((prev) => prev.map((item) => {
      if (item.borrowId !== borrowId) return item;
      const nextDueDate = addDays(item.dueDate, 7);
      return {
        ...item,
        dueDate: nextDueDate,
        status: getStatusFromDueDate(nextDueDate)
      };
    }));

    const renewed = borrowedBooks.find((item) => item.borrowId === borrowId);
    if (renewed) {
      setHistory((prev) => [
        {
          id: Date.now(),
          action: 'Renewed',
          title: renewed.title,
          date: new Date().toISOString().slice(0, 10),
          details: 'Due date extended by 7 days'
        },
        ...prev
      ]);
    }
  };

  const buildReceiptMarkup = (borrowedItem) => {
    const generatedAt = new Date().toISOString().slice(0, 10);
    const statusClass = borrowedItem.status === 'Overdue' ? 'overdue' : borrowedItem.status === 'Due Soon' ? 'soon' : 'active';
    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Library Receipt RCPT-${borrowedItem.borrowId}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; background: #f5f7fb; margin: 0; padding: 24px; color: #1d2939; }
          .receipt { max-width: 820px; margin: 0 auto; background: #fff; border-radius: 14px; border: 1px solid #dbe3f0; overflow: hidden; box-shadow: 0 10px 24px rgba(16,24,40,.10); }
          .header { background: linear-gradient(90deg,#1b74d3,#2e90fa); padding: 16px 18px; color: #fff; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
          .brand { display: flex; align-items: center; gap: 12px; }
          .brand img { width: 54px; height: 54px; border-radius: 12px; background: #fff; }
          .brand h1 { margin: 0; font-size: 1.05rem; }
          .brand p { margin: 3px 0 0; font-size: .8rem; opacity: .95; }
          .meta { text-align: right; font-size: .8rem; }
          .meta strong { display: block; font-size: .9rem; margin-bottom: 2px; }
          .body { padding: 16px; display: grid; gap: 12px; }
          .doc-head { display:flex; justify-content: space-between; align-items:center; border: 1px dashed #b8c5db; border-radius: 10px; padding: 10px; background:#f8fbff; }
          .doc-head h2 { margin:0; font-size: 1.02rem; color:#175cd3; letter-spacing: .5px; }
          .doc-head small { color:#475467; font-size: .78rem; }
          .teacher { border: 1px solid #d9e2f2; border-radius: 10px; padding: 10px; display: flex; align-items: center; gap: 10px; background: #f8fbff; }
          .teacher img { width: 56px; height: 56px; border-radius: 50%; border: 2px solid #b2ddff; object-fit: cover; }
          .teacher h3 { margin: 0; font-size: .95rem; }
          .teacher p { margin: 3px 0 0; color: #475467; font-size: .82rem; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
          .item { border: 1px solid #eaecf0; border-radius: 10px; padding: 10px; background: #fff; }
          .item span { display: block; color: #667085; font-size: .76rem; margin-bottom: 3px; }
          .item strong { font-size: .9rem; }
          .status { display: inline-flex; padding: 4px 8px; border-radius: 999px; font-size: .75rem; font-weight: 600; }
          .status.active { background:#ecfdf3; color:#027a48; }
          .status.soon { background:#fffaeb; color:#b54708; }
          .status.overdue { background:#fef3f2; color:#b42318; }
          .approval { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
          .sign { border: 1px solid #eaecf0; border-radius: 10px; padding: 10px; background:#fff; }
          .sign span { display:block; color:#667085; font-size:.75rem; margin-bottom:14px; }
          .sign strong { display:block; border-top:1px solid #d0d5dd; padding-top:6px; font-size:.82rem; }
          .foot { border-top: 1px dashed #d0d5dd; padding: 12px 16px; color: #667085; font-size: .8rem; }
        </style>
      </head>
      <body>
        <section class="receipt">
          <header class="header">
            <div class="brand">
              <img src="${SCHOOL_LOGO}" alt="School Logo" />
              <div>
                <h1>${SCHOOL_NAME}</h1>
                <p>${SCHOOL_TAGLINE}</p>
                <p>${SCHOOL_ADDRESS}</p>
                <p>${SCHOOL_CONTACT}</p>
              </div>
            </div>
            <div class="meta">
              <strong>RECEIPT #RCPT-${borrowedItem.borrowId}</strong>
              <span>Generated: ${generatedAt}</span>
            </div>
          </header>
          <div class="body">
            <div class="doc-head">
              <div>
                <h2>LIBRARY BORROWING RECEIPT</h2>
                <small>This receipt confirms official borrowing authorization.</small>
              </div>
              <small>Academic Session: 2025/2026</small>
            </div>
            <div class="teacher">
              <img src="${TEACHER_INFO.avatar}" alt="${TEACHER_INFO.name}" />
              <div>
                <h3>${TEACHER_INFO.name}</h3>
                <p>${TEACHER_INFO.role}</p>
                <p>${TEACHER_INFO.department} • ${TEACHER_INFO.id}</p>
              </div>
            </div>
            <div class="grid">
              <div class="item"><span>Book Title</span><strong>${borrowedItem.title}</strong></div>
              <div class="item"><span>Author</span><strong>${borrowedItem.author}</strong></div>
              <div class="item"><span>Borrowed Date</span><strong>${borrowedItem.borrowedDate}</strong></div>
              <div class="item"><span>Collection Time</span><strong>${borrowedItem.pickupAt || 'Not provided'}</strong></div>
              <div class="item"><span>Due Date</span><strong>${borrowedItem.dueDate}</strong></div>
              <div class="item"><span>Status</span><strong><span class="status ${statusClass}">${borrowedItem.status}</span></strong></div>
            </div>
            <div class="approval">
              <div class="sign">
                <span>Approved by Librarian</span>
                <strong>________________________</strong>
              </div>
              <div class="sign">
                <span>Collected by Teacher</span>
                <strong>${TEACHER_INFO.name}</strong>
              </div>
            </div>
          </div>
          <footer class="foot">This official document is generated by the School Management System library module. Keep this receipt for your records and present it at collection if requested.</footer>
        </section>
      </body>
      </html>
    `;
  };

  const downloadReceipt = (borrowedItem) => {
    const receiptContent = buildReceiptMarkup(borrowedItem);

    const blob = new Blob([receiptContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `library_receipt_${borrowedItem.borrowId}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openBorrowModal = (book) => {
    if (book.availableCopies < 1) return;
    setBorrowDraft(book);
    setPickupDate(new Date().toISOString().slice(0, 10));
    setPickupTime('09:00');
    setReservationBorrowId(null);
  };

  const closeBorrowModal = () => {
    setBorrowDraft(null);
    setPickupDate('');
    setPickupTime('');
  };

  const confirmBorrow = () => {
    if (!borrowDraft) return;
    if (!pickupDate || !pickupTime) {
      alert('Please fill collection date and time.');
      return;
    }

    const pickupAt = toPickupDateTime(pickupDate, pickupTime);
    const newBorrowed = borrowBook(borrowDraft.id, pickupAt);
    if (newBorrowed) {
      if (reservationBorrowId) {
        setReservations((prev) => prev.filter((item) => item.reservationId !== reservationBorrowId));
      }
      setReceiptPreview(newBorrowed);
      setActiveTab('borrowed');
    }
    closeBorrowModal();
  };

  const submitReservation = () => {
    const selectedBook = books.find((book) => book.id === Number(reservationBookId));
    if (!selectedBook) return;

    const pickupAt = toPickupDateTime(reservationDate, reservationTime);
    const duplicate = reservations.some(
      (entry) => entry.bookId === selectedBook.id && entry.status === 'Pending'
    );
    if (duplicate) {
      alert('A pending reservation already exists for this book.');
      return;
    }

    const requestedAt = new Date().toISOString().slice(0, 10);
    const nextReservation = {
      reservationId: Date.now(),
      bookId: selectedBook.id,
      title: selectedBook.title,
      author: selectedBook.author,
      requestedAt,
      pickupAt,
      status: 'Pending'
    };

    setReservations((prev) => [nextReservation, ...prev]);
    setHistory((prev) => [
      {
        id: Date.now(),
        action: 'Reserved',
        title: selectedBook.title,
        date: requestedAt,
        details: `Preferred pickup ${pickupAt}`
      },
      ...prev
    ]);
  };

  const cancelReservation = (reservationId) => {
    const selected = reservations.find((item) => item.reservationId === reservationId);
    if (!selected) return;

    setReservations((prev) => prev.filter((item) => item.reservationId !== reservationId));
    setHistory((prev) => [
      {
        id: Date.now(),
        action: 'Reservation Cancelled',
        title: selected.title,
        date: new Date().toISOString().slice(0, 10),
        details: 'Reservation removed'
      },
      ...prev
    ]);
  };

  const borrowFromReservation = (reservation) => {
    const selectedBook = books.find((book) => book.id === reservation.bookId);
    if (!selectedBook || selectedBook.availableCopies < 1) {
      alert('This reserved book is currently unavailable for borrowing.');
      return;
    }

    const [preferredDate, preferredTime] = (reservation.pickupAt || '').split(' ');
    setBorrowDraft(selectedBook);
    setPickupDate(preferredDate || new Date().toISOString().slice(0, 10));
    setPickupTime(preferredTime || '09:00');
    setReservationBorrowId(reservation.reservationId);
  };

  const renderAvailable = () => (
    <section className="library-card">
      <div className="section-title-row">
        <h3>Available Books</h3>
        <button type="button" className="ghost-btn" onClick={() => setCategoryFilter('All Categories')}>View Categories</button>
      </div>

      <div className="books-grid">
        {visibleAvailableBooks.map((book) => (
          <article key={book.id} className="book-card">
            <img src={book.cover} alt={book.title} />
            <div className="book-info">
              <h4>{book.title}</h4>
              <p>{book.author}</p>
              <div className="availability-row">
                <span className={`status-dot ${book.availableCopies > 0 ? 'active' : 'inactive'}`} />
                <span>{book.availableCopies > 0 ? `Available (${book.availableCopies})` : 'Out of Stock'}</span>
              </div>
              <button
                type="button"
                className="primary-btn"
                disabled={book.availableCopies < 1}
                onClick={() => openBorrowModal(book)}
              >
                {book.availableCopies > 0 ? 'Borrow' : 'Unavailable'}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setActiveTab('reservations');
                  setReservationBookId(book.id);
                }}
              >
                Reserve
              </button>
            </div>
          </article>
        ))}
      </div>

      {visibleAvailableBooks.length === 0 && <p className="empty-state">No books found for the selected filters.</p>}
    </section>
  );

  const renderBorrowed = () => (
    <section className="library-card">
      <div className="section-title-row">
        <h3>Borrowed Books</h3>
        <button type="button" className="ghost-btn" onClick={() => setShowHistory((prev) => !prev)}>
          {showHistory ? 'Hide History' : 'Borrowing History'}
        </button>
      </div>

      <div className="borrowed-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Borrowed Date / Due Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleBorrowedBooks.map((item) => (
              <tr key={item.borrowId}>
                <td>{item.title}</td>
                <td>{item.author}</td>
                <td>
                  <div className="date-stack">
                    <span>{item.borrowedDate}</span>
                    <span>Due: {item.dueDate}</span>
                  </div>
                </td>
                <td>
                  <span className={`status-pill ${item.status === 'Overdue' ? 'overdue' : item.status === 'Due Soon' ? 'soon' : 'active'}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="secondary-btn" onClick={() => renewBook(item.borrowId)}>Renew</button>
                    <button type="button" className="secondary-btn" onClick={() => downloadReceipt(item)}>Download Receipt</button>
                    <button type="button" className="primary-btn" onClick={() => returnBook(item.borrowId)}>Return</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleBorrowedBooks.length === 0 && <p className="empty-state">No borrowed books at the moment.</p>}

      {showHistory && (
        <div className="history-panel">
          <h4>Borrowing History</h4>
          {history.length === 0 && <p>No recent history.</p>}
          <ul>
            {history.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.action}</strong>
                <span>{entry.title}</span>
                <small>{entry.date} • {entry.details}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );

  const renderReservations = () => (
    <section className="library-card">
      <div className="section-title-row">
        <h3>Book Reservations</h3>
      </div>

      <div className="reservation-form">
        <label>
          Book
          <select value={reservationBookId} onChange={(event) => setReservationBookId(Number(event.target.value))}>
            {books.map((book) => (
              <option key={book.id} value={book.id}>{book.title} — {book.author}</option>
            ))}
          </select>
        </label>
        <label>
          Preferred Collection Date
          <input type="date" value={reservationDate} onChange={(event) => setReservationDate(event.target.value)} />
        </label>
        <label>
          Preferred Collection Time
          <input type="time" value={reservationTime} onChange={(event) => setReservationTime(event.target.value)} />
        </label>
        <button type="button" className="primary-btn" onClick={submitReservation}>Create Reservation</button>
      </div>

      <div className="borrowed-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Book</th>
              <th>Author</th>
              <th>Requested On</th>
              <th>Preferred Pickup</th>
              <th>Availability</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((item) => {
              const linkedBook = books.find((book) => book.id === item.bookId);
              const isAvailable = linkedBook ? linkedBook.availableCopies > 0 : false;
              return (
                <tr key={item.reservationId}>
                  <td>{item.title}</td>
                  <td>{item.author}</td>
                  <td>{item.requestedAt}</td>
                  <td>{item.pickupAt}</td>
                  <td>
                    <span className={`status-pill ${isAvailable ? 'active' : 'soon'}`}>
                      {isAvailable ? 'Available' : 'Waiting'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        disabled={!isAvailable}
                        onClick={() => borrowFromReservation(item)}
                      >
                        Borrow Now
                      </button>
                      <button type="button" className="ghost-btn" onClick={() => cancelReservation(item.reservationId)}>Cancel</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {reservations.length === 0 && <p className="empty-state">No active reservations.</p>}
    </section>
  );

  return (
    <div className="library-root">
      <div className="library-header">
        <h2>Library</h2>
        <div className="header-controls">
          <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
            <option>All Year</option>
            <option>This Year</option>
          </select>
        </div>
      </div>

      <div className="tabs-row">
        <button type="button" className={activeTab === 'available' ? 'active' : ''} onClick={() => setActiveTab('available')}>Available Books</button>
        <button type="button" className={activeTab === 'borrowed' ? 'active' : ''} onClick={() => setActiveTab('borrowed')}>Borrowed Books</button>
        <button type="button" className={activeTab === 'reservations' ? 'active' : ''} onClick={() => setActiveTab('reservations')}>Reservations</button>
        <span>Total Books: {books.reduce((sum, book) => sum + book.totalCopies, 0)}</span>
      </div>

      <div className="filters-row">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search books, author, category..."
        />
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option>Title</option>
          <option>Author</option>
          <option>Availability</option>
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          {categoryOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </div>

      <div className="library-stats">
        <div><strong>{books.reduce((sum, book) => sum + book.availableCopies, 0)}</strong><span>Available Copies</span></div>
        <div><strong>{borrowedBooks.length}</strong><span>Borrowed Now</span></div>
        <div><strong>{overdueCount}</strong><span>Overdue</span></div>
      </div>

      {activeTab === 'available' && renderAvailable()}
      {activeTab === 'borrowed' && renderBorrowed()}
      {activeTab === 'reservations' && renderReservations()}

      {borrowDraft && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="library-modal">
            <h3>Borrow Request</h3>
            <p>Fill when you will collect this book from the library.</p>
            <div className="borrow-book-preview">
              <strong>{borrowDraft.title}</strong>
              <span>{borrowDraft.author}</span>
            </div>
            <div className="borrow-form-grid">
              <label>
                Collection Date
                <input type="date" value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} />
              </label>
              <label>
                Collection Time
                <input type="time" value={pickupTime} onChange={(event) => setPickupTime(event.target.value)} />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={closeBorrowModal}>Cancel</button>
              <button type="button" className="primary-btn" onClick={confirmBorrow}>Confirm Borrow</button>
            </div>
          </div>
        </div>
      )}

      {receiptPreview && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="library-modal receipt-modal">
            <h3>Borrow Receipt Ready</h3>
            <p>Your borrowing receipt has been generated successfully.</p>
            <div className="receipt-details">
              <div className="receipt-brand-row">
                <img src={SCHOOL_LOGO} alt="School Logo" className="school-logo" />
                <div>
                  <strong>{SCHOOL_NAME}</strong>
                  <p>{SCHOOL_TAGLINE}</p>
                </div>
              </div>
              <div className="receipt-teacher-row">
                <img src={TEACHER_INFO.avatar} alt={TEACHER_INFO.name} className="teacher-avatar" />
                <div>
                  <strong>{TEACHER_INFO.name}</strong>
                  <p>{TEACHER_INFO.role}</p>
                  <p>{TEACHER_INFO.department} • {TEACHER_INFO.id}</p>
                </div>
              </div>
              <span><strong>Receipt:</strong> RCPT-{receiptPreview.borrowId}</span>
              <span><strong>Book:</strong> {receiptPreview.title}</span>
              <span><strong>Pickup:</strong> {receiptPreview.pickupAt}</span>
              <span><strong>Due Date:</strong> {receiptPreview.dueDate}</span>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setReceiptPreview(null)}>Close</button>
              <button type="button" className="primary-btn" onClick={() => downloadReceipt(receiptPreview)}>Download Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;

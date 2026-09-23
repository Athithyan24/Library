# Reading Room

Departmental e-Library for Computer Science. A postgraduate mini project on the MERN stack: MongoDB, Express, React, and Node.

The product is a single reading room used by four roles. The registrar shapes the college. A head of department catalogues books and enrols students for one room only. The librarian runs circulation. Students request, reserve, review, and read.

## Run it

MongoDB should be listening on `mongodb://127.0.0.1:27017`.

```bash
npm install
npm install --prefix server
npm install --prefix client
npm run seed
npm run dev
```

Open http://localhost:5173. The API is http://localhost:5000.

Every demo account uses the password `Library@123`.

| Who | Username |
| --- | --- |
| Registrar | `admin` |
| HOD, Computer Science | `hod.cs` |
| HOD, Artificial Intelligence | `hod.ai` |
| Librarian | `librarian` |
| PG student | `ananya` |
| UG student | `rahul` |

`hod.ai` can catalogue only Artificial Intelligence titles. That is the department boundary.

## A viva path

1. Sign in as `admin`. Open departments, appoint no one new unless you want to, and show UG / PG years.
2. Sign in as `hod.cs`. Enrol a student. The password is shown once. Add a title; it is filed under Computer Science.
3. Sign in as that student, or as `ananya`. Request a book that has copies. Reserve one that does not (`Operating System Concepts`).
4. Sign in as `librarian`. On Circulation, issue the request. The slip is `ISS000148` or the next number. Return Rahul’s overdue operating-systems copy and watch the fine (₹5 a day) and Meera’s queue move to ready.
5. As `ananya`, open a title with a digital copy, leave a review after a loan, and check penalties.

## What is intentionally small

Authentication is JWT plus bcrypt. Roles are checked on the server. There is no OAuth, SSO, or extra encryption layer. Uploaded covers and PDFs stay in `server/uploads`.

Loans last 14 days. Fines are ₹5 per late day, both set in `server/.env`.

# ☕ Odoo Cafe POS — Backend

FastAPI is the **primary API**. Flask runs as a **lightweight proxy/fallback** on a separate port and forwards all requests to FastAPI.

---

## Project Structure

```
odoo_cafe_backend/
├── app/
│   ├── main.py              ← FastAPI entrypoint
│   ├── database.py          ← SQLite + SQLAlchemy setup
│   ├── auth.py              ← JWT helpers
│   ├── schemas/
│   │   └── __init__.py      ← All Pydantic request/response schemas
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py        ← All SQLAlchemy ORM models
│   └── routers/
│       ├── auth.py          ← POST /api/auth/login
│       ├── crud_helper.py   ← Reusable CRUD builder
│       └── resources.py     ← All 9 resource routers
├── flask_app/
│   └── app.py               ← Flask proxy (port 5000 → FastAPI 8000)
├── seed.py                  ← Populate DB with sample data
├── requirements.txt
└── README.md
```

---

## Setup

### 1. Install dependencies
```bash
cd odoo_cafe_backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Seed the database
```bash
python seed.py
```
Creates:
- Admin user → `admin@cafe.com` / `admin123`
- Sample categories, products, floors, tables, payment methods

### 3. Start FastAPI (primary API)
```bash
uvicorn app.main:app --reload --port 8000
```
- API docs: http://localhost:8000/docs
- ReDoc:    http://localhost:8000/redoc

### 4. Start Flask (fallback — optional)
```bash
python flask_app/app.py
```
Flask runs on port **5000** and proxies everything to FastAPI on **8000**. Both must be running for Flask to work.

---

## Auth Flow

```
POST /api/auth/login
Body: { "email": "admin@cafe.com", "password": "admin123" }

Response: { "token": "<jwt>", "user": { "id", "name", "email", "role" } }
```

All other endpoints require the token as a **Bearer** header:
```
Authorization: Bearer <token>
```

---

## API Endpoints

| Resource         | Endpoints                                              |
|------------------|-------------------------------------------------------|
| Auth             | `POST /api/auth/login`                                |
| Categories       | `GET/POST /api/categories`, `GET/PUT/DELETE /:id`     |
| Products         | `GET/POST /api/products`, `GET/PUT/DELETE /:id`       |
| Floors           | `GET/POST /api/floors`, `GET/PUT/DELETE /:id`         |
| Tables           | `GET/POST /api/tables`, `GET/PUT/DELETE /:id`         |
| Bookings         | `GET/POST /api/bookings`, `GET/PUT/DELETE /:id`       |
| Payment Methods  | `GET/POST /api/payment-methods`, `GET/PUT/DELETE /:id`|
| Coupons          | `GET/POST /api/coupons`, `GET/PUT/DELETE /:id`        |
| Promotions       | `GET/POST /api/promotions`, `GET/PUT/DELETE /:id`     |
| Orders           | `GET/POST /api/orders`, `GET/PUT/DELETE /:id`         |

---

## Connecting the Frontend (Zustand)

Per `backend_guide.md` — keep Zustand as a local cache, make actions async:

```ts
// Before (pure Zustand)
addCategory: (cat) => set(state => ({ categories: [...state.categories, cat] }))

// After (API-first)
addCategory: async (cat) => {
  const res = await axios.post('/api/categories', cat, {
    headers: { Authorization: `Bearer ${token}` }
  });
  set(state => ({ categories: [...state.categories, res.data] }));
}
```

Load initial data in your top-level layout:
```ts
useEffect(() => {
  axios.get('/api/categories').then(r => setCategories(r.data));
  axios.get('/api/products').then(r => setProducts(r.data));
  // ...etc
}, []);
```

---

## Environment Variables

| Variable          | Default                    | Description               |
|-------------------|----------------------------|---------------------------|
| `SECRET_KEY`      | `changeme-super-secret-key`| JWT signing secret        |
| `FASTAPI_BASE_URL`| `http://127.0.0.1:8000`   | Flask proxy target        |
| `FLASK_PORT`      | `5000`                     | Flask listening port      |

Create a `.env` file and load with `python-dotenv` or export before running.

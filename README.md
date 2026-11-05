# Sole Society

A responsive sneaker storefront built with React, Vite, and FastAPI.

## Features

- Product catalog served by the FastAPI backend
- Category filtering, favorites, and an interactive shopping bag
- Responsive storefront layout with externally hosted Unsplash sneaker photography
- Basic order endpoint that validates product IDs and quantities

## Run locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

The API is available at `http://localhost:8000`; interactive API docs are at
`http://localhost:8000/docs`.

### Frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`).
The storefront includes a sample catalog fallback if the API is not running.

## API

- `GET /api/health` — health check
- `GET /api/products` — sneaker catalog
- `POST /api/orders` — validate and total an order; accepts
  `{"items":[{"product_id":1,"quantity":2}]}`

Orders are returned as validated quotes and are not persisted. Checkout is a
front-end placeholder; payment processing and inventory management are not
implemented.

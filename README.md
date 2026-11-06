# Sole Society

A responsive sneaker storefront built with React, Vite, and FastAPI.

## Features

- Product catalog served by the FastAPI backend
- Category filtering, live search, price sorting, a saved-favorites filter, and an interactive shopping bag
- Shoe-size selection with the chosen size shown in the shopping bag
- Bag and favorites saved between visits in browser storage
- Shopping bag shows progress toward the $100 free-shipping threshold
- Order submission to the FastAPI API with server-side product and size validation
- Responsive storefront layout with externally hosted Unsplash sneaker photography
- Basic order endpoint that validates product IDs and quantities

## Run locally

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000`; interactive API docs are at
`http://127.0.0.1:8000/docs`.

### Frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`).
The Vite development server proxies `/api` requests to the backend.

## Deploy to an Azure Linux VM

Build the frontend and run the backend from the repository root on the VM:

```bash
cd frontend
npm ci
npm run build

cd ../backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
sudo .venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 80
```

FastAPI serves the built frontend and API from the same origin. In the Azure
portal, add an inbound network security group rule for TCP port `80` (and allow
it in the VM firewall if enabled), then browse to `http://<VM-public-IP>`.
Binding to port 80 requires elevated privileges on Linux. Keep the Uvicorn
process running; for a persistent deployment, run it under a process manager
such as `systemd`.

## API

- `GET /api/health` — health check
- `GET /api/products` — sneaker catalog
- `POST /api/orders` — validate and total an order; accepts
  `{"items":[{"product_id":1,"quantity":2,"size":"8"}]}`

Orders are accepted and totaled for demonstration but are not persisted.
Payment processing and inventory management are not implemented.

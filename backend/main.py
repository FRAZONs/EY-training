from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app = FastAPI(title="Sole Society API", version="1.0.0")

PRODUCTS = [
    {
        "id": 1,
        "name": "Cloud Runner",
        "category": "Running",
        "price": 128,
        "color": "Sail / Volt",
        "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85",
        "badge": "BESTSELLER",
    },
    {
        "id": 2,
        "name": "Everyday Court",
        "category": "Lifestyle",
        "price": 110,
        "color": "Chalk / Stone",
        "image": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1000&q=85",
        "badge": None,
    },
    {
        "id": 3,
        "name": "Retro Pace",
        "category": "Originals",
        "price": 145,
        "color": "Cream / Forest",
        "image": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85",
        "badge": "JUST DROPPED",
    },
    {
        "id": 4,
        "name": "Studio 84",
        "category": "Lifestyle",
        "price": 98,
        "color": "Cloud / Ink",
        "image": "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1000&q=85",
        "badge": None,
    },
]


class OrderItem(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, le=20)
    size: str = Field(pattern=r"^(6|7|8|9|10|11|12)$")


class OrderRequest(BaseModel):
    items: list[OrderItem] = Field(min_length=1)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/products")
def list_products():
    return PRODUCTS


@app.post("/api/orders", status_code=201)
def create_order(order: OrderRequest):
    product_by_id = {product["id"]: product for product in PRODUCTS}
    lines = []
    total = 0

    for item in order.items:
        product = product_by_id.get(item.product_id)
        if product is None:
            raise HTTPException(
                status_code=404, detail=f"Product {item.product_id} was not found"
            )
        line_total = product["price"] * item.quantity
        total += line_total
        lines.append(
            {
                "product_id": product["id"],
                "name": product["name"],
                "size": item.size,
                "quantity": item.quantity,
                "unit_price": product["price"],
                "line_total": line_total,
            }
        )

    return {"status": "received", "items": lines, "total": total}


frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

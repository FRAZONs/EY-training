import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";

const fallbackProducts = [
  {
    id: 1,
    name: "Cloud Runner",
    category: "Running",
    price: 128,
    color: "Sail / Volt",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85",
    badge: "BESTSELLER",
  },
  {
    id: 2,
    name: "Everyday Court",
    category: "Lifestyle",
    price: 110,
    color: "Chalk / Stone",
    image:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 3,
    name: "Retro Pace",
    category: "Originals",
    price: 145,
    color: "Cream / Forest",
    image:
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85",
    badge: "JUST DROPPED",
  },
  {
    id: 4,
    name: "Studio 84",
    category: "Lifestyle",
    price: 98,
    color: "Cloud / Ink",
    image:
      "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1000&q=85",
  },
];

const categories = ["All pairs", "Running", "Lifestyle", "Originals"];
const shoeSizes = ["6", "7", "8", "9", "10", "11", "12"];
const freeShippingThreshold = 100;

function readSavedArray(key) {
  try {
    const saved = window.localStorage.getItem(key);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`Could not restore ${key} from browser storage`, error);
    return [];
  }
}

function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [catalogSource, setCatalogSource] = useState("loading");
  const [activeCategory, setActiveCategory] = useState("All pairs");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("featured");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [cart, setCart] = useState(() => readSavedArray("sole-society-cart"));
  const [selectedSizes, setSelectedSizes] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState(() =>
    readSavedArray("sole-society-favorites"),
  );
  const [notice, setNotice] = useState("");
  const [checkoutPending, setCheckoutPending] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load products");
        return response.json();
      })
      .then((catalog) => {
        setProducts(catalog);
        setCatalogSource("live");
      })
      .catch(() => {
        setCatalogSource("sample");
      });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("sole-society-cart", JSON.stringify(cart));
    } catch (error) {
      console.warn("Could not save your bag to browser storage", error);
    }
  }, [cart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "sole-society-favorites",
        JSON.stringify(favorites),
      );
    } catch (error) {
      console.warn("Could not save favorites to browser storage", error);
    }
  }, [favorites]);

  const shownProducts = useMemo(
    () => {
      const query = searchQuery.trim().toLowerCase();
      const filtered = products.filter((product) => {
        const matchesCategory =
          activeCategory === "All pairs" || product.category === activeCategory;
        const matchesSearch =
          !query ||
          `${product.name} ${product.color} ${product.category}`
            .toLowerCase()
            .includes(query);
        const matchesFavorites =
          !favoritesOnly || favorites.includes(product.id);
        return matchesCategory && matchesSearch && matchesFavorites;
      });
      return filtered.sort((first, second) => {
        if (sortOrder === "price-low") return first.price - second.price;
        if (sortOrder === "price-high") return second.price - first.price;
        if (sortOrder === "name") return first.name.localeCompare(second.name);
        return 0;
      });
    },
    [activeCategory, favorites, favoritesOnly, products, searchQuery, sortOrder],
  );
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const shippingProgress = Math.min(
    (subtotal / freeShippingThreshold) * 100,
    100,
  );
  const amountUntilFreeShipping = Math.max(freeShippingThreshold - subtotal, 0);

  function addToCart(product, size) {
    if (!size) {
      setNotice("Choose a shoe size first");
      window.setTimeout(() => setNotice(""), 2200);
      return;
    }

    setCart((items) => {
      const existing = items.find(
        (item) => item.id === product.id && item.size === size,
      );
      return existing
        ? items.map((item) =>
            item.id === product.id && item.size === size
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...items, { ...product, size, quantity: 1 }];
    });
    setNotice(`${product.name} (US ${size}) added to your bag`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function changeQuantity(productId, size, amount) {
    setCart((items) =>
      items
        .map((item) =>
          item.id === productId && item.size === size
            ? { ...item, quantity: item.quantity + amount }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function toggleFavorite(productId) {
    setFavorites((items) =>
      items.includes(productId)
        ? items.filter((id) => id !== productId)
        : [...items, productId],
    );
  }

  async function submitOrder() {
    if (checkoutPending || cart.length === 0) return;

    setCheckoutPending(true);
    try {
      const response = await fetch("http://localhost:8000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            size: item.size,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : "Your order could not be submitted. Please try again.",
        );
      }

      setCart([]);
      setCartOpen(false);
      setNotice(`Order received · Total $${Number(result.total).toFixed(2)}`);
      window.setTimeout(() => setNotice(""), 3500);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not reach checkout. Please try again.",
      );
      window.setTimeout(() => setNotice(""), 3500);
    } finally {
      setCheckoutPending(false);
    }
  }

  return (
    <>
      <div className="announcement">
        <span>GOOD SHOES. GOOD MOOD.</span>
        <span className="announcement-detail">Free shipping on orders $100+</span>
        <ArrowUpRight size={14} aria-hidden="true" />
      </div>

      <header className="site-header">
        <a className="wordmark" href="#home" aria-label="Sole Society home">
          sole<span>society</span><i>.</i>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#shop">Shop all</a>
          <a href="#shop">New arrivals</a>
          <a href="#story">Our story</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button mobile-menu" aria-label="Open menu">
            <Menu size={21} />
          </button>
          <button
            className="bag-button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open shopping bag, ${cartCount} items`}
          >
            <ShoppingBag size={18} strokeWidth={1.8} />
            <span>Bag</span>
            <span className="bag-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> MADE FOR YOUR EVERYDAY</p>
            <h1>Find your<br />own <em>stride.</em></h1>
            <p className="hero-description">
              Good things happen when you feel good on your feet. Meet the pairs
              made to go wherever you do.
            </p>
            <a className="primary-button" href="#shop">
              FIND YOUR PAIR <ArrowRight size={16} />
            </a>
            <div className="hero-footnote">
              <span>01 — 04</span><span className="footnote-line" /><span>THE EVERYDAY EDIT</span>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1500&q=90"
              alt="A pair of classic sneakers ready for the everyday"
            />
            <div className="image-label"><span>THE EVERYDAY EDIT</span><span>VOL. 01 / 2025</span></div>
            <div className="hero-sticker"><span>WALK</span><span>YOUR</span><span>WAY <ArrowDown size={18} /></span></div>
          </div>
          <div className="hero-index">SS / 001</div>
        </section>

        <section className="benefit-strip" aria-label="Shopping benefits">
          <div><span className="benefit-icon">✳</span> COMFORT THAT GOES THE DISTANCE</div>
          <span className="benefit-divider" />
          <div><span className="benefit-icon">↗</span> FREE SHIPPING ON $100+</div>
          <span className="benefit-divider" />
          <div><span className="benefit-icon">♡</span> 30-DAY EASY RETURNS</div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE GOOD STUFF</p>
              <h2>Pairs worth <em>going places.</em></h2>
            </div>
            <a className="text-link" href="#shop">VIEW ALL <ArrowUpRight size={15} /></a>
          </div>

          <div className="filter-row">
            <div className="category-filters" aria-label="Filter products by category">
              {categories.map((category) => (
                <button
                  className={activeCategory === category ? "filter-chip active" : "filter-chip"}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                >
                  {category}
                </button>
              ))}
              <button
                className={favoritesOnly ? "filter-chip active" : "filter-chip"}
                onClick={() => setFavoritesOnly((enabled) => !enabled)}
                aria-pressed={favoritesOnly}
              >
                <Heart
                  className="favorites-filter-icon"
                  size={13}
                  fill={favoritesOnly ? "currentColor" : "none"}
                  aria-hidden="true"
                />
                Favorites ({favorites.length})
              </button>
            </div>
            <label className="catalog-search">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search sneakers"
                aria-label="Search sneakers by name, color, or category"
              />
            </label>
            <label className="sort-control">
              <span>SORT</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                aria-label="Sort sneakers"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
            <span className="results-count">
              {shownProducts.length} PAIRS{catalogSource === "sample" && " · SAMPLE CATALOG"}
            </span>
          </div>

          <div className="product-grid">
            {shownProducts.map((product, index) => (
              <article className="product-card" key={product.id}>
                <div className="product-image-wrap">
                  <img
                    className="product-image"
                    src={product.image}
                    alt={`${product.name} sneaker in ${product.color}`}
                    loading="lazy"
                  />
                  {product.badge && <span className="product-badge">{product.badge}</span>}
                  <button
                    className={favorites.includes(product.id) ? "favorite-button selected" : "favorite-button"}
                    onClick={() => toggleFavorite(product.id)}
                    aria-label={`${favorites.includes(product.id) ? "Remove" : "Add"} ${product.name} ${favorites.includes(product.id) ? "from" : "to"} favorites`}
                    aria-pressed={favorites.includes(product.id)}
                  >
                    <Heart size={18} fill={favorites.includes(product.id) ? "currentColor" : "none"} />
                  </button>
                  <button
                    className="quick-add"
                    onClick={() => addToCart(product, selectedSizes[product.id])}
                  >
                    QUICK ADD <Plus size={15} />
                  </button>
                </div>
                <div className="product-info">
                  <div><p className="product-category">{product.category}</p><h3>{product.name}</h3></div>
                  <span className="product-price">${product.price}</span>
                </div>
                <p className="product-color">{product.color}</p>
                <label className="size-picker">
                  <span>US SIZE</span>
                  <select
                    value={selectedSizes[product.id] ?? ""}
                    onChange={(event) =>
                      setSelectedSizes((sizes) => ({
                        ...sizes,
                        [product.id]: event.target.value,
                      }))
                    }
                    aria-label={`Choose a US shoe size for ${product.name}`}
                  >
                    <option value="" disabled>Choose size</option>
                    {shoeSizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </label>
                <div className="swatches" aria-label="Available colors"><i /><i /><i /></div>
                <span className="product-index">0{index + 1}</span>
              </article>
            ))}
          </div>
          {shownProducts.length === 0 && (
            <p className="empty-results">
              {favoritesOnly && favorites.length === 0
                ? "No favorites yet. Tap the heart on a sneaker to save it here."
                : "No sneakers match your filters. Try another search or category."}
            </p>
          )}
        </section>

        <section className="story-section" id="story">
          <div className="story-image">
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85"
              alt="Bright sneakers in a sunlit studio"
              loading="lazy"
            />
            <span className="story-image-note">A LITTLE MORE YOU, EVERY STEP.</span>
          </div>
          <div className="story-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> A NOTE FROM US</p>
            <h2>Life's too short<br />for <em>uncomfortable</em><br />shoes.</h2>
            <p>We believe the right pair can change your whole day. So we put comfort first, keep the details thoughtful, and make sneakers you’ll actually want to live in.</p>
            <a className="text-link" href="#shop">GET TO KNOW US <ArrowRight size={15} /></a>
            <span className="story-doodle">S / S</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="wordmark footer-wordmark" href="#home">sole<span>society</span><i>.</i></a>
        <p>TAKE THE LONG WAY HOME.</p>
        <span>© 2025 SOLE SOCIETY</span>
      </footer>

      {notice && <div className="toast"><Check size={16} /> {notice}</div>}

      {cartOpen && (
        <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
          <aside className="cart-drawer" onClick={(event) => event.stopPropagation()} aria-label="Shopping bag">
            <div className="drawer-header">
              <div><p className="eyebrow">YOUR GOOD STUFF</p><h2>Your bag <span>({cartCount})</span></h2></div>
              <button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close bag"><X size={21} /></button>
            </div>
            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingBag size={35} strokeWidth={1.2} />
                <h3>Your next favorite pair is out there.</h3>
                <button className="primary-button" onClick={() => setCartOpen(false)}>KEEP BROWSING <ArrowRight size={15} /></button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={`${item.id}-${item.size}`}>
                      <img src={item.image} alt="" />
                      <div className="cart-item-info">
                        <div className="cart-item-heading"><div><h3>{item.name}</h3><span>{item.color} · US {item.size}</span></div><strong>${item.price}</strong></div>
                        <div className="quantity-control">
                          <button onClick={() => changeQuantity(item.id, item.size, -1)} aria-label={`Remove one ${item.name}, size ${item.size}`}><Minus size={13} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => changeQuantity(item.id, item.size, 1)} aria-label={`Add one ${item.name}, size ${item.size}`}><Plus size={13} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <p><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></p>
                  <div className="shipping-progress">
                    <p>
                      {amountUntilFreeShipping > 0
                        ? `You're $${amountUntilFreeShipping.toFixed(2)} away from free shipping`
                        : "You've unlocked free shipping!"}
                    </p>
                    <div
                      className="shipping-progress-track"
                      role="progressbar"
                      aria-label="Progress toward free shipping"
                      aria-valuemin={0}
                      aria-valuemax={freeShippingThreshold}
                      aria-valuenow={Math.min(subtotal, freeShippingThreshold)}
                    >
                      <span style={{ width: `${shippingProgress}%` }} />
                    </div>
                  </div>
                  <span>Shipping and taxes calculated at checkout.</span>
                  <button
                    className="primary-button checkout-button"
                    onClick={submitOrder}
                    disabled={checkoutPending}
                    aria-busy={checkoutPending}
                  >
                    {checkoutPending ? "SENDING ORDER..." : "PLACE ORDER"}
                    {!checkoutPending && <ArrowRight size={16} />}
                  </button>
                  <p className="checkout-note">Demo checkout — no payment is collected.</p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

export default App;

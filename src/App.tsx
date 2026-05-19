import { useMemo, useState, type FormEvent } from 'react'

const PRICE_PER_M2 = 2450
const PRODUCT_NAME = 'Vidrio inteligente PDLC PrivaView'

type Unit = 'm' | 'cm'

interface CartLine {
  id: string
  widthM: number
  heightM: number
  areaM2: number
  total: number
}

interface CheckoutData {
  nombre: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  cp: string
  notas: string
  tarjeta: string
  vencimiento: string
  cvv: string
}

const emptyCheckout: CheckoutData = {
  nombre: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  cp: '',
  notas: '',
  tarjeta: '',
  vencimiento: '',
  cvv: '',
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n)
}

function toMeters(value: number, unit: Unit) {
  return unit === 'm' ? value : value / 100
}

function generateOrderId() {
  return `PV-${Date.now().toString(36).toUpperCase()}`
}

export default function App() {
  const [unit, setUnit] = useState<Unit>('m')
  const [width, setWidth] = useState('2')
  const [height, setHeight] = useState('1.5')
  const [opaque, setOpaque] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(0)
  const [form, setForm] = useState<CheckoutData>(emptyCheckout)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutData, string>>>({})
  const [orderId, setOrderId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  function navTo(id: string) {
    closeMenu()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const dimensions = useMemo(() => {
    const w = parseFloat(width) || 0
    const h = parseFloat(height) || 0
    const widthM = toMeters(w, unit)
    const heightM = toMeters(h, unit)
    const areaM2 = widthM * heightM
    const total = areaM2 * PRICE_PER_M2
    return { widthM, heightM, areaM2, total, valid: widthM > 0 && heightM > 0 && areaM2 >= 0.25 }
  }, [width, height, unit])

  const cartTotal = cart.reduce((s, item) => s + item.total, 0)

  function addToCart() {
    if (!dimensions.valid) return
    setCart((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        widthM: dimensions.widthM,
        heightM: dimensions.heightM,
        areaM2: dimensions.areaM2,
        total: dimensions.total,
      },
    ])
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((l) => l.id !== id))
  }

  function updateField<K extends keyof CheckoutData>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validateStep(step: number): boolean {
    const next: Partial<Record<keyof CheckoutData, string>> = {}

    if (step === 0) {
      if (!form.nombre.trim()) next.nombre = 'Ingresa tu nombre completo'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Correo electrónico inválido'
      if (form.telefono.replace(/\D/g, '').length < 10) next.telefono = 'Teléfono de al menos 10 dígitos'
    }

    if (step === 1) {
      if (!form.direccion.trim()) next.direccion = 'Ingresa la dirección de envío'
      if (!form.ciudad.trim()) next.ciudad = 'Ingresa la ciudad'
      if (!/^\d{5}$/.test(form.cp.trim())) next.cp = 'Código postal de 5 dígitos'
    }

    if (step === 2) {
      const digits = form.tarjeta.replace(/\s/g, '')
      if (digits.length < 15) next.tarjeta = 'Número de tarjeta inválido'
      if (!/^\d{2}\/\d{2}$/.test(form.vencimiento.trim())) next.vencimiento = 'Formato MM/AA'
      if (!/^\d{3,4}$/.test(form.cvv.trim())) next.cvv = 'CVV inválido'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function goToCheckout() {
    if (cart.length === 0) return
    setShowCheckout(true)
    setCheckoutStep(0)
    document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleCheckoutNext(e: FormEvent) {
    e.preventDefault()
    if (!validateStep(checkoutStep)) return

    if (checkoutStep < 2) {
      setCheckoutStep((s) => s + 1)
      return
    }

    setOrderId(generateOrderId())
    setCart([])
    setForm(emptyCheckout)
    setShowCheckout(false)
    setCheckoutStep(0)
  }

  const stepLabels = ['Contacto', 'Envío', 'Pago']
  const checkoutVisible = showCheckout || cart.length > 0

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <a href="#" className="logo" aria-label="PrivaView inicio" onClick={closeMenu}>
            <img src="/logo.svg" alt="PrivaView Smart Privacy Glass" className="logo-img" />
          </a>
          <nav className="nav nav-desktop" aria-label="Principal">
            <a href="#producto">Producto</a>
            <a href="#nosotros">Nosotros</a>
            <a href="#checkout">Comprar</a>
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="menu-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="nav-mobile"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <span className="menu-icon" aria-hidden />
            </button>
            <button type="button" className="cart-btn" onClick={goToCheckout} aria-label="Ver carrito">
              <span className="cart-btn-label">Carrito</span>
              {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </button>
          </div>
        </div>
        <nav
          id="nav-mobile"
          className={`nav-mobile ${menuOpen ? 'open' : ''}`}
          aria-label="Menú móvil"
        >
          <button type="button" onClick={() => navTo('producto')}>
            Producto
          </button>
          <button type="button" onClick={() => navTo('nosotros')}>
            Nosotros
          </button>
          <button
            type="button"
            onClick={() => {
              goToCheckout()
              closeMenu()
            }}
          >
            Comprar
          </button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-waves" aria-hidden />
        <div className="hero-content">
          <p className="product-badge" style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
            Smart Privacy Glass
          </p>
          <h1>Tecnología y eficiencia en un solo sistema</h1>
          <p>
            PrivaView utiliza tecnología PDLC capaz de modificar automáticamente la transparencia de
            superficies acristaladas mediante control electrónico inteligente.
          </p>
          <div className="hero-features">
            <div className="feature-pill accent">
              <span className="icon" aria-hidden>
                🛡
              </span>
              Privacidad instantánea
            </div>
            <div className="feature-pill">
              <span className="icon" aria-hidden>
                🌡
              </span>
              Control térmico
            </div>
            <div className="feature-pill">
              <span className="icon" aria-hidden>
                ☀
              </span>
              Luz natural optimizada
            </div>
          </div>
        </div>
      </section>

      <section id="producto" className="section">
        <h2 className="section-title">Configura tu vidrio PDLC</h2>
        <p className="section-sub">
          Indica ancho y alto para calcular metros cuadrados. Precio: {formatMoney(PRICE_PER_M2)} / m²
        </p>

        <div className="layout-two layout-product">
          <article className="product-card">
            <span className="product-badge">PDLC</span>
            <h3>{PRODUCT_NAME}</h3>
            <p>
              Lámina inteligente con conmutación eléctrica entre estado transparente y opaco. Ideal
              para oficinas, consultorios y residencias.
            </p>

            <button
              type="button"
              className={`glass-demo ${opaque ? 'opaque' : ''}`}
              onClick={() => setOpaque((o) => !o)}
              aria-pressed={opaque}
              aria-label={
                opaque ? 'Vidrio opaco, clic para transparente' : 'Vidrio transparente, clic para opaco'
              }
            >
              <span className="glass-demo-label">{opaque ? 'Opaco' : 'Transparente'}</span>
              <span className="glass-toggle" aria-hidden />
            </button>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>
              Toca la vista previa para simular el efecto PDLC
            </p>

            <div className="price-tag">
              {formatMoney(PRICE_PER_M2)} <small>/ m²</small>
            </div>

            <div className="unit-toggle" role="group" aria-label="Unidad de medida">
              <button type="button" className={unit === 'm' ? 'active' : ''} onClick={() => setUnit('m')}>
                Metros
              </button>
              <button type="button" className={unit === 'cm' ? 'active' : ''} onClick={() => setUnit('cm')}>
                Centímetros
              </button>
            </div>

            <div className="calc-row">
              <div className="field">
                <label htmlFor="width">Ancho ({unit})</label>
                <input
                  id="width"
                  type="number"
                  min="0.1"
                  step={unit === 'm' ? '0.1' : '1'}
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="height">Alto ({unit})</label>
                <input
                  id="height"
                  type="number"
                  min="0.1"
                  step={unit === 'm' ? '0.1' : '1'}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>

            <div className="calc-summary">
              Área: <strong>{dimensions.areaM2.toFixed(2)} m²</strong>
              <br />
              Dimensiones: {dimensions.widthM.toFixed(2)} m × {dimensions.heightM.toFixed(2)} m
              <br />
              Total estimado: <strong>{formatMoney(dimensions.total)}</strong>
              {!dimensions.valid && (
                <>
                  <br />
                  <span style={{ color: '#f87171' }}>Mínimo 0,25 m² por pedido</span>
                </>
              )}
            </div>

            <button type="button" className="btn btn-primary" disabled={!dimensions.valid} onClick={addToCart}>
              Agregar al carrito
            </button>
          </article>

          <aside className="cart-panel" aria-labelledby="cart-title">
            <h3 id="cart-title" className="section-title" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
              Tu pedido
            </h3>
            {cart.length === 0 ? (
              <p className="cart-empty">Aún no hay piezas en el carrito.</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-details">
                      <strong>{PRODUCT_NAME}</strong>
                      <span>
                        {item.widthM.toFixed(2)} m × {item.heightM.toFixed(2)} m — {item.areaM2.toFixed(2)} m²
                      </span>
                    </div>
                    <div className="cart-item-actions">
                      <strong>{formatMoney(item.total)}</strong>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
                <div className="cart-total">
                  <span>Total</span>
                  <span>{formatMoney(cartTotal)}</span>
                </div>
                <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={goToCheckout}>
                  Finalizar compra
                </button>
              </>
            )}
          </aside>
        </div>
      </section>

      <section id="nosotros" className="section">
        <h2 className="section-title">Misión y visión</h2>
        <p className="section-sub">Comprometidos con espacios inteligentes y sostenibles.</p>
        <div className="about-grid">
          <div className="about-card">
            <h4>Misión</h4>
            <p>
              Desarrollar soluciones inteligentes de privacidad y eficiencia energética mediante
              tecnología innovadora, mejorando confort, seguridad y sostenibilidad.
            </p>
          </div>
          <div className="about-card">
            <h4>Visión</h4>
            <p>
              Ser referente en innovación tecnológica para edificios inteligentes, transformando la
              interacción con los espacios mediante soluciones automatizadas y sostenibles.
            </p>
          </div>
        </div>
      </section>

      <section id="checkout" className="section">
        <h2 className="section-title">Finalizar compra</h2>
        <p className="section-sub">
          Completa tus datos en tres pasos para confirmar el pedido de vidrio PDLC a medida.
        </p>

        {!checkoutVisible ? (
          <p className="cart-empty" style={{ padding: '1rem 0' }}>
            Agrega al menos una pieza al carrito para continuar.
          </p>
        ) : (
          <div className="layout-two layout-checkout">
            <form className="checkout-panel checkout-form" onSubmit={handleCheckoutNext}>
              <div className="checkout-steps" aria-hidden>
                {stepLabels.map((_, i) => (
                  <div
                    key={i}
                    className={`step-dot ${i === checkoutStep ? 'active' : ''} ${i < checkoutStep ? 'done' : ''}`}
                  />
                ))}
              </div>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                Paso {checkoutStep + 1} de 3 — {stepLabels[checkoutStep]}
              </p>

              {checkoutStep === 0 && (
                <>
                  <div className="field">
                    <label htmlFor="nombre">Nombre completo</label>
                    <input
                      id="nombre"
                      value={form.nombre}
                      onChange={(e) => updateField('nombre', e.target.value)}
                      autoComplete="name"
                    />
                    {errors.nombre && <p className="error-text">{errors.nombre}</p>}
                  </div>
                  <div className="field">
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      autoComplete="email"
                    />
                    {errors.email && <p className="error-text">{errors.email}</p>}
                  </div>
                  <div className="field">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      id="telefono"
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => updateField('telefono', e.target.value)}
                      autoComplete="tel"
                    />
                    {errors.telefono && <p className="error-text">{errors.telefono}</p>}
                  </div>
                </>
              )}

              {checkoutStep === 1 && (
                <>
                  <div className="field">
                    <label htmlFor="direccion">Dirección de envío</label>
                    <input
                      id="direccion"
                      value={form.direccion}
                      onChange={(e) => updateField('direccion', e.target.value)}
                      autoComplete="street-address"
                    />
                    {errors.direccion && <p className="error-text">{errors.direccion}</p>}
                  </div>
                  <div className="calc-row">
                    <div className="field">
                      <label htmlFor="ciudad">Ciudad</label>
                      <input
                        id="ciudad"
                        value={form.ciudad}
                        onChange={(e) => updateField('ciudad', e.target.value)}
                        autoComplete="address-level2"
                      />
                      {errors.ciudad && <p className="error-text">{errors.ciudad}</p>}
                    </div>
                    <div className="field">
                      <label htmlFor="cp">Código postal</label>
                      <input
                        id="cp"
                        value={form.cp}
                        onChange={(e) => updateField('cp', e.target.value)}
                        autoComplete="postal-code"
                        maxLength={5}
                      />
                      {errors.cp && <p className="error-text">{errors.cp}</p>}
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="notas">Notas del pedido (opcional)</label>
                    <textarea
                      id="notas"
                      rows={3}
                      value={form.notas}
                      onChange={(e) => updateField('notas', e.target.value)}
                      placeholder="Instrucciones de instalación, horario de entrega..."
                    />
                  </div>
                </>
              )}

              {checkoutStep === 2 && (
                <>
                  <p className="payment-note">
                    Demostración: los datos de pago no se envían a ningún servidor. En producción
                    conecta Stripe o tu pasarela preferida.
                  </p>
                  <div className="field">
                    <label htmlFor="tarjeta">Número de tarjeta</label>
                    <input
                      id="tarjeta"
                      inputMode="numeric"
                      placeholder="0000 0000 0000 0000"
                      value={form.tarjeta}
                      onChange={(e) => updateField('tarjeta', e.target.value)}
                      autoComplete="cc-number"
                    />
                    {errors.tarjeta && <p className="error-text">{errors.tarjeta}</p>}
                  </div>
                  <div className="calc-row">
                    <div className="field">
                      <label htmlFor="vencimiento">Vencimiento</label>
                      <input
                        id="vencimiento"
                        placeholder="MM/AA"
                        value={form.vencimiento}
                        onChange={(e) => updateField('vencimiento', e.target.value)}
                        autoComplete="cc-exp"
                      />
                      {errors.vencimiento && <p className="error-text">{errors.vencimiento}</p>}
                    </div>
                    <div className="field">
                      <label htmlFor="cvv">CVV</label>
                      <input
                        id="cvv"
                        inputMode="numeric"
                        maxLength={4}
                        value={form.cvv}
                        onChange={(e) => updateField('cvv', e.target.value)}
                        autoComplete="cc-csc"
                      />
                      {errors.cvv && <p className="error-text">{errors.cvv}</p>}
                    </div>
                  </div>
                </>
              )}

              <div className="checkout-actions">
                {checkoutStep > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCheckoutStep((s) => s - 1)}
                  >
                    Atrás
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={cart.length === 0}>
                  {checkoutStep < 2 ? 'Continuar' : 'Confirmar pedido'}
                </button>
              </div>
            </form>

            <aside className="cart-panel">
              <h3 className="section-title" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
                Resumen
              </h3>
              {cart.length === 0 ? (
                <p className="cart-empty">Carrito vacío</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <div className="cart-item-details">
                        <span>
                          {item.widthM.toFixed(2)} × {item.heightM.toFixed(2)} m ({item.areaM2.toFixed(2)} m²)
                        </span>
                      </div>
                      <strong>{formatMoney(item.total)}</strong>
                    </div>
                  ))}
                  <div className="cart-total">
                    <span>Total a pagar</span>
                    <span>{formatMoney(cartTotal)}</span>
                  </div>
                </>
              )}
            </aside>
          </div>
        )}
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} PrivaView Smart Privacy Glass — Vidrio PDLC por metro cuadrado
      </footer>

      {orderId && (
        <div className="success-overlay" role="dialog" aria-modal aria-labelledby="success-title">
          <div className="success-card">
            <h2 id="success-title">¡Pedido confirmado!</h2>
            <p>Gracias por tu compra. Te contactaremos para coordinar fabricación e instalación.</p>
            <p className="order-id">{orderId}</p>
            <button type="button" className="btn btn-primary" onClick={() => setOrderId(null)}>
              Seguir comprando
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

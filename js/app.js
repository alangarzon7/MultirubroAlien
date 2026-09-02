// =========================================================
// MULTIRUBRO ALIEN 2.0 - MAIN APPLICATION LOGIC
// =========================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Background Starfield
  new Starfield('star-canvas');

  // Load Store State
  await window.appStore.loadInitialData();

  // Initialize UI Components
  initGreetings();
  initHeader();
  initCategories();
  initPromos();
  initProductCatalog();
  initCartDrawer();
  initImportantSection();
  initAdminModal();
  initSoundToggle();
  initQrModal();
  initFlyerLightbox();
  initGitHubSyncUI();

  // Listen to State Changes
  window.appStore.subscribe((state, event) => {
    updateHeaderUI();
    renderCategories();
    renderPromos();
    renderProducts();
    renderCart();
    renderAdmin();

    if (event === 'cart_add') {
      window.alienAudio.playLaserAdd();
      showToast('🛸 ¡Producto agregado a la nave!', 'success');
      highlightCartButton();
    }
  });

  // Initial UI Render
  updateHeaderUI();
  renderCategories();
  renderPromos();
  renderProducts();
  renderCart();
});

// --- Dynamic Greetings ---
function initGreetings() {
  const greetingEl = document.getElementById('alien-dynamic-greeting');
  if (!greetingEl) return;

  const hour = new Date().getHours();
  let timeGreeting = "¡Saludos Terrícola!";
  if (hour >= 6 && hour < 12) {
    timeGreeting = "¡Buen día Terrícola!";
  } else if (hour >= 12 && hour < 20) {
    timeGreeting = "¡Buenas tardes Terrícola!";
  } else {
    timeGreeting = "¡Buenas noches Terrícola!";
  }

  greetingEl.innerHTML = `
    <span class="inline-flex items-center gap-1.5 text-emerald-400 font-orbitron font-semibold text-xs md:text-sm">
      <span class="animate-bounce">👽</span> ${timeGreeting} <span class="hidden sm:inline text-purple-300 font-normal">| Nave nodriza 24Hs activa</span>
    </span>
  `;
}

// --- Header UI & Real-time Search ---
function initHeader() {
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear-btn');
  const cartBtn = document.getElementById('header-cart-btn');
  const floatingCartBtn = document.getElementById('floating-mobile-cart');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      window.appStore.setSearchQuery(e.target.value);
      if (searchClear) {
        searchClear.classList.toggle('hidden', !e.target.value);
      }
    });
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      window.appStore.setSearchQuery('');
      searchClear.classList.add('hidden');
      searchInput.focus();
    });
  }

  if (cartBtn) {
    cartBtn.addEventListener('click', () => openCart());
  }

  if (floatingCartBtn) {
    floatingCartBtn.addEventListener('click', () => openCart());
  }
}

function updateHeaderUI() {
  const config = window.appStore.config;
  if (!config) return;

  // Update Store Title and Address
  const storeNameEls = document.querySelectorAll('.store-name-text');
  storeNameEls.forEach(el => el.textContent = config.storeName || 'Multirubro Alien');

  const addressEls = document.querySelectorAll('.store-address-text');
  addressEls.forEach(el => el.textContent = config.address || 'Pellegrini 146');

  const gmapsLinks = document.querySelectorAll('.gmaps-link');
  gmapsLinks.forEach(link => {
    link.href = config.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address || 'Pellegrini 146')}`;
  });

  const wspLinks = document.querySelectorAll('.wsp-direct-link');
  const defaultWspUrl = buildWhatsAppUrl(config.whatsapp, '🛸 ¡Hola Multirubro Alien! Vengo de la web y tengo una consulta:');
  wspLinks.forEach(link => {
    link.href = defaultWspUrl;
  });

  // Update Cart Counters
  const count = window.appStore.getCartCount();
  const cartCounters = document.querySelectorAll('.cart-count-badge');
  cartCounters.forEach(badge => {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  });

  // Update Cart Total Badge
  const subtotal = window.appStore.getCartSubtotal();
  const cartSubtotalBadges = document.querySelectorAll('.cart-header-subtotal');
  cartSubtotalBadges.forEach(badge => {
    badge.textContent = formatCurrency(subtotal);
  });

  // Floating mobile cart visibility
  const floatingCart = document.getElementById('floating-mobile-cart');
  if (floatingCart) {
    floatingCart.classList.toggle('hidden', count === 0);
  }
}

function highlightCartButton() {
  const cartBtn = document.getElementById('header-cart-btn');
  if (cartBtn) {
    cartBtn.classList.add('scale-110', 'ring-4', 'ring-emerald-400');
    setTimeout(() => {
      cartBtn.classList.remove('scale-110', 'ring-4', 'ring-emerald-400');
    }, 400);
  }
}

// --- Category Bar with Scroll Buttons ---
function initCategories() {
  const container = document.getElementById('categories-container');
  const scrollLeftBtn = document.getElementById('cat-scroll-left-btn');
  const scrollRightBtn = document.getElementById('cat-scroll-right-btn');

  if (container) {
    container.addEventListener('click', (e) => {
      const pill = e.target.closest('.category-pill');
      if (!pill) return;
      const cat = pill.dataset.category;
      window.appStore.setCategory(cat);

      // Scroll selected pill into view
      pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  }

  if (scrollLeftBtn && container) {
    scrollLeftBtn.addEventListener('click', () => {
      container.scrollBy({ left: -220, behavior: 'smooth' });
    });
  }

  if (scrollRightBtn && container) {
    scrollRightBtn.addEventListener('click', () => {
      container.scrollBy({ left: 220, behavior: 'smooth' });
    });
  }
}

function renderCategories() {
  const container = document.getElementById('categories-container');
  if (!container) return;

  const currentCat = window.appStore.selectedCategory;
  const categories = window.appStore.config?.categories || [];

  let html = `
    <button data-category="ALL" class="category-pill px-4 py-2 rounded-xl text-xs md:text-sm font-orbitron font-bold border shrink-0 ${currentCat === 'ALL' ? 'active' : 'border-purple-500/30 bg-purple-950/40 text-gray-300 hover:border-emerald-400/60 hover:text-white'}">
      🛸 Todos los Productos
    </button>
  `;

  categories.forEach(cat => {
    const isActive = currentCat === cat;
    html += `
      <button data-category="${escapeHtml(cat)}" class="category-pill px-4 py-2 rounded-xl text-xs md:text-sm font-orbitron font-bold border shrink-0 ${isActive ? 'active' : 'border-purple-500/30 bg-purple-950/40 text-gray-300 hover:border-emerald-400/60 hover:text-white'}">
        ${escapeHtml(cat)}
      </button>
    `;
  });

  container.innerHTML = html;

  // Update Category Section Title
  const catTitleEl = document.getElementById('current-category-title');
  if (catTitleEl) {
    catTitleEl.textContent = currentCat === 'ALL' ? 'Catálogo de Productos' : `Catálogo • ${currentCat}`;
  }
}

// --- Promos Flyers Section ---
function initPromos() {
  const container = document.getElementById('promos-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const zoomBtn = e.target.closest('.view-flyer-btn');
    const flyerCard = e.target.closest('.promo-flyer-card');

    if (zoomBtn || flyerCard) {
      const bannerId = (zoomBtn || flyerCard).dataset.bannerId;
      const banner = (window.appStore.config?.promoBanners || []).find(b => b.id === bannerId);
      if (banner) {
        openFlyerLightbox(banner);
      }
    }
  });
}

function renderPromos() {
  const container = document.getElementById('promos-container');
  const titleEl = document.getElementById('promos-section-title');
  if (!container) return;

  if (titleEl && window.appStore.config?.heroPromoTitle) {
    titleEl.textContent = window.appStore.config.heroPromoTitle;
  }

  const banners = window.appStore.getPromoBanners();
  if (banners.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-8 text-center text-gray-400 font-orbitron text-sm">
        🛸 Próximamente nuevos flyers y promos intergalácticas...
      </div>
    `;
    return;
  }

  container.innerHTML = banners.map(b => `
    <div data-banner-id="${b.id}" class="promo-flyer-card group cursor-pointer flex flex-col justify-between">
      <!-- Flyer Image Container -->
      <div class="relative overflow-hidden bg-black/80 aspect-[4/5] sm:aspect-[3/4] flex items-center justify-center">
        <img src="${b.image || 'assets/flyer_domingo.jpg'}" alt="${escapeHtml(b.title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onerror="this.src='assets/flyer_domingo.jpg'">
        
        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none"></div>

        <!-- Top Badge -->
        <div class="absolute top-3 left-3 bg-gradient-to-r from-emerald-500 to-green-600 text-black font-orbitron font-extrabold text-[11px] px-3 py-1 rounded-full shadow-lg">
          ${escapeHtml(b.badge || '🔥 PROMO')}
        </div>

        <!-- Hover Zoom Hint -->
        <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <span class="bg-emerald-500 text-black font-orbitron font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <span>Ver Flyer en Grande</span>
            <span>🔍</span>
          </span>
        </div>

        <!-- Bottom Title Overlay -->
        <div class="absolute bottom-3 left-3 right-3 text-left">
          <h4 class="font-orbitron font-bold text-white text-base leading-tight drop-shadow-md">${escapeHtml(b.title)}</h4>
          ${b.subtitle ? `<p class="text-[11px] text-gray-300 line-clamp-2 mt-1 drop-shadow">${escapeHtml(b.subtitle)}</p>` : ''}
        </div>
      </div>

      <!-- Action Footer -->
      <div class="p-3 bg-[#0f0722] border-t border-purple-500/20 flex items-center justify-between gap-2">
        <span class="text-[10px] font-tech text-emerald-400">MULTIRUBRO ALIEN 24HS</span>
        
        <button data-banner-id="${b.id}" class="view-flyer-btn btn-alien-glow px-3 py-1.5 rounded-lg text-[11px] font-orbitron flex items-center gap-1">
          <span>Ver Promo</span>
          <span>🔍</span>
        </button>
      </div>
    </div>
  `).join('');
}

// --- Flyer Lightbox Modal ---
function initFlyerLightbox() {
  const modal = document.getElementById('flyer-lightbox-modal');
  const closeBtn = document.getElementById('close-lightbox-btn');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });
  }
}

function openFlyerLightbox(banner) {
  const modal = document.getElementById('flyer-lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const title = document.getElementById('lightbox-title');
  const subtitle = document.getElementById('lightbox-subtitle');
  const wspBtn = document.getElementById('lightbox-wsp-btn');

  if (modal && img) {
    img.src = banner.image || 'assets/flyer_domingo.jpg';
    if (title) title.textContent = banner.title;
    if (subtitle) subtitle.textContent = banner.subtitle || '';
    
    if (wspBtn) {
      const config = window.appStore.config;
      const customText = banner.wspText || `🛸 ¡Hola Multirubro Alien! Quiero pedir la promo de: ${banner.title}`;
      wspBtn.href = buildWhatsAppUrl(config.whatsapp, customText);
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

// --- Product Catalog Grid ---
function initProductCatalog() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  container.addEventListener('click', (e) => {
    // Add to cart click
    const addBtn = e.target.closest('.product-add-btn');
    if (addBtn) {
      const prodId = addBtn.dataset.productId;
      const qtyInput = document.getElementById(`qty-${prodId}`);
      const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
      window.appStore.addToCart(prodId, qty);
      return;
    }

    // Plus quantity
    const plusBtn = e.target.closest('.qty-plus-btn');
    if (plusBtn) {
      const prodId = plusBtn.dataset.productId;
      const input = document.getElementById(`qty-${prodId}`);
      if (input) {
        input.value = Math.min(99, (parseInt(input.value, 10) || 1) + 1);
      }
      return;
    }

    // Minus quantity
    const minusBtn = e.target.closest('.qty-minus-btn');
    if (minusBtn) {
      const prodId = minusBtn.dataset.productId;
      const input = document.getElementById(`qty-${prodId}`);
      if (input) {
        input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
      }
      return;
    }
  });
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const countHeader = document.getElementById('products-count-header');
  if (!grid) return;

  const products = window.appStore.getFilteredProducts();

  if (countHeader) {
    countHeader.textContent = `Mostrando ${products.length} productos en la nave`;
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center space-y-4 glass-card rounded-2xl p-8 border border-purple-500/30">
        <div class="text-5xl animate-bounce">🛸</div>
        <h3 class="font-orbitron font-bold text-xl text-white">No se encontraron productos</h3>
        <p class="text-sm text-gray-400 max-w-md mx-auto">No hallamos ítems con los filtros o búsqueda actuales. Prueba cambiando la categoría o término.</p>
        <button onclick="window.appStore.setCategory('ALL'); window.appStore.setSearchQuery(''); document.getElementById('search-input').value='';" class="btn-purple-glow px-6 py-2.5 rounded-xl text-xs font-orbitron">
          Restablecer Catálogo 🚀
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(p => {
    const isOut = p.inStock === false;

    return `
      <div class="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border ${isOut ? 'border-red-500/30 out-of-stock-card' : 'border-purple-500/30'} group">
        
        <!-- Product Image & Badges -->
        <div class="relative h-44 sm:h-52 bg-purple-950/40 overflow-hidden">
          <img src="${p.image || 'assets/logo.jpg'}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onerror="this.src='assets/logo.jpg'">
          
          <div class="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            ${isOut ? `
              <span class="bg-red-600/90 text-white font-orbitron font-black text-[10px] px-2.5 py-1 rounded-md shadow-lg backdrop-blur-sm border border-red-400">
                ⛔ Stock Agotado por el momento
              </span>
            ` : p.badge ? `
              <span class="bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 text-black font-orbitron font-extrabold text-[10px] px-2.5 py-1 rounded-md shadow-md backdrop-blur-sm">
                ${escapeHtml(p.badge)}
              </span>
            ` : ''}
          </div>

          <div class="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-orbitron text-purple-300 border border-purple-500/30">
            ${escapeHtml(p.category)}
          </div>
        </div>

        <!-- Product Details -->
        <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <h4 class="font-orbitron font-bold text-white text-sm sm:text-base line-clamp-2">${escapeHtml(p.name)}</h4>
            <p class="text-xs text-gray-300 line-clamp-2 mt-1 leading-relaxed">${escapeHtml(p.description || '')}</p>
          </div>

          <!-- Price & Quantity Controls -->
          <div class="pt-3 border-t border-purple-500/20 space-y-2.5">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] font-tech text-gray-400">PRECIO</span>
                <div class="font-orbitron font-black text-xl text-emerald-400 glow-alien-text">${formatCurrency(p.price)}</div>
              </div>

              ${!isOut ? `
                <div class="flex items-center bg-black/60 border border-purple-500/40 rounded-lg p-1">
                  <button data-product-id="${p.id}" class="qty-minus-btn w-6 h-6 rounded bg-purple-900/60 hover:bg-purple-700 text-white text-xs flex items-center justify-center active:scale-95">-</button>
                  <input id="qty-${p.id}" type="number" value="1" min="1" max="99" class="w-8 text-center bg-transparent text-xs font-orbitron font-bold text-white focus:outline-none" readonly>
                  <button data-product-id="${p.id}" class="qty-plus-btn w-6 h-6 rounded bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold flex items-center justify-center active:scale-95">+</button>
                </div>
              ` : ''}
            </div>

            <!-- Action Button -->
            ${isOut ? `
              <button disabled class="w-full py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-gray-400 text-xs font-orbitron font-bold cursor-not-allowed">
                Agotado Temporalmente ⛔
              </button>
            ` : `
              <button data-product-id="${p.id}" class="product-add-btn btn-alien-glow w-full py-2.5 rounded-xl text-xs font-orbitron font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg">
                <span>Agregar al Carrito</span>
                <span>🛒</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --- Important Section ---
function initImportantSection() {
  const section = document.getElementById('important-notice-section');
  if (!section) return;

  section.innerHTML = `
    <div class="glass-card rounded-2xl p-6 md:p-8 border-2 border-emerald-500/40 relative overflow-hidden shadow-[0_0_30px_rgba(0,255,102,0.1)]">
      <div class="absolute -right-10 -bottom-10 opacity-10 text-9xl select-none pointer-events-none">👽</div>
      
      <div class="flex items-center gap-3 mb-4">
        <span class="text-3xl">⚠️</span>
        <h3 class="font-orbitron font-black text-lg md:text-2xl text-emerald-400 glow-alien-text">
          INFORMACIÓN IMPORTANTE PARA COMPRAS Y ENTREGAS
        </h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs md:text-sm text-gray-200">
        <div class="bg-black/40 p-4 rounded-xl border border-emerald-500/20 flex gap-3 items-start">
          <span class="text-2xl">💳</span>
          <div>
            <strong class="font-orbitron text-emerald-300 block mb-1">1. Verificación de Pagos</strong>
            Los pedidos se despachan y preparan únicamente una vez verificado y acreditado el pago por transferencia bancaria o Mercado Pago.
          </div>
        </div>

        <div class="bg-black/40 p-4 rounded-xl border border-emerald-500/20 flex gap-3 items-start">
          <span class="text-2xl">📸</span>
          <div>
            <strong class="font-orbitron text-emerald-300 block mb-1">2. Envío de Comprobante</strong>
            Una vez enviado el pedido automático por WhatsApp, deberás adjuntar en el mismo chat la captura/comprobante de la transferencia.
          </div>
        </div>

        <div class="bg-black/40 p-4 rounded-xl border border-emerald-500/20 flex gap-3 items-start">
          <span class="text-2xl">🏬</span>
          <div>
            <strong class="font-orbitron text-emerald-300 block mb-1">3. Retiro en Local</strong>
            Si seleccionas retiro en el local (Pellegrini 146), es <span class="text-emerald-400 font-bold">OBLIGATORIO</span> presentarse con Nombre, Apellido completo y DNI.
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- Cart Drawer & WhatsApp Checkout ---
function initCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  const closeBtn = document.getElementById('close-cart-btn');

  if (closeBtn) closeBtn.addEventListener('click', () => closeCart());
  if (backdrop) backdrop.addEventListener('click', () => closeCart());

  // Delivery mode radio switcher
  const pickupRadio = document.getElementById('delivery-pickup');
  const deliveryRadio = document.getElementById('delivery-ship');

  if (pickupRadio) {
    pickupRadio.addEventListener('change', () => {
      window.appStore.setDeliveryMode('pickup');
    });
  }
  if (deliveryRadio) {
    deliveryRadio.addEventListener('change', () => {
      window.appStore.setDeliveryMode('delivery');
    });
  }

  // Customer info inputs
  const nameInput = document.getElementById('client-name');
  const dniInput = document.getElementById('client-dni');
  const streetInput = document.getElementById('client-street');
  const numberInput = document.getElementById('client-number');
  const notesInput = document.getElementById('client-notes');

  const saveInputs = () => {
    window.appStore.saveCustomerInfo({
      name: nameInput?.value || '',
      dni: dniInput?.value || '',
      street: streetInput?.value || '',
      number: numberInput?.value || '',
      notes: notesInput?.value || ''
    });
  };

  [nameInput, dniInput, streetInput, numberInput, notesInput].forEach(inp => {
    if (inp) inp.addEventListener('input', saveInputs);
  });

  // Copy Alias Button
  const copyAliasBtn = document.getElementById('copy-alias-btn');
  if (copyAliasBtn) {
    copyAliasBtn.addEventListener('click', () => {
      const alias = window.appStore.config?.alias || 'ALIENS.MULTIRUBRO.MP';
      navigator.clipboard.writeText(alias).then(() => {
        window.alienAudio.playChimeCopy();
        showToast(`✅ ¡Alias copiado: ${alias}!`, 'success');
        copyAliasBtn.innerHTML = `<span>¡Copiado!</span> <span>✨</span>`;
        setTimeout(() => {
          copyAliasBtn.innerHTML = `<span>Copiar Alias</span> <span>📋</span>`;
        }, 2000);
      });
    });
  }

  // View QR Button
  const viewQrBtn = document.getElementById('view-qr-btn');
  if (viewQrBtn) {
    viewQrBtn.addEventListener('click', () => {
      openQrModal();
    });
  }

  // WhatsApp Checkout Trigger
  const sendWspBtn = document.getElementById('checkout-whatsapp-btn');
  if (sendWspBtn) {
    sendWspBtn.addEventListener('click', () => {
      handleWhatsAppCheckout();
    });
  }

  // Cart item controls delegation
  const itemsContainer = document.getElementById('cart-items-list');
  if (itemsContainer) {
    itemsContainer.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;

      const prodId = target.dataset.productId;
      if (target.classList.contains('cart-item-plus')) {
        const item = window.appStore.cart.find(i => i.productId === prodId);
        if (item) window.appStore.updateCartQuantity(prodId, item.quantity + 1);
      } else if (target.classList.contains('cart-item-minus')) {
        const item = window.appStore.cart.find(i => i.productId === prodId);
        if (item) window.appStore.updateCartQuantity(prodId, item.quantity - 1);
      } else if (target.classList.contains('cart-item-remove')) {
        window.appStore.removeFromCart(prodId);
      }
    });
  }
}

function openCart() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeCart() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (drawer && backdrop) {
    drawer.classList.add('translate-x-full');
    backdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function renderCart() {
  const itemsContainer = document.getElementById('cart-items-list');
  const emptyMessage = document.getElementById('cart-empty-message');
  const footerSection = document.getElementById('cart-footer-section');
  const deliveryFields = document.getElementById('delivery-address-fields');
  const pickupFields = document.getElementById('pickup-dni-fields');

  if (!itemsContainer) return;

  const items = window.appStore.getCartItemsDetailed();
  const subtotal = window.appStore.getCartSubtotal();
  const shipping = window.appStore.getShippingCost();
  const total = window.appStore.getCartTotal();
  const deliveryMode = window.appStore.deliveryMode;
  const config = window.appStore.config;

  // Toggle Delivery fields visibility
  if (deliveryFields && pickupFields) {
    if (deliveryMode === 'delivery') {
      deliveryFields.classList.remove('hidden');
      pickupFields.classList.add('hidden');
    } else {
      deliveryFields.classList.add('hidden');
      pickupFields.classList.remove('hidden');
    }
  }

  // Update Alias in Drawer
  const aliasDisplay = document.getElementById('cart-alias-display');
  if (aliasDisplay && config) {
    aliasDisplay.textContent = config.alias || 'ALIENS.MULTIRUBRO.MP';
  }

  if (items.length === 0) {
    if (emptyMessage) emptyMessage.classList.remove('hidden');
    if (footerSection) footerSection.classList.add('hidden');
    itemsContainer.innerHTML = '';
    return;
  }

  if (emptyMessage) emptyMessage.classList.add('hidden');
  if (footerSection) footerSection.classList.remove('hidden');

  // Render items list
  itemsContainer.innerHTML = items.map(item => `
    <div class="flex items-center gap-3 p-3 bg-purple-950/40 rounded-xl border border-purple-500/30">
      <img src="${item.product.image || 'assets/logo.jpg'}" alt="${escapeHtml(item.product.name)}" class="w-14 h-14 rounded-lg object-cover border border-purple-500/40" onerror="this.src='assets/logo.jpg'">
      
      <div class="flex-1 min-w-0">
        <h5 class="font-orbitron text-xs text-white font-bold truncate">${escapeHtml(item.product.name)}</h5>
        <div class="text-[11px] text-gray-400 font-tech">${formatCurrency(item.product.price)} c/u</div>
        <div class="text-xs font-orbitron font-black text-emerald-400 mt-0.5">${formatCurrency(item.product.price * item.quantity)}</div>
      </div>

      <div class="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-purple-500/40">
        <button data-product-id="${item.productId}" class="cart-item-minus text-white hover:text-emerald-400 font-bold px-1 text-sm">-</button>
        <span class="text-xs font-orbitron font-bold text-white px-1.5">${item.quantity}</span>
        <button data-product-id="${item.productId}" class="cart-item-plus text-white hover:text-emerald-400 font-bold px-1 text-sm">+</button>
      </div>

      <button data-product-id="${item.productId}" class="cart-item-remove text-gray-400 hover:text-red-400 p-1.5 text-sm" title="Eliminar ítem">
        🗑️
      </button>
    </div>
  `).join('');

  // Update Subtotal, Shipping, Total
  const subtotalEl = document.getElementById('cart-subtotal-val');
  const shippingEl = document.getElementById('cart-shipping-val');
  const totalEl = document.getElementById('cart-total-val');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (shippingEl) {
    if (deliveryMode === 'pickup') {
      shippingEl.textContent = 'Gratis ($0)';
    } else if (shipping === 0 && config.freeShippingMinimum) {
      shippingEl.textContent = '¡Envío Gratis! 🎉';
    } else {
      shippingEl.textContent = formatCurrency(shipping);
    }
  }
  if (totalEl) totalEl.textContent = formatCurrency(total);
}

// --- WhatsApp Helpers & Checkout ---
function getCleanWhatsAppPhone(phone) {
  if (!phone) return '5491112345678';
  let cleaned = String(phone).replace(/\D/g, ''); // Remove all non-digits (+, spaces, dashes)
  
  // If user entered e.g. 2901123456 (10 digits) without 549, format for Argentina WhatsApp:
  if (cleaned.length === 10 && !cleaned.startsWith('54')) {
    cleaned = '549' + cleaned;
  } else if (cleaned.startsWith('54') && !cleaned.startsWith('549') && cleaned.length === 12) {
    cleaned = '549' + cleaned.substring(2);
  }
  return cleaned;
}

function buildWhatsAppUrl(phone, message) {
  const cleanPhone = getCleanWhatsAppPhone(phone);
  const encodedMsg = encodeURIComponent(message);
  // api.whatsapp.com is universally supported on desktop, mobile Chrome, and mobile Safari
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
}

function openWhatsApp(url) {
  // Use anchor click method to avoid popup blockers in mobile Safari/Chrome
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleWhatsAppCheckout() {
  const items = window.appStore.getCartItemsDetailed();
  if (items.length === 0) {
    showToast('⚠️ Tu carrito está vacío', 'error');
    return;
  }

  const info = window.appStore.customerInfo;
  const deliveryMode = window.appStore.deliveryMode;
  const config = window.appStore.config;

  if (!info.name || info.name.trim() === '') {
    showToast('⚠️ Por favor ingresa tu Nombre y Apellido', 'error');
    const nameInput = document.getElementById('client-name');
    if (nameInput) nameInput.focus();
    return;
  }

  if (deliveryMode === 'pickup' && (!info.dni || info.dni.trim() === '')) {
    showToast('⚠️ Para retiro en local el DNI es obligatorio', 'error');
    const dniInput = document.getElementById('client-dni');
    if (dniInput) dniInput.focus();
    return;
  }

  if (deliveryMode === 'delivery' && (!info.street || info.street.trim() === '')) {
    showToast('⚠️ Por favor ingresa la calle de entrega', 'error');
    const streetInput = document.getElementById('client-street');
    if (streetInput) streetInput.focus();
    return;
  }

  window.alienAudio.playTeleportOrder();

  const subtotal = window.appStore.getCartSubtotal();
  const shipping = window.appStore.getShippingCost();
  const total = window.appStore.getCartTotal();

  let msg = `🛸 *NUEVO PEDIDO - MULTIRUBRO ALIEN 24HS* 👽\n`;
  msg += `=====================================\n`;
  msg += `👤 *Cliente:* ${info.name}\n`;
  if (info.dni) {
    msg += `🆔 *DNI:* ${info.dni}\n`;
  }
  msg += `📍 *Modalidad:* ${deliveryMode === 'delivery' ? '🛵 Envío a Domicilio' : '🏬 Retiro en Local (Pellegrini 146)'}\n`;
  
  if (deliveryMode === 'delivery') {
    msg += `🏠 *Dirección:* ${info.street} ${info.number || ''}\n`;
  }
  if (info.notes) {
    msg += `📝 *Aclaraciones:* ${info.notes}\n`;
  }

  msg += `\n🛒 *DETALLE DEL PEDIDO:*\n`;
  items.forEach(item => {
    msg += ` • ${item.quantity}x ${item.product.name} - ${formatCurrency(item.product.price * item.quantity)}\n`;
  });

  msg += `\n💵 *Subtotal:* ${formatCurrency(subtotal)}\n`;
  msg += `🛵 *Costo de Envío:* ${deliveryMode === 'pickup' ? '$0 (Retiro en local)' : formatCurrency(shipping)}\n`;
  msg += `💰 *TOTAL A TRANSFERIR:* ${formatCurrency(total)}\n`;
  msg += `\n💳 *Alias para Transferencia:* \`${config.alias || 'ALIENS.MULTIRUBRO.MP'}\`\n`;
  msg += `🏦 *Titular:* ${config.accountHolder || 'Multirubro Alien 24Hs'}\n`;
  msg += `=====================================\n`;
  msg += `⚠️ *IMPORTANTE:* En breve te envío el comprobante de la transferencia por este chat para que puedan preparar y despachar mi pedido. ¡Muchas gracias! 🚀`;

  const wspUrl = buildWhatsAppUrl(config.whatsapp, msg);
  
  showToast('🚀 ¡Abriendo WhatsApp con tu pedido!', 'success');
  openWhatsApp(wspUrl);
}

// --- QR Modal for Instant Payments ---
function initQrModal() {
  const qrModal = document.getElementById('qr-modal');
  const closeBtn = document.getElementById('close-qr-modal-btn');

  if (closeBtn && qrModal) {
    closeBtn.addEventListener('click', () => {
      qrModal.classList.add('hidden');
    });
  }
}

function openQrModal() {
  const qrModal = document.getElementById('qr-modal');
  const canvas = document.getElementById('qr-canvas-element');
  const aliasText = document.getElementById('qr-modal-alias');
  const alias = window.appStore.config?.alias || 'ALIENS.MULTIRUBRO.MP';

  if (qrModal && canvas) {
    if (aliasText) aliasText.textContent = alias;
    if (window.generateQrCanvas) {
      window.generateQrCanvas(alias, canvas);
    }
    qrModal.classList.remove('hidden');
  }
}

// --- Sound Toggle ---
function initSoundToggle() {
  const soundToggles = document.querySelectorAll('.sound-toggle-btn');
  const updateIcons = () => {
    soundToggles.forEach(btn => {
      btn.textContent = window.alienAudio.muted ? '🔇' : '🔊';
      btn.title = window.alienAudio.muted ? 'Activar Sonidos Espaciales' : 'Silenciar Sonidos';
    });
  };

  soundToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const isMuted = window.alienAudio.toggleMute();
      updateIcons();
      showToast(isMuted ? '🔇 Sonidos desactivados' : '🔊 Sonidos espaciales activados', 'info');
    });
  });

  updateIcons();
}

// --- GitHub Sync UI & Actions ---
function initGitHubSyncUI() {
  const saveTokenBtn = document.getElementById('save-gh-token-btn');
  const tokenInput = document.getElementById('gh-token-input');
  const globalSyncBtn = document.getElementById('global-sync-github-btn');

  if (tokenInput) {
    tokenInput.value = window.githubSync.getToken();
  }

  updateGitHubStatusBadge();

  if (saveTokenBtn && tokenInput) {
    saveTokenBtn.addEventListener('click', () => {
      const token = tokenInput.value.trim();
      if (!token) {
        showToast('⚠️ Ingresa un token válido', 'error');
        return;
      }
      window.githubSync.setToken(token);
      updateGitHubStatusBadge();
      showToast('🔑 Token de GitHub guardado en este navegador', 'success');
    });
  }

  if (globalSyncBtn) {
    globalSyncBtn.addEventListener('click', async () => {
      await performGlobalGitHubSync();
    });
  }
}

function updateGitHubStatusBadge() {
  const badge = document.getElementById('gh-status-badge');
  if (!badge) return;

  if (window.githubSync.isConfigured()) {
    badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-tech font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    badge.textContent = '🟢 Conectado a GitHub';
  } else {
    badge.className = 'text-[10px] px-2 py-0.5 rounded-full font-tech font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
    badge.textContent = '⚠️ Token pendiente';
  }
}

async function performGlobalGitHubSync() {
  const syncBtn = document.getElementById('global-sync-github-btn');
  if (!window.githubSync.isConfigured()) {
    showToast('⚠️ Configura tu Token de GitHub en la pestaña "🔑 Conexión GitHub"', 'error');
    const ghTabBtn = document.querySelector('[data-tab-target="admin-tab-github"]');
    if (ghTabBtn) ghTabBtn.click();
    return;
  }

  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<span>⏳ Sincronizando con GitHub...</span>`;
  }

  try {
    showToast('🚀 Guardando cambios en GitHub main...', 'info');
    await window.githubSync.syncDatabase(window.appStore.config, window.appStore.products);
    showToast('✅ ¡Todos los cambios fueron guardados en GitHub con éxito!', 'success');
  } catch (err) {
    console.error('GitHub Sync Error:', err);
    showToast(`⛔ Error al sincronizar: ${err.message}`, 'error');
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `<span>🚀 GUARDAR CAMBIOS EN GITHUB</span>`;
    }
  }
}

// --- Admin Modal & Management Dashboard ---
function initAdminModal() {
  const adminModal = document.getElementById('admin-modal');
  const openBtns = document.querySelectorAll('.open-admin-trigger');
  const closeBtn = document.getElementById('close-admin-btn');
  const loginForm = document.getElementById('admin-login-form');
  const pinInput = document.getElementById('admin-pin-input');
  const logoutBtn = document.getElementById('admin-logout-btn');

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (adminModal) adminModal.classList.remove('hidden');
    });
  });

  if (closeBtn && adminModal) {
    closeBtn.addEventListener('click', () => {
      adminModal.classList.add('hidden');
    });
  }

  if (loginForm && pinInput) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = window.appStore.loginAdmin(pinInput.value);
      if (ok) {
        pinInput.value = '';
        showToast('🔓 Acceso Autorizado a la Nave', 'success');
      } else {
        showToast('⛔ PIN Incorrecto', 'error');
        pinInput.classList.add('border-red-500');
        setTimeout(() => pinInput.classList.remove('border-red-500'), 1000);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.appStore.logoutAdmin();
      showToast('🔒 Sesión de Administrador cerrada', 'info');
    });
  }

  // Admin Tab Switching
  const tabs = document.querySelectorAll('.admin-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active-tab', 'border-b-2', 'border-emerald-400', 'text-emerald-400'));
      tab.classList.add('active-tab', 'border-b-2', 'border-emerald-400', 'text-emerald-400');

      const targetId = tab.dataset.tabTarget;
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.remove('hidden');
    });
  });

  // Product Form Handler
  const prodForm = document.getElementById('admin-product-form');
  if (prodForm) {
    prodForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSaveProduct();
    });
  }

  // Reset Product Form Button
  const resetProdBtn = document.getElementById('reset-prod-form-btn');
  if (resetProdBtn && prodForm) {
    resetProdBtn.addEventListener('click', () => {
      prodForm.reset();
      document.getElementById('edit-prod-id').value = '';
      document.getElementById('prod-form-title').textContent = '➕ Agregar Nuevo Producto';
    });
  }

  // Banner / Flyer Form Handler
  const bannerForm = document.getElementById('admin-banner-form');
  if (bannerForm) {
    bannerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSaveBanner();
    });
  }

  const resetBannerBtn = document.getElementById('reset-banner-form-btn');
  if (resetBannerBtn && bannerForm) {
    resetBannerBtn.addEventListener('click', () => {
      bannerForm.reset();
      document.getElementById('edit-banner-id').value = '';
      document.getElementById('banner-form-title').textContent = '➕ Cargar Nuevo Flyer / Imagen de Promo';
    });
  }

  // Config Form Handler
  const configForm = document.getElementById('admin-config-form');
  if (configForm) {
    configForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSaveConfig();
    });
  }

  // Add Category Handler
  const addCatBtn = document.getElementById('admin-add-cat-btn');
  const catInput = document.getElementById('admin-new-cat-input');
  if (addCatBtn && catInput) {
    addCatBtn.addEventListener('click', async () => {
      const val = catInput.value.trim();
      if (val) {
        window.appStore.addCategory(val);
        catInput.value = '';
        showToast(`✅ Categoría "${val}" agregada`, 'success');
        if (window.githubSync.isConfigured()) {
          await performGlobalGitHubSync();
        }
      }
    });
  }

  // Download JSON fallback
  const downloadJsonBtn = document.getElementById('download-json-btn');
  if (downloadJsonBtn) {
    downloadJsonBtn.addEventListener('click', () => {
      downloadDatabaseFiles();
    });
  }

  // Delegation for admin product actions (edit, delete, toggle stock)
  const adminProdList = document.getElementById('admin-products-table-body');
  if (adminProdList) {
    adminProdList.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const prodId = btn.dataset.productId;

      if (btn.classList.contains('admin-edit-prod')) {
        editProductInForm(prodId);
      } else if (btn.classList.contains('admin-delete-prod')) {
        if (confirm('¿Seguro que deseas eliminar este producto de la galaxia?')) {
          window.appStore.deleteProduct(prodId);
          showToast('🗑️ Producto eliminado', 'info');
          if (window.githubSync.isConfigured()) {
            await performGlobalGitHubSync();
          }
        }
      } else if (btn.classList.contains('admin-toggle-stock')) {
        window.appStore.toggleProductStock(prodId);
        showToast('🔄 Estado de stock actualizado', 'success');
        if (window.githubSync.isConfigured()) {
          await performGlobalGitHubSync();
        }
      }
    });
  }

  // Delegation for banner list actions (delete)
  const adminBannersList = document.getElementById('admin-banners-list');
  if (adminBannersList) {
    adminBannersList.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const bannerId = btn.dataset.bannerId;
      if (btn.classList.contains('delete-banner-btn')) {
        if (confirm('¿Eliminar este flyer promocional?')) {
          window.appStore.deletePromoBanner(bannerId);
          showToast('🗑️ Flyer eliminado', 'info');
          if (window.githubSync.isConfigured()) {
            await performGlobalGitHubSync();
          }
        }
      }
    });
  }

  // Delegation for category deletion
  const adminCatList = document.getElementById('admin-categories-list');
  if (adminCatList) {
    adminCatList.addEventListener('click', async (e) => {
      const btn = e.target.closest('.delete-cat-btn');
      if (!btn) return;
      const catName = btn.dataset.categoryName;
      if (confirm(`¿Eliminar categoría "${catName}"?`)) {
        window.appStore.deleteCategory(catName);
        showToast('🗑️ Categoría eliminada', 'info');
        if (window.githubSync.isConfigured()) {
          await performGlobalGitHubSync();
        }
      }
    });
  }
}

function renderAdmin() {
  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');
  if (!loginView || !dashboardView) return;

  if (!window.appStore.isAdmin) {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    return;
  }

  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  updateGitHubStatusBadge();

  // Populate Config Form Inputs
  const config = window.appStore.config;
  if (config) {
    setValue('admin-cfg-store-name', config.storeName);
    setValue('admin-cfg-wsp', config.whatsapp);
    setValue('admin-cfg-alias', config.alias);
    setValue('admin-cfg-cbu', config.cbu);
    setValue('admin-cfg-holder', config.accountHolder);
    setValue('admin-cfg-shipping', config.shippingCost);
    setValue('admin-cfg-free-min', config.freeShippingMinimum);
    setValue('admin-cfg-address', config.address);
    setValue('admin-cfg-gmaps', config.googleMapsUrl);
    setValue('admin-cfg-promo-title', config.heroPromoTitle);
    setValue('admin-cfg-pin', config.adminPin);
  }

  // Populate Categories in Select & List
  const prodCatSelect = document.getElementById('prod-category-select');
  const catListContainer = document.getElementById('admin-categories-list');
  if (config && config.categories) {
    if (prodCatSelect) {
      prodCatSelect.innerHTML = config.categories.map(c => `
        <option value="${escapeHtml(c)}">${escapeHtml(c)}</option>
      `).join('');
    }

    if (catListContainer) {
      catListContainer.innerHTML = config.categories.map(c => `
        <div class="flex items-center justify-between p-2.5 bg-black/50 rounded-xl border border-purple-500/30">
          <span class="font-orbitron text-xs text-white">${escapeHtml(c)}</span>
          <button data-category-name="${escapeHtml(c)}" class="delete-cat-btn text-red-400 hover:text-red-300 text-xs px-2 py-1">
            🗑️ Eliminar
          </button>
        </div>
      `).join('');
    }
  }

  // Render Admin Promo Banners List
  const bannersContainer = document.getElementById('admin-banners-list');
  if (bannersContainer && config && config.promoBanners) {
    bannersContainer.innerHTML = config.promoBanners.map(b => `
      <div class="p-3 bg-black/60 rounded-xl border border-purple-500/30 flex flex-col justify-between space-y-2">
        <div class="relative h-32 rounded-lg overflow-hidden bg-purple-950/40">
          <img src="${b.image || 'assets/flyer_domingo.jpg'}" alt="${escapeHtml(b.title)}" class="w-full h-full object-cover">
          <span class="absolute top-2 left-2 bg-emerald-500 text-black text-[9px] font-orbitron font-bold px-2 py-0.5 rounded">
            ${escapeHtml(b.badge || 'PROMO')}
          </span>
        </div>
        <div>
          <h5 class="font-orbitron font-bold text-xs text-white truncate">${escapeHtml(b.title)}</h5>
          <p class="text-[10px] text-gray-400 line-clamp-1">${escapeHtml(b.subtitle || '')}</p>
        </div>
        <div class="text-right">
          <button data-banner-id="${b.id}" class="delete-banner-btn text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-950/40 rounded border border-red-500/30 font-orbitron">
            🗑️ Eliminar Flyer
          </button>
        </div>
      </div>
    `).join('');
  }

  // Render Admin Products Table
  const tableBody = document.getElementById('admin-products-table-body');
  if (tableBody) {
    tableBody.innerHTML = window.appStore.products.map(p => `
      <tr class="border-b border-purple-500/20 hover:bg-purple-950/30 transition-colors">
        <td class="p-3">
          <img src="${p.image || 'assets/logo.jpg'}" class="w-10 h-10 rounded-lg object-cover border border-purple-500/30" onerror="this.src='assets/logo.jpg'">
        </td>
        <td class="p-3">
          <div class="font-orbitron font-bold text-xs text-white">${escapeHtml(p.name)}</div>
          <div class="text-[10px] text-purple-300">${escapeHtml(p.category)}</div>
        </td>
        <td class="p-3 font-orbitron font-bold text-emerald-400 text-xs">
          ${formatCurrency(p.price)}
        </td>
        <td class="p-3">
          <button data-product-id="${p.id}" class="admin-toggle-stock text-[10px] font-orbitron font-bold px-2 py-1 rounded-md ${p.inStock !== false ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}">
            ${p.inStock !== false ? '✅ DISPONIBLE' : '⛔ AGOTADO'}
          </button>
        </td>
        <td class="p-3 text-right space-x-2">
          <button data-product-id="${p.id}" class="admin-edit-prod text-cyan-400 hover:text-cyan-300 text-xs px-2 py-1 bg-cyan-950/60 rounded border border-cyan-500/30 font-orbitron">
            ✏️ Editar
          </button>
          <button data-product-id="${p.id}" class="admin-delete-prod text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-950/60 rounded border border-red-500/30 font-orbitron">
            🗑️
          </button>
        </td>
      </tr>
    `).join('');
  }
}

async function handleSaveProduct() {
  const id = document.getElementById('edit-prod-id').value;
  const name = document.getElementById('prod-name-input').value.trim();
  const category = document.getElementById('prod-category-select').value;
  const price = parseFloat(document.getElementById('prod-price-input').value) || 0;
  const originalPrice = parseFloat(document.getElementById('prod-orig-price-input').value) || null;
  const description = document.getElementById('prod-desc-input').value.trim();
  let image = document.getElementById('prod-img-input').value.trim();
  const fileInput = document.getElementById('prod-file-input');
  const badge = document.getElementById('prod-badge-input').value.trim();
  const inStock = document.getElementById('prod-stock-checkbox').checked;
  const isPromo = document.getElementById('prod-promo-checkbox').checked;

  if (!name || price <= 0) {
    showToast('⚠️ Ingresa un nombre y precio válido', 'error');
    return;
  }

  // Handle uploaded file if present
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    if (window.githubSync.isConfigured()) {
      showToast('📤 Subiendo imagen a GitHub...', 'info');
      try {
        image = await window.githubSync.uploadImage(file);
      } catch (err) {
        console.warn('Could not upload to GitHub, using local data URL:', err);
        image = await readFileAsDataURL(file);
      }
    } else {
      image = await readFileAsDataURL(file);
    }
  }

  const productData = {
    id: id || undefined,
    name,
    category,
    price,
    originalPrice: originalPrice || undefined,
    description,
    image: image || 'assets/logo.jpg',
    badge: badge || (isPromo ? '🔥 PROMO' : ''),
    inStock,
    isPromo
  };

  window.appStore.saveProduct(productData);
  document.getElementById('admin-product-form').reset();
  document.getElementById('edit-prod-id').value = '';
  document.getElementById('prod-form-title').textContent = '➕ Agregar Nuevo Producto';
  showToast('✅ Producto guardado localmente', 'success');

  // Auto-sync to GitHub if configured
  if (window.githubSync.isConfigured()) {
    await performGlobalGitHubSync();
  }
}

function editProductInForm(productId) {
  const p = window.appStore.products.find(item => item.id === productId);
  if (!p) return;

  setValue('edit-prod-id', p.id);
  setValue('prod-name-input', p.name);
  setValue('prod-category-select', p.category);
  setValue('prod-price-input', p.price);
  setValue('prod-orig-price-input', p.originalPrice || '');
  setValue('prod-desc-input', p.description || '');
  setValue('prod-img-input', p.image || '');
  setValue('prod-badge-input', p.badge || '');
  
  const stockCheckbox = document.getElementById('prod-stock-checkbox');
  if (stockCheckbox) stockCheckbox.checked = p.inStock !== false;

  const promoCheckbox = document.getElementById('prod-promo-checkbox');
  if (promoCheckbox) promoCheckbox.checked = !!p.isPromo;

  document.getElementById('prod-form-title').textContent = `✏️ Editando: ${p.name}`;
  document.getElementById('admin-product-form').scrollIntoView({ behavior: 'smooth' });
}

async function handleSaveBanner() {
  const id = document.getElementById('edit-banner-id').value;
  const title = document.getElementById('banner-title-input').value.trim();
  let image = document.getElementById('banner-img-input').value.trim();
  const fileInput = document.getElementById('banner-file-input');
  const badge = document.getElementById('banner-badge-input').value.trim();
  const subtitle = document.getElementById('banner-sub-input').value.trim();
  const wspText = document.getElementById('banner-wsp-input').value.trim();

  // Handle uploaded file if present
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    if (window.githubSync.isConfigured()) {
      showToast('📤 Subiendo flyer a GitHub...', 'info');
      try {
        image = await window.githubSync.uploadImage(file);
      } catch (err) {
        console.warn('Could not upload to GitHub, using local data URL:', err);
        image = await readFileAsDataURL(file);
      }
    } else {
      image = await readFileAsDataURL(file);
    }
  }

  if (!title || !image) {
    showToast('⚠️ Ingresa título e imagen del flyer', 'error');
    return;
  }

  const bannerData = {
    id: id || undefined,
    title,
    image,
    badge: badge || '🔥 PROMO DEL DÍA',
    subtitle,
    wspText
  };

  window.appStore.savePromoBanner(bannerData);
  document.getElementById('admin-banner-form').reset();
  document.getElementById('edit-banner-id').value = '';
  showToast('✅ Flyer de promoción guardado localmente', 'success');

  // Auto-sync to GitHub if configured
  if (window.githubSync.isConfigured()) {
    await performGlobalGitHubSync();
  }
}

async function handleSaveConfig() {
  const rawWsp = document.getElementById('admin-cfg-wsp').value.trim();
  const cleanWsp = getCleanWhatsAppPhone(rawWsp);

  const newConfig = {
    storeName: document.getElementById('admin-cfg-store-name').value.trim(),
    whatsapp: cleanWsp || '5491112345678',
    alias: document.getElementById('admin-cfg-alias').value.trim(),
    cbu: document.getElementById('admin-cfg-cbu').value.trim(),
    accountHolder: document.getElementById('admin-cfg-holder').value.trim(),
    shippingCost: parseFloat(document.getElementById('admin-cfg-shipping').value) || 0,
    freeShippingMinimum: parseFloat(document.getElementById('admin-cfg-free-min').value) || 0,
    address: document.getElementById('admin-cfg-address').value.trim(),
    googleMapsUrl: document.getElementById('admin-cfg-gmaps').value.trim(),
    heroPromoTitle: document.getElementById('admin-cfg-promo-title').value.trim(),
    adminPin: document.getElementById('admin-cfg-pin').value.trim() || 'alien2026'
  };

  window.appStore.saveConfig(newConfig);
  showToast('💾 Configuración guardada localmente', 'success');

  // Auto-sync to GitHub if configured
  if (window.githubSync.isConfigured()) {
    await performGlobalGitHubSync();
  }
}

function downloadDatabaseFiles() {
  const productsBlob = new Blob([JSON.stringify(window.appStore.products, null, 2)], { type: 'application/json' });
  const configBlob = new Blob([JSON.stringify(window.appStore.config, null, 2)], { type: 'application/json' });

  saveBlob(productsBlob, 'products.json');
  setTimeout(() => saveBlob(configBlob, 'config.json'), 300);

  showToast('📥 Descargando products.json y config.json', 'success');
}

function saveBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- HUD Toast Notifications ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast px-4 py-3 rounded-xl flex items-center gap-3 text-xs md:text-sm font-orbitron font-semibold text-white ${type === 'error' ? 'border-red-500' : 'border-emerald-400'}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- Utility Helpers ---
function formatCurrency(num) {
  const val = Number(num) || 0;
  return '$ ' + val.toLocaleString('es-AR');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val !== undefined && val !== null ? val : '';
}

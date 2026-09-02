// Central Reactive State Store for Multirubro Alien 2.0

class StoreState {
  constructor() {
    this.config = null;
    this.products = [];
    this.cart = [];
    this.selectedCategory = "ALL";
    this.searchQuery = "";
    this.deliveryMode = "pickup"; // 'pickup' | 'delivery'
    this.customerInfo = {
      name: "",
      dni: "",
      street: "",
      number: "",
      notes: ""
    };
    this.isAdmin = false;
    this.listeners = [];
  }

  async loadInitialData() {
    // 1. Check LocalStorage for saved config
    const savedConfig = localStorage.getItem('alien_config_v2');
    if (savedConfig) {
      try {
        this.config = JSON.parse(savedConfig);
      } catch (e) {
        console.error('Error parsing saved config:', e);
      }
    }

    if (!this.config || !this.config.promoBanners) {
      try {
        const res = await fetch('data/config.json');
        const defaultCfg = await res.json();
        this.config = { ...defaultCfg, ...(this.config || {}) };
        if (!this.config.promoBanners) {
          this.config.promoBanners = defaultCfg.promoBanners || [];
        }
      } catch (e) {
        console.warn('Could not fetch data/config.json, using fallback');
        this.config = {
          storeName: "Multirubro Alien",
          tagline: "¡Saludos Terrícola! 👽 Nave nodriza activa 24Hs",
          heroPromoTitle: "🛸 PROMOS INTERGALÁCTICAS DEL DÍA",
          address: "Pellegrini 146",
          googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Pellegrini+146",
          openingHours: "Abierto 24 Horas - Todos los días",
          whatsapp: "5491112345678",
          alias: "ALIENS.MULTIRUBRO.MP",
          cbu: "0000003100098765432109",
          shippingCost: 1500,
          freeShippingMinimum: 20000,
          adminPin: "alien2026",
          is24HsOpen: true,
          categories: [
            "🔥 Promos del Día",
            "☕ Café y Merienda",
            "🍦 Helados",
            "🍟 Snacks & Comidas",
            "🥤 Bebidas & Energizantes",
            "🌿 Cannabis & Grow",
            "🍫 Golosinas & Kiosco"
          ],
          promoBanners: [
            {
              id: "banner-1",
              title: "☕ Combo Café Listo & Alfajor",
              subtitle: "¡Activá tu día con café calentito y algo rico! Pellegrini 146.",
              image: "assets/flyer_domingo.jpg",
              badge: "🔥 PROMO DEL DÍA",
              wspText: "🛸 ¡Hola Multirubro Alien! Quiero pedir la Promo de Café Listo + Alfajor del flyer:"
            }
          ]
        };
      }
    }

    // 2. Check LocalStorage for saved products
    const savedProducts = localStorage.getItem('alien_products_v2');
    if (savedProducts) {
      try {
        this.products = JSON.parse(savedProducts);
      } catch (e) {
        console.error('Error parsing saved products:', e);
      }
    }

    if (!this.products || this.products.length === 0) {
      try {
        const res = await fetch('data/products.json');
        this.products = await res.json();
      } catch (e) {
        console.warn('Could not fetch data/products.json');
        this.products = [];
      }
    }

    // 3. Load saved cart
    const savedCart = localStorage.getItem('alien_cart_v2');
    if (savedCart) {
      try {
        this.cart = JSON.parse(savedCart);
      } catch (e) {
        this.cart = [];
      }
    }

    // 4. Load saved customer info
    const savedCustomer = localStorage.getItem('alien_customer_v2');
    if (savedCustomer) {
      try {
        this.customerInfo = { ...this.customerInfo, ...JSON.parse(savedCustomer) };
      } catch (e) { }
    }

    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(event = 'update') {
    for (const listener of this.listeners) {
      listener(this, event);
    }
  }

  // --- Cart Operations ---
  addToCart(productId, quantity = 1) {
    const product = this.products.find(p => p.id === productId);
    if (!product || product.inStock === false) return false;

    const existingIndex = this.cart.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({
        productId,
        quantity,
        addedAt: Date.now()
      });
    }

    this.saveCart();
    this.notify('cart_add');
    return true;
  }

  updateCartQuantity(productId, newQty) {
    if (newQty <= 0) {
      this.removeFromCart(productId);
      return;
    }
    const item = this.cart.find(i => i.productId === productId);
    if (item) {
      item.quantity = newQty;
      this.saveCart();
      this.notify('cart_update');
    }
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.productId !== productId);
    this.saveCart();
    this.notify('cart_remove');
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    this.notify('cart_clear');
  }

  saveCart() {
    localStorage.setItem('alien_cart_v2', JSON.stringify(this.cart));
  }

  saveCustomerInfo(info) {
    this.customerInfo = { ...this.customerInfo, ...info };
    localStorage.setItem('alien_customer_v2', JSON.stringify(this.customerInfo));
    this.notify('customer_update');
  }

  setDeliveryMode(mode) {
    this.deliveryMode = mode;
    this.notify('delivery_update');
  }

  getCartItemsDetailed() {
    return this.cart.map(item => {
      const prod = this.products.find(p => p.id === item.productId);
      return {
        ...item,
        product: prod || { name: 'Producto no disponible', price: 0, image: '' }
      };
    });
  }

  getCartSubtotal() {
    return this.getCartItemsDetailed().reduce((acc, item) => {
      return acc + (item.product.price * item.quantity);
    }, 0);
  }

  getShippingCost() {
    if (this.deliveryMode === 'pickup') return 0;
    const subtotal = this.getCartSubtotal();
    if (this.config.freeShippingMinimum && subtotal >= this.config.freeShippingMinimum) {
      return 0;
    }
    return Number(this.config.shippingCost) || 0;
  }

  getCartTotal() {
    return this.getCartSubtotal() + this.getShippingCost();
  }

  getCartCount() {
    return this.cart.reduce((acc, item) => acc + item.quantity, 0);
  }

  // --- Filter Operations ---
  setCategory(category) {
    this.selectedCategory = category;
    this.notify('filter_change');
  }

  setSearchQuery(query) {
    this.searchQuery = query;
    this.notify('filter_change');
  }

  getFilteredProducts() {
    let result = [...this.products];

    if (this.selectedCategory !== "ALL") {
      result = result.filter(p => p.category === this.selectedCategory);
    }

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.badge && p.badge.toLowerCase().includes(q))
      );
    }

    return result;
  }

  getPromoBanners() {
    return this.config?.promoBanners || [];
  }

  // --- Admin Operations ---
  loginAdmin(pin) {
    if (String(pin).trim() === String(this.config.adminPin).trim()) {
      this.isAdmin = true;
      this.notify('admin_auth');
      return true;
    }
    return false;
  }

  logoutAdmin() {
    this.isAdmin = false;
    this.notify('admin_auth');
  }

  saveProduct(productData) {
    if (!productData.id) {
      productData.id = 'p-' + Date.now();
      this.products.unshift(productData);
    } else {
      const index = this.products.findIndex(p => p.id === productData.id);
      if (index >= 0) {
        this.products[index] = { ...this.products[index], ...productData };
      } else {
        this.products.unshift(productData);
      }
    }
    this.persistProducts();
    this.notify('products_updated');
  }

  deleteProduct(productId) {
    this.products = this.products.filter(p => p.id !== productId);
    this.removeFromCart(productId);
    this.persistProducts();
    this.notify('products_updated');
  }

  toggleProductStock(productId) {
    const p = this.products.find(item => item.id === productId);
    if (p) {
      p.inStock = !p.inStock;
      if (!p.inStock) {
        this.removeFromCart(productId);
      }
      this.persistProducts();
      this.notify('products_updated');
    }
  }

  savePromoBanner(bannerData) {
    if (!this.config.promoBanners) this.config.promoBanners = [];
    if (!bannerData.id) {
      bannerData.id = 'banner-' + Date.now();
      this.config.promoBanners.unshift(bannerData);
    } else {
      const idx = this.config.promoBanners.findIndex(b => b.id === bannerData.id);
      if (idx >= 0) {
        this.config.promoBanners[idx] = { ...this.config.promoBanners[idx], ...bannerData };
      } else {
        this.config.promoBanners.unshift(bannerData);
      }
    }
    this.saveConfig(this.config);
  }

  deletePromoBanner(bannerId) {
    if (!this.config.promoBanners) return;
    this.config.promoBanners = this.config.promoBanners.filter(b => b.id !== bannerId);
    this.saveConfig(this.config);
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('alien_config_v2', JSON.stringify(this.config));
    this.notify('config_updated');
  }

  addCategory(categoryName) {
    if (!this.config.categories.includes(categoryName)) {
      this.config.categories.push(categoryName);
      this.saveConfig(this.config);
    }
  }

  deleteCategory(categoryName) {
    this.config.categories = this.config.categories.filter(c => c !== categoryName);
    this.saveConfig(this.config);
  }

  persistProducts() {
    localStorage.setItem('alien_products_v2', JSON.stringify(this.products));
  }

  resetToDefault() {
    localStorage.removeItem('alien_products_v2');
    localStorage.removeItem('alien_config_v2');
    this.loadInitialData();
  }
}

window.appStore = new StoreState();

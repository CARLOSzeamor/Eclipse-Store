/* ---------- Dados de exemplo (poderia vir de uma API) ---------- */
const products = [
  { id: 'p1', title: 'Fone EvoSound Pro', price: 299.90, img: 'img/Fone.jpg', description: ' Áudio 3D imersivo, cancelamento ativo de ruído e toque inteligente. Bateria de até 30h e estojo com display digital.' },
  { id: 'p2', title: 'Power Bank Solar E-Charge 20000mAh', price: 289.90, img: 'img/Power.jpg', description: 'Carregue seus dispositivos com energia solar! Possui 3 saídas USB, luz LED e carregamento rápido. Ideal para aventuras e emergências.' },
  { id: 'p3', title: 'Mini Projetor Portátil E-View Smart', price: 499.90, img: 'img/Projector.jpg', description: 'Transforme qualquer parede em uma tela gigante! Projeção até 120”, conexão Wi-Fi e compatível com celular e notebook.' },
  { id: 'p4', title: 'Teclado Mecânico E-Keys RGB', price: 259.00, img: 'img/Teclado.jpg', description: 'Design compacto e retroiluminação personalizável. Ideal para gamers e criadores. Switches de alta durabilidade' },
  { id: 'p5', title: 'Suporte Magnético E-Mount Wireless', price: 149.90, img: 'img/Suporte.jpg', description: 'Suporte magnético com carregamento rápido de 15W. Fixe no carro ou mesa e mantenha seu celular sempre carregado.' },
  { id: 'p6', title: 'Smartwatch E-Watch Ultra', price: 279.90, img: 'img/Relogio.jpg', description: 'Acompanhe sua saúde com estilo. Mede batimentos, sono, oxigênio e passos. Resistência à água IP68 e bateria de longa duração.' },
  { id: 'p7', title: 'Lâmpada Inteligente E-Light RGB', price: 89.90, img: 'img/Lampada.jpg', description: 'Controle pelo celular, Alexa ou Google. Ajuste cor, brilho e programações automáticas. Economize energia com tecnologia LED.' },
];

/* ---------- Helpers ---------- */
const money = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;
const qs = (s, ctx=document) => ctx.querySelector(s);
const qsa = (s, ctx=document) => Array.from(ctx.querySelectorAll(s));

/* ---------- Storage keys ---------- */
const STORAGE = {
  CART: 'loja_cart_v1',
  FAV: 'loja_fav_v1',
  USERS: 'loja_users_v1',      // lista de usuários (simulado)
  AUTH: 'loja_auth_v1'         // usuário logado (email)
};

/* ---------- Cart module ---------- */
const cart = {
  items: JSON.parse(localStorage.getItem(STORAGE.CART) || '[]'),

  persist() { localStorage.setItem(STORAGE.CART, JSON.stringify(this.items)); },

  findIndex(prodId){ return this.items.findIndex(i => i.id === prodId); },

  addItem(prodId, qty=1){
    const idx = this.findIndex(prodId);
    if(idx > -1){
      this.items[idx].qty += qty;
    } else {
      const p = products.find(x => x.id === prodId);
      if(!p) return false;
      this.items.push({ id: p.id, title: p.title, price: p.price, img: p.img, qty });
    }
    this.persist();
    ui.updateHeaderCounts();
    ui.toast('Adicionado ao carrinho');
    return true;
  },

  removeItem(prodId){
    this.items = this.items.filter(i => i.id !== prodId);
    this.persist();
    ui.updateHeaderCounts();
    ui.toast('Removido do carrinho');
  },

  updateQuantity(prodId, qty){
    const idx = this.findIndex(prodId);
    if(idx === -1) return;
    this.items[idx].qty = Math.max(1, qty);
    this.persist();
    ui.updateHeaderCounts();
  },

  clear(){
    this.items = [];
    this.persist();
    ui.updateHeaderCounts();
  },

  subtotal(){
    return this.items.reduce((s,i) => s + (i.price * i.qty), 0);
  },

  total(){
    // sem impostos/frete por enquanto; fácil de estender
    return this.subtotal();
  }
};

/* ---------- Favorites module ---------- */
const favorites = {
  items: JSON.parse(localStorage.getItem(STORAGE.FAV) || '[]'),

  persist(){ localStorage.setItem(STORAGE.FAV, JSON.stringify(this.items)); },

  isFav(prodId){ return this.items.includes(prodId); },

  toggle(prodId){
    if(this.isFav(prodId)){
      this.items = this.items.filter(id => id !== prodId);
      ui.toast('Removido dos favoritos');
    } else {
      this.items.push(prodId);
      ui.toast('Adicionado aos favoritos');
    }
    this.persist();
    ui.updateHeaderCounts();
  },

  list(){ return this.items.map(id => products.find(p => p.id === id)).filter(Boolean); }
};

/* ---------- Simple Auth (mock) ---------- */
const auth = {
  // users are stored as [{ name, email, passwordHash }]
  users: JSON.parse(localStorage.getItem(STORAGE.USERS) || '[]'),

  saveUsers(){ localStorage.setItem(STORAGE.USERS, JSON.stringify(this.users)); },

  register({ name, email, password }){
    if(this.users.some(u => u.email === email)) return { ok:false, message:'Email já cadastrado' };
    // nota: armazenamos a senha em texto por simplicidade (NÃO SE FAZ ISSO em produção)
    this.users.push({ name, email, password });
    this.saveUsers();
    localStorage.setItem(STORAGE.AUTH, email);
    ui.toast('Conta criada com sucesso');
    return { ok:true };
  },

  login({ email, password }){
    const u = this.users.find(x => x.email === email && x.password === password);
    if(!u) return { ok:false, message:'Credenciais inválidas' };
    localStorage.setItem(STORAGE.AUTH, email);
    ui.toast(`Bem-vindo(a), ${u.name}`);
    return { ok:true };
  },

  logout(){
    localStorage.removeItem(STORAGE.AUTH);
    ui.toast('Você saiu da conta');
  },

  currentUser(){
    const email = localStorage.getItem(STORAGE.AUTH);
    return this.users.find(u => u.email === email) || null;
  }
};

/* ---------- UI module ---------- */
const ui = {
  formatProductCard(p){
    const isFav = favorites.isFav(p.id) ? 'fav active' : 'fav';
    return `
      <article class="card" data-id="${p.id}">
        <a href="product.html?id=${p.id}" aria-label="${p.title}">
          <img src="${p.img}" alt="${p.title}" />
        </a>
        <h3>${p.title}</h3>
        <div class="price">${money(p.price)}</div>
        <div class="controls">
          <button class="btn primary add-to-cart" data-id="${p.id}">Adicionar</button>
          <button class="icon-btn favorite-btn" data-id="${p.id}" aria-pressed="${favorites.isFav(p.id)}" title="Favoritar">♥</button>
        </div>
      </article>
    `;
  },

  renderProductsGrid(container){
    container.innerHTML = products.map(p => this.formatProductCard(p)).join('');
    // attach listeners
    qsa('.add-to-cart', container).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        cart.addItem(id, 1);
      });
    });
    qsa('.favorite-btn', container).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        favorites.toggle(id);
        // update aria-pressed
        e.currentTarget.setAttribute('aria-pressed', favorites.isFav(id));
      });
    });
    this.updateHeaderCounts();
  },

  renderProductPage(container){
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const product = products.find(p => p.id === id) || products[0];
    container.innerHTML = `
      <div class="product-details card">
        <img src="${product.img}" alt="${product.title}">
      </div>
      <div class="card">
        <h2>${product.title}</h2>
        <p class="price">${money(product.price)}</p>
        <p class="hint">${product.description}</p>
        <div class="controls">
          <button class="btn primary" id="add-product">Adicionar ao carrinho</button>
          <button class="icon-btn" id="toggle-fav">${favorites.isFav(product.id) ? '♥ Remover' : '♡ Favoritar'}</button>
        </div>
      </div>
    `;

    qs('#add-product', container).addEventListener('click', () => {
      cart.addItem(product.id, 1);
    });
    qs('#toggle-fav', container).addEventListener('click', (e) => {
      favorites.toggle(product.id);
      e.currentTarget.textContent = favorites.isFav(product.id) ? '♥ Remover' : '♡ Favoritar';
    });
    this.updateHeaderCounts();
  },

  renderCartPage(container){
    // render items
    if(cart.items.length === 0){
      container.innerHTML = `<div class="card"><p>Carrinho vazio.</p><p><a href="index.html">Continuar comprando</a></p></div>`;
    } else {
      container.innerHTML = cart.items.map(i => `
        <div class="cart-item" data-id="${i.id}">
          <img src="${i.img}" alt="${i.title}">
          <div style="flex:1">
            <strong>${i.title}</strong>
            <div class="price">${money(i.price)}</div>
          </div>
          <div class="qty" aria-label="Quantidade">
            <button class="qty-decr" data-id="${i.id}" aria-label="Diminuir">-</button>
            <input class="qty-input" type="number" min="1" value="${i.qty}" aria-label="Quantidade do item" />
            <button class="qty-incr" data-id="${i.id}" aria-label="Aumentar">+</button>
          </div>
          <div>
            <button class="btn remove-item" data-id="${i.id}" aria-label="Remover item">Remover</button>
          </div>
        </div>
      `).join('');
      // listeners
      qsa('.qty-decr', container).forEach(btn=>{
        btn.addEventListener('click', ()=> {
          const id = btn.dataset.id;
          const item = cart.items.find(x=>x.id===id);
          if(!item) return;
          cart.updateQuantity(id, Math.max(1, item.qty - 1));
          this.renderCartPage(container);
          this.updateCartSummary();
        });
      });
      qsa('.qty-incr', container).forEach(btn=>{
        btn.addEventListener('click', ()=> {
          const id = btn.dataset.id;
          const item = cart.items.find(x=>x.id===id);
          if(!item) return;
          cart.updateQuantity(id, item.qty + 1);
          this.renderCartPage(container);
          this.updateCartSummary();
        });
      });
      qsa('.qty-input', container).forEach(inp=>{
        inp.addEventListener('change', (e)=>{
          const parent = e.target.closest('.cart-item');
          const id = parent.dataset.id;
          const qty = parseInt(e.target.value, 10) || 1;
          cart.updateQuantity(id, qty);
          this.renderCartPage(container);
          this.updateCartSummary();
        });
      });
      qsa('.remove-item', container).forEach(btn=>{
        btn.addEventListener('click', ()=> {
          cart.removeItem(btn.dataset.id);
          this.renderCartPage(container);
          this.updateCartSummary();
        });
      });
    }

    // summary & actions
    this.updateCartSummary();
    const clearBtn = qs('#clear-cart');
    if(clearBtn) clearBtn.addEventListener('click', () => { cart.clear(); this.renderCartPage(container); this.updateCartSummary(); });

    const checkoutBtn = qs('#checkout');
    if(checkoutBtn) checkoutBtn.addEventListener('click', () => {
      const user = auth.currentUser();
      if(!user){
        this.toast('Faça login para finalizar a compra');
        location.href = 'login.html';
        return;
      }
      cart.clear();
      this.renderCartPage(container);
      this.updateCartSummary();
      this.toast('Compra finalizada (simulação). Obrigado!');
    });
  },

  updateCartSummary(){
    const subtotalEl = qs('#cart-subtotal');
    const totalEl = qs('#cart-total');
    if(subtotalEl) subtotalEl.textContent = money(cart.subtotal());
    if(totalEl) totalEl.textContent = money(cart.total());
    this.updateHeaderCounts();
  },

  updateHeaderCounts(){
    const cartCount = cart.items.reduce((s,i)=>s+i.qty,0);
    const favCount = favorites.items.length;
    qsa('#cart-count').forEach(el => el.textContent = cartCount);
    qsa('#fav-count').forEach(el => el.textContent = favCount);
    // header user
    const user = auth.currentUser();
    const userArea = qs('#user-area');
    if(user){
      userArea.innerHTML = `<span aria-hidden="true">Olá, ${user.name}</span> <button id="logout-btn" class="btn">Sair</button>`;
      qs('#logout-btn').addEventListener('click', ()=>{ auth.logout(); this.renderHeader(); });
    } else {
      userArea.innerHTML = `<a id="login-link" href="login.html">Entrar</a>`;
    }
  },

  renderHeader(){
    // Attach favorite button to open favorites list (simple)
    qsa('#favorites-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const favs = favorites.list();
        if(favs.length === 0){
          this.toast('Nenhum favorito ainda');
          return;
        }
        // quick view: open first favorite product page
        location.href = `product.html?id=${favs[0].id}`;
      });
    });
    this.updateHeaderCounts();
  },

  toast(message, ms=2200){
    const el = qs('#toast');
    if(!el) return alert(message);
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(el._t);
    el._t = setTimeout(()=> el.classList.add('hidden'), ms);
  },

  /* ---- Authentication forms ---- */
  initRegisterForm(){
    const form = qs('#register-form');
    if(!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim().toLowerCase();
      const password = form.password.value;
      if(!name || !email || !password){ this.toast('Preencha todos os campos'); return; }
      if(password.length < 6){ this.toast('Senha precisa ter pelo menos 6 caracteres'); return; }
      // simple email regex
      if(!/^\S+@\S+\.\S+$/.test(email)){ this.toast('Email inválido'); return; }
      const res = auth.register({ name, email, password });
      if(!res.ok){ this.toast(res.message); return; }
      // redirect after register
      setTimeout(()=> location.href = 'index.html', 600);
    });
  },

  initLoginForm(){
    const form = qs('#login-form');
    if(!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.email.value.trim().toLowerCase();
      const password = form.password.value;
      if(!email || !password){ this.toast('Preencha todos os campos'); return; }
      const res = auth.login({ email, password });
      if(!res.ok){ this.toast(res.message); return; }
      setTimeout(()=> location.href = 'index.html', 600);
    });
  }
};

/* ---------- Init: expose modules to console for debugging ---------- */
window.store = { cart, favorites, auth, products, ui };

/* ---------- Optional: attach header update on load for all pages ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // header elements are present on all pages; ensure counts are shown
  ui.renderHeader();
});

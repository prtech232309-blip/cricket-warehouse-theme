/* ============================================================
   CRICKET WAREHOUSE USA — THEME JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  initMobileMenu();
  initStickyHeader();
  initQuickAdd();
  updateCartCount();
  initCartDrawer();
  initBackToTop();
});

/* Mobile Menu
   ============================================================ */
function initMobileMenu() {
  const openBtns = document.querySelectorAll('[data-menu-open]');
  const closeBtns = document.querySelectorAll('[data-menu-close]');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) return;

  const open = () => {
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openBtns.forEach(btn => btn.addEventListener('click', open));
  closeBtns.forEach(btn => btn.addEventListener('click', close));
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) close();
  });
}

/* Sticky Header
   ============================================================ */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }, { passive: true });
}

/* Quick Add to Cart (Shopify AJAX Cart API)
   ============================================================ */
function initQuickAdd() {
  document.querySelectorAll('[data-quick-add]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const variantId = btn.dataset.variantId;
      if (!variantId) return;

      const originalHTML = btn.innerHTML;
      btn.textContent = 'ADDING...';
      btn.disabled = true;

      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: parseInt(variantId), quantity: 1 })
        });

        if (res.ok) {
          btn.textContent = 'ADDED!';
          await updateCartCount();
          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
          }, 1500);
        } else {
          const err = await res.json();
          btn.textContent = err.description || 'OUT OF STOCK';
          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
          }, 2000);
        }
      } catch {
        btn.textContent = 'ERROR';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
        }, 2000);
      }
    });
  });
}

/* Update Cart Count Badge
   ============================================================ */
async function updateCartCount() {
  try {
    const res = await fetch('/cart.js');
    const cart = await res.json();
    document.querySelectorAll('.js-cart-count').forEach(badge => {
      badge.textContent = cart.item_count;
      badge.style.display = cart.item_count > 0 ? 'flex' : 'none';
    });
    return cart;
  } catch {
    return null;
  }
}

/* Cart Drawer
   ============================================================ */
function initCartDrawer() {
  const drawer = document.querySelector('.cart-drawer');
  const overlay = document.querySelector('.cart-drawer-overlay');
  if (!drawer) return;

  const openDrawer = async () => {
    drawer.classList.add('is-open');
    overlay?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    await refreshCartDrawer();
  };

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    overlay?.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-cart-drawer-open]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
  });

  overlay?.addEventListener('click', closeDrawer);
  drawer.querySelector('.cart-drawer__close')?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  window.openCartDrawer = openDrawer;
  window.closeCartDrawer = closeDrawer;
}

async function refreshCartDrawer() {
  const body = document.querySelector('.cart-drawer__body');
  const footer = document.querySelector('.cart-drawer__footer');
  const title = document.querySelector('.cart-drawer__title');
  if (!body) return;

  body.innerHTML = '<div class="cart-drawer__loading">Loading...</div>';

  try {
    const res = await fetch('/cart.js');
    const cart = await res.json();

    document.querySelectorAll('.js-cart-count').forEach(b => {
      b.textContent = cart.item_count;
      b.style.display = cart.item_count > 0 ? 'flex' : 'none';
    });
    if (title) {
      title.textContent = cart.item_count > 0
        ? `Your Bag (${cart.item_count})`
        : 'Your Bag';
    }

    if (cart.item_count === 0) {
      body.innerHTML = `
        <div class="cart-drawer__empty">
          <span class="material-symbols-outlined">shopping_bag</span>
          <p>Your bag is empty</p>
          <a class="btn btn-primary" href="/collections/all" onclick="window.closeCartDrawer && window.closeCartDrawer()" style="font-size:14px;padding:12px 24px;">SHOP NOW</a>
        </div>`;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = '';
    const fmt = (c) => '$' + (c / 100).toFixed(2);

    body.innerHTML = cart.items.map(item => `
      <div class="cart-drawer__item">
        <div class="cart-drawer__item-image">
          ${item.image ? `<img src="${item.image}" alt="${item.product_title}" loading="lazy">` : ''}
        </div>
        <div class="cart-drawer__item-details">
          <div class="cart-drawer__item-title">${item.product_title}</div>
          ${item.variant_title && item.variant_title !== 'Default Title' ? `<div class="cart-drawer__item-variant">${item.variant_title}</div>` : ''}
          <div class="cart-drawer__item-row">
            <span class="cart-drawer__item-price">${fmt(item.line_price)}</span>
            <button class="cart-drawer__item-remove" data-drawer-remove data-key="${item.key}">Remove</button>
          </div>
        </div>
      </div>`).join('');

    document.querySelector('.cart-drawer__subtotal-value').textContent = fmt(cart.total_price);

    body.querySelectorAll('[data-drawer-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.textContent = '...';
        try {
          await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: btn.dataset.key, quantity: 0 })
          });
          await refreshCartDrawer();
        } catch { await refreshCartDrawer(); }
      });
    });

  } catch {
    body.innerHTML = '<div class="cart-drawer__empty"><p>Could not load cart.</p></div>';
  }
}

/* Back to Top
   ============================================================ */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

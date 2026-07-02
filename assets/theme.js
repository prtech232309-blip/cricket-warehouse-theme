/* ============================================================
   CRICKET WAREHOUSE USA — THEME JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  initMobileMenu();
  initStickyHeader();
  initQuickAdd();
  updateCartCount();
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
    btn.addEventListener('click', async () => {
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
  } catch {
    // silent fail
  }
}

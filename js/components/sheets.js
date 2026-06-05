// Green PWA | Component — bottom sheet with drag-to-close

class Sheet {

  constructor(sheetId, overlayId, { onClose } = {}) {
    this.sheet   = document.getElementById(sheetId);
    this.overlay = document.getElementById(overlayId);
    this.onClose = onClose || null;

    if (!this.sheet || !this.overlay) return;

    this._dragStartY    = 0;
    this._dragCurrentY  = 0;
    this._dragStartTime = 0;
    this._dragging      = false;

    this._bindDrag();
    this._bindOverlay();
  }

  open() {
    const { sheet, overlay } = this;
    sheet.classList.remove('hidden');
    overlay.classList.remove('hidden');
    // Lock scroll
    document.querySelector('.page')?.style.setProperty('overflow', 'hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sheet.classList.add('visible');
      overlay.classList.add('visible');
    }));
  }

  close() {
    const { sheet, overlay } = this;
    sheet.classList.remove('visible');
    overlay.classList.remove('visible');
    // Reset any drag transform
    sheet.style.transform = '';
    sheet.style.transition = '';
    setTimeout(() => {
      sheet.classList.add('hidden');
      overlay.classList.add('hidden');
      // Unlock scroll
      document.querySelector('.page')?.style.removeProperty('overflow');
      if (this.onClose) this.onClose();
    }, 350);
  }

  _bindOverlay() {
    this.overlay.addEventListener('click', () => this.close());
  }

  _bindDrag() {
    const handle = this.sheet.querySelector('.sheet-handle');
    const target = handle || this.sheet;

    target.addEventListener('touchstart', e => {
      this._dragStartY    = e.touches[0].clientY;
      this._dragCurrentY  = e.touches[0].clientY;
      this._dragStartTime = Date.now();
      this._dragging      = true;
      // Disable transition during drag
      this.sheet.style.transition = 'none';
    }, { passive: true });

    target.addEventListener('touchmove', e => {
      if (!this._dragging) return;
      this._dragCurrentY = e.touches[0].clientY;
      const delta = Math.max(0, this._dragCurrentY - this._dragStartY);
      this.sheet.style.transform = `translateX(-50%) translateY(${delta}px)`;
    }, { passive: true });

    target.addEventListener('touchend', () => {
      if (!this._dragging) return;
      this._dragging = false;

      const delta    = this._dragCurrentY - this._dragStartY;
      const elapsed  = Date.now() - this._dragStartTime;
      const velocity = delta / elapsed; // px/ms

      if (delta > 80 || velocity > 0.4) {
        this.close();
      } else {
        // Snap back
        this.sheet.style.transition = '';
        this.sheet.style.transform  = '';
      }
    });
  }
}
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
    document.body.style.overflow   = 'hidden';
    document.body.style.touchAction = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sheet.classList.add('visible');
      overlay.classList.add('visible');
    }));
  }

  close() {
    const { sheet, overlay } = this;
    sheet.classList.remove('visible');
    overlay.classList.remove('visible');
    sheet.style.transform  = '';
    sheet.style.transition = '';
    setTimeout(() => {
      sheet.classList.add('hidden');
      overlay.classList.add('hidden');
      document.body.style.overflow    = '';
      document.body.style.touchAction = '';
      if (this.onClose) this.onClose();
    }, 350);
  }

  _bindOverlay() {
    this.overlay.addEventListener('click', () => this.close());
  }

  _bindDrag() {
    // Drag from handle OR top 60px of sheet for easier mobile grab
    const sheet  = this.sheet;
    const handle = sheet.querySelector('.sheet-handle');

    const onTouchStart = e => {
      // Only respond to touches in the top portion of the sheet
      const rect   = sheet.getBoundingClientRect();
      const touchY = e.touches[0].clientY;
      if (touchY > rect.top + 80 && !handle?.contains(e.target)) return;

      this._dragStartY    = e.touches[0].clientY;
      this._dragCurrentY  = e.touches[0].clientY;
      this._dragStartTime = Date.now();
      this._dragging      = true;
      sheet.style.transition = 'none';
    };

    const onTouchMove = e => {
      if (!this._dragging) return;
      this._dragCurrentY = e.touches[0].clientY;
      const delta = Math.max(0, this._dragCurrentY - this._dragStartY);
      e.preventDefault(); // prevent page scroll during drag
      sheet.style.transform = `translateX(-50%) translateY(${delta}px)`;
    };

    const onTouchEnd = () => {
      if (!this._dragging) return;
      this._dragging = false;

      const delta    = this._dragCurrentY - this._dragStartY;
      const elapsed  = Date.now() - this._dragStartTime;
      const velocity = delta / elapsed;

      if (delta > 80 || velocity > 0.3) {
        this.close();
      } else {
        sheet.style.transition = '';
        sheet.style.transform  = '';
      }
    };

    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove',  onTouchMove,  { passive: false });
    sheet.addEventListener('touchend',   onTouchEnd);
  }
} 
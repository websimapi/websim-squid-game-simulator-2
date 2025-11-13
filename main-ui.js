// Full-screen mobile-friendly interactive widget injected into the existing page.
// Keeps to a single screen height and starts immediately.

(function () {
  // Avoid injecting twice
  if (window.__injected_ui__) return;
  window.__injected_ui__ = true;

  // Basic sizing helpers
  const px = (n) => `${n}px`;

  // Create root container
  const root = document.createElement('div');
  root.id = 'injected-ui-root';
  Object.assign(root.style, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fbfbfb',
    zIndex: 2147483647,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    touchAction: 'manipulation'
  });

  // Create card
  const card = document.createElement('div');
  Object.assign(card.style, {
    width: '92%',
    maxWidth: '720px',
    height: '84%',
    maxHeight: '720px',
    borderRadius: '14px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  });

  // Header
  const header = document.createElement('div');
  Object.assign(header.style, {
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(0,0,0,0.06)'
  });

  const title = document.createElement('div');
  title.textContent = 'Quick Palette';
  Object.assign(title.style, { fontWeight: 600, fontSize: '16px', color: '#111' });

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  Object.assign(closeBtn.style, {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#444'
  });
  closeBtn.addEventListener('click', () => root.remove());

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Content area
  const content = document.createElement('div');
  Object.assign(content.style, {
    padding: '14px',
    display: 'flex',
    gap: '12px',
    flex: '1 1 auto',
    alignItems: 'stretch',
    justifyContent: 'center'
  });

  // Left: color preview + hex input
  const left = document.createElement('div');
  Object.assign(left.style, {
    flex: '1 1 40%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'stretch'
  });

  const preview = document.createElement('div');
  Object.assign(preview.style, {
    height: '160px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.06)',
    background: '#ff7a7a'
  });

  const hexRow = document.createElement('div');
  Object.assign(hexRow.style, {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  });
  const hexInput = document.createElement('input');
  hexInput.type = 'text';
  hexInput.value = '#ff7a7a';
  Object.assign(hexInput.style, {
    flex: '1 1 auto',
    height: '44px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.08)',
    padding: '0 10px',
    fontSize: '16px'
  });
  const copyHex = document.createElement('button');
  copyHex.textContent = 'Copy';
  Object.assign(copyHex.style, {
    width: '80px',
    height: '44px',
    borderRadius: '8px',
    border: 'none',
    background: '#111',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer'
  });
  copyHex.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(hexInput.value);
      flashMessage('Copied', copyHex);
    } catch {
      flashMessage('Failed', copyHex);
    }
  });

  hexRow.appendChild(hexInput);
  hexRow.appendChild(copyHex);

  left.appendChild(preview);
  left.appendChild(hexRow);

  // Right: generated palette & controls
  const right = document.createElement('div');
  Object.assign(right.style, {
    flex: '1 1 60%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'stretch'
  });

  const paletteGrid = document.createElement('div');
  Object.assign(paletteGrid.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '8px',
    flex: '1 1 auto'
  });

  // Controls
  const controls = document.createElement('div');
  Object.assign(controls.style, {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  });

  const harmonies = ['Analogous', 'Monochrome', 'Complement', 'Triad', 'Tetrad'];
  const harmonySelect = document.createElement('select');
  harmonies.forEach(h => {
    const o = document.createElement('option');
    o.value = h.toLowerCase();
    o.textContent = h;
    harmonySelect.appendChild(o);
  });
  Object.assign(harmonySelect.style, {
    height: '44px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.08)',
    padding: '0 10px',
    fontSize: '15px',
    flex: '1 1 auto'
  });

  const regenBtn = document.createElement('button');
  regenBtn.textContent = 'Generate';
  Object.assign(regenBtn.style, {
    width: '120px',
    height: '44px',
    borderRadius: '8px',
    border: 'none',
    background: '#0b84ff',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer'
  });

  controls.appendChild(harmonySelect);
  controls.appendChild(regenBtn);

  right.appendChild(paletteGrid);
  right.appendChild(controls);

  content.appendChild(left);
  content.appendChild(right);

  // Footer with small note
  const footer = document.createElement('div');
  Object.assign(footer.style, {
    padding: '10px 14px',
    borderTop: '1px solid rgba(0,0,0,0.04)',
    fontSize: '12px',
    color: '#666',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  });
  footer.innerHTML = '<span>Tap a swatch to copy hex</span><span style="opacity:.8">·</span><span style="opacity:.8">Made for mobile</span>';

  card.appendChild(header);
  card.appendChild(content);
  card.appendChild(footer);
  root.appendChild(card);
  document.body.appendChild(root);

  // Flash message helper
  function flashMessage(text, anchorEl) {
    const msg = document.createElement('div');
    msg.textContent = text;
    Object.assign(msg.style, {
      position: 'fixed',
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: '18px',
      background: '#111',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: '10px',
      fontSize: '14px',
      zIndex: 2147483648,
      opacity: '0',
      transition: 'opacity .18s ease, transform .18s ease'
    });
    document.body.appendChild(msg);
    requestAnimationFrame(() => {
      msg.style.opacity = '1';
      msg.style.transform = 'translateX(-50%) translateY(-4px)';
    });
    setTimeout(() => {
      msg.style.opacity = '0';
      msg.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => msg.remove(), 220);
    }, 900);
  }

  // Color helpers
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function hexToRgb(hex) {
    hex = hex.replace('#','').trim();
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    const v = parseInt(hex,16);
    return { r: (v>>16)&255, g: (v>>8)&255, b: v&255 };
  }
  function rgbToHex({r,g,b}) {
    return '#'+[r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('');
  }
  function rgbToHsl({r,g,b}) {
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h=0,s=0,l=(max+min)/2;
    if (max!==min) {
      const d = max-min;
      s = l>0.5?d/(2-max-min):d/(max+min);
      switch(max){
        case r: h=(g-b)/d + (g<b?6:0); break;
        case g: h=(b-r)/d + 2; break;
        case b: h=(r-g)/d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h*360), s: Math.round(s*100), l: Math.round(l*100) };
  }
  function hslToRgb({h,s,l}) {
    h = ((h%360)+360)/360;
    s /= 100; l /= 100;
    let r,g,b;
    if (s===0) r=g=b=l;
    else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l*s;
      const p = 2 * l - q;
      const hue2rgb = (p, q, t) => {
        if (t<0) t+=1;
        if (t>1) t-=1;
        if (t<1/6) return p + (q-p)*6*t;
        if (t<1/2) return q;
        if (t<2/3) return p + (q-p)*(2/3 - t)*6;
        return p;
      };
      r = hue2rgb(p,q,h+1/3);
      g = hue2rgb(p,q,h);
      b = hue2rgb(p,q,h-1/3);
    }
    return { r: Math.round(r*255), g: Math.round(g*255), b: Math.round(b*255) };
  }

  // Generate palette based on harmony
  function generatePalette(hex, mode) {
    const rgb = hexToRgb(hex);
    if (!rgb) return Array(5).fill('#cccccc');
    const baseHsl = rgbToHsl(rgb);
    const h = baseHsl.h;
    const s = baseHsl.s;
    const l = baseHsl.l;

    const out = [];
    if (mode === 'monochrome') {
      const deltas = [-30, -10, 0, 12, 30];
      deltas.forEach(d => {
        const hh = h;
        const ss = clamp(s + d/2, 10, 100);
        const ll = clamp(l + d, 6, 94);
        out.push(rgbToHex(hslToRgb({h:hh, s:ss, l:ll})));
      });
    } else if (mode === 'analogous') {
      const deltas = [-40, -20, 0, 20, 40];
      deltas.forEach(d => {
        out.push(rgbToHex(hslToRgb({h: h + d, s: clamp(s,20,100), l: clamp(l,8,92)})));
      });
    } else if (mode === 'complement') {
      const deltas = [0, 12, -12, 180, 210];
      deltas.forEach(d => {
        out.push(rgbToHex(hslToRgb({h: h + d, s: clamp(s,20,100), l: clamp(l,8,92)})));
      });
    } else if (mode === 'triad') {
      const deltas = [0, 120, -120, 10, -10];
      deltas.forEach(d => {
        out.push(rgbToHex(hslToRgb({h: h + d, s: clamp(s,20,100), l: clamp(l,10,92)})));
      });
    } else if (mode === 'tetrad') {
      const deltas = [0, 90, 180, 270, 30];
      deltas.forEach(d => {
        out.push(rgbToHex(hslToRgb({h: h + d, s: clamp(s,20,100), l: clamp(l,10,92)})));
      });
    } else {
      // fallback
      out.push(rgbToHex(rgb));
      for (let i=1;i<5;i++) {
        out.push('#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'));
      }
    }
    return out.slice(0,5);
  }

  // Render palette
  function renderPalette(palette) {
    paletteGrid.innerHTML = '';
    palette.forEach(hex => {
      const sw = document.createElement('button');
      sw.title = hex;
      Object.assign(sw.style, {
        border: 'none',
        padding: '0',
        height: '56px',
        borderRadius: '8px',
        cursor: 'pointer',
        background: hex,
        boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.06)'
      });
      sw.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(hex);
          flashMessage(hex, sw);
        } catch {
          flashMessage('Failed', sw);
        }
      });

      // overlay label
      const label = document.createElement('div');
      label.textContent = hex;
      Object.assign(label.style, {
        fontSize: '12px',
        color: (isLight(hex) ? '#111' : '#fff'),
        padding: '6px',
        textAlign: 'center',
        fontWeight: 650,
        background: 'transparent'
      });
      sw.appendChild(label);
      paletteGrid.appendChild(sw);
    });
  }

  function isLight(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return true;
    // Perceived luminance
    const l = (0.299*rgb.r + 0.587*rgb.g + 0.114*rgb.b);
    return l > 160;
  }

  // Initial render
  function updateFromInput() {
    const val = hexInput.value.trim();
    const hex = val.startsWith('#') ? val : '#'+val;
    const rgb = hexToRgb(hex);
    if (rgb) {
      preview.style.background = hex;
      const palette = generatePalette(hex, harmonySelect.value);
      renderPalette(palette);
    }
  }
  updateFromInput();

  // Wire events
  hexInput.addEventListener('input', () => {
    // keep as upper/lower as typed, but try to update preview fast
    updateFromInput();
  });
  regenBtn.addEventListener('click', () => updateFromInput());
  harmonySelect.addEventListener('change', () => updateFromInput());

  // Tap outside to close (but keep card taps)
  root.addEventListener('click', (e) => {
    if (e.target === root) root.remove();
  });

  // Accessibility: ensure interactive targets large enough
  // (styles already set; just in case)
  const style = document.createElement('style');
  style.textContent = `
    #injected-ui-root button, #injected-ui-root select, #injected-ui-root input { min-height:44px; }
    @media (max-width:420px) {
      #injected-ui-root div[style] > div { gap:10px; }
    }
  `;
  document.head.appendChild(style);

})();
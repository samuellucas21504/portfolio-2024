import './styles.css'

type RimPoint = { c: number; s: number; r: number; v: number }
type Blob = {
  pts: RimPoint[]
  tmp: number[]
  seed: number
  x: number
  y: number
  vx: number
  vy: number
  R: number
  clock: number
  init: boolean
  kick: number
  /** inchaço do "pop" ao entrar (1 → 0) */
  pop: number
}
type Drop = {
  sp: number
  ph: number
  dist: number
  size: number
  x: number
  y: number
  vx: number
  vy: number
  init: boolean
  kick: { x: number; y: number } | null
}
type Target = { x: number; y: number; R: number }
type Vec = [number, number]

const TAU = Math.PI * 2
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const fx1 = (v: number) => v.toFixed(1)

/* ---------------------------------------------------------------
   Capa: o nome ocupa a altura da tela
   "SAMUEL" ganha a altura primeiro e a largura das letras (eixo wdth
   da Archivo) se ajusta para encher a linha. "Lucas" fica com o resto.
   A gota grande vai ao lado de "Lucas" (tela deitada) ou no espaço
   livre acima do nome (tela em pé).
   --------------------------------------------------------------- */
function setupHeroFit(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>('.hgrid')
  const title = root.querySelector<HTMLElement>('.hl')
  const line1 = root.querySelector<HTMLElement>('.ln1')
  const line2 = root.querySelector<HTMLElement>('.ln2')
  const lucas = root.querySelector<HTMLElement>('.lucas')
  const anchor = root.querySelector<HTMLElement>('.anchor')
  if (!stage || !title || !line1 || !line2 || !lucas || !anchor) return
  const letters = Array.from(line1.children) as HTMLElement[]

  const setWidth = (wd: number) => letters.forEach((l) => (l.style.fontVariationSettings = `"wdth" ${wd.toFixed(1)}, "wght" 900`))
  const naturalWidth = () => letters.reduce((sum, l) => sum + l.offsetWidth, 0)

  const fit = () => {
    const W = title.clientWidth
    const H = stage.clientHeight
    if (W < 60 || H < 60) return
    const gap = parseFloat(getComputedStyle(line2).marginTop) || 0
    const top = parseFloat(getComputedStyle(title).marginTop) || 0
    const usable = Math.max(100, H - gap - top)

    let size1 = (usable * 0.54) / 0.8
    line1.style.fontSize = `${size1}px`
    setWidth(62)
    let wd = 62
    const narrowest = naturalWidth()
    const portrait = narrowest > W
    if (portrait) {
      size1 *= (W * 0.995) / narrowest
      line1.style.fontSize = `${size1}px`
    } else {
      setWidth(125)
      if (naturalWidth() <= W) {
        wd = 125
      } else {
        let lo = 62
        let hi = 125
        for (let i = 0; i < 9; i++) {
          const mid = (lo + hi) / 2
          setWidth(mid)
          if (naturalWidth() <= W) lo = mid
          else hi = mid
        }
        wd = lo
      }
    }
    setWidth(wd)
    line1.dataset.wd = wd.toFixed(1)
    letters.forEach((l) => delete l.dataset.w)

    let size2 = Math.max(40, (usable - line1.offsetHeight) / 0.8)
    lucas.style.fontSize = `${size2}px`
    const maxWidth = portrait ? W : W * 0.76
    if (lucas.offsetWidth > maxWidth) {
      size2 *= maxWidth / lucas.offsetWidth
      lucas.style.fontSize = `${size2}px`
    }

    // Medidas de layout (offset*), que ignoram transformações. Antes usava getBoundingClientRect, que
    // inclui a animação de entrada de "Lucas" (deslocado e em escala no primeiro ajuste) e a escala da
    // capa encolhida pela rolagem: o espaço da gota saía diferente a cada ajuste (carregar, resize,
    // barra do celular) e a gota mudava de tamanho ao voltar ao topo.
    const within = (el: HTMLElement) => {
      let x = 0
      let y = 0
      let node: HTMLElement | null = el
      while (node && node !== stage) {
        x += node.offsetLeft
        y += node.offsetTop
        node = node.offsetParent as HTMLElement | null
      }
      return { x, y }
    }
    const sw = stage.clientWidth
    const sh = stage.clientHeight
    const spare = within(title).y
    let box: { left: number; top: number; width: number; height: number }
    if (spare > sh * 0.22) {
      box = { left: sw * 0.28, top: 0, width: sw * 0.72, height: spare }
    } else {
      // tela deitada: a gota fica na ponta direita, ao lado de "Lucas" (o desenho já aprovado), e nunca
      // encosta no nome se ele for largo
      const left = Math.max(within(lucas).x + lucas.offsetWidth + sw * 0.02, sw * 0.873)
      box = { left, top: within(line2).y, width: Math.max(sw - left, sw * 0.16), height: line2.offsetHeight }
    }
    Object.assign(anchor.style, {
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
      right: 'auto',
      bottom: 'auto',
    })
  }

  let queued = 0
  fit()
  document.fonts?.ready.then(fit)
  window.addEventListener('resize', () => {
    cancelAnimationFrame(queued)
    queued = requestAnimationFrame(fit)
  })
}

/* ---------------------------------------------------------------
   Trajetória: uma experiência aberta por vez
   --------------------------------------------------------------- */
function setupAccordion(root: HTMLElement): void {
  const items = Array.from(root.querySelectorAll<HTMLElement>('.xitem'))
  const setOpen = (item: HTMLElement, open: boolean) => {
    item.classList.toggle('open', open)
    item.querySelector('.xrow')?.setAttribute('aria-expanded', String(open))
    const body = item.querySelector<HTMLElement>('.xbody')
    if (body) body.hidden = !open
  }
  for (const item of items) {
    item.querySelector('.xrow')?.addEventListener('click', () => {
      const willOpen = !item.classList.contains('open')
      items.forEach((other) => setOpen(other, false))
      if (willOpen) setOpen(item, true)
    })
  }
}

/* ---------------------------------------------------------------
   Ferramentas: roleta infinita
   A lista de cada categoria é renderizada 3 vezes. Ao chegar ao fim
   da cópia do meio, anima até a cópia de baixo (idêntica) e volta
   sem transição para a do meio: o começo e o fim nunca aparecem.
   --------------------------------------------------------------- */
function setupStack(root: HTMLElement, motion: boolean): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.tab'))
  const lists = Array.from(root.querySelectorAll<HTMLElement>('.stk-list'))
  if (!tabs.length || tabs.length !== lists.length) return

  let cat = 0
  let pos = 0
  let wrapTimer = 0
  const size = (i: number) => lists[i].children.length / 3

  const render = (animate: boolean) => {
    const list = lists[cat]
    list.classList.toggle('noanim', !animate)
    list.style.transform = `translateY(${2 - pos}em)`
    Array.from(list.children).forEach((word, i) => {
      const d = Math.abs(i - pos)
      word.classList.toggle('on', d === 0)
      word.classList.toggle('n1', d === 1)
    })
  }

  const select = (i: number) => {
    window.clearTimeout(wrapTimer)
    cat = i
    pos = size(i)
    tabs.forEach((tab, j) => {
      tab.classList.toggle('on', j === i)
      tab.setAttribute('aria-pressed', String(j === i))
    })
    lists.forEach((list, j) => (list.hidden = j !== i))
    render(false)
  }

  const advance = () => {
    const n = size(cat)
    pos += 1
    render(true)
    if (pos >= 2 * n) {
      wrapTimer = window.setTimeout(() => {
        pos -= n
        render(false)
      }, 900)
    }
  }

  tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i)))
  select(0)
  if (!motion) return

  let visible = true
  const stk = root.querySelector('.stk')
  if (stk && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting
    }).observe(stk)
  }
  window.setInterval(() => {
    if (visible && !document.hidden) advance()
  }, 1800)
}

/* ---------------------------------------------------------------
   Revelar ao rolar (e girar os contadores)
   --------------------------------------------------------------- */
function setupReveal(root: HTMLElement): void {
  if (!('IntersectionObserver' in window)) return
  const vh = window.innerHeight
  const pending = Array.from(root.querySelectorAll<HTMLElement>('[data-rv]')).filter((el) => {
    const r = el.getBoundingClientRect()
    const seen = r.top < vh * 0.95 && r.bottom > 0
    if (seen) el.classList.add('in')
    return !seen
  })
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('in')
        io.unobserve(entry.target)
      }
    },
    { threshold: 0.12 },
  )
  pending.forEach((el) => io.observe(el))
  root.classList.add('armed')
}

/* ---------------------------------------------------------------
   Tinta: gota com borda elástica
   --------------------------------------------------------------- */
function makeBlob(points: number, seed: number): Blob {
  const pts: RimPoint[] = []
  for (let i = 0; i < points; i++) {
    const a = (i / points) * TAU
    pts.push({ c: Math.cos(a), s: Math.sin(a), r: 0, v: 0 })
  }
  return { pts, tmp: new Array(points).fill(0), seed, x: 0, y: 0, vx: 0, vy: 0, R: 0, clock: 0, init: false, kick: 0, pop: 0 }
}

const radiusOf = (b: Blob) => b.R * (1 + 0.02 * b.pop)

function isInside(b: Blob, x: number, y: number): boolean {
  if (!b.init || b.R <= 0) return false
  const a = (Math.atan2(y - b.y, x - b.x) + TAU) % TAU
  const i = Math.round((a / TAU) * b.pts.length) % b.pts.length
  return Math.hypot(x - b.x, y - b.y) < radiusOf(b) + b.pts[i].r - 2
}

/**
 * Um passo da física da gota.
 * - Fora: o cursor empurra o centro e amassa a borda quando se aproxima.
 * - Dentro (hold): a gota volta para o lugar dela com um quique e fica ali;
 *   só a borda perto do cursor reage.
 */
function stepBlob(b: Blob, target: Target, mx: number, my: number, mvx: number, mvy: number, active: boolean, hold: boolean, t: number): void {
  if (target.R <= 0) return
  if (!b.init) {
    b.x = target.x
    b.y = target.y
    b.R = target.R
    b.init = true
  }
  b.R += (target.R - b.R) * 0.1
  b.pop *= 0.9
  const R0 = radiusOf(b)

  if (hold) {
    b.vx = (b.vx + (target.x - b.x) * 0.06) * 0.78
    b.vy = (b.vy + (target.y - b.y) * 0.06) * 0.78
  } else {
    b.clock += 1
    const ts = b.clock / 60
    let fx = (target.x + Math.sin(ts * 0.43 + b.seed) * R0 * 0.1 - b.x) * 0.012
    let fy = (target.y + Math.cos(ts * 0.31 + b.seed * 2) * R0 * 0.08 - b.y) * 0.012
    if (active) {
      const dx = b.x - mx
      const dy = b.y - my
      const d = Math.hypot(dx, dy) || 1
      const infl = R0 * 1.5
      if (d < infl) {
        const k = 1 - d / infl
        fx += (dx / d) * k * 0.9 + mvx * 0.04 * k
        fy += (dy / d) * k * 0.9 + mvy * 0.04 * k
      }
    }
    b.vx = (b.vx + fx) * 0.9
    b.vy = (b.vy + fy) * 0.9
  }
  b.x += b.vx
  b.y += b.vy

  const pts = b.pts
  const n = pts.length
  const kick = b.kick
  const calm = hold ? 0.6 : 1
  const ts = t * 0.001
  b.kick = 0
  for (let i = 0; i < n; i++) {
    const p = pts[i]
    const idle = R0 * calm * (0.055 * Math.sin(ts * 1.1 + i * 1.7 + b.seed) + 0.035 * Math.sin(ts * 1.9 + i * 2.9 + b.seed * 3))
    let f = (idle - p.r) * 0.05
    if (active) {
      const rr = R0 + p.r
      const dx = b.x + p.c * rr - mx
      const dy = b.y + p.s * rr - my
      const d = Math.hypot(dx, dy) || 1
      const infl = R0 * 0.45 + 24
      if (d < infl) {
        const k = 1 - d / infl
        f += ((dx * p.c + dy * p.s) / d) * k * k * R0 * 0.022
        f += (mvx * p.c + mvy * p.s) * k * 0.06
      }
    }
    if (kick) f += kick * (0.55 + 0.45 * Math.abs(Math.sin(i * 12.9898 + b.seed)))
    p.v = (p.v + f) * 0.87
  }
  for (let i = 0; i < n; i++) pts[i].r += pts[i].v
  for (let i = 0; i < n; i++) b.tmp[i] = pts[i].r * 0.7 + (pts[(i - 1 + n) % n].r + pts[(i + 1) % n].r) * 0.15
  for (let i = 0; i < n; i++) pts[i].r = clamp(b.tmp[i], -R0 * 0.55, R0 * 0.9)
}

function blobPath(b: Blob): string {
  const n = b.pts.length
  const R = radiusOf(b)
  const P: Vec[] = b.pts.map((p) => {
    const rr = Math.max(1, R + p.r)
    return [b.x + p.c * rr, b.y + p.s * rr]
  })
  let d = `M${fx1(P[0][0])} ${fx1(P[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n]
    const p1 = P[i]
    const p2 = P[(i + 1) % n]
    const p3 = P[(i + 2) % n]
    d += `C${fx1(p1[0] + (p2[0] - p0[0]) / 6)} ${fx1(p1[1] + (p2[1] - p0[1]) / 6)} ${fx1(p2[0] - (p3[0] - p1[0]) / 6)} ${fx1(p2[1] - (p3[1] - p1[1]) / 6)} ${fx1(p2[0])} ${fx1(p2[1])}`
  }
  return d + 'Z'
}

/* ---------------------------------------------------------------
   Cursor: lente translúcida, letras que respiram, tinta e parallax
   --------------------------------------------------------------- */
function setupPointerFx(root: HTMLElement, motion: boolean): void {
  const hero = root.querySelector<HTMLElement>('.hero')
  if (!hero) return
  const lens = document.querySelector<HTMLElement>('.lens')
  const anchor = root.querySelector<HTMLElement>('.anchor')
  const dotSlot = root.querySelector<HTMLElement>('.dotslot')
  const line1 = root.querySelector<HTMLElement>('.ln1')
  const pMain = root.querySelector<SVGPathElement>('.p-main')
  const pMainShadow = root.querySelector<SVGPathElement>('.p-mains')
  const pDot = root.querySelector<SVGPathElement>('.p-dot')
  const pDotShadow = root.querySelector<SVGPathElement>('.p-dots')
  const dropEls = Array.from(root.querySelectorAll<SVGCircleElement>('.drop'))
  const letters = Array.from(root.querySelectorAll<HTMLElement>('.ln1 .lt'))
  const parallax = Array.from(root.querySelectorAll<HTMLElement>('[data-par]'))
  // títulos com data-lens: a cópia .lx aparece só dentro do círculo da lente (meia letra fica meio pintada)
  type Zone = { el: HTMLElement; lx: HTMLElement; clip: HTMLElement | null; shown: boolean }
  const zones: Zone[] = []
  for (const el of root.querySelectorAll<HTMLElement>('[data-lens]')) {
    const lx = el.querySelector<HTMLElement>(':scope > .lx')
    if (lx) zones.push({ el, lx, clip: el.closest<HTMLElement>('.hx-stage'), shown: false })
  }

  const mouse = { x: -9999, y: -9999, px: Number.NaN, py: Number.NaN, active: false, hot: false, text: false }
  let tap: { x: number; y: number } | null = null
  // a ponta real do cursor: um ponto que anda junto com o mouse, sem a suavização da bola
  const tip = document.querySelector<HTMLElement>('.lens-dot')
  // com mouse ou caneta, só a bola aparece: o cursor do sistema some
  if (lens && window.matchMedia('(hover: hover) and (pointer: fine)').matches) document.documentElement.classList.add('no-cursor')

  // o ponteiro está em cima de caracteres? (as caixas do texto, não o bloco inteiro)
  const range = document.createRange()
  const overText = (target: Element | null, x: number, y: number) => {
    if (!target) return false
    for (const n of target.childNodes) {
      if (n.nodeType !== Node.TEXT_NODE || !n.textContent?.trim()) continue
      range.selectNodeContents(n)
      // folga de 4px na vertical: o espaço entre linhas não faz a bola piscar entre vidro e nítido
      for (const r of range.getClientRects()) if (x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 4 && y <= r.bottom + 4) return true
    }
    return false
  }
  const readTarget = (target: Element | null) => {
    mouse.hot = !!target?.closest('a, button')
    mouse.text = overText(target, mouse.x, mouse.y)
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') {
        mouse.active = false
        return
      }
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
      readTarget(e.target instanceof Element ? e.target : null)
      if (tip) tip.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
    },
    { passive: true },
  )
  // rolando sem mexer o mouse, o que está embaixo dele muda: relê uma vez por quadro
  let rereading = false
  window.addEventListener(
    'scroll',
    () => {
      if (!mouse.active || rereading) return
      rereading = true
      requestAnimationFrame(() => {
        rereading = false
        readTarget(document.elementFromPoint(mouse.x, mouse.y))
      })
    },
    { passive: true },
  )
  document.addEventListener('pointerout', (e) => {
    if (!e.relatedTarget) mouse.active = false
  })
  window.addEventListener('pointerdown', (e) => (tap = { x: e.clientX, y: e.clientY }), { passive: true })

  const main = makeBlob(18, 1.3)
  const dot = makeBlob(10, 4.1)
  const drops: Drop[] = [
    { sp: 0.32, ph: 0.4, dist: 1.45, size: 0.16 },
    { sp: -0.24, ph: 2.6, dist: 1.62, size: 0.1 },
    { sp: 0.18, ph: 4.4, dist: 1.32, size: 0.07 },
  ].map((d) => ({ ...d, x: 0, y: 0, vx: 0, vy: 0, init: false, kick: null }))
  const lensPos = { x: 0, y: 0, cls: '' }
  let inMain = false
  let inDot = false
  let last = performance.now()

  // posição de um elemento dentro da capa em px de layout: não muda quando a capa encolhe (transform)
  const offsetIn = (el: HTMLElement) => {
    let x = 0
    let y = 0
    let node: HTMLElement | null = el
    while (node && node !== hero) {
      x += node.offsetLeft
      y += node.offsetTop
      node = node.offsetParent as HTMLElement | null
    }
    return { x, y }
  }

  const geometry = () => {
    const hr = hero.getBoundingClientRect()
    const sc = hr.width / (hero.offsetWidth || hr.width) || 1
    const W = hero.offsetWidth
    const H = hero.offsetHeight
    let mainT: Target = { x: W * 0.8, y: H * 0.5, R: clamp(W * 0.09, 40, 150) }
    if (anchor && anchor.offsetWidth > 10 && anchor.offsetHeight > 10) {
      const o = offsetIn(anchor)
      mainT = { x: o.x + anchor.offsetWidth / 2, y: o.y + anchor.offsetHeight / 2, R: clamp(Math.min(anchor.offsetWidth * 0.42, anchor.offsetHeight * 0.5), 28, 190) }
    }
    let dotT: Target = { x: -999, y: -999, R: 0 }
    if (dotSlot && dotSlot.offsetWidth > 2) {
      const o = offsetIn(dotSlot)
      dotT = { x: o.x + dotSlot.offsetWidth / 2, y: o.y + dotSlot.offsetHeight / 2, R: Math.max(4, dotSlot.offsetWidth / 2) }
    }
    return { hr, sc, W, H, mainT, dotT }
  }

  const draw = () => {
    const dm = blobPath(main)
    pMain?.setAttribute('d', dm)
    pMainShadow?.setAttribute('d', dm)
    if (dot.init && dot.R > 0) {
      const dd = blobPath(dot)
      pDot?.setAttribute('d', dd)
      pDotShadow?.setAttribute('d', dd)
    }
    drops.forEach((d, i) => {
      const el = dropEls[i]
      if (!el) return
      el.setAttribute('cx', fx1(d.x))
      el.setAttribute('cy', fx1(d.y))
      el.setAttribute('r', motion ? fx1(main.R * d.size) : '0')
    })
  }

  // Movimento reduzido: tinta parada, desenhada uma vez (e refeita se o layout mudar)
  if (!motion) {
    const still = () => {
      const g = geometry()
      for (const [b, target] of [[main, g.mainT], [dot, g.dotT]] as [Blob, Target][]) {
        b.x = target.x
        b.y = target.y
        b.R = target.R
        b.init = target.R > 0
      }
      draw()
    }
    still()
    window.addEventListener('resize', () => requestAnimationFrame(still))
    document.fonts?.ready.then(() => requestAnimationFrame(still))
  }

  const splash = () => {
    main.kick = main.R * 0.16
    dot.kick = dot.R * 0.3
    for (const d of drops) {
      const a = Math.atan2(d.y - main.y, d.x - main.x) + (Math.random() - 0.5)
      d.kick = { x: Math.cos(a) * 16, y: Math.sin(a) * 16 }
    }
  }

  const pop = (b: Blob, strength: number) => {
    b.kick = b.R * strength
    b.pop = 1
  }

  const stepDrops = (t: number, mx: number, my: number, active: boolean) => {
    const ts = t * 0.001
    drops.forEach((d, i) => {
      if (!d.init) {
        d.x = main.x
        d.y = main.y
        d.init = true
      }
      const ang = ts * d.sp + d.ph
      const dist = main.R * (d.dist + 0.08 * Math.sin(ts * 1.3 + i))
      let fx = (main.x + Math.cos(ang) * dist - d.x) * 0.02
      let fy = (main.y + Math.sin(ang) * dist * 0.85 - d.y) * 0.02
      if (active) {
        const dx = d.x - mx
        const dy = d.y - my
        const dd = Math.hypot(dx, dy) || 1
        if (dd < 90) {
          const k = 1 - dd / 90
          fx += (dx / dd) * k * 2.2
          fy += (dy / dd) * k * 2.2
        }
      }
      if (d.kick) {
        fx += d.kick.x
        fy += d.kick.y
        d.kick = null
      }
      d.vx = (d.vx + fx) * 0.9
      d.vy = (d.vy + fy) * 0.9
      d.x += d.vx
      d.y += d.vy
    })
  }

  // recorta as cópias .lx no círculo da lente e escolhe o modo da lente.
  // Roda no fim do quadro, depois do parallax, para o recorte acompanhar o texto que se mexe.
  const finishLens = () => {
    if (!lens) return
    const r = lens.offsetWidth / 2
    let inZone = false
    for (const z of zones) {
      let e: { left: number; right: number; top: number; bottom: number } = z.el.getBoundingClientRect()
      if (z.clip) {
        const c = z.clip.getBoundingClientRect()
        e = { left: Math.max(e.left, c.left), right: Math.min(e.right, c.right), top: Math.max(e.top, c.top), bottom: Math.min(e.bottom, c.bottom) }
      }
      const hit = mouse.active && lensPos.x + r > e.left && lensPos.x - r < e.right && lensPos.y + r > e.top && lensPos.y - r < e.bottom
      if (!hit) {
        if (z.shown) {
          z.lx.style.clipPath = ''
          z.shown = false
        }
        continue
      }
      // coordenadas locais da cópia (se algum pai estiver em escala, divide pela escala)
      const b = z.lx.getBoundingClientRect()
      const s = b.width / (z.lx.offsetWidth || b.width) || 1
      z.lx.style.clipPath = `circle(${fx1(r / s)}px at ${fx1((lensPos.x - b.left) / s)}px ${fx1((lensPos.y - b.top) / s)}px)`
      z.shown = true
      if (lensPos.x > e.left && lensPos.x < e.right && lensPos.y > e.top && lensPos.y < e.bottom) inZone = true
    }
    // sobre links encolhe; dentro da tinta vira gota de cobalto; nos títulos com efeito vira um anel
    // que revela; sobre qualquer outro texto perde o vidro (fica só o anel, para o texto continuar legível)
    const mode = mouse.hot ? ' hot' : inMain || inDot ? ' neg' : inZone ? ' zone' : mouse.text ? ' txt' : ''
    const cls = 'lens' + (mouse.active ? ' on' + mode : '')
    if (cls !== lensPos.cls) {
      lens.className = cls
      lensPos.cls = cls
      tip?.classList.toggle('on', mouse.active)
    }
  }

  const frame = (t: number) => {
    requestAnimationFrame(frame)
    const steps = clamp(Math.round((t - last) / 16.7), 1, 3)
    last = t
    const moving = mouse.active && !Number.isNaN(mouse.px)
    const mvx = moving ? mouse.x - mouse.px : 0
    const mvy = moving ? mouse.y - mouse.py : 0
    mouse.px = mouse.x
    mouse.py = mouse.y

    // lente
    if (lens) {
      lensPos.x += (mouse.x - lensPos.x) * (motion ? 0.2 : 1)
      lensPos.y += (mouse.y - lensPos.y) * (motion ? 0.2 : 1)
      lens.style.transform = `translate3d(${fx1(lensPos.x)}px, ${fx1(lensPos.y)}px, 0)`
    }
    if (!motion) {
      finishLens()
      return
    }

    const vh = window.innerHeight
    const g = geometry()
    if (g.hr.bottom > 0 && g.hr.top < vh) {
      // coordenadas do cursor dentro da capa; com a capa encolhida, a tinta não reage
      const hx = (mouse.x - g.hr.left) / g.sc
      const hy = (mouse.y - g.hr.top) / g.sc
      const act = mouse.active && g.sc > 0.995

      // SAMUEL: perto do cursor as letras afinam (peso) e estreitam um pouco (wdth)
      const base = Number(line1?.dataset.wd ?? 125)
      const rad = 230
      const targets = letters.map((el) => {
        if (!act) return 0
        const r = el.getBoundingClientRect()
        const dx = mouse.x - (r.left + r.width / 2)
        const dy = mouse.y - (r.top + r.height / 2)
        return Math.exp((-(dx * dx + dy * dy) / (rad * rad)) * 1.4)
      })
      letters.forEach((el, i) => {
        const prev = Number(el.dataset.w ?? 0)
        const next = prev + (targets[i] - prev) * 0.12
        if (Math.abs(next - prev) < 0.0008) return
        el.dataset.w = next.toFixed(4)
        el.style.fontVariationSettings = `"wdth" ${fx1(base - (base - 62) * 0.5 * next)}, "wght" ${Math.round(900 - 600 * next)}`
      })

      if (tap) {
        const tx = (tap.x - g.hr.left) / g.sc
        const ty = (tap.y - g.hr.top) / g.sc
        tap = null
        if (g.sc > 0.995 && tx >= 0 && ty >= 0 && tx <= g.W && ty <= g.H) splash()
      }

      // ao entrar na gota: ela volta para o lugar com um "pop"
      const insideMain = act && isInside(main, hx, hy)
      const insideDot = act && isInside(dot, hx, hy)
      if (insideMain && !inMain) pop(main, 0.02)
      if (insideDot && !inDot) pop(dot, 0.05)
      inMain = insideMain
      inDot = insideDot

      for (let k = 0; k < steps; k++) {
        stepBlob(main, g.mainT, hx, hy, mvx / steps, mvy / steps, act, insideMain, t)
        stepBlob(dot, g.dotT, hx, hy, mvx / steps, mvy / steps, act, insideDot, t)
        stepDrops(t, hx, hy, act)
      }
      draw()
    } else {
      tap = null
      inMain = false
      inDot = false
    }

    // palavra gigante da trajetória desliza com a rolagem
    for (const el of parallax) {
      const r = el.getBoundingClientRect()
      if (r.bottom < -300 || r.top > vh + 300) continue
      const speed = Number(el.dataset.par ?? 0)
      el.style.transform = `translate3d(${((r.top + r.height / 2 - vh / 2) * speed) | 0}px, 0, 0)`
    }
    finishLens()
  }
  requestAnimationFrame(frame)
}

/* ---------------------------------------------------------------
   Transições entre as seções, ligadas à rolagem (voltam se rolar para cima).
   Cada fronteira tem a sua, sem repetir:
   Trabalho → Perfil: o Trabalho para e escurece, o Perfil sobe por cima como folha.
   Perfil → Trajetória: rolagem lateral. A pessoa rola para baixo, mas o Perfil sai pela
     esquerda, a página nova entra pela direita e "TRAJETÓRIA" atravessa a tela enorme até
     virar o título da seção.
   Trajetória → Stack: o cobalto se espalha como uma gota de tinta.
   Stack → Contato: colunas laranja com topos de formas diferentes sobem.
   Contato → rodapé: as letras do nome se juntam vindas de vários lados.
   --------------------------------------------------------------- */

// o título da Trajetória ocupa a largura toda (com ou sem movimento)
function fitJourneyWord(root: HTMLElement): void {
  const word = root.querySelector<HTMLElement>('.hx-word')
  const box = root.querySelector<HTMLElement>('.hx-final')
  if (!word || !box) return
  const cs = getComputedStyle(box)
  const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
  word.style.fontSize = '100px'
  const w = word.offsetWidth
  if (w > 0 && avail > 0) word.style.fontSize = `${((100 * avail * 0.99) / w).toFixed(2)}px`
}

function setupTransitions(root: HTMLElement): void {
  const work = root.querySelector<HTMLElement>('#work')
  const profile = root.querySelector<HTMLElement>('#profile')
  const journey = root.querySelector<HTMLElement>('#journey')
  const stack = root.querySelector<HTMLElement>('#stack')
  const contact = root.querySelector<HTMLElement>('#contact')
  const foot = root.querySelector<HTMLElement>('.foot')
  const hx = root.querySelector<HTMLElement>('.hx')
  const stage = root.querySelector<HTMLElement>('.hx-stage')
  const panel = root.querySelector<HTMLElement>('.hx-panel')
  const word = root.querySelector<HTMLElement>('.hx-word')
  const deck = root.querySelector<HTMLElement>('.hx-final .jdeck')
  if (!work || !profile || !journey || !stack || !contact || !foot || !hx || !stage || !panel || !word || !deck) return
  const cols = Array.from(contact.querySelectorAll<HTMLElement>('.sky i'))
  const letters = Array.from(foot.querySelectorAll<HTMLElement>('.fl'))
  const listWrap = hx.nextElementSibling instanceof HTMLElement ? hx.nextElementSibling : null
  const boxStage = stack.querySelector<HTMLElement>('.boxstage')
  const box = stack.querySelector<HTMLElement>('.box')
  const boxGrid = stack.querySelector<HTMLElement>('.sgrid')
  const doors = Array.from(stack.querySelectorAll<HTMLElement>('.door'))
  const latches = Array.from(stack.querySelectorAll<HTMLElement>('.latch'))
  root.classList.add('tx-on')

  // palco da Trajetória: fica parado por D px de rolagem. O .hx sobe uma tela (margem negativa) para
  // o palco grudar no topo exatamente quando o fim do Perfil chega ao pé da tela.
  const g = { D: 1, fx: 0, fy: 0, fw: 1, fh: 1, S: 1, DB: 1 }
  const measure = () => {
    const vh = window.innerHeight
    // caixa de ferramentas: a seção fica uma tela mais DB de rolagem, e o palco gruda no topo nesse trecho
    g.DB = Math.round(vh * 1.3)
    if (boxStage && doors.length === 2) {
      stack.style.height = `${vh + g.DB}px`
      boxStage.style.height = `${vh}px`
    }
    fitJourneyWord(root)
    g.D = Math.round(vh * 3)
    hx.style.height = `${vh + g.D}px`
    hx.style.marginTop = `${-vh}px`
    stage.style.height = `${vh}px`
    // lugar final da palavra (o título), medido sem transformação
    g.fx = word.offsetLeft
    g.fy = word.offsetTop
    g.fw = word.offsetWidth
    g.fh = word.offsetHeight
    // enquanto atravessa, a palavra tem ~metade da altura da tela (limitada no celular para não correr demais)
    g.S = clamp((vh * 0.5) / (g.fh * 0.84), 1.5, 5.5)
    // a lista começa logo abaixo do parágrafo (no espaçamento normal), e não depois da tela inteira do palco:
    // ela sobe por cima da parte vazia do palco enquanto o título pousa
    if (listWrap) {
      const gap = clamp(root.clientWidth * 0.04, 32, 60)
      const below = vh - (deck.offsetTop + deck.offsetHeight) - gap
      listWrap.style.marginTop = `${-Math.max(0, Math.round(below))}px`
    }
  }
  measure()

  const out3 = (k: number) => 1 - Math.pow(1 - k, 3)
  const inOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
  // ordem e desvios fixos (parecem aleatórios, mas não mudam entre visitas)
  const colOrder = cols.map((_, i) => ((i * 7 + 3) % cols.length) / cols.length)
  const scatter = letters.map((_, i) => ({ x: (((i * 37) % 11) - 5) * 0.22, y: 0.8 + ((i * 53) % 7) * 0.14, r: (((i * 29) % 9) - 4) * 8 }))

  let queued = false
  const render = () => {
    queued = false
    const vh = window.innerHeight
    const W = root.clientWidth

    // Trabalho → Perfil (p: topo do Perfil indo do pé ao topo da tela)
    const p2 = clamp((vh - profile.getBoundingClientRect().top) / vh, 0, 1)
    if (p2 > 0) {
      work.style.transform = `translateY(${(p2 * vh).toFixed(1)}px) scale(${(1 - 0.07 * out3(p2)).toFixed(4)})`
      work.style.transformOrigin = `50% ${Math.round(work.offsetHeight - vh / 2)}px`
    } else {
      work.style.transform = ''
    }
    profile.style.setProperty('--lift', `${(48 * (1 - out3(p2))).toFixed(1)}px`)
    // escurecimento: uma sombra do tamanho do Perfil, deslocada uma tela para cima, cobre só a tela acima
    // da folha (o Trabalho encolhido e as bordas que ele deixa à mostra) e nada abaixo
    profile.style.boxShadow =
      p2 > 0 && p2 < 1
        ? `0 ${-vh}px 0 0 rgba(21, 21, 26, ${(0.62 * p2).toFixed(3)}), 0 -34px 60px -36px rgba(21, 21, 26, .55)`
        : p2 >= 1
          ? `0 ${-vh}px 0 0 rgba(21, 21, 26, .62)`
          : ''

    // Perfil → Trajetória: rolagem lateral com o palco parado
    const scrolled = clamp(-hx.getBoundingClientRect().top, 0, g.D)
    const q = scrolled / g.D
    const a = inOut(clamp(q / 0.26, 0, 1)) // a página entra pela direita, o Perfil sai pela esquerda
    const b = inOut(clamp((q - 0.26) / 0.52, 0, 1)) // a palavra atravessa a tela
    const c = inOut(clamp((q - 0.78) / 0.22, 0, 1)) // a palavra encolhe até o lugar do título
    // o Perfil fica parado na vertical (compensa a rolagem) enquanto sai para a esquerda
    profile.style.transform = q > 0 ? `translate3d(${(-a * W).toFixed(1)}px, ${scrolled.toFixed(1)}px, 0)` : ''
    panel.style.transform = `translate3d(${((1 - a) * W).toFixed(1)}px, 0, 0)`
    const bw = g.fw * g.S
    const bh = g.fh * g.S
    const x0 = W * 0.06
    const x1 = Math.min(x0, W - bw - W * 0.06)
    let x = a < 1 ? x0 + (1 - a) * W : x0 + (x1 - x0) * b
    let y = (vh - bh) / 2
    let s = g.S
    if (c > 0) {
      x += (g.fx - x) * c
      y += (g.fy - y) * c
      s += (1 - s) * c
    }
    // transformação 2D (sem translate3d): o navegador redesenha o texto no tamanho atual em vez de esticar uma imagem
    word.style.transform = `translate(${(x - g.fx).toFixed(1)}px, ${(y - g.fy).toFixed(1)}px) scale(${s.toFixed(4)})`
    // cheia enquanto atravessa (para ler), vira contorno quando chega
    word.style.setProperty('--fa', (1 - c).toFixed(3))
    // o parágrafo só aparece no fim do pouso, quando a palavra já não passa por cima dele
    const d = clamp((c - 0.6) / 0.4, 0, 1)
    deck.style.opacity = d.toFixed(3)
    deck.style.transform = d < 1 ? `translateY(${((1 - d) * 24).toFixed(1)}px)` : ''

    // Trajetória → Stack: a caixa chega fechada; com ela ocupando a tela, as travas giram e as portas abrem
    if (box && boxGrid) {
      const ob = clamp(-stack.getBoundingClientRect().top / g.DB, 0, 1)
      const unlatch = inOut(clamp(ob / 0.16, 0, 1))
      const open = inOut(clamp((ob - 0.14) / 0.8, 0, 1))
      for (const l of latches) l.style.transform = `rotate(${(unlatch * 90).toFixed(1)}deg)`
      // as portas abrem para dentro: cada uma recua e, perto dos 90°, vira a parede lateral da caixa
      // (abrir para fora fazia a porta passar pelo "olho" e sair da tela no meio do movimento)
      const ang = open * 90
      doors[0].style.transform = open > 0 ? `rotateY(${ang.toFixed(2)}deg)` : ''
      doors[1].style.transform = open > 0 ? `rotateY(${(-ang).toFixed(2)}deg)` : ''
      // escurece conforme vira (parede fica na sombra) e some no fim, deixando só as ferramentas
      const shade = (Math.sin((ang * Math.PI) / 180) * 0.55).toFixed(3)
      for (const d of doors) {
        d.style.setProperty('--shade', shade)
        d.style.opacity = (1 - clamp((open - 0.78) / 0.22, 0, 1)).toFixed(3)
      }
      box.style.visibility = open >= 1 ? 'hidden' : ''
      // as ferramentas estavam lá dentro: chegam um pouco para frente enquanto as portas abrem
      boxGrid.style.transform = open < 1 ? `scale(${(0.9 + 0.1 * open).toFixed(4)})` : ''
      boxGrid.style.opacity = open < 1 ? (0.3 + 0.7 * open).toFixed(3) : ''
    }

    // Stack → Contato: as colunas sobem dentro da faixa cobalto no topo do Contato (abaixo da caixa de
    // ferramentas), cada uma no seu tempo. Começa quando a faixa entra na tela e fecha quando ela está
    // quase toda à vista (o pé da faixa a 85% da altura).
    const p5 = clamp((vh - contact.getBoundingClientRect().top) / (vh * 0.8), 0, 1)
    cols.forEach((c, i) => {
      const k = out3(clamp(p5 * 1.7 - colOrder[i] * 0.7, 0, 1))
      c.style.transform = `translateY(${((1 - k) * 101).toFixed(2)}%)`
    })

    // Contato → rodapé: o rodapé é curto, então a montagem acontece na rolagem que sobra até o fim
    const fr = foot.getBoundingClientRect()
    const p6 = clamp((vh - fr.top) / (fr.height || 1), 0, 1)
    letters.forEach((l, i) => {
      const k = out3(clamp(p6 * 1.5 - (i / letters.length) * 0.5, 0, 1))
      const s = scatter[i]
      l.style.transform = k >= 1 ? '' : `translate(${(s.x * (1 - k)).toFixed(3)}em, ${(s.y * (1 - k)).toFixed(3)}em) rotate(${(s.r * (1 - k)).toFixed(1)}deg)`
    })
  }
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(render)
  }
  const remeasure = () => {
    measure()
    schedule()
  }
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', remeasure)
  document.fonts?.ready.then(remeasure)
  render()
}

/* ---------------------------------------------------------------
   Da capa para o Trabalho
   Ao rolar uma tela: o A e o U de SAMUEL viram formas, a capa vira uma
   moldura que encolhe até o canto de cima e a seção de Trabalho cresce
   como moldura nova a partir do canto de baixo, até ocupar a tela.
   As etiquetas mostram o tamanho de cada moldura ao vivo.
   --------------------------------------------------------------- */
function setupIntro(root: HTMLElement, motion: boolean): void {
  const intro = root.querySelector<HTMLElement>('.intro')
  const hero = root.querySelector<HTMLElement>('.hero')
  const track = root.querySelector<HTMLElement>('.intro-track')
  const work = root.querySelector<HTMLElement>('#work')
  const boxHero = root.querySelector<HTMLElement>('.sb-hero')
  const boxWork = root.querySelector<HTMLElement>('.sb-work')
  if (!motion || !intro || !hero || !track || !work || !boxHero || !boxWork) return
  // letras de "amuel" e "ucas" que viram formas, numa ordem embaralhada (mas fixa)
  const morphs = Array.from(hero.querySelectorAll<HTMLElement>('.mo'))
  const order = morphs.map((_, i) => ((i * 5 + 2) % morphs.length) / morphs.length)
  const SHAPES = 8
  const dimHero = boxHero.querySelector<HTMLElement>('.sb-dim')
  const dimWork = boxWork.querySelector<HTMLElement>('.sb-dim')
  root.classList.add('intro-on')

  const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
  const place = (el: HTMLElement, x: number, y: number, w: number, h: number, show: boolean) => {
    Object.assign(el.style, { left: `${x.toFixed(1)}px`, top: `${y.toFixed(1)}px`, width: `${w.toFixed(1)}px`, height: `${h.toFixed(1)}px`, opacity: show ? '1' : '0' })
  }

  let queued = false
  const render = () => {
    queued = false
    const T = track.offsetHeight
    if (T <= 0) return
    const ir = intro.getBoundingClientRect()
    const t = clamp(-ir.top / T, 0, 1)
    const W = hero.offsetWidth
    const H = hero.offsetHeight
    const vh = window.innerHeight

    // 1) as letras viram formas uma a uma, e cada forma troca a cada trecho de rolagem
    //    (cada letra no seu ritmo, como os caracteres do Matrix)
    const scrolled = Math.max(0, -ir.top)
    morphs.forEach((el, i) => {
      const on = t < 1 && t > 0.02 + order[i] * 0.16
      el.classList.toggle('g', on)
      if (!on) return
      const shape = String((i * 3 + Math.floor(scrolled / (26 + ((i * 11) % 23)))) % SHAPES)
      if (el.dataset.s === shape) return
      if (el.dataset.s) el.classList.remove(`s${el.dataset.s}`)
      el.classList.add(`s${shape}`)
      el.dataset.s = shape
    })

    // 2) a capa encolhe até o canto de cima
    const shrink = ease(clamp((t - 0.15) / 0.6, 0, 1))
    const k = 1 - 0.76 * shrink
    const ox = W * 0.025 * shrink
    const oy = vh * 0.04 * shrink
    hero.style.transform = shrink > 0 ? `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px) scale(${k.toFixed(4)})` : ''
    hero.style.visibility = t >= 1 ? 'hidden' : ''
    place(boxHero, ox, oy, W * k, H * k, t > 0.03 && t < 1)
    if (dimHero) dimHero.textContent = `${Math.round(W * k)} × ${Math.round(H * k)}`

    // 3) a seção de Trabalho cresce a partir do canto de baixo
    const grow = clamp((t - 0.3) / 0.7, 0, 1)
    if (t >= 1 || grow <= 0) {
      work.style.clipPath = t >= 1 ? '' : 'inset(100% 0 0 0)'
      place(boxWork, 0, 0, 0, 0, false)
      return
    }
    const e = ease(grow)
    const wr = work.getBoundingClientRect()
    const bx = W * (0.8 - 0.8 * e)
    const bw = W * (0.17 + 0.83 * e)
    const bottom = vh * (0.95 + 0.05 * e)
    // a borda de cima nunca passa do topo da seção, que sobe enquanto a moldura cresce
    const top = Math.max(vh * (0.79 - 0.79 * e), wr.top)
    const left = ir.left + bx
    work.style.clipPath = `inset(${(top - wr.top).toFixed(1)}px ${(wr.right - left - bw).toFixed(1)}px ${(wr.bottom - bottom).toFixed(1)}px ${(left - wr.left).toFixed(1)}px)`
    place(boxWork, bx, top, bw, bottom - top, true)
    if (dimWork) dimWork.textContent = `${Math.round(bw)} × ${Math.round(bottom - top)}`
  }
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(render)
  }
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  render()
}

/* ---------------------------------------------------------------
   Início (no fim do arquivo para que todas as constantes já existam)
   --------------------------------------------------------------- */
const site = document.querySelector<HTMLElement>('.site')
if (site) {
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  setupHeroFit(site)
  setupIntro(site, motion)
  if (motion) setupTransitions(site)
  else {
    const fit = () => fitJourneyWord(site)
    fit()
    window.addEventListener('resize', fit)
    document.fonts?.ready.then(fit)
  }
  setupAccordion(site)
  setupStack(site, motion)
  if (motion) setupReveal(site)
  setupPointerFx(site, motion)
}

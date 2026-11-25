import type { Content } from './content/pt'

// Modelo único das páginas. O vite.config.ts injeta o resultado em index.html (PT) e en/index.html (EN).

const LINKEDIN = 'https://linkedin.com/in/samuel-lucas-rdg'
const GITHUB = 'https://github.com/samuellucas21504'

const icon = (paths: string, size = 14, stroke = 2.6) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" aria-hidden="true">${paths}</svg>`
const UP_RIGHT = '<path d="M7 17L17 7"/><path d="M8 7h9v9"/>'
const DOWN = '<path d="M12 4v16"/><path d="M5 13l7 7 7-7"/>'
const UP = '<path d="M12 20V4"/><path d="M5 11l7-7 7 7"/>'
const DOWN_RIGHT = '<path d="M6 6l12 12"/><path d="M18 8v10H8"/>'
const PLUS = '<path d="M12 5v14"/><path d="M5 12h14"/>'
const RIGHT = '<path d="M4 12h16"/><path d="M13 5l7 7-7 7"/>'

const pad = (n: number) => String(n).padStart(2, '0')
const list = <T>(items: T[], fn: (item: T, i: number) => string) => items.map(fn).join('')

// Contador que gira até o valor: cada dígito é uma fita 0–9 repetida duas vezes.
const STRIP = list(Array.from({ length: 20 }, (_, i) => i % 10), (d) => `<span>${d}</span>`)
function odometer(value: string, baseDelay = 0): string {
  let k = 0
  return list([...value], (ch) => {
    if (!/\d/.test(ch)) return `<span class="osep">${ch}</span>`
    const delay = (baseDelay + k++ * 0.09).toFixed(2)
    return `<span class="oc"><span class="os" style="transform:translateY(-${10 + Number(ch)}em);transition-delay:${delay}s">${STRIP}</span></span>`
  })
}

const OTP = ['4829173650', '7315098264', '0596381742', '2681740395', '9043265817', '5170429638']

const windowBar = (file: string, tag: string) =>
  `<div class="wbar"><span class="wd" aria-hidden="true"><i></i><i></i><i></i></span><span class="f-m wt">${file}</span><span class="f-m wf">${tag}</span></div>`

export function renderHead(c: Content): string {
  return `<title>${c.meta.title}</title>
    <meta name="description" content="${c.meta.description}" />
    <meta name="theme-color" content="#2433C4" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${c.meta.title}" />
    <meta property="og:description" content="${c.meta.description}" />
    <meta property="og:locale" content="${c.meta.ogLocale}" />`
}

export function renderPage(c: Content): string {
  const { nav, hero, work: w, profile: p, journey: j, stack: s, contact: ct, footer: f } = c

  return `
<a class="skip" href="#content">${c.skip}</a>
<div class="site s-oat" id="top">

<!-- Ao rolar, a capa vira uma moldura que encolhe e a seção de Trabalho cresce no lugar (main.ts, setupIntro) -->
<div class="intro">
<header class="hero wrap">
  <div class="cur" aria-hidden="true">${'<i></i>'.repeat(8)}</div>
  <svg class="ink inkin" aria-hidden="true" focusable="false">
    <path class="p-mains" d="M0 0" transform="translate(8 7)"/>
    <path class="p-dots" d="M0 0" transform="translate(4 3)"/>
    <path class="p-main" d="M0 0"/>
    <path class="p-dot" d="M0 0"/>
    <circle class="drop" cx="-60" cy="-60" r="0"/>
    <circle class="drop" cx="-60" cy="-60" r="0"/>
    <circle class="drop" cx="-60" cy="-60" r="0"/>
  </svg>

  <nav class="nav navin" aria-label="${nav.aria}">
    <a class="brand f-x" href="#top" aria-label="${nav.brandAria}">SL<span class="brand-dot">.</span></a>
    <a class="nl lang f-m" href="${nav.lang.href}" hreflang="${nav.lang.hreflang}" lang="${nav.lang.hreflang}" aria-label="${nav.lang.aria}">${nav.lang.label}</a>
  </nav>

  <!-- O nome ocupa a altura da tela: o tamanho das linhas é calculado em main.ts (setupHeroFit) -->
  <div class="hgrid">
    <span class="anchor" aria-hidden="true"></span>
    <h1 class="hl">
      <span class="sr">Samuel Lucas</span>
      <span class="ln1 f-x" aria-hidden="true">${list([...'SAMUEL'], (ch, i) => `<span class="asm lt${i ? ' mo' : ''}">${ch}</span>`)}</span>
      <span class="ln2" aria-hidden="true"><span class="asm a4 f-s lucas">L${list([...'ucas'], (ch) => `<span class="mo">${ch}</span>`)}<span class="dotslot"></span></span></span>
    </h1>
  </div>

  <div class="hbot fadein">
    <a class="btn btn-pop" href="#work">${hero.ctaWork} ${icon(DOWN)}</a>
    <a class="btn btn-ink" href="#contact">${nav.contact} ${icon(UP_RIGHT)}</a>
    <a class="btn btn-ghost" href="${LINKEDIN}" target="_blank" rel="noopener">LinkedIn ${icon(UP_RIGHT)}</a>
    <a class="scue" href="#work" aria-label="${hero.scrollAria}">${icon(DOWN, 22, 2.4)}</a>
  </div>
</header>
<div class="intro-pin pin-hero" aria-hidden="true">
  <div class="selbox sb-hero">${'<i class="sb-h"></i>'.repeat(4)}<span class="sb-dim"></span></div>
</div>
<div class="intro-pin pin-work" aria-hidden="true">
  <div class="selbox sb-work">${'<i class="sb-h"></i>'.repeat(4)}<span class="sb-dim"></span></div>
</div>
<div class="intro-track"></div>
</div>

<main id="content" tabindex="-1">

<section id="work" class="sec wrap bt" aria-labelledby="work-title">
  <div class="shead">
    <h2 id="work-title" class="f-x h2" data-rv>${w.title[0]} <span class="f-s em">${w.title[1]}</span></h2>
    <p class="deck" data-rv>${w.deck}</p>
  </div>

  <div class="bento">
    <article class="win t-ink c7 r2" data-rv>
      ${windowBar(w.search.file, w.search.tag)}
      <div class="wbody">
        <span class="f-m soft">${w.search.label}</span>
        <span class="f-x num-a"><span class="f-s tilde" aria-hidden="true">~</span><span class="odo" aria-hidden="true">${odometer(w.search.number, 0.25)}</span><span class="sr">${w.search.sr}</span></span>
        <div class="split">
          <p class="cap">${w.search.caption}</p>
          <div class="log f-m" aria-hidden="true">${list(w.search.log, (l, i) => `<div class="l${i + 1}">› ${l}${i === 2 ? '<span class="caret"></span>' : ''}</div>`)}</div>
        </div>
      </div>
    </article>

    <article class="win t-pop c5 r2" data-rv>
      ${windowBar(w.autosave.file, w.autosave.tag)}
      <div class="wbody">
        <span class="f-m">${w.autosave.label}</span>
        <div class="shrink">
          <span class="f-c strike">${w.autosave.from}</span>
          <span class="to">${icon(DOWN_RIGHT, 44, 2.4)}<span class="f-x">${w.autosave.to}</span></span>
        </div>
        <p class="cap">${w.autosave.caption}</p>
      </div>
    </article>

    <article class="win t-card c5 r2 pdfc" data-rv>
      ${windowBar(w.pdf.file, w.pdf.tag)}
      <div class="wbody">
        <span class="f-m">${w.pdf.label}</span>
        <span class="pdfnum">
          <span class="f-x num-c"><span class="odo" aria-hidden="true">${odometer(w.pdf.number, 0.2)}</span><span class="sr">${w.pdf.sr}</span></span>
          <span class="f-m" aria-hidden="true">${w.pdf.sub}</span>
        </span>
        <span class="engines">${list(w.pdf.engines, (e) => `<span class="chip old">${e}</span>`)}<span class="chip new">${w.pdf.engine}</span></span>
        <p class="cap push">${w.pdf.caption}</p>
      </div>
    </article>

    <article class="win t-char c3 r2" data-rv>
      ${windowBar(w.rust.file, w.rust.tag)}
      <div class="wbody">
        <span class="half" aria-hidden="true"></span>
        <span class="f-m">${w.rust.label}</span>
        <div class="shrink sm">
          <span class="f-c strike">${w.rust.from}</span>
          <span class="to">${icon(DOWN_RIGHT, 34, 2.4)}<span class="f-x lc">${w.rust.to}</span></span>
        </div>
        <p class="cap">${w.rust.caption}</p>
      </div>
    </article>

    <article class="win t-ink c4 r2" data-rv>
      ${windowBar(w.tfa.file, w.tfa.tag)}
      <div class="wbody">
        <span class="tfa"><span class="f-x">2FA</span><span class="f-s">${w.tfa.em}</span></span>
        <span class="otp" aria-hidden="true">${list(OTP, (seq) => `<span class="ob"><span class="os2">${list([...seq], (d) => `<span>${d}</span>`)}</span></span>`)}</span>
        <p class="cap">${w.tfa.caption}</p>
        <span class="fixed"><span class="f-m soft">${w.tfa.fixedLabel}</span>${list(w.tfa.fixed, (x) => `<span class="chip x">${x}</span>`)}</span>
      </div>
    </article>

    <article class="win t-pop c4 r2" data-rv>
      ${windowBar(w.tests.file, w.tests.tag)}
      <div class="wbody">
        <span class="f-m">${w.tests.label}</span>
        <span class="tfa"><span class="f-x lc">${w.tests.big}</span><span class="f-s">${w.tests.em}</span></span>
        <span class="bars">
          <span class="bar-row"><span class="f-m">${w.tests.before[0]}</span><span class="bar" aria-hidden="true"><i style="width:100%"></i></span><span class="f-x lc bv">${w.tests.before[1]}</span></span>
          <span class="bar-row"><span class="f-m">${w.tests.after[0]}</span><span class="bar" aria-hidden="true"><i style="width:6%"></i></span><span class="f-x lc bv">${w.tests.after[1]}</span></span>
        </span>
        <p class="cap">${w.tests.caption}</p>
      </div>
    </article>

    <article class="win t-ink c4 r2" data-rv>
      ${windowBar(w.queues.file, w.queues.tag)}
      <div class="wbody">
        <span class="f-m soft">${w.queues.label}</span>
        <span class="bignum"><span class="f-x lc num-q">${w.queues.big}</span><span class="f-m">${w.queues.sub}</span></span>
        <p class="cap push">${w.queues.caption}</p>
      </div>
    </article>

    <article class="win t-card c4 r2" data-rv>
      ${windowBar(w.protocol.file, w.protocol.tag)}
      <div class="wbody">
        <span class="f-m">${w.protocol.label}</span>
        <span class="bignum"><span class="f-x num-p">${w.protocol.big}</span><span class="f-m">${w.protocol.sub}</span></span>
        <p class="cap push">${w.protocol.caption}</p>
      </div>
    </article>
  </div>
</section>

<section id="profile" class="sec wrap bt" aria-labelledby="profile-title">
  <h2 id="profile-title" class="ph" data-rv>
    <span class="f-s ph-1">${p.title[0]}</span>
    <span class="f-x ph-2">${p.title[1]}</span>
    <span class="ph-3">${p.title[2] ? `<span class="f-s">${p.title[2]}</span>` : ''}<span class="f-c ph-4">${p.title[3]}</span></span>
  </h2>
  <div class="pgrid">
    <aside class="ficha" data-rv aria-label="${p.factsTitle}">
      <div class="f-m ficha-h">${p.factsTitle}</div>
      <dl>${list(p.facts, ([k, v]) => `<div class="fr"><dt class="f-m">${k}</dt><dd>${v}</dd></div>`)}</dl>
    </aside>
    <div class="ptext" data-rv>${list(p.body, (t, i) => `<p${i === 0 ? ' class="dcap"' : ''}>${t}</p>`)}</div>
  </div>
</section>

<section id="journey" class="sec bt" aria-labelledby="journey-title">
  <h2 id="journey-title" class="sr">${j.heading}</h2>
  <div class="gwrap" aria-hidden="true"><span class="giant f-x" data-par="-0.4">${j.giant}</span></div>
  <div class="wrap">
    <p class="jdeck" data-rv>${j.deck}</p>
    <div class="xlist">${list(
      j.jobs,
      (job, i) => `
      <div class="xitem${i === 0 ? ' open' : ''}">
        <button class="xrow" type="button" aria-expanded="${i === 0}" aria-controls="job-${i}">
          <span class="xn f-m">${pad(i + 1)}</span>
          <span class="xd f-m">${job.dates}</span>
          <span class="xc f-x">${job.company}</span>
          <span class="xr">${job.role}<span class="f-m xs">${job.sub}</span></span>
          <span class="xi" aria-hidden="true">${icon(PLUS, 18, 2.4)}</span>
        </button>
        <div class="xbody" id="job-${i}"${i === 0 ? '' : ' hidden'}>
          <ul class="xul">${list(job.bullets, (b) => `<li>${b}</li>`)}</ul>
          <div class="xchips">${list(job.chips, (ch) => `<span class="chip">${ch}</span>`)}</div>
        </div>
      </div>`,
    )}
    </div>
  </div>
</section>

<section id="stack" class="sec wrap t-ink" aria-labelledby="stack-title">
  <div class="sgrid">
    <div class="sleft">
      <h2 id="stack-title" class="f-x h2s">${s.title[0]} <span class="f-s">${s.title[1]}</span></h2>
      <div class="tabs" role="group" aria-label="${s.groupAria}">${list(
        s.cats,
        (cat, i) =>
          `<button type="button" class="tab${i === 0 ? ' on' : ''}" aria-pressed="${i === 0}" data-name="${cat.name}"><span class="tn">${pad(i + 1)}</span>${cat.name}</button>`,
      )}</div>
    </div>
    <div class="sright">
      <div class="stk f-c" aria-hidden="true">
        <span class="stk-mark">${icon(RIGHT, 24, 3)}</span>
        ${list(s.cats, (cat, i) => {
          const n = cat.words.length
          const ring = [...cat.words, ...cat.words, ...cat.words]
          const words = list(ring, (word, k) => `<span class="stk-w${k === n ? ' on' : Math.abs(k - n) === 1 ? ' n1' : ''}">${word}</span>`)
          return `<div class="stk-list noanim"${i === 0 ? '' : ' hidden'} style="transform:translateY(${2 - n}em)">${words}</div>`
        })}
      </div>
      <ul class="sr">${list(s.cats, (cat) => `<li>${cat.name}: ${cat.words.join(', ')}</li>`)}</ul>
    </div>
  </div>
</section>

<section id="contact" class="sec wrap t-pop" aria-labelledby="contact-title">
  <h2 id="contact-title" class="cbig" data-rv>
    <span class="f-x cb-1">${ct.title[0]}</span>
    <span class="cb-2"><span class="f-s">${ct.title[1]}</span><span class="f-x outl" aria-hidden="true">(?)</span></span>
  </h2>
  <div class="cgrid">
    <div class="cmail-wrap">
      <span class="f-m">${ct.mailLabel}</span>
      <a class="cmail f-x" href="mailto:${ct.email}">${ct.email}</a>
    </div>
    <p class="ctext">${ct.text}</p>
  </div>
  <div class="clinks">
    <a class="cl" href="${LINKEDIN}" target="_blank" rel="noopener"><span class="f-m">LinkedIn</span><span class="clb"><span class="f-x clt">/samuel-lucas-rdg</span>${icon(UP_RIGHT, 26, 2.4)}</span></a>
    <a class="cl" href="${GITHUB}" target="_blank" rel="noopener"><span class="f-m">GitHub</span><span class="clb"><span class="f-x clt">/samuellucas21504</span>${icon(UP_RIGHT, 26, 2.4)}</span></a>
    <div class="cl"><span class="f-m">${ct.baseLabel}</span><span class="clb col"><span class="f-x clt">${ct.base}</span><span class="f-m">${ct.tz}</span></span></div>
  </div>
</section>

</main>

<footer class="foot">
  <div class="frow wrap f-m"><span>${f.copy}</span><span>${f.place}</span><a class="nl" href="#top">${f.top} ${icon(UP)}</a></div>
  <span class="fmark f-x wrap" aria-hidden="true">Samuel Lucas</span>
</footer>

</div>
<div class="lens" aria-hidden="true"></div>
`
}

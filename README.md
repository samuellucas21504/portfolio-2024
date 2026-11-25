# Portfolio 2026

[PT]

Site pessoal de Samuel Lucas, pensado como uma revista técnica: tipografia gigante, letras que viram formas ao rolar, janelas de vários tamanhos, uma gota de tinta que reage ao cursor e uma roleta infinita de ferramentas. Em português (`/`) e inglês (`/en/`).

[EN]

Samuel Lucas's personal site, designed like a technical magazine: oversized type, letters that turn into shapes as you scroll, windows of many sizes, an ink drop that reacts to the cursor, and an endless tool roulette. In Portuguese (`/`) and English (`/en/`).

## Rodar / Run

```bash
npm install
npm run dev       # http://localhost:5173 e http://localhost:5173/en/
npm run build     # gera ./dist
npm run preview   # serve ./dist
```

Node 20.19+ ou 22+.

## Publicar / Deploy

O workflow `.github/workflows/deploy.yml` roda a cada push na `main`: instala, gera o build e publica `./dist` na branch `gh-pages` (GitHub Pages). O domínio próprio (samuellucasrdg.com) vem do arquivo `public/CNAME`, que vai junto em todo build: sem ele o deploy apaga o domínio do GitHub Pages. O build usa caminhos relativos, então também funciona em subpasta (`usuario.github.io/repo/`).

## Onde mexer / Where to edit

| O quê | Arquivo |
| --- | --- |
| Textos em português | `src/content/pt.ts` |
| Textos em inglês | `src/content/en.ts` (mesmo formato do PT) |
| Estrutura das seções (HTML) | `src/render.ts` |
| Estilos e paletas | `src/styles.css` |
| Interações (tinta, lente, formas da capa, transição de rolagem, roleta, trajetória) | `src/main.ts` |

As duas páginas (`index.html` e `en/index.html`) são cascas mínimas: o plugin em `vite.config.ts` preenche o conteúdo de cada idioma usando o mesmo modelo, no dev e no build.

**Paleta:** troque a classe `s-oat` do `.site` em `src/render.ts` por `s-mag` (oat, marinho e magenta) ou `s-noite` (escura com lima).

**Acessibilidade:** respeita `prefers-reduced-motion` (sem animações e com a tinta parada), tem link para pular para o conteúdo, e a trajetória e as abas funcionam pelo teclado.

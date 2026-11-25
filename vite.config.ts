import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import { renderHead, renderPage } from './src/render.ts'
import { pt } from './src/content/pt.ts'
import { en } from './src/content/en.ts'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * As duas páginas (index.html em PT e en/index.html em EN) são cascas mínimas.
 * Este plugin preenche <!--head--> e <!--page--> com o mesmo modelo (src/render.ts)
 * usando o conteúdo de cada idioma (src/content/*.ts), no dev e no build.
 */
function pages(): Plugin {
  return {
    name: 'render-pages',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const content = ctx.path.startsWith('/en/') ? en : pt
        return html.replace('<!--head-->', renderHead(content)).replace('<!--page-->', renderPage(content))
      },
    },
  }
}

export default defineConfig({
  // caminhos relativos: funciona no domínio raiz, em subpasta do GitHub Pages ou em domínio próprio
  base: './',
  plugins: [pages()],
  build: {
    rollupOptions: {
      input: {
        main: `${root}index.html`,
        en: `${root}en/index.html`,
      },
    },
  },
})

// Auditoria Lighthouse: build otimizado + preview, 3 medicoes por pagina e perfil, mediana por categoria.
// Uso: npm run lighthouse   (opcional: LH_NFT_ID=<id> para escolher o NFT do detalhe)
import { execSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import os from 'node:os'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import * as chromeLauncher from 'chrome-launcher'

const PORT = 4173
const BASE = `http://localhost:${PORT}`
const RUNS = 3
const OUT = 'lighthouse/reports'
const CATS = ['performance', 'accessibility', 'best-practices', 'seo']
const TARGETS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }

function firstNftId() {
  if (process.env.LH_NFT_ID) return process.env.LH_NFT_ID
  const f = 'src/mocks/fixtures/nfts.ts'
  if (existsSync(f)) {
    const m = /\bid:\s*['"]([^'"]+)['"]/.exec(readFileSync(f, 'utf8'))
    if (m) return m[1]
  }
  return 'nft-1'
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }

async function waitFor(url) {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(url)).ok) return } catch { /* aguarda */ } await new Promise((r) => setTimeout(r, 1000)) }
  throw new Error('Servidor de preview nao subiu.')
}

const nftId = firstNftId()
const PAGES = { inicio: '/', detalhe: `/nft/${nftId}` }
console.log(`Detalhe auditado: /nft/${nftId}`)

console.log('Build...')
execSync('npm run build', { stdio: 'inherit' })
const server = spawn('npm', ['run', 'preview', '--', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' })
const stop = () => { try { if (process.platform === 'win32') execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' }); else server.kill() } catch { /* ja encerrado */ } }
process.on('exit', stop)

mkdirSync(OUT, { recursive: true })
const summary = { env: { node: process.version, os: `${os.type()} ${os.release()}`, cpus: os.cpus().length, memGB: Math.round(os.totalmem() / 2 ** 30), date: new Date().toISOString() }, results: [] }

try {
  await waitFor(BASE)
  for (const [page, path] of Object.entries(PAGES)) {
    for (const profile of ['mobile', 'desktop']) {
      const runs = []
      for (let i = 1; i <= RUNS; i++) {
        const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] })
        try {
          const r = await lighthouse(`${BASE}${path}`, { port: chrome.port, output: ['html', 'json'], logLevel: 'error', onlyCategories: CATS }, profile === 'desktop' ? desktopConfig : undefined)
          const base = `${OUT}/${page}-${profile}-${i}`
          writeFileSync(`${base}.html`, r.report[0])
          writeFileSync(`${base}.json`, r.report[1])
          const a = r.lhr.audits
          runs.push({
            scores: Object.fromEntries(CATS.map((c) => [c, Math.round((r.lhr.categories[c].score ?? 0) * 100)])),
            lcp: a['largest-contentful-paint'].numericValue, cls: a['cumulative-layout-shift'].numericValue, tbt: a['total-blocking-time'].numericValue,
          })
          summary.env.lighthouse = r.lhr.lighthouseVersion
          summary.env.chrome = r.lhr.environment.hostUserAgent
        } finally { await chrome.kill() }
      }
      summary.results.push({
        page, profile, runs,
        median: {
          ...Object.fromEntries(CATS.map((c) => [c, median(runs.map((x) => x.scores[c]))])),
          lcpMs: Math.round(median(runs.map((x) => x.lcp))), cls: +median(runs.map((x) => x.cls)).toFixed(3), tbtMs: Math.round(median(runs.map((x) => x.tbt))),
        },
      })
    }
  }
} finally { stop() }

writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 2))
const rows = summary.results.map(({ page, profile, median: m }) => {
  const cell = (c) => `${m[c]}${m[c] >= TARGETS[c] ? '' : ' (abaixo da meta)'}`
  return `| ${page} | ${profile} | ${cell('performance')} | ${cell('accessibility')} | ${cell('best-practices')} | ${cell('seo')} | ${m.lcpMs} | ${m.cls} | ${m.tbtMs} |`
})
const md = ['| Pagina | Perfil | Perf | A11y | BP | SEO | LCP (ms) | CLS | TBT (ms) |', '|---|---|---|---|---|---|---|---|---|', ...rows, '', `Lighthouse ${summary.env.lighthouse} | ${summary.env.chrome} | Node ${summary.env.node} | ${summary.env.os} | ${summary.env.cpus} CPUs, ${summary.env.memGB} GB`].join('\n')
writeFileSync(`${OUT}/summary.md`, md)
console.log('\n' + md)

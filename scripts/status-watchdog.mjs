#!/usr/bin/env node
// VoltchainHub status watchdog.
// Consulta /api/metrics, deriva um estado (UP / DEGRADED / DOWN) e alerta no
// WhatsApp APENAS em transicao de estado (nao em todo poll), pra nao virar ruido.
//
// Estado:
//   UP        API respondeu e a leitura on-chain veio (chain.deviceCount presente)
//   DEGRADED  API respondeu mas a leitura on-chain falhou/veio vazia
//   DOWN      API inalcancavel (timeout / erro de rede / http != 2xx)
//
// Uso:
//   node scripts/status-watchdog.mjs            # um ciclo (ideal via Task Scheduler)
//   node scripts/status-watchdog.mjs --loop 60  # laco a cada 60s (foreground)
//
// Alerta no WhatsApp via CLI oficial do gateway OpenClaw (sem token no processo).
// Alvo resolvido de BRAIN_WA_TARGET (allowlist do gateway). Sem alvo => so loga.

import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const API = process.env.VCH_API || 'https://voltchainhub.org/api'
const STATE_FILE = process.env.VCH_STATE || join(tmpdir(), 'vch-status-watchdog.json')
const TIMEOUT_MS = 8000

async function probe() {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const r = await fetch(`${API}/metrics`, { cache: 'no-store', signal: ctrl.signal })
    if (!r.ok) return { state: 'DOWN', detail: `http ${r.status}` }
    const j = await r.json()
    const chain = j.chain || {}
    if (chain.deviceCount == null) return { state: 'DEGRADED', detail: 'leitura on-chain vazia', metrics: j }
    return { state: 'UP', detail: `devices=${chain.deviceCount} luz=${chain.luzTotalSupply} trades=${chain.tradeCount}`, metrics: j }
  } catch (e) {
    return { state: 'DOWN', detail: e.name === 'AbortError' ? 'timeout' : String(e.message || e) }
  } finally {
    clearTimeout(timer)
  }
}

function loadState() {
  if (!existsSync(STATE_FILE)) return { state: 'UP', since: null }
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')) } catch { return { state: 'UP', since: null } }
}

function saveState(s) {
  try { writeFileSync(STATE_FILE, JSON.stringify(s)) } catch (e) { console.error('state write falhou:', e.message) }
}

function sendWhatsApp(text) {
  const target = process.env.BRAIN_WA_TARGET
  if (!target) { console.error('BRAIN_WA_TARGET nao definido, alerta so no log:', text); return }
  const cli = process.env.OPENCLAW_CLI || 'E:\\Users\\Vinicius\\Desktop\\openclaw\\openclaw\\node_modules\\.bin\\openclaw.cmd'
  const dir = mkdtempSync(join(tmpdir(), 'vch-wa-'))
  const msgFile = join(dir, 'msg.txt')
  writeFileSync(msgFile, text, 'utf8')
  const res = spawnSync(cli, ['message', 'send', '--channel', 'whatsapp', '--target', target, '--message', text], {
    encoding: 'utf8', timeout: 30000, shell: true,
  })
  if (res.status !== 0) console.error('WhatsApp send falhou:', res.stderr || res.stdout || res.error)
  else console.log('alerta WhatsApp enviado')
}

function label(s) {
  return s === 'UP' ? 'operacional' : s === 'DEGRADED' ? 'degradado (leitura on-chain)' : 'fora do ar'
}

async function cycle() {
  const now = new Date().toISOString()
  const prev = loadState()
  const cur = await probe()
  console.log(`[${now}] ${cur.state} :: ${cur.detail}`)

  if (cur.state !== prev.state) {
    const emoji = cur.state === 'UP' ? '✅' : cur.state === 'DEGRADED' ? '⚠️' : '\u{1f534}'
    const msg = `${emoji} VoltchainHub status: ${label(prev.state)} -> ${label(cur.state)}\n${cur.detail}\nhttps://voltchainhub.org/status.html`
    sendWhatsApp(msg)
    saveState({ state: cur.state, since: now, detail: cur.detail })
  } else {
    saveState({ state: cur.state, since: prev.since || now, detail: cur.detail })
  }
  return cur.state
}

const loopArg = process.argv.indexOf('--loop')
if (loopArg !== -1) {
  const secs = Number(process.argv[loopArg + 1]) || 60
  console.log(`watchdog em laco a cada ${secs}s (Ctrl+C pra sair)`)
  await cycle()
  setInterval(cycle, secs * 1000)
} else {
  await cycle()
}

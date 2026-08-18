import { existsSync, readFileSync, statSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const dist = resolve('dist')
const html = readFileSync(resolve(dist, 'index.html'), 'utf8')
const sw = readFileSync(resolve(dist, 'sw.js'), 'utf8')

const entryMatch = html.match(/src="\/(assets\/index-[^"]+\.js)"/)
if (!entryMatch) throw new Error('Performance budget: entry bundle was not found')

const entryPath = resolve(dist, entryMatch[1])
const entryGzipBytes = gzipSync(readFileSync(entryPath)).length
const entryLimit = 120 * 1024
if (entryGzipBytes > entryLimit) {
  throw new Error(`Performance budget: ${basename(entryPath)} is ${entryGzipBytes} gzip bytes (limit ${entryLimit})`)
}

const manifestUrls = [...sw.matchAll(/"url":"([^"]+)"/g)].map(match => match[1])
const uniqueLocalUrls = [...new Set(manifestUrls)].filter(url => existsSync(resolve(dist, url)))
const precacheBytes = uniqueLocalUrls.reduce((sum, url) => sum + statSync(resolve(dist, url)).size, 0)
const precacheLimit = 650 * 1024
if (precacheBytes > precacheLimit) {
  throw new Error(`Performance budget: precache is ${precacheBytes} bytes (limit ${precacheLimit})`)
}

console.log(`Performance budget passed: entry ${entryGzipBytes} gzip bytes, precache ${precacheBytes} bytes`)

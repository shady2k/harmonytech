/**
 * Production server for LAN deployment
 *
 * Serves static files + WebSocket signaling + API proxy on the same port.
 * Run: node server.js
 * Access: http://<your-lan-ip>:3000
 */

import { createServer } from 'http'
import { request as httpsRequest } from 'https'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { WebSocketServer } from 'ws'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const DIST_DIR = join(__dirname, 'dist')

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

// Proxy configuration for external APIs (CORS bypass)
const PROXY_ROUTES = {
  '/api/yandex-llm': 'https://llm.api.cloud.yandex.net',
  '/api/yandex-stt': 'https://stt.api.cloud.yandex.net',
}

/**
 * Proxy request to external API
 */
function proxyRequest(req, res, targetBase, pathPrefix) {
  const targetPath = req.url.replace(pathPrefix, '')
  const targetUrl = new URL(targetPath, targetBase)

  const proxyReq = httpsRequest(
    {
      hostname: targetUrl.hostname,
      port: 443,
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.hostname,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message)
    res.writeHead(502)
    res.end('Proxy error')
  })

  req.pipe(proxyReq)
}

// HTTP server for static files and API proxy
const server = createServer((req, res) => {
  // Check for proxy routes first
  for (const [prefix, target] of Object.entries(PROXY_ROUTES)) {
    if (req.url.startsWith(prefix)) {
      return proxyRequest(req, res, target, prefix)
    }
  }

  // Static file serving
  let filePath = join(DIST_DIR, req.url === '/' ? 'index.html' : req.url)

  // SPA fallback - serve index.html for non-file routes
  if (!existsSync(filePath) || !extname(filePath)) {
    filePath = join(DIST_DIR, 'index.html')
  }

  try {
    const content = readFileSync(filePath)
    const ext = extname(filePath)
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    res.writeHead(200, { 'Content-Type': contentType })
    res.end(content)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
})

// WebSocket signaling server
const wss = new WebSocketServer({ server, path: '/signaling' })
const topics = new Map()

wss.on('connection', (conn) => {
  const subscribedTopics = new Set()

  conn.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())

      if (message.type === 'subscribe' && message.topics) {
        for (const topicName of message.topics) {
          if (!topics.has(topicName)) {
            topics.set(topicName, new Set())
          }
          topics.get(topicName).add(conn)
          subscribedTopics.add(topicName)
        }
      }

      if (message.type === 'unsubscribe' && message.topics) {
        for (const topicName of message.topics) {
          const topic = topics.get(topicName)
          if (topic) {
            topic.delete(conn)
            if (topic.size === 0) topics.delete(topicName)
          }
          subscribedTopics.delete(topicName)
        }
      }

      if (message.type === 'publish' && message.topic) {
        const topic = topics.get(message.topic)
        if (topic) {
          for (const receiver of topic) {
            if (receiver !== conn && receiver.readyState === 1) {
              receiver.send(JSON.stringify(message))
            }
          }
        }
      }

      if (message.type === 'ping') {
        conn.send(JSON.stringify({ type: 'pong' }))
      }
    } catch {
      // Ignore invalid messages
    }
  })

  conn.on('close', () => {
    for (const topicName of subscribedTopics) {
      const topic = topics.get(topicName)
      if (topic) {
        topic.delete(conn)
        if (topic.size === 0) topics.delete(topicName)
      }
    }
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  HarmonyTech Server
  ──────────────────
  App:       http://localhost:${PORT}/
  Signaling: ws://localhost:${PORT}/signaling
  Proxy:     /api/yandex-llm, /api/yandex-stt

  Access from LAN using your local IP address.
  `)
})

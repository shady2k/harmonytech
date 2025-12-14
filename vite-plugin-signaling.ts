/**
 * Vite plugin that adds y-webrtc signaling to dev server
 *
 * Signaling available at ws://<host>:<port>/signaling
 */

import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import { WebSocketServer, WebSocket } from 'ws'

export function signalingPlugin(): Plugin {
  const topics = new Map<string, Set<WebSocket>>()

  const handleConnection = (conn: WebSocket): void => {
    const subscribedTopics = new Set<string>()

    conn.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as {
          type: string
          topics?: string[]
          topic?: string
        }

        if (message.type === 'subscribe' && Array.isArray(message.topics)) {
          for (const topicName of message.topics) {
            if (!topics.has(topicName)) {
              topics.set(topicName, new Set())
            }
            const topic = topics.get(topicName)
            if (topic !== undefined) {
              topic.add(conn)
            }
            subscribedTopics.add(topicName)
          }
        }

        if (message.type === 'unsubscribe' && Array.isArray(message.topics)) {
          for (const topicName of message.topics) {
            const topic = topics.get(topicName)
            if (topic !== undefined) {
              topic.delete(conn)
              if (topic.size === 0) topics.delete(topicName)
            }
            subscribedTopics.delete(topicName)
          }
        }

        if (message.type === 'publish' && typeof message.topic === 'string') {
          const topic = topics.get(message.topic)
          if (topic !== undefined) {
            for (const receiver of topic) {
              if (receiver !== conn && receiver.readyState === WebSocket.OPEN) {
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
        if (topic !== undefined) {
          topic.delete(conn)
          if (topic.size === 0) topics.delete(topicName)
        }
      }
    })
  }

  return {
    name: 'vite-plugin-signaling',

    configureServer(server: ViteDevServer): void {
      const wss = new WebSocketServer({ noServer: true })
      wss.on('connection', handleConnection)

      server.httpServer?.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
        if (request.url === '/signaling') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request)
          })
        }
      })
    },
  }
}

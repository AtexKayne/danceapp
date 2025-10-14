export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders && res.flushHeaders()

  if (!global._sseClients) global._sseClients = []
  global._sseClients.push(res)

  res.write(`data: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`)

  req.on('close', () => {
    global._sseClients = global._sseClients.filter(r => r !== res)
  })
}

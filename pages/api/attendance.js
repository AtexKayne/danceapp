import { readDb, writeDb } from '../../lib/db'
import { nanoid } from 'nanoid'

export default function handler(req, res) {
	const db = readDb()
	const method = req.method
	const today = new Date().toISOString().slice(0, 10)

	if (method === 'GET') {
		const visible = db.attendances.filter(a => a.dateISO === today)
		db.attendances = visible
		writeDb(db)
		return res.json(visible)
	}

	if (method === 'POST') {
		const { groupId, firstName, lastName, gender, isSupport = false } = req.body
		const rec = { id: nanoid(), groupId, firstName, lastName, gender, isSupport, dateISO: today }
		db.attendances.push(rec)
		writeDb(db)
		notifySSE({ type: 'attendance_added', payload: rec })
		return res.status(201).json(rec)
	}

	if (method === 'DELETE') {
		const { id } = req.query
		if (id) {
			// admin deletion by id
			const idx = db.attendances.findIndex(a => a.id === id)
			if (idx !== -1) {
				const removed = db.attendances.splice(idx, 1)[0]
				writeDb(db); notifySSE({ type: 'attendance_removed', payload: removed })
			}
			return res.status(200).end()
		} else {
			// participant cancellation: expect body with firstName,lastName,groupId
			let body = ''
			req.on('data', chunk => { body += chunk })
			req.on('end', () => {
				try {
					const data = JSON.parse(body || '{}')
					const { groupId, firstName, lastName } = data
					const idx = db.attendances.findIndex(a => a.groupId === groupId && a.firstName === firstName && a.lastName === lastName && a.dateISO === today)
					if (idx !== -1) {
						const removed = db.attendances.splice(idx, 1)[0]
						writeDb(db); notifySSE({ type: 'attendance_removed', payload: removed })
						return res.status(200).json({ removed })
					}
					return res.status(404).json({ error: 'Not found' })
				} catch (e) {
					return res.status(400).json({ error: 'Bad request' })
				}
			})
		}
	}

	res.setHeader('Allow', 'GET,POST,DELETE')
	res.status(405).end('Method not allowed')

	function notifySSE(msg) {
		if (global._sseClients && global._sseClients.length) {
			const data = `data: ${JSON.stringify(msg)}\n\n`
			global._sseClients.forEach(r => r.write(data))
		}
	}
}

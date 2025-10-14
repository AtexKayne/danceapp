import { readDb, writeDb } from '../../lib/db'

export default function handler(req, res) {
	const db = readDb()
	const method = req.method

	// Compute current time in UTC+5
	const now = new Date()
	const local = new Date(now.getTime() + 5 * 60 * 60 * 1000)
	const today = local.toISOString().slice(0, 10)

	if (method === 'GET') {
		const visible = db.groups.filter(g => {
			const groupDate = g.date || today
			if (groupDate !== today) return false
			return true
			// const [h, m] = (g.time || '00:00').split(':').map(Number)
			// const groupTime = new Date(local)
			// groupTime.setHours(h, m, 0, 0)
			// return groupTime > local
		})
		db.groups = visible
		writeDb(db)		
		return res.json(visible)
	}

	if (method === 'POST') {
		const { name, time } = req.body
		const todayStr = today
		const id = (Date.now()).toString()
		db.groups.push({ id, name, time, date: todayStr })
		writeDb(db)
		return res.status(201).json({ id, name, time, date: todayStr })
	}

	if (method === 'PUT') {
		const { id, name, time } = req.body
		const g = db.groups.find(x => x.id == id)
		if (!g) return res.status(404).end()
		g.name = name || g.name
		g.time = time || g.time
		writeDb(db)
		return res.status(200).json(g)
	}

	if (method === 'DELETE') {
		const { id } = req.query
		db.groups = db.groups.filter(g => g.id != id)
		writeDb(db)
		return res.status(200).end()
	}

	res.setHeader('Allow', 'GET,POST,PUT,DELETE')
	res.status(405).end('Method not allowed')
}

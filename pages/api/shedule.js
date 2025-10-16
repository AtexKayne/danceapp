import { nanoid } from 'nanoid'
import { getData, updateData } from '../../lib/db'

export default async function handler(req, res) {
	const db = await getData()
	const method = req.method
	const now = new Date()
	const currentDay = ['7', '1', '2', '3', '4', '5', '6'][now.getDay()];
	const local = new Date(now.getTime() + 5 * 60 * 60 * 1000)
	const today = local.toISOString().slice(0, 10)

	if (method === 'GET') {
		let visible = db.shedule
		if (!visible) {
			visible = {}
			db.shedule = {}
			await updateData(db)
		}
		if (!visible[currentDay]) return res.json(visible)

		const activeGroups = visible[currentDay].filter(g => g.isActive)
		if (!activeGroups.length) return res.json(visible)

		let isNeedUpdate = false
		activeGroups.forEach(g => {
			const index = db.groups.findIndex(e => e.name === g.name)
			if (index === -1) {
				db.groups.push({
					name: g.name,
					time: '17:00',
					date: today,
					id: nanoid()
				})
				isNeedUpdate = true
			}
		})
		if (isNeedUpdate) await updateData(db)
		return res.json(visible)
	}

	if (method === 'POST') {
		const { shedules } = req.body
		db.shedule = {}
		Object.keys(shedules).forEach(key => {
			if (Array.isArray(shedules[key])) {
				db.shedule[key] = [...shedules[key].map(item => {
					return {
						...item,
						id: nanoid(),
						isActive: true
					}
				})]
			}
		})
		updateData(db)
		notifySSE({ type: 'shedule_added', payload: db.shedule })
		return res.status(201).json(db)
	}

	if (method === 'DELETE') {
		const { day, id } = req.query
		const idx = db.shedule[day].findIndex(a => a.id === id)
		if (idx === -1) return res.status(404).end()
		const removed = db.shedule[day].splice(idx, 1)[0]
		if (!db.shedule[day] || !db.shedule[day].length) {
			delete db.shedule[day]
		}
		updateData(db);
		notifySSE({ type: 'shedule_removed', payload: removed })
		return res.status(200).end()
	}

	if (method === 'PUT') {
		const { id, name, day, isActive } = req.body
		const g = db.shedule[day].find(x => x.id == id)
		if (!g) return res.status(404).end()
		g.name = name || g.name
		g.isActive = isActive
		updateData(db)
		return res.status(200).json(g)
	}

	res.setHeader('Allow', 'GET,POST,PUT,DELETE')
	res.status(405).end('Method not allowed')

	function notifySSE(msg) {
		if (global._sseClients && global._sseClients.length) {
			const data = `data: ${JSON.stringify(msg)}\n\n`
			global._sseClients.forEach(r => r.write(data))
		}
	}
}


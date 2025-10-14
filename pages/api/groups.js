export default async function handler(req, res) {
	const db = await getData()
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
		updateData(db)
		return res.json(visible)
	}

	if (method === 'POST') {
		const { name, time } = req.body
		const todayStr = today
		const id = (Date.now()).toString()
		db.groups.push({ id, name, time, date: todayStr })
		updateData(db)
		return res.status(201).json({ id, name, time, date: todayStr })
	}

	if (method === 'PUT') {
		const { id, name, time } = req.body
		const g = db.groups.find(x => x.id == id)
		if (!g) return res.status(404).end()
		g.name = name || g.name
		g.time = time || g.time
		updateData(db)
		return res.status(200).json(g)
	}

	if (method === 'DELETE') {
		const { id } = req.query
		db.groups = db.groups.filter(g => g.id != id)
		updateData(db)
		return res.status(200).end()
	}

	res.setHeader('Allow', 'GET,POST,PUT,DELETE')
	res.status(405).end('Method not allowed')
}

async function getData() {
	try {
		const response = await fetch('http://s1qwmailr2.temp.swtest.ru/', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			}
		});

		if (!response.ok) {
			throw new Error('Network response was not ok');
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error:', error);
	}
}

async function updateData(newData) {
	try {
		const response = await fetch('http://s1qwmailr2.temp.swtest.ru/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(newData)
		});
		console.log(response);
		

		if (!response.ok) {
			throw new Error('Network response was not ok');
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.error('Error:', error);
	}
}
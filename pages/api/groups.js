import { put, list } from "@vercel/blob"
import { MongoClient } from 'mongodb'

export default async function handler(req, res) {
	const uri = process.env.MONGODB_URI
	const options = {
		useUnifiedTopology: true,
		useNewUrlParser: true,
	}

	let client, clientPromise, db, collection

	if (!process.env.MONGODB_URI) {
		throw new Error('Please add your Mongo URI to .env.local')
	}

	if (process.env.NODE_ENV === 'development') {
		// В разработке используем глобальную переменную
		if (!global._mongoClientPromise) {
			client = new MongoClient(uri, options)
			global._mongoClientPromise = client.connect()
		}
		clientPromise = global._mongoClientPromise
	} else {
		// В продакшене создаем новый клиент
		client = new MongoClient(uri, options)
		clientPromise = client.connect()
	}

	const method = req.method

	// Compute current time in UTC+5
	const now = new Date()
	const local = new Date(now.getTime() + 5 * 60 * 60 * 1000)
	const today = local.toISOString().slice(0, 10)

	try {
		db = await getDatabase(clientPromise)
		collection = db.collection('groups')
		console.log(collection);
		res.status(200).json([])
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Error fetching users'
		})
	}

	if (method === 'GET') {
		// const visible = db.groups.filter(g => {
		// 	const groupDate = g.date || today
		// 	if (groupDate !== today) return false
		// 	return true
		// 	const [h, m] = (g.time || '00:00').split(':').map(Number)
		// 	const groupTime = new Date(local)
		// 	groupTime.setHours(h, m, 0, 0)
		// 	return groupTime > local
		// })
		// db.groups = visible
		// writeJSON(db)
		console.log('--');
		console.log(db);
		console.log('--');
		
		

		// try {
		// 	const db = await getDatabase(clientPromise)
		// 	const collection = db.collection('groups')
		// 	console.log(collection);


		// 	const groups = await collection.find({}).toArray()
		// 	console.log(groups);



		// 	res.status(200).json([])
		// } catch (error) {
		// 	res.status(500).json({
		// 		success: false,
		// 		message: 'Error fetching users'
		// 	})
		// }

		const visible = {}
		return new Promise(resolve => resolve([]))
	}

	if (method === 'POST') {
		const { name, time } = req.body
		const id = (Date.now()).toString()
		const group = { id, name, time, date: today }

		try {
			const result = await collection.insertOne(group)
			res.status(201).json({
				success: true,
				insertedId: result.insertedId,
				message: 'Created successfully'
			})
		} catch (error) {
			res.status(500).json({
				success: false,
				message: 'Error creating',
				error: error.message
			})
		}
		return res.status(201).json(group)
	}

	if (method === 'PUT') {
		const { id, name, time } = req.body
		const g = db.groups.find(x => x.id == id)
		if (!g) return res.status(404).end()
		g.name = name || g.name
		g.time = time || g.time
		writeJSON(db)
		return res.status(200).json(g)
	}

	if (method === 'DELETE') {
		const { id } = req.query
		db.groups = db.groups.filter(g => g.id != id)
		writeJSON(db)
		return res.status(200).end()
	}

	res.setHeader('Allow', 'GET,POST,PUT,DELETE')
	res.status(405).end('Method not allowed')
}

const getDatabase = async (clientPromise) => {
	const client = await clientPromise
	const db = client.db(process.env.MONGODB_DB)
	return { client, db }
}
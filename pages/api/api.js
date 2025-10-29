import { deleteNewData, getNewData, updateNewData } from '../../lib/db'

export default async function handler(req, res) {
    const method = req.method

    if (method === 'GET') {
        const db = await getNewData(req.query)
        return res.json(db)
    }

    if (method === 'POST') {

        const action = req.body.action
        if (action === 'register') {
            registerUser(req.body)
            notifySSE({ type: 'attendance_added', payload: req.body })
        } else if (action === 'addGroup') {
            addGroup(req.body)
            notifySSE({ type: 'group_added', payload: req.body })
        } else if (action === 'updateGroup') {
            updateGroup(req.body)
            notifySSE({ type: 'group_updated', payload: req.body })
        } else if (action === 'addSheduleGroup') {
            addSheduleGroup(req.body)
            notifySSE({ type: 'group_added', payload: req.body })
        } else if (action === 'editSheduleGroup') {
            editSheduleGroup(req.body)
            notifySSE({ type: 'group_added', payload: req.body })
        }

        return res.status(201).json(req.body)
    }

    if (method === 'DELETE') {
        const body = JSON.parse(req.body)
        const { action } = body
        if (action === 'cancel') {
            cancelUser(body)
        } else if (action === 'deleteGroup') {
            deleteGroup(body)
        }

        return res.status(201).json(body)
    }

    res.setHeader('Allow', 'GET,POST,DELETE,PUT,UPDATE')
    res.status(405).end('Method not allowed')

    function notifySSE(msg) {
        if (global._sseClients && global._sseClients.length) {
            const data = `data: ${JSON.stringify(msg)}\n\n`
            global._sseClients.forEach(r => r.write(data))
        }
    }
}

const editSheduleGroup = async (body) => {
    delete body.action
    const resp = await updateNewData({ ...body, dbname: 'schedule' })
    return resp
}

const addSheduleGroup = async (body) => {
    delete body.action
    const resp = await updateNewData({ ...body, dbname: 'schedule' })
    return resp
}

const updateGroup = async (body) => {
    delete body.action
    const resp = await updateNewData({ ...body, dbname: 'groups' })
    return resp
}

const addGroup = async (body) => {
    const { name, time } = body
    const now = new Date()
    const local = new Date(now.getTime() + 5 * 60 * 60 * 1000)
    const date = local.toISOString().slice(0, 10)
    const rec = { name, time, date, dbname: 'groups' }
    const resp = await updateNewData(rec)
    return resp
}

const deleteGroup = async (body) => {
    const resp = await deleteNewData({ ...body, dbname: 'groups' })
    return resp
}

const registerUser = async (body) => {
    const { groupId, firstName, lastName, gender, isSupport = false, isEmpty } = body
    const rec = { groupId, firstName, lastName, gender, isSupport, dbname: 'attendances', isEmpty }
    const resp = await updateNewData(rec)
    return resp
}

const cancelUser = async (body) => {
    const resp = await deleteNewData({ ...body, dbname: 'attendances' })
    return resp
}

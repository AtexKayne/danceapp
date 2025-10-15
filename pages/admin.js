import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchData } from '../lib/db'

export default function Admin() {
    const [pw, setPw] = useState('')
    const [auth, setAuth] = useState(false)
    const [groups, setGroups] = useState([])
    const [att, setAtt] = useState([])
    const [newGroup, setNewGroup] = useState({ name: '', time: '17:00' })

    useEffect(() => {
        if (auth) initData()

    }, [auth])

    useEffect(() => {
        localLogin()
    }, [])

    const localLogin = () => {
        const isAdmin = localStorage.getItem('isAdmin')
        if (isAdmin) return setAuth(true)
    }

    const initData = async () => {
        const r1 = await fetchData('/api/groups');
        const gs = await r1.json()

        const r2 = await fetchData('/api/attendance');
        const as = await r2.json()
        const upd = {}
        as.forEach(a => {
            const thisGroup = gs.filter(g => a.groupId === g.id)[0]
            if (thisGroup && thisGroup.id) {
                const uData = {
                    ...a,
                    groupName: thisGroup.name,
                    groupTime: thisGroup.time,
                    groupId: thisGroup.id
                }
                if (Array.isArray(upd[thisGroup.id])) {
                    upd[thisGroup.id].push(uData)
                } else {
                    upd[thisGroup.id] = [uData]
                }
            }
        })

        setGroups(gs)
        setAtt(upd)
    }

    async function login() {
        const res = await fetchData('/api/admin/check?pw=' + encodeURIComponent(pw))
        if (res.ok) {
            localStorage.setItem('isAdmin', 'true')
            setAuth(true)
        } else {
            alert('Неверный пароль')
        }
    }

    async function addGroup() {
        await fetchData('/api/groups', {
            method: 'POST',
            headers:
            {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: newGroup.name,
                time: newGroup.time
            })
        })
        setNewGroup({ name: '', time: '17:00' });
        initData()
    }

    async function deleteGroup(id) {
        await fetchData('/api/groups?id=' + id, {
            method: 'DELETE'
        });
        initData()
    }

    async function editGroup(id, name, time) {
        await fetchData('/api/groups', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, name, time })
        });
        initData()
    }

    async function removeAttendance(id) {
        await fetchData('/api/attendance?id=' + id, { method: 'DELETE' });
        initData()
    }

    return (
        <main className="container">
            <h1>Админка</h1>
            {!auth ? (
                <div>
                    <input type="password" value={pw} onChange={e => setPw(e.target.value)} />
                    <button onClick={login}>Войти</button>
                </div>
            ) : (
                <div>
                    <Link href='/'>На главную</Link>
                    <section>
                        <h2>Группы</h2>
                        <div className="group-items">
                            <div className="group-items__item">
                                <input type="text" placeholder="Название" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value.trim() })} />
                                <input type="hidden" placeholder="Время" value={newGroup.time} onChange={e => setNewGroup({ ...newGroup, time: e.target.value })} />
                                <button disabled={!newGroup.name} onClick={addGroup}>Добавить</button>
                            </div>
                        </div>
                        <br />
                        <ul className="group-items">
                            {groups.map(g => (
                                <li className="group-items__item" key={g.id} style={{ marginTop: 8 }}>
                                    <input type="text" defaultValue={g.name} onBlur={e => editGroup(g.id, e.target.value, g.time)} />
                                    <input type="hidden" defaultValue={g.time} onBlur={e => editGroup(g.id, g.name, e.target.value)} />
                                    <button onClick={() => deleteGroup(g.id)}>Удалить</button>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section style={{ marginTop: 20 }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '464px' }}>
                            <span>Списки участников</span>
                            <button className="btn btn--inline" onClick={initData}>Обновить</button>
                        </h2>
                        <RegisteredUsers att={att} removeAttendance={removeAttendance} />
                    </section>
                </div>
            )}
        </main>
    )
}


const RegisteredUsers = ({ att, removeAttendance }) => {
    const keys = Object.keys(att)
    if (!keys.length) return <div>Нет записей</div>

    return keys.map(key => {
        const data = att[key]
        return (
            <div key={key} className="card">
                <b>Группа: {data[0].groupName}</b>
                <RegisteredUser data={data} removeAttendance={removeAttendance} />
                {/* <div>{a.firstName} {a.lastName} — {a.gender} {a.isSupport ? '(support)' : ''}</div>
                <div>Группа: {a.groupName}</div>
                <button onClick={() => removeAttendance(a.id)}>Отменить</button> */}
            </div>
        )
    })
}

const RegisteredUser = ({ data, removeAttendance }) => {
    if (!data.length) return <div>Нет записей</div>
    const male = []
    const female = []
    const sMale = []
    const sFemale = []

    data.forEach(u => {
        if (u.gender === 'male') {
            if (u.isSupport) sMale.push(u)
            else male.push(u)
        } else {
            if (u.isSupport) sFemale.push(u)
            else female.push(u)
        }
    })


    return (
        <div>
            <div>
                Партнеров: {male.length} {sMale.length ? `(+${sMale.length})` : ''} |
                Партнерш: {female.length} {sFemale.length ? `(+${sFemale.length})` : ''}
            </div>
            <ol className="att-list">
                {data.map(a => {
                    return (
                        <li className="att-list__item" key={a.id}>
                            <span>{a.gender === 'male' ? 'М' : 'Ж'}: {a.firstName} {a.lastName} {a.isSupport ? '(саппорт)' : ''}</span>

                            <button className="btn btn--inline" onClick={() => removeAttendance(a.id)}>Отменить</button>
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}

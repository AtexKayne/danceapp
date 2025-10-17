import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchData } from '../lib/db'
import Head from 'next/head'

export default function Admin() {
    const [pw, setPw] = useState('')
    const [att, setAtt] = useState([])
    const [auth, setAuth] = useState(false)
    const [groups, setGroups] = useState([])
    const [shedule, setShedule] = useState({})
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
        const r1 = await fetchData('/api/shedule');
        const ss = await r1.json()

        const r2 = await fetchData('/api/groups');
        const gs = await r2.json()

        const r3 = await fetchData('/api/attendance');
        const as = await r3.json()


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

        setShedule(ss)
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
        <>
            <Head>
                <title>Админка | Algorithm</title>
                <meta name="description" content="Записаться на занятие в танцевальной студии Algorithm" />
                <meta property="og:title" content="Админка | Algorithm" />
                <meta name="twitter:title" content="Админка | Algorithm" />
            </Head>
            <main className="container">
                <h1>Админка</h1>
                {!auth ? (
                    <div>
                        <input type="password" value={pw} onChange={e => setPw(e.target.value)} />
                        <button onClick={login}>Войти</button>
                    </div>
                ) : (
                    <>
                        <Link href='/'>На главную</Link>
                        <div className="row">
                            <div className="col">
                                <section>
                                    <h2>Группы</h2>
                                    <div className="group-items">
                                        <div className="group-items__item">
                                            <input type="text" placeholder="Название" value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value.trim() })} />
                                            <input type="hidden" placeholder="Время" value={newGroup.time} onChange={e => setNewGroup({ ...newGroup, time: e.target.value })} />
                                            <button disabled={!newGroup.name} onClick={addGroup}>
                                                <svg width="18" height="18" viewBox="0 0 24 24">
                                                    <path fill="green" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <h2>Сегодня проходят</h2>
                                    {groups && groups.length ? (
                                        <ul className="group-items">
                                            {groups.map(g => (
                                                <li className="group-items__item" key={g.id} style={{ marginTop: 8 }}>
                                                    <input type="text" defaultValue={g.name} onBlur={e => editGroup(g.id, e.target.value, g.time)} />
                                                    <input type="hidden" defaultValue={g.time} onBlur={e => editGroup(g.id, g.name, e.target.value)} />
                                                    <button onClick={() => deleteGroup(g.id)}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24">
                                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z"></path>
                                                        </svg>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div>Не проходят</div>
                                    )}
                                </section>

                                <h2>Расписание</h2>
                                <SheduleComponent shedule={shedule} setShedule={setShedule} initData={initData} />
                            </div>
                            <div className="col">
                                <section style={{ marginTop: 20 }}>
                                    <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '464px' }}>
                                        <span>Списки участников</span>
                                        <button className="btn btn--inline" onClick={initData}>
                                            <svg width="18" height="18" viewBox="0 0 24 24">
                                                <path d="m19 8-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4z"></path>
                                            </svg>
                                        </button>
                                    </h2>
                                    <RegisteredUsers att={att} removeAttendance={removeAttendance} />
                                </section>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </>
    )
}

const RegisteredUsers = ({ att, removeAttendance }) => {
    const [selectedGroup, setSelectedGroup] = useState('all')

    const keys = Object.keys(att)
    if (!keys.length) return <div>Нет записей</div>

    return (
        <div className="group-list">
            <div className="group-list__select">
                <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
                    <option value="all">Все</option>
                    {keys.map(key => (
                        <option key={key} value={key}>{att[key][0].groupName}</option>
                    ))}
                </select>
            </div>
            {
                keys.map(key => {
                    const data = att[key]
                    return (
                        <div key={key} data-active={selectedGroup.includes(key) || selectedGroup === 'all'} className="card group-list__item">
                            <b>Группа: {data[0].groupName}</b>
                            <RegisteredUser data={data} removeAttendance={removeAttendance} />
                            {/* <div>{a.firstName} {a.lastName} — {a.gender} {a.isSupport ? '(support)' : ''}</div>
                            <div>Группа: {a.groupName}</div>
                            <button onClick={() => removeAttendance(a.id)}>Отменить</button> */}
                        </div>
                    )
                })
            }
        </div>
    )
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

                            <button className="btn btn--inline" onClick={() => removeAttendance(a.id)}>
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="red" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2m5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12z"></path>
                                </svg>
                            </button>
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}

const SheduleComponent = ({ shedule, setShedule, initData }) => {
    const now = new Date()
    const currentDay = ['7', '1', '2', '3', '4', '5', '6'][now.getDay()];
    const [isNewDisabled, setIsNewDisabled] = useState([])
    const [activeTab, setActiveTab] = useState(currentDay)
    const changeHandler = event => {
        const { target } = event
        const name = target.name
        const value = target.value.trim()
        setIsNewDisabled(prev => {
            const next = [...prev]
            if (value) {
                if (!next.includes(name)) next.push(name)
            } else {
                const idx = next.findIndex(a => a === name)
                if (idx + 1) next.splice(idx, 1)
            }
            return next
        })
    }
    const weeks = [
        { i: '1', short: 'пн', name: 'понедельник' },
        { i: '2', short: 'вт', name: 'вторник' },
        { i: '3', short: 'ср', name: 'среду' },
        { i: '4', short: 'чт', name: 'четверг' },
        { i: '5', short: 'пт', name: 'пятницу' },
        { i: '6', short: 'сб', name: 'субботу' },
        { i: '7', short: 'вс', name: 'воскресенье' }
    ]

    const addGroup = async (event) => {
        const { target } = event
        const input = target.previousSibling
        const value = input.value
        const day = input.name
        const isExist = Array.isArray(shedule[day]) && (shedule[day].findIndex(a => a.name.toLowerCase() === value.toLowerCase()) + 1)
        if (isExist) return alert('Такое название уже есть')

        const newShedule = { ...shedule }
        if (Array.isArray(shedule[day])) {
            newShedule[day].push({ name: value, id: (Date.now()).toString(), isActive: true })
        } else {
            newShedule[day] = [{ name: value, id: (Date.now()).toString(), isActive: true }]
        }

        input.value = ''

        await fetchData('/api/shedule', {
            method: 'POST',
            headers:
            {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ shedules: newShedule })
        })

        setShedule(newShedule)
    }

    const toggleGroup = async (data) => {
        await fetchData('/api/shedule', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...data })
        });
        initData()
    }

    const editHandler = async (event, id) => {
        const { target } = event
        const { name, value } = target
        if (!value) return target.value = target.dataset.default
        if (value === target.dataset.default) return

        await fetchData('/api/shedule', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, name: value, day: name, isActive: true })
        });
        initData()
    }

    const deleteGroup = async (id) => {
        await fetchData(`/api/shedule?id=${id}&day=${activeTab}`, {
            method: 'DELETE'
        });
        initData()
    }

    return (
        <div className="shedule">
            <div className="shedule__tabs">
                {weeks.map(w => (
                    <div key={w.name} data-active={activeTab === w.i} onClick={() => setActiveTab(w.i)}>
                        {w.short}
                    </div>
                ))}
            </div>
            {weeks.map(w => (
                <div key={w.i} data-active={activeTab === w.i} className="shedule__item">
                    {/* <div className="shedule__item-name">{w.name}</div> */}
                    <div className="shedule__item-container">
                        <div className="group-items">
                            <div>Группы в {w.name}</div>
                            <hr />
                            <div className="group-items">
                                <div className="group-items__item">
                                    <input type="text" name={w.i} placeholder="Название" onChange={changeHandler} />
                                    <button disabled={!isNewDisabled.includes(w.i)} onClick={addGroup}>
                                        <svg width="18" height="18" viewBox="0 0 24 24">
                                            <path fill="green" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <br />
                            {shedule[w.i] && shedule[w.i].length ? shedule[w.i].map(g => {
                                return (
                                    <div className="group-items__item" key={g.id} style={{ marginTop: 8 }}>
                                        <input disabled={!g.isActive} type="text" defaultValue={g.name} data-default={g.name} name={w.i} onBlur={(e) => editHandler(e, g.id)} />
                                        <button onClick={() => deleteGroup(g.id)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z"></path>
                                            </svg>
                                        </button>
                                        <button onClick={() => toggleGroup({ id: g.id, name: g.name, day: w.i, isActive: !g.isActive })}>
                                            <svg width="18" height="18" viewBox="0 0 24 24">
                                                <path fill={g.isActive ? 'green' : 'red'} d="M13 3h-2v10h2zm4.83 2.17-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83"></path>
                                            </svg>
                                        </button>
                                    </div>
                                )
                            }) : <div>Нет групп в {w.name}</div>}
                        </div>
                    </div>
                </div>
            ))}

        </div>
    )
}
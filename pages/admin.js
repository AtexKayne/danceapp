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
                                            <button disabled={!newGroup.name} onClick={addGroup}>Добавить</button>
                                        </div>
                                    </div>
                                    <h2>Сегодня проходят</h2>
                                    {groups && groups.length ? (
                                        <ul className="group-items">
                                            {groups.map(g => (
                                                <li className="group-items__item" key={g.id} style={{ marginTop: 8 }}>
                                                    <input type="text" defaultValue={g.name} onBlur={e => editGroup(g.id, e.target.value, g.time)} />
                                                    <input type="hidden" defaultValue={g.time} onBlur={e => editGroup(g.id, g.name, e.target.value)} />
                                                    <button onClick={() => deleteGroup(g.id)}>Удалить</button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div>Не проходят</div>
                                    )}

                                </section>

                                <section style={{ marginTop: 20 }}>
                                    <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '464px' }}>
                                        <span>Списки участников</span>
                                        <button className="btn btn--inline" onClick={initData}>Обновить</button>
                                    </h2>
                                    <RegisteredUsers att={att} removeAttendance={removeAttendance} />
                                </section>
                            </div>
                            <div className="col">
                                <h2>Расписание</h2>
                                <SheduleComponent shedule={shedule} setShedule={setShedule} initData={initData} />
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

                            <button className="btn btn--inline" onClick={() => removeAttendance(a.id)}>Отменить</button>
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
                            <hr/>
                            <div className="group-items">
                                <div className="group-items__item">
                                    <input type="text" name={w.i} placeholder="Название" onChange={changeHandler} />
                                    <button disabled={!isNewDisabled.includes(w.i)} onClick={addGroup}>Добавить</button>
                                </div>
                            </div>
                            <br />
                            {shedule[w.i] && shedule[w.i].length ? shedule[w.i].map(g => {
                                return (
                                    <div className="group-items__item" key={g.id} style={{ marginTop: 8 }}>
                                        <input disabled={!g.isActive} type="text" defaultValue={g.name} data-default={g.name} name={w.i} onBlur={(e) => editHandler(e, g.id)} />
                                        <button onClick={() => deleteGroup(g.id)}>Удалить</button>
                                        <button onClick={() => toggleGroup({ id: g.id, name: g.name, day: w.i, isActive: !g.isActive })}>
                                            {g.isActive ? 'Выкл' : 'Вкл'}
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
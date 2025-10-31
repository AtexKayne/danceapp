import Link from 'next/link'
import Head from 'next/head'
import { useEffect, useState, useRef } from 'react'
import { fetchData } from '../lib/db'

export default function Home() {
	const [groups, setGroups] = useState([])
	const [groupsT, setGroupsT] = useState([])
	const [user, setUser] = useState({ firstName: '', lastName: '', gender: 'female' })
	const [registeredFor, setRegisteredFor] = useState({})
	const [registereDisabled, setRegisteredDisabled] = useState([])
	const [counts, setCounts] = useState({})
	const [isAdmin, setIsAdmin] = useState(false)
	const refCount = useRef(1)

	useEffect(() => {
		loadGroups()
		const saved = localStorage.getItem('user')
		if (saved) {
			const u = JSON.parse(saved)
			setUser(u)
		}
		const groups = localStorage.getItem('groups')
		if (groups) {
			const g = JSON.parse(groups)
			setRegisteredDisabled(Object.keys(g))
			setRegisteredFor(g)
		}
		setIsAdmin(localStorage.getItem('isAdmin') === 'true')
	}, [])

	// useEffect(() => {
	// 	const saved = JSON.parse(localStorage.getItem('user') || '')
	// 	if (saved) {
	// 		const currentGroups = JSON.parse(localStorage.getItem('groups') || '{}')
	// 		console.log(user, saved, currentGroups);
	// 	}
	// }, [user])

	const loadGroups = async () => {
		const resp = await fetchData({ isIndex: true })		
		const data = await resp.json()

		setGroups(data.groups.length ? data.groups[0] : [])
		setGroupsT(data.groups.length && data.groups.length === 2 ? data.groups[1] : [])
		setCounts(data.attendances)
	}

	async function register(group, isEmpty) {
		const body = { action: 'register', groupId: group.id, ...user, isEmpty }
		const res = await fetchData({
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		})
		if (res.ok) {
			const rec = await res.json()
			const currentGroups = JSON.parse(localStorage.getItem('groups') || '{}')
			currentGroups[group.id] = { ...group, ...rec }
			localStorage.setItem('groups', JSON.stringify(currentGroups))
			localStorage.setItem('user', JSON.stringify(user))
			setRegisteredDisabled(Object.keys(currentGroups))
			setRegisteredFor(currentGroups)
			setTimeout(loadGroups, 500)
		} else {
			alert('Ошибка при регистрации')
		}
	}

	async function cancel(group, id) {
		const groupId = group.id
		const res = await fetchData({
			method: 'DELETE',
			body: JSON.stringify({ groupId, action: 'cancel', ...user })
		})

		if (res.ok) {
			const currentGroups = JSON.parse(localStorage.getItem('groups') || '{}')
			delete currentGroups[groupId]
			localStorage.setItem('groups', JSON.stringify(currentGroups))
			setRegisteredDisabled(Object.keys(currentGroups))
			setRegisteredFor(currentGroups)
			await register(group, 'true')
			setTimeout(loadGroups, 500)
		} else {
			alert('Ошибка при отмене')
		}
	}

	const setName = (e) => {
		const value = e.target.value.trim()
		setUser({ ...user, firstName: value })
	}

	const reloadHandler = () => {
		window.location.reload()
	}

	const getAdmin = () => {
		refCount.current++
		if (refCount.current >= 12) {
			window.location.href = '/admin'
		}
		setTimeout(() => refCount.current = 0, 4000)
	}

	return (
		<>
			<Head>
				<title>Запись на занятие | Algorithm</title>
				<meta name="description" content="Записаться на занятие в танцевальной студии Algorithm" />
				<meta property="og:title" content="Запись на занятие | Algorithm" />
				<meta name="twitter:title" content="Запись на занятие | Algorithm" />
			</Head>
			<main className="container">

				{isAdmin && (
					<Link className="link" href='/admin'>
						<span>В админку</span>
						<svg width="19" height="19" viewBox="0 0 24 24">
							<path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
						</svg>
					</Link>
				)}
				<h1 style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between'}} onClick={getAdmin}>
					<span>Запись на занятие</span>
					<button className="btn btn--inline" onClick={reloadHandler}>
						<svg width="18" height="18" viewBox="0 0 24 24">
							<path d="m19 8-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4z"></path>
						</svg>
					</button>
				</h1>
				<div className='row'>
					<div className='col'>
						<h2>Профиль</h2>
						<div>
							<input style={{ marginTop: '0' }} type="text" placeholder="Имя *" value={user.firstName} onChange={setName} />
						</div>
						<div>
							<input type="text" placeholder="Фамилия" value={user.lastName} onChange={e => setUser({ ...user, lastName: e.target.value })} />
						</div>
						<div>
							<select value={user.gender} onChange={e => setUser({ ...user, gender: e.target.value })}>
								<option value="female">Я партнёрша</option>
								<option value="male">Я партнёр</option>
							</select>
						</div>
						<div>
							<label>
								<input type="checkbox" checked={user.isSupport || false} onChange={e => setUser({ ...user, isSupport: e.target.checked })} />
								<span>Саппорт</span>
							</label>
						</div>
					</div>
					<div className='col'>
						<h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '464px' }}>
							<span>Группы (сегодня)</span>
						</h2>
						<Groups groups={groups} counts={counts} registeredFor={registeredFor} register={register} cancel={cancel} user={user} registereDisabled={registereDisabled} />
						<h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '464px' }}>
							<span>Группы (завтра)</span>
						</h2>
						<Groups groups={groupsT} counts={counts} registeredFor={registeredFor} register={register} cancel={cancel} user={user} registereDisabled={registereDisabled} />
					</div>
				</div>
			</main >
		</>
	)
}

const Groups = ({ groups, counts, registeredFor, user, registereDisabled, register, cancel }) => {
	if (!groups || !groups.length) {
		return (<div>Нет групп</div>)
	}

	return groups.map(g => {
		const count = counts[g.id] ?? { male: 0, female: 0, supports: 0 }
		const countRU = `Партнеров: ${(count.male) || 0} ${count.supportMale ? `(+${count.supportMale} саппорт)` : ''} | Партнерш: ${(count.female) || 0} ${count.supportFemale ? `(+${count.supportFemale} саппорт)` : ''}`
		return (
			<div className="card" key={g.id}>
				<div><strong>{g.name}</strong></div>
				<div>{countRU}</div>
				{
					registeredFor[g.id]
						? (
							<div style={{ marginTop: '12px' }}>
								<div data-hidden={registeredFor[g.id].isEmpty === 'true'}> Я {registeredFor[g.id].firstName} {registeredFor[g.id].lastName} приду на занятие в качестве {registeredFor[g.id].isSupport ? 'саппорта' : 'ученика'} </div>
								{registeredFor[g.id].isEmpty === 'true'
									? <button onClick={() => register(g, 'false')}>Я приду (записаться)</button>
									: <button onClick={() => cancel(g)}>Я не смогу (отменить запись)</button>}

							</div>
						)
						: <div style={{ display: 'flex', gap: '12px' }}>
							<button disabled={!user.firstName || !user.lastName || registereDisabled.includes(g.id)} onClick={() => register(g, 'false')}>Я пойду</button>
							<button disabled={!user.firstName || !user.lastName || registereDisabled.includes(g.id)} onClick={() => register(g, 'true')}>Я не смогу</button>
						</div>
				}
			</div>
		)
	})
}

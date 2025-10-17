import Link from 'next/link'
import Head from 'next/head'
import { useEffect, useState, useRef } from 'react'
import { fetchData } from '../lib/db'

export default function Home() {
	const [groups, setGroups] = useState([])
	const [user, setUser] = useState({ firstName: '', lastName: '', gender: 'female' })
	const [registeredFor, setRegisteredFor] = useState({})
	const [registereDisabled, setRegisteredDisabled] = useState([])
	const [counts, setCounts] = useState({})
	const [isAdmin, setIsAdmin] = useState(false)
	const refCount = useRef(1)

	useEffect(() => {
		fetchData('/api/groups').then(r => r.json()).then(setGroups)
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
		refreshCounts()
		const es = new EventSource('/api/sse')
		es.onmessage = e => {
			try {
				const msg = JSON.parse(e.data);
				refreshCounts()
			} catch (e) { }
		}
		return () => es.close()
	}, [])

	async function register(group) {
		const body = { groupId: group.id, firstName: user.firstName, lastName: user.lastName, gender: user.gender, isSupport: user.isSupport || false }
		const res = await fetchData('/api/attendance', {
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
			refreshCounts()
		} else {
			alert('Ошибка при регистрации')
		}
	}

	async function cancel(groupId, id) {
		const res = await fetchData('/api/attendance?id=' + encodeURIComponent(id), {
			method: 'DELETE'
		})
		if (res.ok) {
			const currentGroups = JSON.parse(localStorage.getItem('groups') || '{}')
			delete currentGroups[groupId]
			localStorage.setItem('groups', JSON.stringify(currentGroups))
			setRegisteredDisabled(Object.keys(currentGroups))
			setRegisteredFor(currentGroups)
			refreshCounts()
		} else {
			alert('Ошибка при отмене')
		}
	}

	function refreshCounts() {
		fetch('/api/attendance').then(r => r.json()).then(data => {
			const map = {}
			data.forEach(a => {
				map[a.groupId] ??= { male: 0, female: 0, sMale: 0, sFemale: 0 }
				if (a.gender === 'male') {
					map[a.groupId].male += 1
					if (a.isSupport) map[a.groupId].sMale += 1
				} else if (a.gender === 'female') {
					map[a.groupId].female += 1
					if (a.isSupport) map[a.groupId].sFemale += 1
				}
			})
			setCounts(map)
		})
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
				<h1 onClick={getAdmin}>Запись на занятие</h1>
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
							<button className="btn btn--inline" onClick={reloadHandler}>
								<svg width="18" height="18" viewBox="0 0 24 24">
									<path d="m19 8-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4z"></path>
								</svg>
							</button>
						</h2>
						{!groups.length && <div>Сегодня нет групп</div>}
						{groups.map(g => {
							const count = counts[g.id] ?? { male: 0, female: 0, supports: 0 }
							const countRU = `Партнеров: ${(count.male - count.sMale) || 0} ${count.sMale ? `(+${count.sMale} саппорт)` : ''} | Партнерш: ${(count.female - count.sFemale) || 0} ${count.sFemale ? `(+${count.sFemale} саппорт)` : ''}`
							return (
								<div className="card" key={g.id}>
									<div><strong>{g.name}</strong></div>
									<div>{countRU}</div>
									{
										registeredFor[g.id]
											? (
												<div style={{ marginTop: '12px' }}>
													<div> Я {registeredFor[g.id].firstName} {registeredFor[g.id].lastName} приду на занятие в качестве {registeredFor[g.id].isSupport ? 'саппорта' : 'ученика'} </div>
													<button onClick={() => cancel(g.id, registeredFor[g.id].id)}>Я не смогу (отменить запись)</button>
												</div>
											)
											: <button disabled={!user.firstName || registereDisabled.includes(g.id)} onClick={() => register(g)}>Я пойду (отметиться)</button>
									}
								</div>
							)
						})}
					</div>
				</div>

				{/* <div className='row'>
				<div className='col'></div>
				<div className='col'>
					<div style={{ marginTop: 20 }}>
						<h2>Твоя запись</h2>
						<RegisteredGroups registeredFor={registeredFor} cancel={cancel} />
					</div>
				</div>
			</div> */}
			</main >
		</>
	)
}

const RegisteredGroups = ({ registeredFor, cancel }) => {
	console.log(registeredFor);

	const keys = Object.keys(registeredFor)
	if (!keys.length) return <div>Нет активной записи</div>

	return keys.map(key => {
		const data = registeredFor[key]
		return (
			<div className="card" key={key}>
				<span>
					{data.firstName} {data.lastName} {data.gender === 'male' ? 'записан' : 'записана'} на группу {data.name} в {data.time} в качестве {data.isSupport ? 'саппорта' : 'ученика'}
				</span>
				<button onClick={() => cancel(key, data.id)}>Отменить запись</button>
			</div>
		)
	})
}


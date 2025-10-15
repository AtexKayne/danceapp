import '../styles.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
	return (
		<>
			<Head>
				<link rel="icon" href="/favicon.ico" sizes="any" />
				<link rel="manifest" href="/manifest.json" />
				<link rel="apple-touch-icon" href="/icon-192x192.png" />
				<meta name="theme-color" content="#000000" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
			</Head>
			<Component {...pageProps} />
		</>
	)
}
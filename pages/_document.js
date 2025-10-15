// Для Pages Router: pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document'
// import path from 'path'
// path.join(process.cwd(), 'tmp', 'manifest.json')
export default function Document() {

    return (
        <Html>
            <Head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
                <meta name="theme-color" content="#000000" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
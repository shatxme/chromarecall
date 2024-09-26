import type { AppProps } from 'next/app'
// Remove or comment out the following line:
// import '@/styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
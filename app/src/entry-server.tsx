// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";


export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <title>Famcash</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon2.ico" />
          <link rel="apple-touch-icon" href="/pwa/pwa-192x192.png" />
          <link rel="manifest" href="/pwa/manifest.json" />
          <style>
            {`
              @font-face {
                font-family: "Inter";
                font-style: normal;
                font-weight: 400 700;
                src: url(/fonts/Inter-Latin-400-700.woff2) format("woff2");
                unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC,
                U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122,
                U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
              }
              @font-face {
                font-family: 'Mackinac';
                src: url("/fonts/mackinac-medium.woff2") format('woff2');
                font-weight: 500;
                font-style: normal;
              }
            `}
          </style>
          {assets}
        </head>
        <body class="text-base font-sans background pb-16">
          <div id="app">{children}</div>
          {scripts}
          <PWA />
        </body>
      </html>
    )}
  />
));

function PWA() {
  return (
    <script>{`
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/pwa/sw.js').then(
        () => console.log('Service Worker registered successfully.'),
        (error) => console.log('Service Worker registration failed:', error)
      );
    }
  `}</script>
  )
}

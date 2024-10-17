// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          <style>
            {`@font-face {
								font-family: "Inter";
								font-style: normal;
								font-weight: 400 700;
								src: url(/fonts/Inter-Latin-400-700.woff2) format("woff2");
								unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC,
									U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122,
									U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
							}`}
          </style>
          {assets}
        </head>
        <body class="text-base group/body bg-gradient-to-br from-stone-100 via-slate-100 to-gray-100 pb-16">
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));

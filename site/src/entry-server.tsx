// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";


export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon2.ico" />
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
            @font-face {
              font-family: 'Fricolage Grotesque';
              font-weight: 100 900;
              font-style: normal;
              font-named-instance: 'Regular';
              src: url(/fonts/fricolage-grotesque.var.woff2) format('woff2')
            }
            @font-face {
              font-family: 'Mackinac';
              src: url("/fonts/mackinac-bold.woff2") format('woff2');
              font-weight: 700;
              font-style: normal;
            }
`}
          </style>
          {assets}
        </head>
        <body class="text-base font-sans bg-white">
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));

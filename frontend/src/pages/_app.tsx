import type { AppProps } from 'next/app';
import type { NextPageWithLayout } from '@/types';
import {useEffect, useMemo, useState} from 'react';
import Head from 'next/head';
import { Hydrate, QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ThemeProvider } from 'next-themes';
import ModalsContainer from '@/components/modal-views/container';
import DrawersContainer from '@/components/drawer-views/container';
// base css file
import 'swiper/css';
import '@/assets/css/scrollbar.css';
import '@/assets/css/globals.css';
import '@/assets/css/range-slider.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { DecryptPermission } from '@demox-labs/aleo-wallet-adapter-base';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
import {RecordProvider} from "@/components/record-provider";
import { AxiomWebVitals } from 'next-axiom';
import {
  FoxWalletAdapter,
  SoterWalletAdapter,
  LeoWalletAdapter,
  PuzzleWalletAdapter,
  configureConnectionForPuzzle
} from '@/lib/wallet-adapters';


type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};


function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: 'Aleo Name Service',
      }),
      new FoxWalletAdapter({
        appName: 'Aleo Name Service',
      }),
      new PuzzleWalletAdapter({
        appName: 'Aleo Name Service',
      }),
      new SoterWalletAdapter({
        appName: 'Aleo Name Service',
      })
    ],
    []
  );
  const [queryClient] = useState(() => new QueryClient());
  const getLayout = Component.getLayout ?? ((page) => page);

  useEffect(() => {
    configureConnectionForPuzzle({
      dAppName: "ANS",
      dAppDescription: "Aleo Name Service",
      dAppUrl:  `https://${location.host}`,
      dAppIconURL: 'data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij4KPGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPgo8dGl0bGU+QU5TPC90aXRsZT4KPHBvbHlnb24gY2xhc3M9ImNscy0xIiBwb2ludHM9IjkyLjI1IDEzMy4yIDEwMi43MSAxNTMuNTYgMTI0LjIgMTQ0LjQyIDExMy44OCAxMjMuOTkgOTIuMjUgMTMzLjIiLz4KPHBvbHlnb24gY2xhc3M9ImNscy0xIiBwb2ludHM9IjE2Ni4xMiAxMjYuNTcgMTU1LjY1IDEwNi4yIDEzNS4wNyAxMTQuOTYgMTQ1LjQgMTM1LjM5IDE2Ni4xMiAxMjYuNTciLz4KPHBvbHlnb24gY2xhc3M9ImNscy0xIiBwb2ludHM9IjIwMS42OSAzOC42MSAxNzguMDEgMzguNjEgMTc4LjAxIDUwLjYyIDE3OC4wMSAxODEuODkgMTc4LjAxIDE4OCAxNzEuOTcgMTg4IDE0NS40IDEzNS4zOSAxMjQuMiAxNDQuNDIgMTU5IDIxMy4zMSAxNTkuNDEgMjE0LjExIDIwMS42OSAyMTQuMTEgMjAxLjY5IDM4LjYxIi8+Cjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSI5OS45NyA0NS40NyA5Ni41IDM4LjYxIDc3Ljk5IDM4LjYxIDc2Ljc2IDM4LjYxIDU0LjMgMzguNjEgNTQuMyA1MC42MSA1NC4zIDIxNC4xMSA3Ny45OSAyMTQuMTEgNzcuOTkgNzEgNzcuOTkgNjQuODggODQuMDIgNjQuODggMTEzLjg4IDEyMy45OSAxMzUuMDcgMTE0Ljk2IDk5Ljk3IDQ1LjQ3Ii8+Cjwvc3ZnPg==',
    });
  }, []);

  //could remove this if you don't need to page level layout
  return (
    <>
      <Head>
        {/* maximum-scale 1 meta tag need to prevent ios input focus auto zooming */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1 maximum-scale=1"
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <WalletProvider
            wallets={wallets}
            decryptPermission={DecryptPermission.OnChainHistory}
            programs={["credits.aleo",
              "ans_registrar_v4.aleo",
              "ans_registrar_v5.aleo",
              "ans_registrar_v6.aleo",
              "aleo_name_service_registry_v4.aleo",
              "aleo_name_service_registry_v5.aleo",
              "aleo_name_service_registry_v6.aleo",
              process.env.NEXT_PUBLIC_PROGRAM!]}
            autoConnect
          >
            <WalletModalProvider>
              <RecordProvider>
                <ThemeProvider
                  attribute="class"
                  enableSystem={false}
                  defaultTheme="dark"
                >
                  {getLayout(<Component {...pageProps} />)}
                  <ModalsContainer />
                  <DrawersContainer />
                </ThemeProvider>
              </RecordProvider>
            </WalletModalProvider>
          </WalletProvider>
        </Hydrate>
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      </QueryClientProvider>
      <ToastContainer
        position="top-right"
        theme="dark"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        draggable={false}
        closeOnClick
        pauseOnHover
      />
      <AxiomWebVitals />
    </>
  );
}

export default CustomApp;

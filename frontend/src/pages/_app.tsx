import type { AppProps } from 'next/app';
import type { NextPageWithLayout } from '@/types';
import { useMemo, useState } from 'react';
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
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { DecryptPermission } from '@demox-labs/aleo-wallet-adapter-base';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
import {Analytics} from "@vercel/analytics/react";
import {RecordProvider} from "@/components/record-provider";
import {FoxWalletAdapter} from "@/lib/wallet-adapter/foxwallet";
import { AxiomWebVitals } from 'next-axiom';

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
      })
    ],
    []
  );
  const [queryClient] = useState(() => new QueryClient());
  const getLayout = Component.getLayout ?? ((page) => page);
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
      <Analytics />
      <AxiomWebVitals />
    </>
  );
}

export default CustomApp;

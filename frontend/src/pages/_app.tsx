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
import {DecryptPermission, WalletAdapterNetwork} from '@demox-labs/aleo-wallet-adapter-base';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
import {RecordProvider} from "@/context/record-context";
import { AxiomWebVitals } from 'next-axiom';
import {
  FoxWalletAdapter,
  SoterWalletAdapter,
  LeoWalletAdapter,
  PuzzleWalletAdapter,
  AvailWalletAdapter,
  configureConnectionForPuzzle
} from '@/lib/wallet-adapters';
import {PrivateFeeProvider} from "@/context/private-fee-context";
import {BlockNumber} from "@/components/BlockNumber";
import {isMobile} from "@/lib/util";


type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};


function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const wallets = useMemo(
    () => [
        new LeoWalletAdapter({
          appName: 'Aleo Name Service',
          isMobile: isMobile(),
          mobileWebviewUrl: isMobile() ? location.href : ''
        }),
        new FoxWalletAdapter({
          appName: 'Aleo Name Service',
        }),
        new PuzzleWalletAdapter({
          appName: 'Aleo Name Service',
        }),
        new SoterWalletAdapter({
          appName: 'Aleo Name Service',
        }),
      ], []);
  const [queryClient] = useState(() => new QueryClient());
  const getLayout = Component.getLayout ?? ((page) => page);
  const [isTestnet, setIsTestnet] = useState(false);

  useEffect(() => {
    setIsTestnet(process.env.NEXT_PUBLIC_NETWORK === 'testnetbeta');
  }, []);

  useEffect(() => {
    configureConnectionForPuzzle({
      dAppName: "ANS",
      dAppDescription: "Aleo Name Service",
      dAppUrl:  `https://${location.host}`,
      dAppIconURL: 'data:image/png;base64,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',
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
      {isTestnet && (
        <div style={{
          backgroundColor: 'rgb(255, 245, 204)',
          color: 'rgb(38, 38, 38)',
          textAlign: 'center',
          padding: '5px',
          fontWeight: 'bold'
        }}>
          You are viewing the ANS app on testnet.
        </div>
      )}
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <WalletProvider
            wallets={wallets}
            decryptPermission={DecryptPermission.OnChainHistory}
            network={process.env.NEXT_PUBLIC_NETWORK as WalletAdapterNetwork}
            programs={["credits.aleo",
              "token_registry.aleo",
              process.env.NEXT_PUBLIC_COUPON_CARD_PROGRAM!,
              process.env.NEXT_PUBLIC_PROGRAM!]}
            autoConnect
          >
            <WalletModalProvider>
              <PrivateFeeProvider>
                <RecordProvider>
                  <ThemeProvider
                    attribute="class"
                    enableSystem={false}
                    defaultTheme="dark"
                  >
                    {getLayout(<Component {...pageProps} />)}
                    <BlockNumber />
                    <ModalsContainer />
                    <DrawersContainer />
                  </ThemeProvider>
                </RecordProvider>
              </PrivateFeeProvider>
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

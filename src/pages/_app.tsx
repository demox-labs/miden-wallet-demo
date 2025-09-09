import type { AppProps } from 'next/app';
import type { NextPageWithLayout } from '@/types';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import ModalsContainer from '@/components/modal-views/container';
import DrawersContainer from '@/components/drawer-views/container';
// base css file
import 'swiper/css';
import '@/assets/css/scrollbar.css';
import '@/assets/css/globals.css';
import '@/assets/css/range-slider.css';
import { WalletProvider } from '@demox-labs/miden-wallet-adapter-react';
import {
  AllowedPrivateData,
  PrivateDataPermission,
} from '@demox-labs/miden-wallet-adapter-base';
import { WalletModalProvider } from '@demox-labs/miden-wallet-adapter-reactui';
import { MidenWalletAdapter } from '@demox-labs/miden-wallet-adapter-miden';
import { MidenSdkProvider } from '@/lib/hooks/use-miden-sdk';

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function CustomApp({ Component, pageProps }: AppPropsWithLayout) {
  const [wallets, setWallets] = useState<MidenWalletAdapter[]>([]);

  useEffect(() => {
    const midenAdapter = new MidenWalletAdapter({
      appName: 'Miden Demo App',
    });

    setWallets([midenAdapter]);
  }, []);

  const [queryClient] = useState(() => new QueryClient());
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1 maximum-scale=1"
        />
      </Head>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={pageProps.dehydratedState}>
          <ThemeProvider
            attribute="class"
            enableSystem={false}
            defaultTheme="dark"
          >
            <WalletProvider
              wallets={wallets}
              privateDataPermission={PrivateDataPermission.Auto}
              allowedPrivateData={AllowedPrivateData.All}
              autoConnect
            >
              <WalletModalProvider>
                <MidenSdkProvider>
                  {getLayout(<Component {...pageProps} />)}
                  <ModalsContainer />
                  <DrawersContainer />
                </MidenSdkProvider>
              </WalletModalProvider>
            </WalletProvider>
          </ThemeProvider>
        </HydrationBoundary>
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      </QueryClientProvider>
    </>
  );
}

export default CustomApp;

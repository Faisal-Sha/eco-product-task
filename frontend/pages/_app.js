import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../src/components/Navigation';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  // Pages that should not show navigation
  const noNavPages = ['/login', '/register'];
  const showNav = !noNavPages.includes(router.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="font-sans antialiased">
        {showNav && <Navigation />}
        <Component {...pageProps} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            success: {
              style: {
                background: '#10B981',
                color: 'white',
              },
            },
            error: {
              style: {
                background: '#EF4444',
                color: 'white',
              },
            },
          }}
        />
      </div>
    </QueryClientProvider>
  );
}

export default MyApp;

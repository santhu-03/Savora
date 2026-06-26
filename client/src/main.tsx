import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { queryClient } from './lib/queryClient';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#260B10',
                color: '#D9B89C',
                border: '1px solid rgba(191,139,94,0.3)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                borderRadius: '12px',
                padding: '10px 14px',
              },
              success: {
                iconTheme: { primary: '#BF8B5E', secondary: '#FDF8F3' },
              },
              error: {
                iconTheme: { primary: '#A6523F', secondary: '#FDF8F3' },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

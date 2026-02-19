import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './router';

import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  console.log('🚀 App component rendering...');

  try {
    return (
      <BrowserRouter>
        <ErrorBoundary>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    );
  } catch (error) {
    console.error('❌ Error in App component:', error);
    return <div style={{ padding: '50px', color: 'red' }}>ERROR: {error.message}</div>;
  }
}

export default App;

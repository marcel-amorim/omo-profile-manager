import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/organisms/ErrorBoundary';
import { ToastContainer } from './components/organisms/ToastContainer';
import { ProfileManagerPage } from './components/pages/ProfileManagerPage';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <ProfileManagerPage />
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/rubik/300.css';
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import './styles/app.css';
import { App } from './ui/App.tsx';
import { Creations, useCreationsPage } from './ui/Creations.tsx';

function Root() {
  return useCreationsPage() ? <Creations /> : <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

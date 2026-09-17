import type { JSX } from 'preact';
import { AppShell } from './app/AppShell';
import appStyles from './App.module.css';

function App(): JSX.Element {
  return (
    <main class={appStyles.app}>
      <AppShell />
    </main>
  );
}

export default App;

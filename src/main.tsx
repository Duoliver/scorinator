import { render } from 'preact';
import './design-system/tokens/fonts.css';
import './design-system/tokens/tokens.css';
import './design-system/tokens/elements.css';
import App from './App';

render(<App />, document.getElementById('root')!);

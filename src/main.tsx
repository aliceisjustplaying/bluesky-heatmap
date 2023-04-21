import { createRoot } from 'react-dom/client';
import 'react-tooltip/dist/react-tooltip.css';
import './react-calendar-heatmap.css';
import './styles.css';
import 'github-fork-ribbon-css/gh-fork-ribbon.css';
import { App } from './App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);

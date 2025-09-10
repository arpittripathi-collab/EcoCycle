import './styles/main.css';
import { router } from './router';

// This function will resolve the routes
const handleRouteChange = () => {
  router.resolve();
};

window.addEventListener('load', handleRouteChange);
window.addEventListener('hashchange', handleRouteChange);
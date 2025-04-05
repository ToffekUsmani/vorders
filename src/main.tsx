
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add custom CSS for voice assistant animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse-animation {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
  
  .pulse-animation {
    animation: pulse-animation 2s infinite;
  }
  
  @keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  
  .animate-bounce-subtle {
    animation: bounce-subtle 1.5s ease-in-out infinite;
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-in-out;
  }
`;

document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);

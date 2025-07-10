import React from 'react';
import { FalconApiContext, useFalconApiContext, } from './contexts/falcon-api-context.js';
import { Home } from './pages/home.js';
import ReactDOM from 'react-dom/client';

// Import Shoelace
import '@shoelace-style/shoelace/dist/themes/light.css';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';

// Set the base path for Shoelace assets
setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/');

function App() {
  const {falcon, navigation, isInitialized} = useFalconApiContext();

  if (!isInitialized) {
    return null;
  }

  return (
    <React.StrictMode>
      <FalconApiContext.Provider value={{ falcon, navigation, isInitialized }}>
        <Home/>
      </FalconApiContext.Provider>
    </React.StrictMode>
  );
}

const domContainer = document.querySelector("#app");
const root = ReactDOM.createRoot(domContainer);

root.render(<App/>);

import React from 'react';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <div className="app-container">
      {/* You can add global headers/sidebars here later! */}
      <Outlet />
    </div>
  );
}

export default App;

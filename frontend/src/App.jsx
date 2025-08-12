import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Register from './components/register';
import Login from './components/login';
import Dashboard from './components/dashboard';
import RequireAuth from './components/RequireAuth';
import RedirectIfAuth from './components/RedirectIfAuth';


function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <Router>
      <nav className="bg-blue-500 p-4 text-white flex justify-between items-center">
        <div className="flex gap-4">
          <Link to="/">Home</Link>
          {!user && <Link to="/register">Register</Link>}
          {!user && <Link to="/login">Login</Link>}
          {user && <Link to="/dashboard">Dashboard</Link>}
        </div>
        {/* {user && (
          <div className="flex gap-4 items-center">
            <span>Hello, {user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        )} */}
      </nav>
<Routes>
  <Route path="/" element={<div className="p-4">Welcome to the App</div>} />

  <Route
    path="/register"
    element={
      <RedirectIfAuth user={user}>
        <Register />
      </RedirectIfAuth>
    }
  />

  <Route
    path="/login"
    element={
      <RedirectIfAuth user={user}>
        <Login />
      </RedirectIfAuth>
    }
  />

  <Route
    path="/dashboard"
    element={
      <RequireAuth user={user}>
        <Dashboard user={user} onLogout={handleLogout} />
      </RequireAuth>
    }
  />
</Routes>
    </Router>
  );
}

export default App;
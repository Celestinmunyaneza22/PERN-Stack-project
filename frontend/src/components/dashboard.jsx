import React from 'react';

function Dashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white shadow rounded p-6 max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Welcome, {user.username}!</h1>
        <p className="mb-4 text-gray-700">This is dashboard.</p>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
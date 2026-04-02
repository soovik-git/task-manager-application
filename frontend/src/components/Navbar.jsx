import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="nav glass-panel">
      <h1>Task Master</h1>
      <div className="nav-links">
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Welcome, {user?.email}
        </span>
        <button onClick={logout} className="btn-danger" style={{ padding: '0.4rem 0.8rem' }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

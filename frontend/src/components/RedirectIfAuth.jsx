import { Navigate } from 'react-router-dom';

function RedirectIfAuth({ user, children }) {
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RedirectIfAuth;
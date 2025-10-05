import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // Verify both token and correct role for the route
  if (!token) {
    return <Navigate to="/" />;
  }

  // Check if trying to access admin route without admin role
  if (window.location.pathname === '/admin' && userRole !== 'admin') {
    return <Navigate to="/employee" />;
  }

  // Check if trying to access employee route without employee role
  if (window.location.pathname === '/employee' && userRole !== 'employee') {
    return <Navigate to="/admin" />;
  }

  return children;
};

export default PrivateRoute;

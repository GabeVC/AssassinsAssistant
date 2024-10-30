import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    // If user is not authenticated, redirect to the login page
    return <Navigate to="/login" />;
  }
  // If user is authenticated, render the children (the protected component)
  return children;
};

export default ProtectedRoute;

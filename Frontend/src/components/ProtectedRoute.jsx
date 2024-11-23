import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * This component handles protecting components from unauthorized users
 * 
 * @param {User} user - The current user
 * @param {Component} children - The protected component
 * @returns {Any} Either redirects the user to the login page if unauthorized, or displays children component
 */
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    // If user is not authenticated, redirect to the login page
    return <Navigate to="/login" />;
  }
  // If user is authenticated, render the children (the protected component)
  return children;
};

export default ProtectedRoute;

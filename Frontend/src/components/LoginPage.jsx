import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  let gameId = null
  let path = null

  const queryParams = new URLSearchParams(location.search);
  const redirect = queryParams.get('redirect');
  if (redirect)
  {
    [path, gameId] = redirect.split('/');
  }
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      console.log('Path:', path); 
      console.log('Game ID:', gameId);

      if (path === 'join' && gameId) { //If the user was redirected to login after clicking an invite link
        navigate(`/join/${gameId}`);
      } else {
        navigate('/home');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="auth-page">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Log In</button>
      </form>
      <div>
      Don't have an account? Register <a
        href={`/register?redirect=join/${gameId}`}>here</a>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
        // Create user with Firebase Authentication and add them to db
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, 'users', user.uid), {
            userId: user.uid,
            username: username,
            email: email,
            createdAt: new Date(),
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                eliminations: 0,
              },
        });
        
        console.log("Registered User:", userCredential.user);
        navigate('/home'); // Redirect after successful registration
    } catch (error) {
        setError(error.message);
    }
  };

  return (
    <div className="auth-page">
    <h2>Register</h2>
    <form onSubmit={handleRegister}>
        <div className="form-group">
        <label>Username:</label>
        <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
        />
        </div>
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
        <button type="submit">Register</button>
    </form>
    </div>
);
};

export default RegisterPage;

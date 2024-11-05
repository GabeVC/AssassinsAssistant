import { React, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'

const ProfilePage = () => {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  // I was trying to figure out how to extract info but idk
  {/*useEffect(() => {
    const findUser = async userId => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnapshot = await getDoc(userRef);
        const userData = userSnapshot.data();
      } catch (error) {
        console.error("Failed to find user:", error);
      }
    };

    if (user) {
        findUser(user.uid);
    }
  }, [user]);*/}

  // username and created don't work
  return (
    <div className="profile-page">
      <header>
        <h1>Assassins Assistant</h1>
        <h2>Profile Information</h2>
      </header>
      <main>
        <p>Created: {user.createdAt}</p>
        <p>Email: {user.email}</p>
        <p>UserID: {user.uid}</p>
        <p>Username: {user.username}</p>
      </main>
    </div>
  );
};

export default ProfilePage;

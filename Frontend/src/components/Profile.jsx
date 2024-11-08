import { React, useEffect ,useState} from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, onSnapshot, updateDoc, collection, where, query, getDocs } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading} = useAuth();
  const [loading2, setLoading2] = useState(true);
  const [currUser, setCurrUser] = useState(null);

  useEffect(() => {
  const fetchUserData = async () => {
    try {
      if (loading) return <p>Loading...</p>;
        const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            const userInfo = userDoc.data();
            setCurrUser(userInfo);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading2(false);
    }
  }

  fetchUserData();
}, [user]);

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
  if (loading2) return <p>Loading profile details...</p>;
  return (
    <div className="profile-page">

      <header>
        <h1>Assassins Assistant</h1>
        <h2>Profile Information</h2>
      </header>
      <main>
        <p>Created: {new Date(currUser.createdAt.seconds * 1000).toLocaleString()}</p>
        <p>Email: {currUser.email}</p>
        <p>UserID: {user.uid}</p>
        <p>Username: {currUser.username}</p>
      </main>
    </div>
  );
};

export default ProfilePage;

import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // State to store the message from the Koa API and the count
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);

  // Fetch the message from the Koa API when the component mounts
  useEffect(() => {
    fetch('http://localhost:4000/api')
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message); // Set the message from the API
      })
      .catch((error) => {
        console.error('Error fetching message from API:', error);
      });
  }, []);

  return (
    <>
      <div>
        <h1>Koa work yippee</h1>
        <p>
          Message from the Koa API: <strong>{message || 'Loading...'}</strong>
        </p>
      </div>
    </>
  );
}

export default App;

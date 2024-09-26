import './App.css';
import React from 'react';

function App() {
  const handleButtonClick = async () => {
    try {
      const response = await fetch('http://localhost:5000/make-video', {
        method: 'POST',
      });
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while making the video.');
    }
  };

  return (
    <div className="App">
      <button className="big-button" onClick={handleButtonClick}>Make a Video</button>
    </div>
  );
}

export default App;
const axios = require('axios');

// URL of your application, change it to your hosted app's URL on Render
const url = 'https://your-app-name.onrender.com';

// Ping interval (in milliseconds). Here we use 5 minutes (300,000 ms)
const interval = 300000; // 5 minutes

function keepAppAlive() {
  setInterval(() => {
    axios.get(url)
      .then(response => {
        console.log(`Ping successful: ${response.status}`);
      })
      .catch(error => {
        console.error('Ping failed', error);
      });
  }, interval);
}

// Start the pings
keepAppAlive();

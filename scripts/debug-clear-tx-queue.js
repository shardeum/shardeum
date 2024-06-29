const http = require('http');
const readline = require('readline');

// Function to prompt the user for input
function prompt(question) {
  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });

  return new Promise((resolve) => rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
  }));
}

function fetchDataFromPort(port) {
  const url = `http://localhost:${port}/debug-queue-clear`;

  return new Promise((resolve, reject) => {
      http.get(url, (response) => {
          resolve(null)
      }).on('error', (err) => {
          console.error(`Error fetching data from port ${port}: ${err.message}`);
          resolve(null);
      });
  });
}


// Main function
async function main() {
  const startPort = parseInt(await prompt('Enter the start port: '), 10);
  const endPort = parseInt(await prompt('Enter the end port: '), 10);

  for (let port = startPort; port <= endPort; port++) {
      await fetchDataFromPort(port);
  }
}

main();
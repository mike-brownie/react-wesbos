require('dotenv').config({ path: '.env' });
const createServer = require('./createServer.js');
const db = require('./db');

const server = createServer();

// Action item: cookies from JWT via express middleware
// Action item: populate current user via express middleware

server.start(
    {
        cors: {
            credentials: true, 
            origin: process.env.FRONTEND_URL
        }
    }, 
    dets => {console.log(`¡Server running on port https://localhost:${dets.port}!`);
    }
);

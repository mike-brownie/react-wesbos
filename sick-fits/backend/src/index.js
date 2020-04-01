require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// reminder - deploy express middleware cookies 
// reminder - deploy express middleware current user 

server.start({
    cors: {
        credentials: true, 
        origin: process.env.FRONTEND_URL,
    }
},
 dets => { console.log(`¡Server is running on port http:/localhost/:${dets.port}!`)
})

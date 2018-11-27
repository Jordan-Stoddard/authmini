const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs') // added package and required it here
const session = require('express-session')
const KnexSessionStore = require('connect-session-knex')(session)

// require in db config file
const db = require('./database/dbConfig.js');

// Initialize server
const server = express();

// Session Config
const sessionConfig = {
  secret: 'this-is-his-doggo', // the key using for decrypting, we would normally never have a secret hard coded here
  cookie: {
    maxAge: 1000 * 60 * 10, // Sets the timeout for the session
    secure: false, // in production you want this true. Only set it over httpS
  },
  httpOnly: true, // no JS can touch this cookie
  resave: false,
  saveUninitialized: false,
  name: 'foobarBanana',
  store: new KnexSessionStore({ // Setting the store, which allows us to connect our session data and put it into a database.
    tablename: 'sessions',
    sidfieldname: 'sid',
    knex: db,
    createtable: true,
    clearInterval: 1000 * 60 * 60
  })
}


// Initialize middleware
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig)) // wires up session management

server.post('/api/register', (req, res) => {
  // grab username and password from body
  const creds = req.body
  // generate the hash from the user's password
  const hash = bcrypt.hashSync(creds.password, 14) // rounds is 2^X
  // override the user.password with the hash
    creds.password = hash;
  // Save user to the database
  db('users').insert(creds).then(ids => {
    res.status(201).json(ids)
  })
  .catch(err => json(err))
})

server.post('/api/login', (req, res) => {
  // grab username and password from body
  const creds = req.body

  db('users')
  .where({username: creds.username})
  .first()
  .then(user => {
if(user && bcrypt.compareSync(creds.password, user.password)) {
  // passwords match and user exists by that username
  req.session.userId = user.id
  res.status(200).json({message: 'welcome'})
} else {
  // either username is invalid or password is wrong
  res.status(401).json({message: 'you shall not pass'})
}
  })
  .catch(err => res.json(err))
})


// protect this route, only authenticated users should see it
server.get('/api/users', protected, (req, res) => {
    db('users')
    .select('id', 'username', 'password') // Added password to select
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
 
});

server.get('/api/logout', (req, res) => {
  if(req.session) {
    req.session.destroy(err => {
      if (err) {
        res.send('there was an error, cant logout.')
      } else {
        res.send('bye')
      }
    })
  }
})

 function protected(req, res, next) {
  // If this is true, they're logged in and they have access to the data.
  if(req.session && req.session.userId) {
    next();
  } else {
    // bounce them
    res.status(401).json({you: 'shall not pass'})
  }
}

// Sanity Check
server.get('/', (req, res) => {
  res.send('Its Alive!');
});

server.listen(3300, () => console.log('\nrunning on port 3300\n'));

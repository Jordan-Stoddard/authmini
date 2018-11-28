require('dotenv').config()
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // *************************** added package and required it here
const jwt = require('jsonwebtoken')

const db = require('./database/dbConfig.js');

const server = express();

server.use(express.json());
server.use(cors());

function generateToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    roles: ['sales', 'marketing'] // this will come from the database
  };
  const secret = process.env.JWT_SECRET;
  const options = {
    expiresIn: '1h',
  }
  return jwt.sign(payload, secret, options);
}

server.post('/api/login', (req, res) => {
  // grab username and password from body
  const creds = req.body;

  db('users')
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        // passwords match and user exists by that username
        // created a session before > now we create a token
        // library used to send cokie automatically > we send the token manually
        const token = generateToken(user);
        res.status(200).json({ message: 'welcome!', token });
      } else {
        // either username is invalid or password is wrong
        res.status(401).json({ message: 'you shall not pass!!' });
      }
    })
    .catch(err => res.json(err));
});

function protected(req, res, next) {
  // Token is normally sent in the Authorization header
  const token = req.headers.authorization;

  if(token) {
    // is it valid
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if(err) {
        // token is invalid
        res.status(401).json({message: 'invalid token'})
      } else {
        // Token is valid
        req.decodedToken = decodedToken;
        next();
      }
    })
   
  } else {
    //bounce
    res.status(401).json({message: 'Username or password is incorrect'})
  }
  
}

// protect this route, only authenticated users should see it
server.get('/api/me', protected, (req, res) => {
  db('users')
    .select('id', 'username', 'password') // ***************************** added password to the select
    .where({ id: req.session.user })
    .first()
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
});

server.get('/api/users', protected, (req, res) => {
  db('users')
    .select('id', 'username', 'password') // ***************************** added password to the select
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
});

server.post('/api/register', (req, res) => {
  // grab username and password from body
  const creds = req.body;

  // generate the hash from the user's password
  const hash = bcrypt.hashSync(creds.password, 4); // rounds is 2^X

  // override the user.password with the hash
  creds.password = hash;

  // save the user to the database
  db('users')
    .insert(creds)
    .then(ids => {
      res.status(201).json(ids);
    })
    .catch(err => json(err));
});

server.get('/', (req, res) => {
  res.send('Its Alive!');
});

server.listen(3300, () => console.log('\nrunning on port 3300\n'));

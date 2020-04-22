const express = require('express');
const app = express();
const router = express.Router();
const mongoose = require('mongoose');
const config = require('./config/database');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');

const authentication = require('./routes/authentication')(router);
const blogs = require('./routes/blogs')(router);

mongoose.Promise = global.Promise;
mongoose.connect(config.uri, (err) => {
    if(err){
        console.log('Could Not connect to database ', err);
    } else{
        // console.log('Secret is: '+ config.secret);
        console.log('Connected to database: '+ config.db);
    }
});

app.use(cors({
    origin: 'http://localhost:4200'
}));

app.use(bodyParser.urlencoded({limit: '50mb', extended: false }));
app.use(bodyParser.json({limit: '50mb'}));

app.use(express.static(__dirname + '/client/dist/client/'));

// app.use(session({
//     secret: 'cookie_secret',
//     name: 'cookie_name',
//     resave: true,
//     saveUninitialized: true,
//     cookie: { secure: false },
//   }));
//   app.use(passport.initialize());
//   app.use(passport.session());
// var passportOneSessionPerUser = require('passport-one-session-per-user')
// passport.use(new passportOneSessionPerUser())
// app.use(passport.authenticate('passport-one-session-per-user'))

app.use('/authentication', authentication);
app.use('/blogs', blogs);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/client/dist/client/index.html'));
});

app.listen(3000, () => {
    console.log('Listening on Port 3000');
});
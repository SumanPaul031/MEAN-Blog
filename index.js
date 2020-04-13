const express = require('express');
const app = express();
const mongoose = require('mongoose');
const config = require('./config/database');

mongoose.Promise = global.Promise;
mongoose.connect(config.uri, (err) => {
    if(err){
        console.log('Could Not connect to database ', err);
    } else{
        // console.log('Secret is: '+ config.secret);
        console.log('Connected to database: '+ config.db);
    }
});

app.get('*', (req, res) => {
    res.send('Hey');
});

app.listen(3000, () => {
    console.log('Listening on Port 3000');
});
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const config = require('../config/database');

module.exports = (router) => {
    router.post('/register', (req, res) => {
        if(!req.body.email){
            res.json({ success: false, message: 'Please Provide an Email' });
        } else{
            if(!req.body.username){
                res.json({ success: false, message: 'Please Provide a Username' });
            } else {
                if(!req.body.password){
                    res.json({ success: false, message: 'Please Provide a Password' });
                } else {
                    let user = new User({
                        email: req.body.email.toLowerCase(),
                        username: req.body.username.toLowerCase(),
                        password: req.body.password
                    });

                    user.save((err) => {
                        if(err){
                            // console.log(err);
                            if(err.name === 'MongoError'){
                                if(err.code === 11000){
                                    if(err.keyPattern.email){
                                        res.json({ success: false, message: 'Email already exists' });
                                    } else if(err.keyPattern.username){
                                        res.json({ success: false, message: 'Username already exists' });
                                    }
                                }
                            } else if(err.name === 'ValidationError'){
                                // console.log(err.errors.email.message);
                                if(err.errors.email){
                                    res.json({ success: false, message: err.errors.email.message });
                                } else if(err.errors.username){
                                    res.json({ success: false, message: err.errors.username.message });
                                } else if(err.errors.password){
                                    res.json({ success: false, message: err.errors.password.message });
                                }
                            } else{
                                res.json({ success: false, message: 'Could Not Save User. Error: '+err });
                            }
                        } else{
                            res.json({ success: true, message: 'User Registered' });
                        }
                    })
                }
            }
        }
    });

    router.get('/checkEmail/:email', (req, res) => {
        if(!req.params.email){
            res.json({ success: false, message: 'Email was not provided'});
        } else{
            User.findOne({ email: req.params.email }, (err, user) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    if(user){
                        res.json({ success: false, message: 'Email already exists' });
                    } else{
                        res.json({ success: true });
                    }
                }
            })
        }
    });

    router.get('/checkUsername/:username', (req, res) => {
        if(!req.params.username){
            res.json({ success: false, message: 'Username was not provided'});
        } else{
            User.findOne({ username: req.params.username }, (err, user) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    if(user){
                        res.json({ success: false, message: 'Username already taken' });
                    } else{
                        res.json({ success: true });
                    }
                }
            })
        }
    });

    router.post('/login', (req, res) => {
        if(!req.body.username){
            res.json({ success: false, message: 'Please provide a username' });
        } else{
            if(!req.body.password){
                res.json({ success: false, message: 'Please enter a password' });
            } else{
                User.findOne({ username: req.body.username.toLowerCase() }, (err, user) => {
                    if(err){
                        res.json({ success: false, message: err });
                    } else{
                        if(!user){
                            res.json({ success: false, message: 'Username Not Found' });
                        } else{
                            const validPassword = user.comparePassword(req.body.password);
                            if(!validPassword){
                                res.json({ success: false, message: 'Incorrect Password' });
                            } else{
                                const token = jwt.sign({ userId: user._id, username: user.username, email: user.email }, config.secret, { expiresIn: '15s' });
                                res.json({ success: true, message: 'Logged In Successfully!', token: token, user: user });
                            }
                        }
                    }
                });
            }
        }
    });

    router.use((req, res, next) => {
        var token = req.body.token || req.body.query || req.headers['x-access-token'];
        if(token){
            //verify token
            jwt.verify(token, config.secret, function(err, decoded) {
                if(err){
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid Token'
                    });
                } else{
                    req.decoded = decoded;
                    next();
                }
            })
        } else{
            return res.status(401).json({
                success: false,
                message: 'No Token Found'
            })
        }
    })

    router.get('/me', (req, res) => {
        res.send(req.decoded);
    });

    return router;
}
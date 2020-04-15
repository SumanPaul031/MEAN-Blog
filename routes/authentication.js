const User = require('../models/user');

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

    return router;
}
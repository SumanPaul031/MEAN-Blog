const User = require('../models/user');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const config = require('../config/database');
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

module.exports = (router) => {
    var client = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "sumanpaul0209@gmail.com",
            pass: "R@scal99toku49"
        }
    });

    //Verify Refresh Token Middleware which will be verifying the session
    let verifySession = (req, res, next) => {
        //grab the refresh token from the request header
        let refreshToken = req.header('x-refresh-token');

        //grab the _id from the request header
        let _id = req.header('_id');

        User.findByIdAndToken(_id, refreshToken).then((user) => {
            if(!user){
                //user couldn't be found
                res.status(401).json({
                    success: false,
                    message: 'Make sure the refresh token and userID are valid'
                })
            }

            //if user was found the refresh token exists in the database but we still have to checkif it has expired or not
            req.user_id = user._id;
            req.userObject = user;
            req.refreshToken = refreshToken;

            let isSessionValid = false;

            user.sessions.forEach((session) => {
                if(session.token === refreshToken){
                    //check if the session has expired
                    if(User.hasRefreshTokenExpired(session.expiresAt) === false){
                        //refresh token has not expired
                        isSessionValid = true;
                    }
                }
            });

            if(isSessionValid){
                //call next to continue with processing this web request
                next();
            } else{
                //session is not valid
                res.status(401).json({
                    success: false,
                    message: 'Refresh token has expired or the session is invalid'
                });
            }
        }).catch((e) => {
            res.status(401).json({
                success: false,
                message: e
            });
        })
    }

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
                        password: req.body.password,
                        temporarytoken: jwt.sign({ username: req.body.email.toLowerCase(), email: req.body.username.toLowerCase() }, config.secret, { expiresIn: '1h' })
                    });
                    // user.temporarytoken = jwt.sign({ username: user.username, email: user.email, name: user.name }, secret, { expiresIn: '1h' });

                    user.save().then(() => {
                        var email = {
                            from: 'MEAN Blog Staff',
                            to: user.email,
                            subject: 'MEAN-Blog activation link',
                            text: 'Hello '+user.username+'.\n\nPlease click on the link below to activate your account.\n\nhttp://localhost:3000/activate/'+user.temporarytoken,
                            html: 'Hello <strong>'+user.username+'</strong>.<br><br>Please click on the link below to activate your account.<br><br><a href="http://localhost:3000/activate/'+user.temporarytoken+'">http://localhost:3000/activate/</a>'
                        };
                    
                        client.sendMail(email, function(error, info){
                            if (error) {
                              console.log(error);
                            } else {
                              console.log('Email sent: ' + info.response);
                            }
                        });
                        return user.createSession();
                    }).then((refreshToken) => {        
                        return user.generateAccessToken().then((accessToken) => {
                            return {accessToken, refreshToken};
                        });
                    }).then((authTokens) => {
                        res.json({
                            success: true,
                            message: 'You have been successfully registered. Please check your email for activation Link',
                            headers: {
                                'x-refresh-token': authTokens.refreshToken,
                                'x-access-token': authTokens.accessToken
                            },
                            user: user
                        });                
                    }).catch((err) => {
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
                                if(!user.active){
                                    res.json({
                                        success: false,
                                        message: 'Account is not yet activated. Please check your email for activation link',
                                        expired: true
                                    });
                                } else{
                                    return user.createSession().then((refreshToken) => {
                                        return user.generateAccessToken().then((accessToken) => {
                                            return {accessToken, refreshToken}
                                        });
                                    }).then((authTokens) => {
                                        res.json({
                                            success: true,
                                            message: 'Logged In Successfully!',
                                            headers: {
                                                'x-refresh-token': authTokens.refreshToken,
                                                'x-access-token': authTokens.accessToken
                                            },
                                            user: user
                                        });
                                    }).catch((e) => {
                                        res.status(401).json({
                                            success: false,
                                            message: e
                                        })
                                    })
                                }
                            }
                        }
                    }
                });
            }
        }
    });

    //Route to get New Access Token
    router.get('/access-token', verifySession, (req, res) => {
        //We know that the caller is authenticated and we have the user_id and userObject available to us
        req.userObject.generateAccessToken().then((accessToken) => {
            res.json({
                success: true,
                message: 'new access token generated',
                headers: {
                    'x-access-token': accessToken
                },
                token: accessToken
            });
        }).catch((e) => {
            res.status(401).json({
                success: false,
                message: e
            });
        })
    });

    router.get('/activate/:token', (req, res) => {
        if(req.params.token === null || req.params.token === undefined || req.params.token === ''){
            res.json({ success: false, message: 'No activation token Found' });
        } else{
            User.findOne({ temporarytoken: req.params.token }, (err, user) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    jwt.verify(req.params.token, config.secret, function(err, decoded) {
                        if(err){
                            res.json({
                                success: false,
                                message: 'Activation Link has expired'
                            });
                        } else if(!user) {
                            res.json({
                                success: false,
                                message: 'Activation Link has expired'
                            });
                        } else{
                            user.temporarytoken = false;
                            user.active = true;
                            user.save().then(() => {
                                var email = {
                                    from: 'MEAN Blog Staff',
                                    to: user.email,
                                    subject: 'MEAN-Blog account activated',
                                    text: 'Hello '+user.username+'.\n\nYour account has been successfully activated',
                                    html: 'Hello <strong>'+user.username+'</strong>.<br><br>Your account has been successfully activated'
                                };
        
                                client.sendMail(email, function(error, info){
                                    if (error) {
                                      console.log(error);
                                    } else {
                                      console.log('Email sent: ' + info.response);
                                    }
                                });
                
                                res.json({
                                    success: true,
                                    message: 'Account Activated'
                                });
                            })
                        }
                    })
                }
            });
        }
    })

    router.post('/resend', (req, res) => {
        if(req.body.email === undefined || req.body.email === null || req.body.email === ''){
            return res.json({
                success: false,
                message: 'Please enter your email id'
            });
        } else{
            User.findOne({ email: req.body.email }, (err, user) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    if(!user){
                        res.json({
                            success: false,
                            message: 'Email not found'
                        });
                    } else{
                        if(user.active){
                            res.json({
                                success: false,
                                message: 'Account already activated'
                            })
                        } else{
                            res.json({ success: true, user: user });
                        } 
                    }
                }
            });
        }
    })

    router.put('/resend', (req, res) => {
        if(req.body.email === undefined || req.body.email === null || req.body.email === ''){
            return res.json({
                success: false,
                message: 'Please enter your email id'
            });
        } else{
            User.findOne({ email: req.body.email }, (err, user) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    if(!user){
                        res.json({
                            success: false,
                            message: 'Email not found'
                        });
                    } else{
                        user.temporarytoken = jwt.sign({ username: user.username, email: user.email }, config.secret, { expiresIn: '1h' });

                        user.save().then(() => {
                            var email = {
                                from: 'MEAN Blog Staff',
                                to: user.email,
                                subject: 'MEAN-Blog activation link request',
                                text: 'Hello '+user.username+'.\n\nPlease click on the link below to activate your account.\n\nhttp://localhost:3000/activate/'+user.temporarytoken,
                                html: 'Hello <strong>'+user.username+'</strong>.<br><br>Please click on the link below to activate your account.<br><br><a href="http://localhost:3000/activate/'+user.temporarytoken+'">http://localhost:3000/activate/</a>'
                            };
                        
                            client.sendMail(email, function(error, info){
                                if (error) {
                                  console.log(error);
                                } else {
                                  console.log('Email sent: ' + info.response);
                                }
                            });
            
                            res.json({
                                success: true,
                                message: 'Activation Link Sent. Please check your mail for new activation link'
                            });
                        }).catch((e) => {
                            res.json({
                                success: false,
                                message: e
                            })
                        })
                    }
                }
            });
        }
    })

    router.get('/resetusername/:email', (req, res) => {
        if(req.params.email === undefined || req.params.email === null || req.params.email === ''){
            res.json({
                success: false,
                message: 'No Email Found'
            });
        } else{
            User.findOne({ email: req.params.email }, (err, user) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    if(!user){
                        res.json({
                            success: false,
                            message: 'Email Not Found'
                        });
                    } else{
                        if(!user.active){
                            res.json({
                                success: false,
                                message: 'Account is not yet activated. Please check your email for activation link',
                                expired: true
                            });
                        } else{
                            var email = {
                                from: 'MEAN Blog Staff',
                                to: user.email,
                                subject: 'MEAN-Blogl Username request',
                                text: 'Hello '+user.username+'.\n\nYour Username is '+user.username,
                                html: 'Hello <strong>'+user.username+'</strong>.<br><br>Your Username is <strong>'+user.username+'</strong>'
                            };
                        
                            client.sendMail(email, function(error, info){
                                if (error) {
                                  console.log(error);
                                } else {
                                  console.log('Email sent: ' + info.response);
                                }
                            });
        
                            res.json({
                                success: true,
                                message: 'Username has been sent to your email'
                            });
                        }
                    }
                }
            });
        }
    })

    router.put('/resetpassword', (req, res) => {
        if(req.body.email === undefined || req.body.email === null || req.body.email === ''){
            res.json({
                success: false,
                message: 'Please enter your email'
            });
        } else{
            User.findOne({ email: req.body.email }, (err, user) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    if(!user){
                        res.json({
                            success: false,
                            message: 'Email Not Found'
                        })
                    } else{
                        if(!user.active){
                            res.json({
                                success: false,
                                message: 'Account is not yet activated. Please check your email for activation link',
                                expired: true
                            });
                        } else{
                            user.resettoken = jwt.sign({ username: user.username, email: user.email }, config.secret, { expiresIn: '1h' });

                            user.save().then(() => {
                                var email = {
                                    from: 'MEAN Blog Staff',
                                    to: user.email,
                                    subject: 'MEAN-Blog reset Password request',
                                    text: 'Hello '+user.username+'.\n\nPlease click on the link below to reset your password.\n\nhttp://localhost:3000/newpassword/'+user.resettoken,
                                    html: 'Hello <strong>'+user.username+'</strong>.<br><br>Please click on the link below to reset your password.<br><br><a href="http://localhost:3000/newpassword/'+user.resettoken+'">http://localhost:3000/newpassword/</a>'
                                };
                            
                                client.sendMail(email, function(error, info){
                                    if (error) {
                                      console.log(error);
                                    } else {
                                      console.log('Email sent: ' + info.response);
                                    }
                                });
                
                                res.json({
                                    success: true,
                                    message: 'Password Reset Link Sent. Please check your mail'
                                });
                            }).catch((e) => {
                                res.json({
                                    success: false,
                                    message: e
                                })
                            });
                        }
                    }
                }
            });
        }
    })

    router.get('/newpassword/:token', (req, res) => {
        if(req.params.token === null || req.params.token === undefined || req.params.token === ''){
            res.json({ success: false, message: 'No Password Reset Token Found'});
        } else{
            User.findOne({ resettoken: req.params.token }, (err, user) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    jwt.verify(req.params.token, config.secret, function(err, decoded) {
                        if(err){
                            res.json({
                                success: false,
                                message: 'Invalid Token'
                            });
                        } else{
                            if(!user) {
                                res.json({
                                    success: false,
                                    message: 'Reset Link has expired'
                                });
                            } else{
                                res.json({
                                    success: true,
                                    user: user
                                });
                            }
                        }
                    });
                }
            });
        }
    })

    router.put('/savepassword', (req, res) => {
        if(req.body.email === undefined || req.body.email === null || req.body.email === ''){
            res.json({
                success: false,
                message: 'Please enter your email'
            });
        } else{
            User.findOne({ email: req.body.email }, (err, user) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    if(req.body.password === null || req.body.password === undefined || req.body.password === ''){
                        res.json({
                            success: false,
                            message: 'Please enter a new password'
                        });
                    } else{
                        user.password = req.body.password;
                        user.resettoken = false;
                        user.save().then(() => {

                            var email = {
                                from: 'MEAN Blog Staff',
                                to: user.email,
                                subject: 'MEAN-Blog Password Successfully Reset',
                                text: 'Hello '+user.username+'.\n\nYour password has been successfully reset',
                                html: 'Hello <strong>'+user.username+'</strong>.<br><br>Your password has been successfully reset'
                            };
                        
                            client.sendMail(email, function(error, info){
                                if (error) {
                                console.log(error);
                                } else {
                                console.log('Email sent: ' + info.response);
                                }
                            });

                            res.json({
                                success: true,
                                message: 'Password Reset successfully'
                            });
                        }).catch((e) => {
                            if(e.name === "ValidationError"){
                                if(e.errors.password){
                                    res.json({
                                        success: false,
                                        message: e.errors.password.message
                                    });
                                }
                            }
                            // res.send(e);
                        });
                    }
                }
            });
        }
    })

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
            return res.status(400).json({
                success: false,
                message: 'No Token Found'
            })
        }
    })

    router.get('/me', (req, res) => {
        res.send(req.decoded);
    });

    router.get('/users', (req, res) => {
        User.find({}, (err, users) => {
            if(err){
                console.log('Unknown Error')
                res.json({ success: false, message: err });
            } else{
                User.findOne({ email: req.decoded.email }, (err, mainUser) => {
                    if(err){
                        console.log('Error while finding main user')
                        res.json({ success: false, message: err });
                    } else{
                        if(!mainUser){
                            console.log('Main User Not Found');
                            res.json({ success: false, message: 'Main User Not Found' });
                        } else{
                            if(!users){
                                res.json({
                                    success: false,
                                    message: 'No users Found'
                                })
                            } else{
                                res.json({
                                    success: true,
                                    users: users
                                })
                            }
                        }
                    }
                });
            }
        })
    });

    router.get('/displayUsers/:username', (req, res) => {
        if(!req.params.username){
            res.json({ success: false });
        } else{
            User.find({ "username": new RegExp(req.params.username, 'i') }).exec((err, users) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    User.findOne({ email: req.decoded.email }, (err, mainUser) => {
                        if(err){
                            console.log('Error while finding main user')
                            res.json({ success: false, message: err });
                        } else{
                            if(!mainUser){
                                console.log('Main User Not Found');
                                res.json({ success: false, message: 'Main User Not Found' });
                            } else{
                                if(!users){
                                    res.json({
                                        success: false,
                                        message: 'No users Found'
                                    })
                                } else{
                                    res.json({
                                        success: true,
                                        users: users
                                    })
                                }
                            }
                        }
                    });
                }
            });
        }
    })

    router.get('/profiledisplay/:username', (req, res) => {
        if(!req.params.username){
            res.json({ success: false });
        } else{
            User.findOne({ username: req.params.username }).exec((err, user) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    User.findOne({ email: req.decoded.email }, (err, mainUser) => {
                        if(err){
                            console.log('Error while finding main user')
                            res.json({ success: false, message: err });
                        } else{
                            if(!mainUser){
                                console.log('Main User Not Found');
                                res.json({ success: false, message: 'Main User Not Found' });
                            } else{
                                if(!user){
                                    res.json({
                                        success: false,
                                        message: 'No user Found'
                                    })
                                } else{
                                    if(mainUser.permission === 'user' && (user.permission === 'moderator' || user.permission === 'admin')){
                                        res.json({
                                            success: false,
                                            message: 'You do not have the permission to view this user'
                                        })
                                    } else if(mainUser.permission === 'moderator' && (user.permission === 'admin')){
                                        res.json({
                                            success: false,
                                            message: 'You do not have the permission to view this user'
                                        })
                                    } else{
                                        res.json({
                                            success: true,
                                            user: user
                                        });
                                    }
                                }
                            }
                        }
                    });
                }
            });
        }
    })

    router.get('/management', (req, res) => {
        User.find({}, (err, users) => {
            if(err){
                console.log('Unknown Error')
                res.json({ success: false, message: err });
            } else{
                User.findOne({ email: req.decoded.email }, (err, mainUser) => {
                    if(err){
                        console.log('Error while finding main user')
                        res.json({ success: false, message: err });
                    } else{
                        if(!mainUser){
                            console.log('Main User Not Found');
                            res.json({ success: false, message: 'Main User Not Found' });
                        } else{
                            if(mainUser.permission === 'admin' || mainUser.permission === 'moderator'){
                                if(!users){
                                    res.json({
                                        success: false,
                                        message: 'No users Found'
                                    })
                                } else{
                                    res.json({
                                        success: true,
                                        users: users,
                                        permission: mainUser.permission
                                    })
                                }
                            } else{
                                console.log('Main user is not admin');
                                res.json({ success: false, message: 'You do not have permission to view the users' });
                            }
                        }
                    }
                });
            }
        })
    });

    router.delete('/management/:email', (req, res) => {
        var deleteUser = req.params.email;
        User.findOne({ email: req.decoded.email }, (err, mainUser) => {
            if(err) throw err;

            if(!mainUser){
                res.json({
                    success: false,
                    message: 'Cannot find MainUser'
                });
            } else{
                if(mainUser.permission !== 'admin'){
                    res.json({
                        success: false,
                        message: 'You are not an admin'
                    });
                } else{
                    User.findOneAndRemove({ email: req.params.email }, (err, delUser) => {
                        if(err) throw err;

                        res.json({
                            success: true,
                            message: 'You have successfully deleted the user',
                        });
                    })
                }
            }
        })
    });

    router.get('/edit/:id', (req, res) => {
        User.findOne({ email: req.decoded.email }, (err, mainUser) => {
            if(err) throw err;

            if(!mainUser){
                res.json({
                    success: false,
                    message: 'mainUser Not Found'
                });
            } else{
                // console.log('Main User is: '+mainUser);
                if(mainUser.permission === 'admin' || mainUser.permission === 'moderator'){
                    User.findOne({ _id: req.params.id }, (err, user) => {
                        if(err) throw err;

                        if(!user){
                            res.json({
                                success: false,
                                message: 'User Not Found'
                            });
                        } else{
                            res.json({
                                success: true,
                                user: user,
                                caller: mainUser
                            });
                        }
                    });
                } else{
                    console.log('Not an admin or moderator');
                    res.json({
                        success: false,
                        message: 'You are not an Admin or Moderator'
                    });
                }
            }
        })
    });

    router.get('/ownedit/:id', (req, res) => {
        User.findOne({ email: req.decoded.email }, (err, mainUser) => {
            if(err) throw err;

            if(!mainUser){
                res.json({
                    success: false,
                    message: 'mainUser Not Found'
                });
            } else{
                res.json({
                    success: true,
                    user: mainUser
                });
            }
        })
    });

    router.put('/edit/:id', (req, res) => {
        User.findOne({ email: req.decoded.email }, (err, mainUser) => {
            if(err) throw err;

            if(!mainUser){
                res.json({
                    success: false,
                    message: 'mainUser Not Found'
                });
            } else{
                if(mainUser.permission === 'admin'){
                    User.findOne({ _id: req.params.id }, (err, user) => {
                        if(err) throw err;
            
                        if(req.body.username === null || req.body.username === undefined || req.body.username === '' || req.body.email === null || req.body.email === undefined || req.body.email === '' || req.body.permission === null || req.body.permission === undefined || req.body.permission === ''){
                            res.json({
                                success: false,
                                message: 'Make sure the user has all the fields.'
                            });
                        } else if(!user){
                            res.json({
                                success: false,
                                message: 'User with Id Not Found'
                            });
                        } else{
                            user.email = req.body.email;
                            user.username = req.body.username;
                            user.permission = req.body.permission;
                            user.save().then(() => {            
                                res.json({
                                    success: true,
                                    message: 'Updated successfully'
                                });
                            }).catch((e) => {
                                console.log('Error while editing '+e);
                                if(e.name === "MongoError"){
                                    if(e.keyPattern.username){
                                        res.json({
                                            success: false,
                                            message: 'Username already exists'
                                        });
                                    } else if(e.keyPattern.email){
                                        res.json({
                                            success: false,
                                            message: 'Email already exists'
                                        });
                                    }
                                } else if(e.name === "ValidationError"){
                                    if(e.errors.email){
                                        res.json({
                                            success: false,
                                            message: e.errors.email.message
                                        });
                                    } else if(e.errors.username){
                                        res.json({
                                            success: false,
                                            message: e.errors.username.message
                                        });
                                    }
                                } else{
                                    console.log('Here error '+e);
                                    res.json({
                                        success: false,
                                        message: e
                                    });
                                }
                                // res.send(e);
                            });
                        }
                    })
                } else if(mainUser.permission === 'moderator'){
                    User.findOne({ _id: req.params.id }, (err, user) => {
                        if(err) throw err;
            
                        if(req.body.username === null || req.body.username === undefined || req.body.username === '' || req.body.email === null || req.body.email === undefined || req.body.email === '' || req.body.permission === null || req.body.permission === undefined || req.body.permission === ''){
                            res.json({
                                success: false,
                                message: 'Make sure the user has all the fields.'
                            });
                        } else if(!user){
                            res.json({
                                success: false,
                                message: 'User with Id Not Found'
                            });
                        } else{
                            if(user.permission === 'admin'){
                                res.json({
                                    success: false,
                                    message: 'Only an admin can change the data of another admin'
                                });
                            } else{
                                user.email = req.body.email;
                                user.username = req.body.username;
                                user.permission = req.body.permission;
                                user.save().then(() => {            
                                    res.json({
                                        success: true,
                                        message: 'Updated successfully'
                                    });
                                }).catch((e) => {
                                    if(e.name === "MongoError"){
                                        if(e.keyPattern.username){
                                            res.json({
                                                success: false,
                                                message: 'Username already exists'
                                            });
                                        } else if(e.keyPattern.email){
                                            res.json({
                                                success: false,
                                                message: 'Email already exists'
                                            });
                                        }
                                    } else if(e.name === "ValidationError"){
                                        if(e.errors.email){
                                            res.json({
                                                success: false,
                                                message: e.errors.email.message
                                            });
                                        } else if(e.errors.username){
                                            res.json({
                                                success: false,
                                                message: e.errors.username.message
                                            });
                                        }
                                    } else{
                                        console.log('Here error '+e);
                                        res.json({
                                            success: false,
                                            message: e
                                        });
                                    }
                                    // res.send(e);
                                });
                            }
                        }
                    })
                } else{
                    console.log('Not an admin or moderator');
                    res.json({
                        success: false,
                        message: 'You are not an Admin or Moderator'
                    });
                }
            }
        })
    });

    router.put('/ownedit/:id', (req, res) => {
        User.findOne({ email: req.decoded.email }, (err, mainUser) => {
            if(err) throw err;

            if(!mainUser){
                res.json({
                    success: false,
                    message: 'mainUser Not Found'
                });
            } else{
                User.findOne({ _id: req.params.id }, (err, user) => {
                    if(err) throw err;
        
                    if(req.body.username === null || req.body.username === undefined || req.body.username === '' || req.body.email === null || req.body.email === undefined || req.body.email === '' || req.body.permission === null || req.body.permission === undefined || req.body.permission === ''){
                        res.json({
                            success: false,
                            message: 'Please enter all the fields.'
                        });
                    } else if(!user){
                        res.json({
                            success: false,
                            message: 'User with Id Not Found'
                        });
                    } else{
                        user.email = req.body.email;
                        user.username = req.body.username;
                        user.permission = req.body.permission;
                        user.save().then(() => {            
                            res.json({
                                success: true,
                                message: 'Updated successfully'
                            });
                        }).catch((e) => {
                            console.log('Error while editing '+e);
                            if(e.name === "MongoError"){
                                if(e.keyPattern.username){
                                    res.json({
                                        success: false,
                                        message: 'Username already exists'
                                    });
                                } else if(e.keyPattern.email){
                                    res.json({
                                        success: false,
                                        message: 'Email already exists'
                                    });
                                }
                            } else if(e.name === "ValidationError"){
                                if(e.errors.email){
                                    res.json({
                                        success: false,
                                        message: e.errors.email.message
                                    });
                                } else if(e.errors.username){
                                    res.json({
                                        success: false,
                                        message: e.errors.username.message
                                    });
                                }
                            } else{
                                console.log('Here error '+e);
                                res.json({
                                    success: false,
                                    message: e
                                });
                            }
                            // res.send(e);
                        });
                    }
                })
            }
        })
    });

    //Upload User Image Route
    router.post('/profileImg/:id', (req, res) => {
        // console.log(req.body.avatar);
        User.findOne({ _id: req.params.id }, (err, user) => {
            if(err) throw err;

            if(req.body.username === null || req.body.username === undefined || req.body.username === '' || req.body.email === null || req.body.email === undefined || req.body.email === '' || req.body.permission === null || req.body.permission === undefined || req.body.permission === ''){
                res.json({
                    success: false,
                    message: 'Please enter all the fields.'
                });
            } else if(!user){
                res.json({
                    success: false,
                    message: 'User with Id Not Found'
                });
            } else{
                user.email = req.body.email;
                user.username = req.body.username;
                user.permission = req.body.permission;
                saveAvatar(user, req.body.avatar);
                // console.log(req.body.avatar);
                user.save().then(() => {            
                    res.json({
                        success: true,
                        message: 'Profile Img Uploaded successfully'
                    });
                }).catch((e) => {
                    console.log('Error while editing '+e);
                    if(e.name === "MongoError"){
                        if(e.keyPattern.username){
                            res.json({
                                success: false,
                                message: 'Username already exists'
                            });
                        } else if(e.keyPattern.email){
                            res.json({
                                success: false,
                                message: 'Email already exists'
                            });
                        }
                    } else if(e.name === "ValidationError"){
                        if(e.errors.email){
                            res.json({
                                success: false,
                                message: e.errors.email.message
                            });
                        } else if(e.errors.username){
                            res.json({
                                success: false,
                                message: e.errors.username.message
                            });
                        }
                    } else{
                        console.log('Here error '+e);
                        res.json({
                            success: false,
                            message: e
                        });
                    }
                });
            }
        });
    });

    router.get('/profileImg/:id', (req, res) => {
        User.findOne({ _id: req.params.id }, (err, user) => {
            if(err) throw err;

            if(!user){
                res.json({
                    success: false,
                    message: 'User with Id Not Found'
                });
            } else{
                if(!user.avatarImage || !user.avatarImageType){
                    res.json({
                        success: false,
                        message: 'User doesn\'t have a profile Img'
                    });
                } else{
                    res.json({
                        success: true,
                        path: user.avatarImagePath
                    })
                }
            }
        });
    })

    function saveAvatar(user, avatarEncoded){
        if(avatarEncoded == null) return;
        // const avatar = JSON.parse(avatarEncoded);
        // console.log(avatarEncoded.type);
        if(avatarEncoded != null && imageMimeTypes.includes(avatarEncoded.type)){
            user.avatarImage = new Buffer.from(avatarEncoded.data, 'base64');
            user.avatarImageType = avatarEncoded.type;
        }
    }

    return router;
}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

let emailLengthChecker = (email) => {
    if(!email){
        return false;
    } else{
        if(email.length < 5 || email.length > 30){
            return false;
        } else{
            return true;
        }
    }
}

let validEmailChecker = (email) => {
    if(!email){
        return false;
    } else{
        const regExp = new RegExp(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/);
        return regExp.test(email);
    }
} 

let usernameLengthChecker = (username) => {
    if(!username){
        return false;
    } else{
        if(username.length < 3 || username.length > 15){
            return false;
        } else{
            return true;
        }
    }
}

let validUsernameChecker = (username) => {
    if(!username){
        return false;
    } else{
        const regExp = new RegExp(/^[a-zA-Z0-9]+$/);
        return regExp.test(username);
    }
}

let passwordLengthChecker = (password) => {
    if(!password){
        return false;
    } else{
        if(password.length < 8){
            return false;
        } else{
            return true;
        }
    }
}

let validPasswordChecker = (password) => {
    if(!password){
        return false;
    } else{
        const regExp = new RegExp(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[\d])(?=.*?[\W]).{8,}$/);
        return regExp.test(password);
    }
}

const emailValidators = [
    {
        validator: emailLengthChecker,
        message: 'Email must be atleast 5 characters long but no more than 30'
    },
    {
        validator: validEmailChecker,
        message: 'Please enter a valid email'
    }
];

const usernameValidators = [
    {
        validator: usernameLengthChecker,
        message: 'Username must be atleast 3 characters long but no more than 15'
    },
    {
        validator: validUsernameChecker,
        message: 'Username must be alphanumeric without any special characters or spaces'
    }
]

const passwordValidators = [
    {
        validator: passwordLengthChecker,
        message: 'Password must be atleast 8 characters long'
    },
    {
        validator: validPasswordChecker,
        message: 'Password must contain atleast- one lowercase, one uppercase letter, one digit and one special character'
    }
]

const userSchema = new Schema({
    email: { type: String, required: true, lowercase: true, unique: true, validate: emailValidators },
    username: { type: String, required: true, lowercase: true, unique: true, validate: usernameValidators },
    password: { type: String, required: true, validate: passwordValidators },
    active: { type: Boolean, required: true, default: false },
    temporarytoken: { type: String, required: true },
    resettoken: { type: String, required: false },
    sessions: [{
        token: {
            type: String,
            required: true
        },
        expiresAt: {
            type: Number,
            required: true
        }
    }],
    permission: { type: String, required: true, default: 'user' },
    avatarImage: { type: Buffer },
    avatarImageType: { type: String }
});

userSchema.virtual('avatarImagePath').get(function() {
    if(this.avatarImage != null && this.avatarImageType != null){
        // return `data:${this.avatarImageType};charset=utf-8;base64,${this.avatarImage.toString('base64')}`;
        return `data:${this.avatarImageType};base64,${this.avatarImage.toString('base64')}`;
    }
})

userSchema.pre('save', function(next) {
    let user = this;
    let costFactor = 10;

    if(user.isModified('password')){
        bcrypt.genSalt(costFactor, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            })
        })
    } else{
        next();
    }
});

userSchema.methods.comparePassword = function(password){
    return bcrypt.compareSync(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
    const user = this;
    return new Promise((resolve, reject) => {
        //Create the JWT and return that
        jwt.sign({ _id: user._id, username: user.username, email: user.email, permission: user.permission }, config.secret, { expiresIn: "10s" }, (err, token) => {
            if(!err){
                resolve(token);
            } else{
                reject();
            }
        });
    })
}

userSchema.methods.generateRefreshToken = function(){
    //This method simply generates a 64byte hex string - it doesn't save it to the database. saveSessionToDatabase() does that
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if(!err){
                let token = buf.toString('hex');
                return resolve(token);
            }
        })
    })
}

userSchema.methods.createSession = function(){
    let user = this;

    console.log('User is: '+user);

    return user.generateRefreshToken().then((refreshToken) => {
        return saveSessionToDatabase(user, refreshToken);
    }).then((refreshToken) => {
        //saved to database successfully
        //now return the refresh token
        return refreshToken;
    }).catch((e) => {
        return Promise.reject('Failed to save session to database.\n' + e);
    });
}

userSchema.statics.findByIdAndToken = function(_id, token){
    const User = this;
    return User.findOne({
        _id,
        'sessions.token': token
    });
}

userSchema.statics.hasRefreshTokenExpired = (expiresAt) => {
    let secondsSinceEpoch = Date.now() / 1000;
    if(expiresAt > secondsSinceEpoch){
        return false;
    } else{
        return true;
    }
}

//Helper methods
let saveSessionToDatabase = (user, refreshToken) => {
    //save session to database (Session = refreshtoken + expiresAt)
    return new Promise((resolve, reject) => {
        let expiresAt = generateRefreshTokenExpiryTime();

        // user.sessions = [];
        if(user.sessions.length >= 1){
            user.sessions.shift();
        }

        user.sessions.push({ 'token': refreshToken, expiresAt });
        
        user.save().then(() => {
            //saved session successfully
            return resolve(refreshToken);
        }).catch((e) => {
            reject(e);
        })
    })
}

let generateRefreshTokenExpiryTime = () => {
    let daysUntilExpire = "10";
    // let secondsUntilExpire = ((daysUntilExpire * 24) *60 ) * 60;
    let secondsUntilExpire = 15;
    return ((Date.now() / 1000) * secondsUntilExpire);
}

module.exports = mongoose.model('User', userSchema);
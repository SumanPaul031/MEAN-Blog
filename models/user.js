const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
        if(password.length < 8 || password.length > 15){
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
        const regExp = new RegExp(/^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[\d])(?=.*?[\W]).{8,15}$/);
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
        message: 'Password must be atleast 8 characters long but no more than 15'
    },
    {
        validator: validPasswordChecker,
        message: 'Password must contain atleast- one lowercase, one uppercase letter, one digit and one special character'
    }
]

const userSchema = new Schema({
    email: { type: String, required: true, lowercase: true, unique: true, validate: emailValidators },
    username: { type: String, required: true, lowercase: true, unique: true, validate: usernameValidators },
    password: { type: String, required: true, validate: passwordValidators }
});

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

module.exports = mongoose.model('User', userSchema);
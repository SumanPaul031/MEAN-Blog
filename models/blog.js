const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

let titleLengthChecker = (title) => {
    if(!title){
        return false;
    } else{
        if(title.length < 5 || title.length > 50){
            return false;
        } else{
            return true;
        }
    }
}

let validTitleChecker = (title) => {
    if(!title){
        return false;
    } else{
        const regExp = new RegExp(/^[a-zA-Z0-9]+$/);
        return regExp.test(title);
    }
} 

const titleValidators = [
    {
        validator: titleLengthChecker,
        message: 'Title must be atleast 5 characters long but no more than 50'
    },
    {
        validator: validTitleChecker,
        message: 'Please enter a valid title'
    }
];

let bodyLengthChecker = (body) => {
    if(!body){
        return false;
    } else{
        if(body.length < 5 || body.length > 500){
            return false;
        } else{
            return true;
        }
    }
}

const bodyValidators = [
    {
        validator: bodyLengthChecker,
        message: 'Body must be atleast 5 characters long but no more than 500'
    }
]

let commentLengthChecker = (comment) => {
    if(!comment[0]){
        return false;
    } else{
        if(comment[0].length < 1 || comment[0].length > 200){
            return false;
        } else{
            return true;
        }
    }
}

const commentValidators = [
    // First comment validator
    {
      validator: commentLengthChecker,
      message: 'Comments may not exceed 200 characters.'
    }
];

const blogSchema = new Schema({
    title: { type: String, required: true, validate: titleValidators },
    body: { type: String, required: true, validate: bodyValidators },
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now() },
    likes: { type: Number, default: 0 },
    likedBy: { type: Array },
    dislikes: { type: Number, default: 0 },
    dislikedBy: { type: Array },
    comments: [
        {
            comment: { type: String, validate: commentValidators },
            commentator: { type: mongoose.Schema.Types.Object, ref: 'User' },
            commentedAt: { type: Date, default: Date.now() }
        }
    ]
});

module.exports = mongoose.model('Blog', blogSchema);
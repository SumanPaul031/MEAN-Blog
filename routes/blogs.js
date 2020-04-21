const User = require('../models/user');
const Blog = require('../models/blog');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const config = require('../config/database');
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

module.exports = (router) => {

    router.post('/newBlog', (req, res) => {
        if(!req.body.title){
            res.json({
                success: false,
                message: 'Blog title is required'
            });
        } else{
            if(!req.body.body){
                res.json({
                    success: false,
                    message: 'Blog body is required'
                });
            } else{
                if(!req.body.createdBy){
                    res.json({
                        success: false,
                        message: 'Please specify who created the Blog'
                    });
                } else{
                    const blog = new Blog({
                        title: req.body.title,
                        body: req.body.body,
                        createdBy: req.body.createdBy,
                        createdAt: Date.now()
                    });

                    blog.save((err) => {
                        if(err){
                            if(err.name === 'ValidationError'){
                                if(err.errors.title){
                                    res.json({ success: false, message: err.errors.title.message });
                                } else if(err.errors.body){
                                    res.json({ success: false, message: err.errors.body.message });
                                }
                            } else{
                                res.json({ success: false, message: err });
                            }
                        } else{
                            res.json({ success: true, message: 'Blog Posted Successfully' });
                        }
                    });
                }
            }
        }
    });

    router.get('/allBlogs', (req, res) => {
        Blog.find({}, (err, blogs) => {
            if(err){
                res.json({ success: false, message: err });
            } else{
                if(!blogs){
                    res.json({ success: false, message: 'No Blogs Available' });
                } else{
                    res.json({ success: true, blogs: blogs });
                }
            }
        }).sort({ 'createdAt': -1 });
    });

    router.get('/editBlog/:id', (req, res) => {
        Blog.findOne({ _id: req.params.id }, (err, blog) => {
            if(err){
                res.json({ success: false, message: err });
            } else{
                if(!blog){
                    res.json({ success: false, message: 'No blog found with that id' });
                } else{
                    User.findOne({ _id: req.decoded._id }, (err, user) => {
                        if (err) {
                            res.json({ success: false, message: err }); // Return error
                        } else{
                            if (!user) {
                                res.json({ success: false, message: 'Unable to authenticate user' }); // Return error message
                            } else{
                                if(user.username !== blog.createdBy){
                                    res.json({ success: false, message: 'You are not authorized to edit this blog.' });
                                } else{
                                    res.json({
                                        success: true,
                                        blog: blog
                                    });
                                }
                            }
                        }
                    })
                }
            }
        })
    });

    router.put('/editBlog/:id', (req, res) => {
        Blog.findOne({ _id: req.params.id }, (err, blog) => {
            if(err){
                res.json({ success: false, message: err });
            } else{
                if(req.body.title === null || req.body.title === undefined || req.body.title === '' || req.body.body === null || req.body.body === undefined || req.body.body === '' || req.body.createdBy === null || req.body.createdBy === undefined || req.body.createdBy === ''){
                    res.json({
                        success: false,
                        message: 'Please enter all the fields.'
                    });
                } else{
                    if(!blog){
                        res.json({ success: false, message: 'No blog found with that id' });
                    } else{
                        User.findOne({ _id: req.decoded._id }, (err, user) => {
                            if (err) {
                                res.json({ success: false, message: err });
                            } else{
                                if (!user) {
                                    res.json({ success: false, message: 'Unable to authenticate user.' });
                                } else{
                                    if (user.username !== blog.createdBy) {
                                        res.json({ success: false, message: 'You are not authorized to edit this blog post.' });
                                    } else{
                                        blog.title = req.body.title;
                                        blog.body = req.body.body;
                                        blog.createdBy = req.body.createdBy;
                                        blog.createdAt = Date.now();
                                        blog.save((err) => {
                                            if(err){
                                                if(err.name === 'ValidationError'){
                                                    if(err.errors.title){
                                                        res.json({ success: false, message: err.errors.title.message });
                                                    } else if(err.errors.body){
                                                        res.json({ success: false, message: err.errors.body.message });
                                                    }
                                                } else{
                                                    res.json({ success: false, message: err });
                                                }
                                            } else{
                                                res.json({ success: true, message: 'Blog Updated Successfully' });
                                            }
                                        });
                                    }
                                }
                            }
                        })
                    }
                }
            }
        });
    });

    router.delete('/editBlog/:id', (req, res) => {
        Blog.findOne({ _id: req.params.id }, (err, blog) => {
            if(err){
                res.json({ success: false, message: err });
            } else{
                if(!blog){
                    res.json({ success: false, message: 'No blog found with that id' });
                } else{
                    User.findOne({ _id: req.decoded._id }, (err, user) => {
                        if (err) {
                            res.json({ success: false, message: err });
                        } else{
                            if (!user) {
                                res.json({ success: false, message: 'Unable to authenticate user.' });
                            } else{
                                if (user.username !== blog.createdBy) {
                                    res.json({ success: false, message: 'You are not authorized to delete this blog post.' });
                                } else{
                                    blog.remove((err) => {
                                        if (err) {
                                          res.json({ success: false, message: err });
                                        } else {
                                          res.json({ success: true, message: 'Blog deleted!' });
                                        }
                                    });
                                }
                            }
                        }
                    })
                }
            }
        });
    });

    return router;
}
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

    router.put('/likeBlog', (req, res) => {
        if(!req.body.id){
            res.json({ success: false, message: 'No id was provided' });
        } else{
            Blog.findOne({ _id: req.body.id }, (err, blog) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    if(!blog){
                        res.json({ success: false, message: 'The blog was not found' });
                    } else{
                        User.findOne({ _id: req.decoded._id }, (err, user) => {
                            if(err){
                                res.json({ success: false, message: err });
                            } else{
                                if (!user) {
                                    res.json({ success: false, message: 'Could not authenticate user.' });
                                } else{
                                    if (user.username === blog.createdBy) {
                                        res.json({ success: false, messagse: 'Cannot like your own post.' });
                                    } else{
                                        if (blog.likedBy.includes(user.username)) {
                                            res.json({ success: false, message: 'You already liked this post.' });
                                        } else{
                                            if(blog.dislikedBy.includes(user.username)){
                                                blog.dislikes--;
                                                const arrayIndex = blog.dislikedBy.indexOf(user.username);
                                                blog.dislikedBy.splice(arrayIndex, 1);
                                                blog.likes++;
                                                blog.likedBy.push(user.username);
                                                blog.save((err) => {
                                                    if (err) {
                                                      res.json({ success: false, message: err });
                                                    } else {
                                                      res.json({ success: true, message: 'Blog liked!' });
                                                    }
                                                });
                                            } else{
                                                blog.likes++;
                                                blog.likedBy.push(user.username);
                                                blog.save((err) => {
                                                    if (err) {
                                                      res.json({ success: false, message: err });
                                                    } else {
                                                      res.json({ success: true, message: 'Blog liked!' });
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
            })
        }
    });

    router.put('/dislikeBlog', (req, res) => {
        if(!req.body.id){
            res.json({ success: false, message: 'No id was provided' });
        } else{
            Blog.findOne({ _id: req.body.id }, (err, blog) => {
                if(err){
                    res.json({ success: false, message: err });
                } else{
                    if(!blog){
                        res.json({ success: false, message: 'The blog was not found' });
                    } else{
                        User.findOne({ _id: req.decoded._id }, (err, user) => {
                            if(err){
                                res.json({ success: false, message: err });
                            } else{
                                if (!user) {
                                    res.json({ success: false, message: 'Could not authenticate user.' });
                                } else{
                                    if (user.username === blog.createdBy) {
                                        res.json({ success: false, messagse: 'Cannot dislike your own post.' });
                                    } else{
                                        if (blog.dislikedBy.includes(user.username)) {
                                            res.json({ success: false, message: 'You already disliked this post.' });
                                        } else{
                                            if(blog.likedBy.includes(user.username)){
                                                blog.likes--;
                                                const arrayIndex = blog.likedBy.indexOf(user.username);
                                                blog.likedBy.splice(arrayIndex, 1);
                                                blog.dislikes++;
                                                blog.dislikedBy.push(user.username);
                                                blog.save((err) => {
                                                    if (err) {
                                                      res.json({ success: false, message: err });
                                                    } else {
                                                      res.json({ success: true, message: 'Blog disliked!' });
                                                    }
                                                });
                                            } else{
                                                blog.dislikes++;
                                                blog.dislikedBy.push(user.username);
                                                blog.save((err) => {
                                                    if (err) {
                                                      res.json({ success: false, message: err });
                                                    } else {
                                                      res.json({ success: true, message: 'Blog disliked!' });
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
            })
        }
    });

    router.post('/comment', (req, res) => {
        if (!req.body.comment) {
            res.json({ success: false, message: 'No comment provided' });
        } else{
            if (!req.body.id) {
                res.json({ success: false, message: 'No id was provided' });
            } else{
                Blog.findOne({ _id: req.body.id }, (err, blog) => {
                    if(err){
                        res.json({ success: false, message: err });
                    } else{
                        if(!blog){
                            res.json({ success: false, message: 'The blog was not found' });
                        } else{
                            User.findOne({ _id: req.decoded._id }, (err, user) => {
                                if(err){
                                    res.json({ success: false, message: err });
                                } else{
                                    if (!user) {
                                        res.json({ success: false, message: 'Could not authenticate user.' });
                                    } else{
                                        if (user.username === blog.createdBy) {
                                            res.json({ success: false, messagse: 'Cannot comment on your own post.' });
                                        } else{
                                            blog.comments.push({
                                                comment: req.body.comment,
                                                commentator: user,
                                                commentedAt: Date.now()
                                            });
                                            
                                            blog.save((err) => {
                                                if (err) {
                                                  res.json({ success: false, message: err });
                                                } else {
                                                  res.json({ success: true, message: 'Comment saved' });
                                                }
                                            })
                                        }
                                    }
                                }
                            })
                        }
                    }
                })
            }
        }
    });

    router.get('/blog/:id/comment/:commentId', (req, res) => {
        if (!req.params.id) {
            res.json({ success: false, message: 'No id was provided' });
        } else{
            if(!req.params.commentId){
                res.json({ success: false, message: 'No comment id was provided' });
            } else{
                Blog.findOne({ _id: req.params.id }, (err, blog) => {
                    if(err){
                        res.json({ success: false, message: err });
                    } else{
                        if(!blog){
                            res.json({ success: false, message: 'The blog was not found' });
                        } else{
                            User.findOne({ _id: req.decoded._id }, (err, user) => {
                                if(err){
                                    res.json({ success: false, message: err });
                                } else{
                                    if (!user) {
                                        res.json({ success: false, message: 'Could not authenticate user.' });
                                    } else{
                                        var index = blog.comments.findIndex(i => i._id == req.params.commentId);

                                        if(blog.comments[index]){
                                            if(String(user._id) !== String(blog.comments[index].commentator._id)){
                                                res.json({ success: false, message: 'Cannot edit other\'s comments' });
                                            } else{
                                                res.json({ success: true, comment: blog.comments[index], blog: blog });
                                            }
                                        } else{
                                            res.json({ success: false, message: 'Some Technical error' });
                                        }
                                    }
                                }
                            })
                        }
                    }
                })
            }
        }
    });

    router.put('/comment', (req, res) => {
        if (!req.body.comment) {
            res.json({ success: false, message: 'No comment provided' });
        } else{
            if (!req.body.id) {
                res.json({ success: false, message: 'No id was provided' });
            } else{
                Blog.findOne({ _id: req.body.id }, (err, blog) => {
                    if(err){
                        res.json({ success: false, message: err });
                    } else{
                        if(!blog){
                            res.json({ success: false, message: 'The blog was not found' });
                        } else{
                            User.findOne({ _id: req.decoded._id }, (err, user) => {
                                if(err){
                                    res.json({ success: false, message: err });
                                } else{
                                    if (!user) {
                                        res.json({ success: false, message: 'Could not authenticate user.' });
                                    } else{
                                        var index = blog.comments.findIndex(i => i._id == req.body.commentId);

                                        if(String(user._id) !== String(blog.comments[index].commentator._id)){
                                            res.json({ success: false, message: 'Cannot edit other\'s comments' });
                                        } else{
                                            // res.json({ success: true, comment: blog.comments[index], blog: blog });
                                            blog.comments.splice(index, 1);
                                            blog.comments.push({
                                                comment: req.body.comment,
                                                commentator: user,
                                                commentedAt: Date.now()
                                            });

                                            blog.save((err) => {
                                                if (err) {
                                                    res.json({ success: false, message: err });
                                                } else {
                                                    res.json({ success: true, message: 'Comment edited' });
                                                }
                                            });
                                        }
                                    }
                                }
                            })
                        }
                    }
                })
            }
        }
    });

    router.delete('/blog/:id/comment/:commentId', (req, res) => {
        if (!req.params.id) {
            res.json({ success: false, message: 'No id was provided' });
        } else{
            if(!req.params.commentId){
                res.json({ success: false, message: 'No comment id was provided' });
            } else{
                Blog.findOne({ _id: req.params.id }, (err, blog) => {
                    if(err){
                        res.json({ success: false, message: err });
                    } else{
                        if(!blog){
                            res.json({ success: false, message: 'The blog was not found' });
                        } else{
                            User.findOne({ _id: req.decoded._id }, (err, user) => {
                                if(err){
                                    res.json({ success: false, message: err });
                                } else{
                                    if (!user) {
                                        res.json({ success: false, message: 'Could not authenticate user.' });
                                    } else{
                                        var index = blog.comments.findIndex(i => i._id == req.params.commentId);

                                        if(String(user._id) !== String(blog.comments[index].commentator._id)){
                                            res.json({ success: false, message: 'Cannot delete other\'s comments' });
                                        } else{
                                            blog.comments.splice(index, 1);

                                            blog.save((err) => {
                                                if (err) {
                                                    res.json({ success: false, message: err });
                                                } else {
                                                    res.json({ success: true, message: 'Comment deleted' });
                                                }
                                            });
                                        }
                                    }
                                }
                            })
                        }
                    }
                })
            }
        }
    });

    return router;
}
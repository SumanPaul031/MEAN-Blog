const crypto = require('crypto').randomBytes(256).toString('hex');

module.exports = {
    uri: 'mongodb+srv://sumanpaul0209:R%40scal99toku49@mean-blog-eygqk.mongodb.net/test?retryWrites=true&w=majority',
    secret: crypto,
    db: 'MEAN-blog'
}
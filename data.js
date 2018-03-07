//随机插入文章数据

const loremipsum = require('lorem-ipsum');
const slug = require('slug');
const config = require('./config/config');
const glob = require('glob');
const mongoose = require('mongoose');

mongoose.connect(config.db,{useMongoClient:true});
const db = mongoose.connection;
db.on('error', () => {
  throw new Error('unable to connect to database at ' + config.db);
});

const models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model);
});


const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Category = mongoose.model('Category');

User.findOne(function(err, user) {
	if(err) {
		return console.log('cannot find user');
	}

	Category.find(function(err, categories) {
		if(err) {
			return console.log('cannot find categories');
		}

		categories.forEach(function(category) {
			for(var i=0; i< 35; i++) {
				const title = loremipsum({ count: 1, units: 'sentence'});
				const post = new Post({
					title: title,
					slug: slug(title),
					content: loremipsum({ count: 1, units: 'sentence'}),
				  category: category,
				  author: user,
				  published: true,
				  meta: { favourate: 0 },
				  comments: [ ],
				  created: new Date
				});

				post.save(function(err, post) {
					console.log('saved post:', post.slug);
				});
			}
		});
	});
});

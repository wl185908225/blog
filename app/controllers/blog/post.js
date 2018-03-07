const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = mongoose.model('Post');
const Category = mongoose.model('Category');

module.exports = (app) => {
  app.use('/posts', router);
};

router.get('/', (req, res, next) => {
   //condition
  var conditions = {published: true};
  var keyword = "";
  if(req.query.keyword) {
    keyword = req.query.keyword.trim();
    conditions.title = new RegExp(keyword, 'i');
  }

  Post.find(conditions)
    .sort('-created')
    .populate('author')
    .populate('category')
    .exec((err, posts) => {
      //return res.json(posts);
      if (err) return next(err);

      var pageNum = Math.abs(parseInt(req.query.page || 1, 10));
      var pageSize = 10;
      var totalCount = posts.length;
      var pageCount = Math.ceil(totalCount / pageSize);


      console.log("pageCount:" + pageCount);
      console.log("pageNum:" + pageNum);
      if(pageNum > pageCount) {
        pageNum = pageCount;
      }

      res.render('blog/index', {
        posts: posts.slice((pageNum - 1) * pageSize, pageNum * pageSize),
        pageNum: pageNum,
        pageCount: pageCount,
        keyword: keyword,
        pretty: true
      });
    });
});


router.get('/category/:name', (req, res, next) => {
  Category.findOne({ name: req.params.name}).exec(function(err, category) {
    if(err) {
      return next(err);
    }

    Post.find({ category: category, published: true})
        .sort('created')
        .populate('category')
        .populate('author')
        .exec(function(err, posts) {
          if(err) {
            return next(err);
          }

          res.render('blog/category', {
            posts: posts,
            category: category,
            pretty: true
          });
    });
  });
});

router.get('/view/:id', (req, res, next) => {
  if(!req.params.id) {
    return next(new Error('no post id provided'));
  }

  var conditions = {};
  try {
    conditions._id = mongoose.Types.ObjectId(req.params.id);
  } catch(err) {
    conditions.slug = req.params.id;
  }

  Post.findOne(conditions)
      .populate('category')
      .populate('author')
      .exec(function(err, post) {
        if(err) {
          return next(err);
        }

        res.render('blog/view', {
          post: post,
          pretty: true
        });
  });
});

router.get('/favourate/:id', (req, res, next) => {
  if(!req.params.id) {
    return next(new Error('no post id provided'));
  }

  const conditions = {};
  try {
    conditions._id = mongoose.Types.ObjectId(req.params.id);
  } catch(err) {
    conditions.slug = req.params.id;
  }

  Post.findOne(conditions)
      .populate('category')
      .populate('author')
      .exec(function(err, post) {
        if(err) {
          return next(err);
        }

        post.meta.favourate = post.meta.favourate ? post.meta.favourate + 1 : 1;
        post.markModified('meta');
        post.save(function(err) {
          //此处不应该在当前页，刷新页面即用户点赞，应跳回文章详情页
          // res.render('blog/view', { 
          //   post: post,
          //   pretty: true
          // });

          res.redirect('/posts/view/' + post.slug);
        }); 
  });
});

router.post('/comment/:id', (req, res, next) => {
  if(!req.body.email) {
    return next(new Error('no email provided for commenter'));
  }

  if(!req.body.content) {
    return next(new Error('no content provided for commenter'));
  }

  var conditions = {};
  try {
    conditions._id = mongoose.Types.ObjectId(req.params.id);
  } catch(err) {
    conditions.slug = req.params.id;
  }

  Post.findOne(conditions).exec(function(err, post) {
    if(err) {
      return next(err);
    }

    var comment = { 
      email: req.body.email, 
      content: req.body.content,
      created: new Date() 
    };

    post.comments.unshift(comment);
    post.markModified('comments');

    post.save(function(err, post) {

      req.flash('info', '评论添加成功');
      res.redirect('/posts/view/' + post.slug);
    });
    // res.render('blog/view', {
    //   post: post,
    //   pretty: true
    // });
  });
});


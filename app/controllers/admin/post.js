const express = require('express');
const router = express.Router();
const slug = require('slug');
const pinyin = require('pinyin');
const mongoose = require('mongoose');
const auth = require('./user');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Category = mongoose.model('Category');

module.exports = (app) => {
  app.use('/admin/posts', router);
};

router.get('/', auth.requireLogin,(req, res, next) => {

  //sort
  var sortby = req.query.sortby ? req.query.sortby : 'title';
  var sortdir = req.query.sortdir ? req.query.sortdir : 'desc';

  if(['title', 'category', 'author', 'created', 'published'].indexOf(sortby) === -1) {
    sortby = 'title';   //没找到字段，默认created
  }

  if(['desc', 'asc'].indexOf(sortdir) === -1) {
    sortdir = 'desc';
  }

  var sortObj = {};
  sortObj[sortby] = sortdir;

  //condition
  var conditions = {};
  if(req.query.category) {
    conditions.category = req.query.category.trim();
  }
  if(req.query.author) {
    conditions.author = req.query.author.trim();
  }
  if(req.query.keyword) {
    conditions.title = new RegExp(req.query.keyword.trim(), 'i');
    //conditions.content = new RegExp(req.query.keyword.trim(), 'i');
  }

  User.find({}, function(err, authors){
    if(err) return next(err);

    Post.find(conditions)
      .sort(sortObj)
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

        res.render('admin/post/index', {
          posts: posts.slice((pageNum - 1) * pageSize, pageNum * pageSize),
          authors: authors,
          pageNum: pageNum,
          pageCount: pageCount,
          sortdir:sortdir,
          sortby:sortby,
          filter: {
            category: req.query.category || "",
            author: req.query.author || "",
            keyword: req.query.keyword || ""
          },
          pretty: true
        });
      });
    });
});

router.get('/add', auth.requireLogin,(req, res, next) => {
  res.render('admin/post/add', {
    action: "/admin/posts/add",
    post: {
      category: { _id: ""},
      author: { _id: ""}
    },
    pretty: true
  });
});

router.post('/add', auth.requireLogin,(req, res, next) => {

  req.checkBody('title', '文章标题不能为空').notEmpty();
  req.checkBody('category', '必须指定文章分类').notEmpty();
  req.checkBody('author', '必须指定文章作者').notEmpty();
  req.checkBody('content', '文章内容至少写几句').notEmpty(); //express-validator 校验

  var errors = req.validationErrors();
  if (errors) {
    //res.jsonp(errors);
    return res.render('admin/post/add', {
      errors: errors,
      title: req.body.title,
      category: req.body.category,
      author: req.body.author,
      content: req.body.content
    });
  }

  var title = req.body.title.trim();
  var category = req.body.category.trim();
  var author = req.body.author.trim();
  var content = req.body.content;

  User.findOne({_id: author},function(err, author){
    if(err) {
      return next(err);
    }

    var py = pinyin(title,{
                    style: pinyin.STYLE_NORMAL, // 设置拼音风格 
                    heteronym: false
                  }).map(function(item) {
                    return item[0];
                  }).join(' ');
    console.log(py);

    var post = new Post({
      title: title,
      slug: slug(py),
      category: category,
      content: content,
      author:author,
      published: true,
      meta: { favourate: 0 },
      comments: [],
      created: new Date(),
    });

    post.save(function(err, post) {
      if(err) {
        req.flash('error', '文章保存失败');
        res.redirect('/admin/posts/add');
      } else {
        req.flash('info', '文章保存成功');
        res.redirect('/admin/posts');
      }
    });
  });
});


//此处用中间件getPostById, 之后getPostById中next()继续下面函数
router.get('/edit/:id', auth.requireLogin, getPostById, (req, res, next) => {
  var post = req.post;
  res.render('admin/post/add', {
    post: post,
    action: "/admin/posts/edit/" + post._id,
    pretty: true
  });
});

router.post('/edit/:id', auth.requireLogin, getPostById, (req, res, next) => {
  var post = req.post;
  var title = req.body.title.trim();
  var author = req.body.author.trim();
  var category = req.body.category.trim();
  var content = req.body.content;

  var py = pinyin(title,{
        style: pinyin.STYLE_NORMAL, // 设置拼音风格 
        heteronym: false
      }).map(function(item) {
        return item[0];
      }).join(' ');
  console.log(py);


  post.title = title;
  post.category = category;
  post.author = author;
  post.content = content;
  post.slug = slug(py);

  post.save(function(err, post) {
    if(err) {
      req.flash('error', '文章编辑失败');
      res.redirect('/admin/posts/edit/' + post._id);
    } else {
      req.flash('info', '文章编辑成功');
      res.redirect('/admin/posts');
    }
  });
});

router.get('/delete/:id', auth.requireLogin, (req, res, next) => {
  if(!req.params.id) {
    return next(new Error('no post id provided'));
  }

  Post.remove({ _id: req.params.id}).exec(function(err, rowsRemoved) {
    if(err) {
      return next(err);
    }

    if(rowsRemoved) {
      req.flash('success', '文章删除成功');
    } else {
      req.flash('error', '文章删除失败');
    }

    res.redirect('/admin/posts');
  })
});


function getPostById(req, res, next) {
   if(!req.params.id) {
    return next(new Error('no post id provided'));
  }

  Post.findOne({_id: req.params.id})
      .populate('category')
      .populate('author')
      .exec(function(err, post) {
        if(err) {
          return next(err);
        }

        if(!post) {
          return next(new Error('post not found:' , req.params._id));
        }

        req.post = post;
        next();
    });
}


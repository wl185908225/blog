const express = require('express');
const router = express.Router();
const slug = require('slug');
const pinyin = require('pinyin');
const mongoose = require('mongoose');
const auth = require('./user');

const Post = mongoose.model('Post');
const Category = mongoose.model('Category');

module.exports = (app) => {
  app.use('/admin/categories', router);
};

router.get('/', auth.requireLogin,(req, res, next) => {
  res.render('admin/category/index', {
    pretty: true
  });
});

router.get('/add', auth.requireLogin,(req, res, next) => {
  res.render('admin/category/add', {
  	action: "/admin/categories/add",
  	category: { _id: ''},
    pretty: true
  });
});

router.post('/add', auth.requireLogin, (req, res, next) => {
	req.checkBody('name', '分类名称不能为空').notEmpty(); //express-validator 校验

  var errors = req.validationErrors();
  if (errors) {
    //res.jsonp(errors);
    return res.render('admin/category/add', {
      errors: errors,
      title: req.body.title,
      category: req.body.category,
      content: req.body.content
    });
  }

  var name = req.body.name.trim();

    var py = pinyin(name,{
                    style: pinyin.STYLE_NORMAL, // 设置拼音风格 
                    heteronym: false
                  }).map(function(item) {
                    return item[0];
                  }).join(' ');
    console.log(py);

    var category = new Category({
      name: name,
      slug: slug(py),
      created: new Date(),
    });

    category.save(function(err, post) {
      if(err) {
        req.flash('error', '分类保存失败');
        res.redirect('/admin/categories/add');
      } else {
        req.flash('info', '分类保存成功');
        res.redirect('/admin/categories');
      }
    });
});


//此处用中间件getCategoryById, 之后getCategoryById中next()继续下面函数
router.get('/edit/:id', auth.requireLogin, getCategoryById, (req, res, next) => {
	var category = req.category;
  res.render('admin/category/add', {
    category: category,
    action: "/admin/categories/edit/" + category._id,
    pretty: true
  });
});

router.post('/edit/:id', auth.requireLogin, getCategoryById, (req, res, next) => {
	var category = req.category;
  var name = req.body.name.trim();
  var py = pinyin(name,{
        style: pinyin.STYLE_NORMAL, // 设置拼音风格 
        heteronym: false
      }).map(function(item) {
        return item[0];
      }).join(' ');
  console.log(py);


  category.name = name;
  category.slug = slug(py);

  category.save(function(err, category) {
    if(err) {
      req.flash('error', '分类编辑失败');
      res.redirect('/admin/categories/edit/' + post._id);
    } else {
      req.flash('info', '分类编辑成功');
      res.redirect('/admin/categories');
    }
  });
});

router.get('/delete/:id', auth.requireLogin, getCategoryById, (req, res, next) => {
	if(!req.params.id) {
    return next(new Error('no category id provided'));
  }

  req.category.remove(function(err, rowsRemoved) {
    if(err) {
      return next(err);
    }

    if(rowsRemoved) {

    	//1、硬删除：分类删除成功后，还需删除分类下的所有文章
    	//2、软删除：标记分类下的文章标记为删除
      req.flash('success', '分类删除成功');
    } else {
      req.flash('error', '分类删除失败');
    }

    res.redirect('/admin/categories');
  });
});


function getCategoryById(req, res, next) {
   if(!req.params.id) {
    return next(new Error('no category id provided'));
  }

  Category.findOne({_id: req.params.id})
      .exec(function(err, category) {
        if(err) {
          return next(err);
        }

        if(!category) {
          return next(new Error('category not found:' , req.params._id));
        }

        req.category = category;
        next();
    });
}


const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require("passport");
const md5 = require('md5');
const Post = mongoose.model('Post');
const User = mongoose.model('User');

module.exports = (app) => {
  app.use('/admin/users', router);
};


//验证登陆中间件
module.exports.requireLogin = function(req, res, next) {
  if(req.user) {
    next();
  } else {
    req.flash("error", "只有登录用户才能访问");
    res.redirect("/admin/users/login");
  }
};

/*后台登陆*/
router.get('/login', requireLogin,(req, res, next) => {
  console.log(req.user);
  if(req.user) {
    res.redirect('/admin/posts');
  } else {
    res.render('admin/user/login', {
      pretty:true
    });
  }
  
});


/*后台登陆提交*/
router.post('/login', passport.authenticate('local', { 
  failureRedirect: '/admin/users/login',
  failureFlash: '用户名或密码错误' 
  }), (req, res, next) => {
  console.log("user login success", req.body);
  res.redirect("/admin/posts");
});

/*后台注册*/
router.get('/register', (req, res, next) => {
  res.render('admin/user/register', {
    pretty:true
  });
});

/*后台注册提交*/
router.post('/register', (req, res, next) => {
  req.checkBody('email', '作者邮箱不能为空').notEmpty();
  req.checkBody('password', '账号密码不能为空').notEmpty();
  req.checkBody('confirmPassword', '两次密码不匹配').notEmpty().equals(req.body.password);  //express-validator 校验


  var errors = req.validationErrors();
  if (errors) {
    //res.jsonp(errors);
    return res.render('admin/user/register', {
      errors: errors,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword
    });
  }
  

  var user = new User({
    name: req.body.email.split('@').shift(),
    email: req.body.email,
    password: md5(req.body.password),
    created: new Date()
  });

  user.save(function(err, post) {
    if(err) {
      console.log("admin/user/register error:", err);
      req.flash('error', '用户注册失败');
      return res.render('admin/user/register');
    } else {
      req.flash('info', '用户注册成功');
      res.redirect('/admin/users/login');
    }
  });
});


/*后台注销*/
router.get('/logout', (req, res, next) => {
  req.logout();
  res.redirect('/');
});

router.get('/list', (req, res, next) => {
  User.find({}, function(err, authors){
    if(err) return next(err);
    var pageNum = Math.abs(parseInt(req.query.page || 1, 10));
    var pageSize = 10;
    var totalCount = authors.length;
    var pageCount = Math.ceil(totalCount / pageSize);

    console.log("pageCount:" + pageCount);
    console.log("pageNum:" + pageNum);
    if(pageNum > pageCount) {
      pageNum = pageCount;
    }

    res.render('admin/user/index', {
      authors: authors.slice((pageNum - 1) * pageSize, pageNum * pageSize),
      pageNum: pageNum,
      pageCount: pageCount,
      pretty: true
    });
	});
});


router.get('/add', (req, res, next) => {
  res.render('admin/user/add', {
    action: "/admin/users/add",
    author: { _id: ""},
    pretty: true
  });
});

router.post('/add', (req, res, next) => {
  req.checkBody('name', '作者姓名不能为空').notEmpty();
  req.checkBody('email', '作者邮箱不能为空').notEmpty();
  req.checkBody('password', '账号密码不能为空').notEmpty(); //express-validator 校验

  var errors = req.validationErrors();
  if (errors) {
    //res.jsonp(errors);
    return res.render('admin/users/add', {
      errors: errors,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    });
  }

  var name = req.body.name.trim();
  var email = req.body.email.trim();
  var password = req.body.password.trim();

  User.findOne({name: name},function(err, author){
    if(author) {
      req.flash('error', name + '名称已被占用，请重新输入');
    }

    var user = new User({
      name: name,
      email: email,
      password: md5(password),
      created: new Date(),
    });

    user.save(function(err, post) {
      if(err) {
        req.flash('error', '作者保存失败');
        res.redirect('/admin/users/add');
      } else {
        req.flash('info', '作者保存成功');
        res.redirect('/admin/users/list');
      }
    });
  });
});


// //此处用中间件getUserById, 之后getUserById中next()继续下面函数
router.get('/edit/:id', getUserById, (req, res, next) => {
  var user = req.user;
  res.render('admin/user/add', {
    author: user,
    action: "/admin/users/edit/" + user._id,
    pretty: true
  });
});

router.post('/edit/:id', getUserById, (req, res, next) => {
  var user = req.user;
  req.checkBody('name', '作者姓名不能为空').notEmpty();
  req.checkBody('email', '作者邮箱不能为空').notEmpty();
  req.checkBody('password', '账号密码不能为空').notEmpty(); //express-validator 校验

  var errors = req.validationErrors();
  if (errors) {
    //res.jsonp(errors);
    return res.render('admin/users/add', {
      errors: errors,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    });
  }

  var name = req.body.name.trim();
  var email = req.body.email.trim();
  var password = req.body.password.trim();

  user.name = name;
  user.email = email;
  user.password = md5(password);

  user.save(function(err, post) {
    if(err) {
      req.flash('error', '作者保存失败');
      res.redirect('/admin/users/add');
    } else {
      req.flash('info', '作者保存成功');
      res.redirect('/admin/users');
    }
  });
});

router.get('/delete/:id', (req, res, next) => {
  if(!req.params.id) {
    return next(new Error('no user id provided'));
  }

  User.remove({ _id: req.params.id}).exec(function(err, rowsRemoved) {
    if(err) {
      return next(err);
    }

    if(rowsRemoved) {
      req.flash('success', '删除用户成功');
    } else {
      req.flash('error', '删除用户失败');
    }

    res.redirect('/admin/users/list');
  })
});

router.get('/modifyPassword',(req, res, next) => {
  var user = req.user;
  res.render('admin/user/modifyPassword', {
    author: user,
    action: "/admin/users/modifyPassword/" + user._id,
    pretty: true
  });
});

router.post('/modifyPassword/:id', getUserById,(req, res, next) => {
  var user = req.user;
  req.checkBody('password', '账号密码不能为空').notEmpty(); //express-validator 校验

  var errors = req.validationErrors();
  if (errors) {
    //res.jsonp(errors);
    return res.render('admin/users/modifyPassword', {
      errors: errors,
      password: req.body.password
    });
  }

  var password = req.body.password.trim();

  user.password = md5(password);

  user.save(function(err, post) {
    if(err) {
      req.flash('error', '修改密码失败');
    } else {
      req.flash('info', '修改密码成功，请重新登陆');
    }
    req.logout();
    res.redirect('/admin/users/login');
  });
  
});


function getUserById(req, res, next) {
  if(!req.params.id) {
    return next(new Error('no user id provided'));
  }

  User.findOne({_id: req.params.id})
      .exec(function(err, user) {
        if(err) {
          return next(err);
        }

        if(!user) {
          return next(new Error('user not found:' , req.params._id));
        }

        req.user = user;
        next();
    });
}

function requireLogin(req, res, next) {
  if(req.user) {
    res.redirect('/admin/posts');
  } else {
    next();
  }
};
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var categoriesRouter = require('./routes/categories');
var teacherRouter = require('./routes/teacher');
var jwt = require('./utils/jwt');
var pcjwt = require('./utils/pcjwt');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('upload'))


// 微信小程序token拦截模块
const url = ['/users/wxlogin', '/users/list', '/users/detail', '/users/search', '/users/getCourseByTeacher', '/users/hotCourse', '/users/teacher', '/users/comment', '/users/getCart']
app.use(function (req, res, next) {
  let address = req.url.split('?')[0];
  if (req.url.startsWith('/users') && url.indexOf(address) === -1) {
    let token = req.headers.token;
    let result = jwt.verifyToken(token);
    if (result === 'err' || !result) {
      res.status(401).send({ status: 401, msg: '登录已过期,请重新登录' });
    } else {
      next();
    }
  } else {
    next();
  }
});
// pc端登录拦截，检查token
// app.use(function (req, res, next) {
//   if (req.url.startsWith('/public') && !req.url.startsWith('/public/login')) {
//     let token = req.headers.token;
//     let result = pcjwt.verifyToken(token);
//     console.log(result);
//     if (result === 'err' || !result) {
//       res.send({ status: 401, msg: '登录已过期,请重新登录' });
//     } else {
//       next();
//     }
//   } else {
//     next();
//   }
// });
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/categories', categoriesRouter);
app.use('/public', teacherRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

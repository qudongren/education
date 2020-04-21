var express = require('express');
const mongoose = require('mongoose');
var router = express.Router();
mongoose.set('useFindAndModify', false)
const User = require('../controller/user');



//评价接口
router.post("/addComment", User.addComment);

// 获取选课课程详情
router.get("/selectDetail", User.getSelectedCourseDetail);

// 上传作业
router.post("/upload", User.upload);

// 获取学员的选课情况和作业
router.get('/selected', User.getSelected);

// 退课取消订单
router.post('/cancelCourse', User.cancelCourse);

// 修改个人信息
router.post('/changeUserInfo', User.changeUserInfo);

// 获取个人信息
router.get('/userInfo', User.getUserInfo);

// 获取订单
router.get('/getOrderList', User.getOrderList);

// 支付订单报名
router.post('/payment', User.payment);

// 会过滤
router.post('/getCart', User.getCart);
// 查找老师评论
router.get('/comment', User.getComments);
// 查找老师信息
router.get('/teacher', User.getTeacher);
// 会过滤
router.get('/hotCourse', User.getHotCourse);
// 会过滤
router.get('/getCourseByTeacher', User.getCourseByTeacher);
// 会过滤
router.get('/search', User.searchCourse);
// 会过滤 初次课次日期已过的课次
router.get('/list', User.getCourseList);
// 根据课程id查找
router.get('/detail', User.getCourseDetail);
/* POST users/wxlogin */
router.post('/wxlogin', User.wxlogin);
/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});
module.exports = router;

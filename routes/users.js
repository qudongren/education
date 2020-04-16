var express = require('express');
const mongoose = require('mongoose');
const request = require('request');
var formidable = require("formidable");
var path = require("path");
var fs = require("fs");
const wxConfig = require('../config/wxConfig.json');
const jwt = require("../utils/jwt");
// const Student = require("../models/student");
// const Course = require("../models/course");
// const Work = require("../models/work");
const { filterCourse, getTimeBlock, randomOrder } = require('../utils/util');
var router = express.Router();
mongoose.set('useFindAndModify', false)
const User = require('../controller/user');

// 上传作业
router.post("/upload", (req, res) => {
  let token = req.headers.token;
  let result = jwt.verifyToken(token);
  if (result === 'err' || !result) {
    res.status(403).send({ status: 403, msg: '登录已过期,请重新登录' });
    return;
  }
  var form = new formidable.IncomingForm();
  let uploadDir = path.join(__dirname, "../upload/");
  form.uploadDir = uploadDir;//本地文件夹目录路径
  form.parse(req, (err, fields, files) => {
    let {fileName, cid, id} = fields;
    let oldPath = files.file.path;//这里的路径是图片的本地路径
    let newPath = path.join(path.dirname(oldPath), fileName);
    var downUrl = "http://localhost:3000/" + fileName;//这里是想传回图片的链接
    fs.rename(oldPath, newPath, async () => {//fs.rename重命名图片名称
      let {_id} = await Student.findOne({openid: result});
      Work.updateOne({course_id: cid, student_id: _id}, {$push: {works: {"sub_course_id": id, "workUrl": newPath}}}, function(err, doc) {
        if (err) {
          console.log(err);
          return;
        } 
        if (doc.nModified == 1 && doc.ok == 1) {
          res.send({code: 1, msg: "上传成功"});
        } 
        else {
          res.send({code: -1, msg: "上传失败"});
        }
      })
    })
  })
})

// 获取学员的选课情况和作业
router.get('/selected', function (req, res, next) {
  let token = req.headers.token;
  let result = jwt.verifyToken(token);
  if (result === 'err' || !result) {
    res.status(403).send({ status: 403, msg: '登录已过期,请重新登录' });
    return;
  }
  Student.findOne({openid: result}, function(err, doc) {
    if (err) {
      console.log(err);
      return;
    }
    if (!doc) return;
    let {_id} = doc;
    Work.find({student_id: _id}, function(err1, docList) {
      if (err1) {
        console.log(err1);
        return;
      }
      if (!docList) {
        res.send({
          courses: [],
          workList: []
        })
        return;
      }
      let courseList = docList.map(item => item.course_id);
      Course.find({_id: courseList}, function(err2, courses) {
        if (err2) return;
        courses = getTimeBlock(courses);
        let workList = []
        courses.forEach(item => {
          let res0 = docList.find(it => it.course_id === item._id.toString());
          let {works} = res0;
          let sub_course = item.sub_course;
          sub_course.forEach(i => {
            let work = works.find(ite => ite.sub_course_id === i._id.toString());
            let isFinish;
            // 已上传作业
            if (!work || !work.workUrl) isFinish = false;
            else isFinish = true;
            if (i.sub_work) {
              workList.push({
                isFinish,
                course_id: item._id,
                course_name: item.cName,
                sub_name: i.sub_name,
                sub_date: i.sub_date,
                sub_work: i.sub_work,
                sub_course_id: i._id
              })
            }
          })
        })
        res.send({workList, courses});
      })
    })
  }) 
});

// 获取个人信息
router.get('/selected', function (req, res, next) {
  let token = req.headers.token;
  let result = jwt.verifyToken(token);
  if (result === 'err' || !result) {
    res.status(403).send({ status: 403, msg: '登录已过期,请重新登录' });
    return;
  }
  if (!req || !req.query) {
    res.send({ code: -3, msg: 'error' });
    return;
  }
  Student.findOne({ openid: result }, function (err, doc) {
    if (err) {
      console.log(err);
      return;
    }
    if (!doc) return;
    let { selected } = doc;
    Course.find({ _id: selected }).exec(function (err, courses) {
      if (err) {
        res.json({
          "status": "error",
          "code": "-1"
        });
      }
      courses = getTimeBlock(courses);
      res.json(courses);
    });
  })
})

// 退课取消订单
router.post('/cancelCourse', function (req, res, next) {
  let token = req.headers.token;
  let result = jwt.verifyToken(token);
  if (result === 'err' || !result) {
    res.status(403).send({ status: 403, msg: '登录已过期,请重新登录' });
    return;
  }
  if (!req || !req.body) {
    res.send({ code: -3, msg: 'error' });
    return;
  }
  let { order_id } = req.body;
  Student.findOne({ openid: result }, function (err, doc0) {
    if (err) {
      console.log(err);
      return;
    }
    let { order } = doc0;
    let student_id = doc0.id;
    let result0 = order.find(item => item.order_id === order_id);
    let { course_id } = result0;
    Course.findOne({ _id: course_id }, async function (err, doc) {
      if (err) {
        console.log(err);
        return;
      }
      let validCourse = filterCourse([doc]);
      if (!validCourse.length) {
        res.send({ code: -1, msg: "该课程已开课，不能退课" });
        return;
      }
      let { _id } = doc._id;
      order.forEach(item => {
        if (item.order_id === order_id) {
          item.order_state = "0";
        }
      })
      try {
        await Promise.all([
          Course.updateOne({ _id: _id }, { $inc: { nowNum: -1 } }), 
          Work.remove({course_id, student_id}), 
          Student.updateOne({ openid: result }, { order })
        ]);
      } catch (e) {
        console.log(e)
      }
      res.send({ code: 1, msg: "退课成功" });
    })
  })
})

// 修改个人信息
router.post('/changeUserInfo', function (req, res, next) {
  let token = req.headers.token;
  let result = jwt.verifyToken(token);
  if (result === 'err' || !result) {
    res.status(403).send({ status: 403, msg: '登录已过期,请重新登录' });
    return;
  }
  if (!req || !req.body) {
    res.send({ code: -3, msg: 'error' });
    return;
  }
  let params = req.body.params;
  Student.findOneAndUpdate({ openid: result }, { ...params }, { new: true }, function (err, doc) {
    if (err) {
      console.log(err);
      return;
    }
    let { name } = doc;
    res.send({ code: 1, name });
  })
})

// 获取个人信息
router.get('/userInfo', function (req, res, next) {
  let token = req.headers.token;
  let result = jwt.verifyToken(token);
  if (result === 'err' || !result) {
    res.status(403).send({ status: 403, msg: '登录已过期,请重新登录' });
    return;
  }
  if (!req || !req.query) {
    res.send({ code: -3, msg: 'error' });
    return;
  }
  Student.findOne({ openid: result }, function (err, doc) {
    if (err) {
      console.log(err);
      return;
    }
    if (!doc) return;
    let { name, gender, phone, birthday } = doc;
    gender = gender == "0" ? "女" : "男";
    let userInfo = { name, gender, phone, birthday };
    res.send(userInfo);
  })
})

// 获取订单
router.get('/getOrderList', function (req, res, next) {
  let token = req.headers.token;
  let result = jwt.verifyToken(token);
  if (result === 'err' || !result) {
    res.status(403).send({ status: 403, msg: '登录已过期,请重新登录' });
    return;
  }
  if (!req || !req.query) {
    res.send({ code: -3, msg: 'error' });
    return;
  }
  Student.findOne({ openid: result }, function (err, doc) {
    if (err) {
      console.log(err);
      return;
    }
    if (!doc) return;
    let { order } = doc;
    if (req.query.state) {
      let { state } = req.query;
      order = order.filter(item => item.order_state == state);
    }
    order.reverse();
    res.send({ orderList: order });
  })
});

// 立即报名时检查
router.get('/immePay', function (req, res, next) {
  let token = req.headers.token;
  let result = jwt.verifyToken(token);
  if (result === 'err' || !result) {
    res.status(403).send({ status: 403, msg: '登录已过期,请重新登录' });
    return;
  }
  if (!req || !req.query || !req.query.course_id) {
    res.send({ code: -3, msg: 'error' });
    return;
  }
  let { course_id } = req.query;
  Student.findOne({ openid: result }, function (err, doc) {
    if (err) {
      console.log(err);
      return;
    }
    if (!doc) {
      return;
    }
    let {_id} = doc;
    Work.findOne({course_id, student_id: _id}, function(err1, doc1) {
      if (err1) {
        console.log(err1);
        return;
      }
      if (doc1) {
        res.send({ code: 0, msg: "你已报名该课程" });
        return;
      }
      res.send({ code: 1, msg: "" });
    })
  });
});

// 支付订单报名
router.post('/payment', async function (req, res, next) {
  let token = req.headers.token;
  let result = jwt.verifyToken(token);
  if (result === 'err' || !result) {
    res.status(403).send({ status: 403, msg: '登录已过期,请重新登录' });
    return;
  }
  if (!req || !req.body) {
    res.send({ code: -3, msg: 'error' });
    return;
  }
  let { courseIdList } = req.body;
  Course.find({ _id: courseIdList }, function (err, docList) {
    if (err) {
      console.log(err);
      return;
    }
    let tag = true, index, length = docList.length;
    for (let i = 0; i < length; i++) {
      if (docList[i].nowNum > docList[i].total) {
        index = i;
        tag = false;
        break;
      }
    }
    if (!tag) {
      res.send({ code: -2, msg: docList[index].cName + "名额已满,提交失败" });
      return;
    }
    Student.findOne({ openid: result }, function (err, doc) {
      if (err) {
        console.log(err);
        return;
      }
      let { _id } = doc;
      Work.find({ course_id: courseIdList, student_id: _id }, function (err1, doc1) {
        if (err1) {
          console.log(err1);
          return;
        }
        console.log(doc1);
        if (doc1.length) {
          res.json({ code: -1, msg: '你已报名该课程' });
          return;
        }
        let workList = courseIdList.map(item => {
          return {
            course_id: item,
            student_id: _id
          }
        });
        Work.insertMany(workList, function (err2, doc2) {
          if (err2) {
            console.log(err2);
            return;
          }
        });
        Course.updateMany({ _id: courseIdList }, { $inc: { nowNum: 1 } }, function (err, doc) {
          if (err) {
            console.log(err);
            return;
          }
        })
        let { order, cart } = doc;
        courseIdList.forEach(item => {
          let index = cart.indexOf(item);
          if (index !== -1) {
            cart.splice(index, 1);
          }
        })
        docList.forEach(item => {
          let ord = {
            order_id: randomOrder(5),
            created_time: new Date().toLocaleString(),
            order_price: item.price,
            order_state: "1",
            course_id: item._id,
            course_name: item.cName
          }
          order.push(ord);
        })
        Student.updateOne({ openid: result }, { cart, order }, function (err, doc) {
          if (err) {
            console.log(err);
            return;
          }
          res.send({ code: 1, msg: 'success' });
        });
      });
    })
  })
});

// 添加购课单
// router.post('/addCart', function (req, res, next) {
//   let token = req.headers.token;
//   let result = jwt.verifyToken(token);
//   if (result === 'err' || !result) {
//     res.status(403).send({ status: 403, msg: '登录已过期,请重新登录' });
//     return;
//   }
//   let course_id = req.body.course_id;
//   Student.findOne({ openid: result }, function (err, doc) {
//     if (err) {
//       console.log(err);
//       return;
//     }
//     let { _id } = doc;
//     Work.findOne({ course_id, student_id: _id }, function (err1, doc1) {
//       if (err1) {
//         console.log(err);
//         return;
//       }
//       if (doc1) {
//         res.json({ code: -1, msg: '你已报名该课程' });
//         return;
//       }
//       let { cart } = doc;
//       if (cart.indexOf(course_id) !== -1) {
//         res.json({ code: 0, msg: '该课程已在购物单' });
//         return;
//       }
//       Student.updateOne({ openid: result }, { $addToSet: { cart: [course_id] } }, function (err, doc) {
//         if (err) {
//           console.log(err);
//           return;
//         }
//         res.send({ code: 1, msg: 'success' });
//       });
//     })
//   });
// });

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

const wxConfig = require('../config/wxConfig.json');
const jwt = require("../utils/jwt");
const { filterCourse, getTimeBlock, randomOrder } = require('../utils/util');
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const request = require('request');
const querysql = require('../config/db');

class User {
  constructor() {
  }
  wxlogin(req, res, next) {
    if (req.body.code) {
      const url = "https://api.weixin.qq.com/sns/jscode2session?appid=" + wxConfig.appid + "&secret=" + wxConfig.secret + "&js_code=" + req.body.code + "&grant_type=authorization_code";
      request(url, async (error, response, body) => {
        if (error) {
          res.send({ code: -1 });
          return;
        }
        try {
          let data = JSON.parse(body);
          let sql = 'select * from Student where openid = ?'
          let student = await querysql(sql, [data.openid]);
          if (!student.length) {
            let sql_1 = 'insert into Student (openid) values (?)';
            let result = await querysql(sql_1, [data.openid]);
            let token = jwt.createToken(req.body.code, result.insertId, data.session_key);
            res.send({ token, code: 1 });
          } else {
            let token = jwt.createToken(req.body.code, student[0].id, data.session_key);
            res.send({ token, code: 1, name: student[0].name });
          }
        } catch (e) {
          res.send({ code: -2, err: e });
        }
      });
    } else {
      res.send({ msg: "缺失少code参数", code: -3 });
    }
  }
  async getCourseByTeacher(req, res, next) {
    let { teacher_id } = req.query;
    if (!teacher_id) {
      res.send({ code: -1 })
    }
    let sql = `select a.*, b.cate_dec as subject_dec, c.cate_dec as grade_dec, d.name as teacher_name, d.avatarUrl 
    from course a, category b, category c, teacher d 
    where a.cate_id = b.id and 
    b.parent_id = c.id and 
    a.teacher_id = d.id and
    d.id = ?`
    let courses = await querysql(sql, [teacher_id]);
    if (!courses.length) {
      res.send([]);
      return;
    }
    courses = await filterCourse(courses);
    courses = await getTimeBlock(courses);
    res.send(courses);
  }
  async getCourseList(req, res, next) {
    let { subject_id } = req.query;
    if (!subject_id) {
      res.send({ code: -1 })
    }
    let sql = `select a.*, b.cate_dec as subject_dec, c.cate_dec as grade_dec, d.name as teacher_name, d.avatarUrl 
    from course a, category b, category c, teacher d 
    where a.cate_id = b.id and 
    b.parent_id = c.id and 
    a.teacher_id = d.id and
    b.id = ?`
    let courses = await querysql(sql, [subject_id]);
    if (!courses.length) {
      res.send([]);
      return;
    }
    courses = await filterCourse(courses);
    courses = await getTimeBlock(courses);
    res.send(courses);
  }
  async searchCourse(req, res, next) {
    let search = req.query.search;
    if (!search) {
      res.send({ code: -1 })
    }
    let sql = `select a.*, b.cate_dec as subject_dec, c.cate_dec as grade_dec, d.name as teacher_name, d.avatarUrl 
    from course a, category b, category c, teacher d 
    where a.cate_id = b.id and 
    b.parent_id = c.id and 
    a.teacher_id = d.id and
    a.cName like ?`;
    let courses = await querysql(sql, ['%' + search + '%']);
    console.log(courses)
    if (!courses.length) {
      res.send([]);
      return;
    }
    courses = await filterCourse(courses);
    courses = await getTimeBlock(courses);
    res.send(courses);
  }
  async getHotCourse(req, res, next) {
    let grade_id = req.query.grade_id
    if (!grade_id) {
      res.send({ code: -1 })
    }
    let sql = `select a.*, b.cate_dec as subject_dec, c.cate_dec as grade_dec, d.name as teacher_name, d.avatarUrl 
    from course a, category b, category c, teacher d 
    where a.cate_id = b.id and 
    b.parent_id = c.id and 
    a.teacher_id = d.id and 
    c.id = ? 
    order by hotLevel desc
    LIMIT 10`
    let courses = await querysql(sql, [grade_id]);
    if (!courses.length) {
      res.send([]);
      return;
    }
    courses = await filterCourse(courses);
    courses = await getTimeBlock(courses);
    let course = [];
    // 选取5个热门课程返回
    if (courses.length > 5) {
      for (let i = 0; i < 5; i++) {
        course.push(courses[i]);
      }
    } else {
      course = courses;
    }
    res.send(course);
  }
  async getCourseDetail(req, res, next) {
    let { course_id } = req.query;
    if (!course_id) {
      res.send({ code: -1 })
    }
    let sql = `select a.*, b.cate_dec as subject_dec, c.cate_dec as grade_dec, d.name as teacher_name, d.avatarUrl 
    from course a, category b, category c, teacher d 
    where a.cate_id = b.id and 
    b.parent_id = c.id and 
    a.teacher_id = d.id and
    a.id = ?`
    let courses = await querysql(sql, [course_id]);
    if (!courses.length) {
      res.send([]);
      return;
    }
    courses = await filterCourse(courses);
    courses = await getTimeBlock(courses);
    res.send(courses);
  }
  async getTeacher(req, res, next) {
    let { teacher_id } = req.query;
    if (!teacher_id) {
      res.send({ code: -1 })
    }
    let sql = `select id,name,phone,gender,avatarUrl,introduce,tags from teacher
    where id = ?`
    let res0 = await querysql(sql, [teacher_id]);
    res.send(res0.length ? { teacher: res0[0] } : {})
  }
  async getComments(req, res, next) {
    let { teacher_id } = req.query;
    if (!teacher_id) {
      res.send({ code: -1 })
    }
    let sql = `select a.*,b.name from comment a, student b
    where a.teacher_id = ? and
    b.id = a.student_id`
    let res0 = await querysql(sql, [teacher_id]);
    res.send(res0)
  }
  async getCart(req, res, next) {
    let { course_list } = req.body;
    if (!course_list || !course_list.length) {
      res.send({ code: -1 })
    }
    let sql = `select a.*, b.cate_dec as subject_dec, c.cate_dec as grade_dec, d.name as teacher_name, d.avatarUrl 
    from course a, category b, category c, teacher d 
    where a.cate_id = b.id and 
    b.parent_id = c.id and 
    a.teacher_id = d.id and
    a.id in (${course_list.toString()})`
    let courses = await querysql(sql);
    if (!courses.length) {
      res.send([]);
      return;
    }
    courses = await filterCourse(courses);
    courses = await getTimeBlock(courses);
    res.send(courses);
  }
  async payment(req, res, next) {
    let token = req.headers.token;
    let result = jwt.verifyToken(token);
    let { courseIdList } = req.body;
    try {
      let sql = `select * from orders where student_id = ${result} and course_id in (${courseIdList.toString()})`
      let res0 = await querysql(sql);
      if (res0 && res0.length) {
        let course_id_list = res0.map(item => item.course_id);
        let sql = `select * from course where id in (${course_id_list.toString()})`
        let res1 = await querysql(sql);
        res.send({ code: -2, msg: "你已报名过某些课次", result: res1 });
        return;
      }
      sql = `select * from course where id in (${courseIdList.toString()}) and nowNum >= total`
      let res1 = await querysql(sql);
      if (res1 && res1.length) {
        res.send({ code: -1, msg: "某些课程名额已满", result: res1 });
        return;
      }
      await querysql(`update course set nowNum = nowNum + 1 where id in (${courseIdList.toString()})`);
      let courseList = await querysql(`select * from course where id in (${courseIdList.toString()})`);
      let sqlStr = 'insert into orders (student_id, course_id, created_time, order_no, order_state, order_price) values ';
      for (let i = 0, len = courseList.length; i < len; i++) {
        let date = new Date().toLocaleString();
        let order_no = randomOrder(5);
        let str = `(${result}, ${courseList[i].id}, '${date}', ${order_no}, '1', ${courseList[i].price})`
        sqlStr += str;
        if (i !== len - 1) sqlStr += ',';
      }
      await querysql(sqlStr);
      res.send({ code: 1, msg: '支付成功' });
    } catch (e) {
      res.send({ error: e });
    }
  }
  async getOrderList(req, res, next) {
    let token = req.headers.token;
    let result = jwt.verifyToken(token);
    let sql = `select a.*, b.cName from orders a, course b where student_id = ${result} and a.course_id = b.id`;
    let res0 = await querysql(sql);
    if (req.query.state) {
      let { state } = req.query;
      res0 = res0.filter(item => item.order_state == state);
    }
    res0.reverse();
    res.send(res0);
  }
  async getUserInfo(req, res, next) {
    let token = req.headers.token;
    let result = jwt.verifyToken(token);
    let sql = `select name, gender, phone, birthday from student where id = ${result}`;
    let res0 = await querysql(sql);
    res.send(res0);
  }
  async changeUserInfo(req, res, next) {
    let token = req.headers.token;
    let result = jwt.verifyToken(token);
    let {name, birthday, gender, phone} = req.body;
    let sql = `update student set name = ?, birthday = ?, gender = ?, phone = ? where id = ${result}`;
    await querysql(sql, [name, birthday, gender, parseInt(phone)]);
    let res0 = await querysql(`select * from student where id = ${result}`);
    res.send({ code: 1, name: res0[0].name })
  }
  async cancelCourse(req, res, next) {
    let token = req.headers.token;
    let result = jwt.verifyToken(token);
    let { order_id } = req.body;
    let sql = `select course_id from orders where id = ${order_id}`;
    let res0 = await querysql(sql);
    if (!res0.length) {
      res.send({ error: 'none' });
      return;
    }
    let course_id = res0[0].course_id;
    let res1 = await querysql(`select * from course where id = ${course_id}`);
    let validCourse = await filterCourse(res1);
    if (!validCourse.length) {
      res.send({ code: -1, msg: "该课程已开课，不能退课" });
      return;
    }
    await querysql(`update course set nowNum = nowNum - 1 where id = ${validCourse[0].id}`);
    await querysql(`update orders set order_state = '0', deleted_time = '${new Date().toLocaleString()}' where id = ${order_id}`);
    res.send({ code: 1 });
  }
  async getSelected(req, res, next) {
    let token = req.headers.token;
    let result = jwt.verifyToken(token);
    let res0 = await querysql(`select * from orders where student_id = ${result} and order_state = '1'`);
    if (!res0.length) {
      res.send({
        courses: [],
        workList: []
      })
      return;
    }
    let courseIdList = res0.map(item => item.course_id);
    let courseList = await querysql(`select a.*, b.cate_dec as subject_dec, c.cate_dec as grade_dec, d.name as teacher_name, d.avatarUrl 
    from course a, category b, category c, teacher d 
    where a.cate_id = b.id and 
    b.parent_id = c.id and 
    a.teacher_id = d.id and
    a.id in (${courseIdList.toString()})`);
    courseList = await getTimeBlock(courseList);
    let res1 = await querysql(`select b.*, c.cName from subcourse b, course c
    where c.id in (${courseIdList.toString()}) and
    b.course_id = c.id and
    b.sub_work is not null`);
    if (!res1.length) {
      res.send({
        courses: courseList,
        workList: []
      })
      return;
    }
    res1 = res1.filter(item => !!item.sub_work);
    for (let i = 0, len = res1.length; i < len; i++) {
      let res2 = await querysql(`select * from work where student_id = ${result} and subcourse_id = ${res1[i].id}`)
      if (res2.length) {
        res1[i].isFinish = true;
      } else {
        res1[i].isFinish = false;
      }
    }
    res.send({
      courses: courseList,
      workList: res1
    })
  }
  async upload(req, res, next) {
    let token = req.headers.token;
    let result = jwt.verifyToken(token);
    var form = new formidable.IncomingForm();
    let uploadDir = path.join(__dirname, "../upload/");
    form.uploadDir = uploadDir;//本地文件夹目录路径
    form.parse(req, (err, fields, files) => {
      let { fileName, id } = fields;
      console.log(fields);
      let oldPath = files.file.path;//这里的路径是图片的本地路径
      let newPath = path.join(path.dirname(oldPath), fileName);
      var downUrl = "http://localhost:3000/" + fileName;//这里是想传回图片的链接
      console.log(downUrl)
      fs.rename(oldPath, newPath, async () => {//fs.rename重命名图片名称
        try {
          await querysql(`insert into work (student_id, subcourse_id, worlUrl) values (${result}, ${id}, '${downUrl}')`);
          res.send({ code: 1, msg: "上传成功" });
        } catch (e) {
          res.send({ code: -1, msg: "上传失败", err: e});
        }
      });
    });
  }
}

module.exports = new User()
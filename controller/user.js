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
        let _data = JSON.parse(body);
        let sql = 'select * from Student where openid = ?'
        let student = await querysql(sql, [_data.openid]);
        if (!student.length) {
          let sql_1 = 'insert into Student (openid) values (?)';
          let result = await querysql(sql_1, [_data.openid]);
          console.log(result)
          let htoken = jwt.createToken(req.body.code, result.insertId, _data.session_key);
          res.send({ token: htoken, code: 1 });
        } else {
          let htoken = jwt.createToken(req.body.code, student[0].id, _data.session_key);
          res.send({ token: htoken, code: 1, name: student[0].name });
        }
      });
    } else {
      res.send({ msg: "require code", code: -1 });
    }
  }
  async getCourseByTeacher(req, res, next) {
    let {teacher_id} = req.query;
    if (!teacher_id) {
      res.send({code: -1})
    }
    let sql = `select a.*, b.dec as subject_dec, c.dec as grade_dec, d.name as teacher_name, d.avatarUrl 
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
    let {subject_id} = req.query;
    if (!subject_id) {
      res.send({code: -1})
    }
    let sql = `select a.*, b.dec as subject_dec, c.dec as grade_dec, d.name as teacher_name, d.avatarUrl 
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
      res.send({code: -1})
    }
    let sql = `select a.*, b.dec as subject_dec, c.dec as grade_dec, d.name as teacher_name, d.avatarUrl 
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
      res.send({code: -1})
    }
    let sql = `select a.*, b.dec as subject_dec, c.dec as grade_dec, d.name as teacher_name, d.avatarUrl 
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
      for(let i = 0; i < 5; i++) {
        course.push(courses[i]);
      }
    } else {
      course = courses;
    }
    res.send(course);
  }
  async getCourseDetail(req, res, next) {
    let {course_id} = req.query;
    if (!course_id) {
      res.send({code: -1})
    }
    let sql = `select a.*, b.dec as subject_dec, c.dec as grade_dec, d.name as teacher_name, d.avatarUrl 
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
    let {teacher_id} = req.query;
    if (!teacher_id) {
      res.send({code: -1})
    }
    let sql = `select id,name,phone,gender,avatarUrl,introduce,tags from teacher
    where id = ?`
    let res0 = await querysql(sql, [teacher_id]);
    res.send(res0.length ? {teacher: res0[0]} : {})
  }
  async getComments(req, res, next) {
    let {teacher_id} = req.query;
    if (!teacher_id) {
      res.send({code: -1})
    }
    let sql = `select a.*,b.name from comment a, student b
    where a.teacher_id = ? and
    b.id = a.student_id`
    let res0 = await querysql(sql, [teacher_id]);
    res.send(res0)
  }
  async getCart(req, res, next) {
    let {course_list} = req.body;
    if (!course_list || !course_list.length) {
      res.send({code: -1})
    }
    console
    let sql = `select a.*, b.dec as subject_dec, c.dec as grade_dec, d.name as teacher_name, d.avatarUrl 
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
  async getOrder(req, res, next) {
    
  }
}

module.exports =  new User()
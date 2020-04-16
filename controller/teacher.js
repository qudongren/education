const pcjwt = require("../utils/pcjwt");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const request = require('request');
const querysql = require('../config/db');

class Teacher {
  constructor() {
  }
  async getSubCourse(req, res, next) {
    if (!req || !req.query || !req.query.course_id) {
      res.send({ code: -2, msg: "缺少参数" });
      return;
    }
    let sql = `select * from subcourse where course_id = ?`;
    let sub_course = await querysql(sql, [req.query.course_id]);
    res.send(sub_course);
  }
  async getCourseList(req, res, next) {
    if (!req || !req.query) {
      res.send({ code: -2, msg: "error" });
      return;
    }
    let sql = `select a.*, b.dec as subject_dec, c.dec as grade_dec, d.name as teacher_name, d.avatarUrl 
    from course a, category b, category c, teacher d 
    where a.cate_id = b.id and 
    b.parent_id = c.id and 
    a.teacher_id = d.id`
    let courses = await querysql(sql)
    res.send(courses);
  }
  // 管理员访问
  async getTeacherList(req, res, next) {
    // pc端 权限控制
    // let token = req.headers.token;
    // let result = pcjwt.verifyToken(token);
    // if (result.role !== "1") {
    //   res.send({status: 403, msg: '拒绝访问'});
    //   return;
    // }
    let sql = `select id as value, name as label from teacher`;
    let teachers = await querysql(sql);
    res.send(teachers);
  }
  async login(req, res, next) {
    var id = req.body.id;
    var password = req.body.password;
    let sql = `select password,isAdmin from teacher where id = ${id}`;
    let result = await querysql(sql);
    if (result.length) {
      let item = result[0]
      if (item.password === password) {
        let token = pcjwt.createToken(id, item.isAdmin);
        res.send({ status: 200, msg: '登陆成功', token, role: item.isAdmin});
      } else {
        res.send({ status: 400, msg: '账号密码错误' });
      }
    } else {
      res.send({ status: 404, msg: '账号不存在' })
    }
  }
}

module.exports = new Teacher()
const pcjwt = require("../utils/pcjwt");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const request = require('request');
const querysql = require('../config/db');

class Teacher {
  constructor() {
  }
  async login(req, res, next) {
    var id = req.body.id;
    var password = req.body.password;
    if (!id || !password) {
      res.send({code: -1, msg: "请输入用户名或者密码"})
      return;
    }
    let sql = `select * from teacher where id = ${id}`;
    let result = await querysql(sql);
    if (result.length) {
      let item = result[0];
      let newItem = JSON.parse(JSON.stringify(item));
      delete newItem.password
      delete newItem.isAdmin
      if (item.password === password) {
        let token = pcjwt.createToken(id, item.isAdmin);
        res.send({ status: 200, msg: '登陆成功', token, role: item.isAdmin, ...newItem});
      } else {
        res.send({ status: 400, msg: '账号密码错误' });
      }
    } else {
      res.send({ status: 404, msg: '账号不存在' })
    }
  }
  async getCourseList(req, res, next) {
    let token = req.headers.token;
    let result = pcjwt.verifyToken(token);
    let sql = `select a.*, b.dec as subject_dec, c.dec as grade_dec, d.name as teacher_name, d.avatarUrl 
    from course a, category b, category c, teacher d 
    where a.cate_id = b.id and 
    b.parent_id = c.id and 
    a.teacher_id = d.id`
    if (result.role === '0') {
      sql += ` and d.id = ${result.id}`;
    }
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
    let sql = `select id,name,phone,gender,avatarUrl,introduce,tags,isAdmin from teacher`;
    let teachers = await querysql(sql);
    res.send(teachers);
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
  async getStudentList(req, res, next) {
    if (!req || !req.query || !req.query.course_id) {
      res.send({ code: -2, msg: "缺少参数" });
      return;
    }
    let sql = `select b.id, b.name, b.gender, b.phone, b.birthday, b.avatarUrl from orders a, student b where course_id = ? and order_state = '1' and a.student_id = b.id`;
    let studentList = await querysql(sql, [req.query.course_id]);
    res.send(studentList);
  }
  async changeCourse(req, res, next) {
    let {course_id,cName,cate_id,teacher_id,price,total,hotLevel,detail,picture,start_time,end_time} = req.body;
    if (!course_id || !cName || !cate_id || !price || !start_time || !end_time) {
      res.send({ code: -2, msg: "缺少参数" });
      return;
    }
    try {
      let sql = `update course set cName = ?, cate_id = ?, teacher_id = ?,price = ?,total = ?,hotLevel = ?,detail = ?,picture = ?,start_time = ?,end_time = ? where id = ?`;
      await querysql(sql, [cName,cate_id,teacher_id,price,total,hotLevel,detail,picture,start_time,end_time,course_id]);
      res.send({code: 1, msg: '更改成功'})
    } catch (e) {
      res.send({code: -1, msg: '更改失败'})
    }
  }
  async deleteCourse(req, res, next) {
    let {course_id} = req.body;
    if (!course_id) {
      res.send({ code: -2, msg: "缺少参数" });
      return;
    }
    try {
      await querysql(`delete from course where id = ${course_id}`);
      res.send({code: 1, msg: '删除成功'})
    } catch (e) {
      res.send({code: -1, msg: '删除失败'})
    }
  }
  async addCourse(req, res, next) {
    let {cName,cate_id,teacher_id,price,total,hotLevel,detail,picture,start_time,end_time} = req.body;
    if (!cName || !cate_id || !price || !start_time || !end_time) {
      res.send({ code: -2, msg: "缺少参数" });
      return;
    }
    try {
      let sql = `insert into course (cName,cate_id,teacher_id,price,total,hotLevel,detail,picture,start_time,end_time) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      await querysql(sql, [cName,cate_id,teacher_id,price,total,hotLevel,detail,picture,start_time,end_time]);
      res.send({code: 1, msg: '添加成功'})
    } catch (e) {
      res.send({code: -1, msg: '添加失败'})
    }
  }
  async addSubCourse(req, res, next) {
    let {sub_name, sub_date, sub_work, course_id} = req.body;
    if (!sub_name || !sub_date || !course_id) {
      res.send({ code: -2, msg: "缺少参数" });
      return;
    }
    try {
      let sql = `insert into subcourse (sub_name, sub_date, sub_work, course_id) values (?, ?, ?, ?)`;
      await querysql(sql, [sub_name, sub_date, sub_work, course_id]);
      res.send({code: 1, msg: '添加成功'})
    } catch (e) {
      res.send({code: -1, msg: '添加失败'})
    }
  }
  async changeSubCourse(req, res, next) {
    let {subcourse_id, sub_name, sub_date, sub_work} = req.body;
    if (!subcourse_id || !sub_name || !sub_date) {
      res.send({ code: -2, msg: "缺少参数" });
      return;
    }
    try {
      let sql = `update subcourse set sub_name = ?, sub_date = ?, sub_work = ? where id = ?`;
      await querysql(sql, [sub_name, sub_date, sub_work, subcourse_id]);
      res.send({code: 1, msg: '更改成功'})
    } catch (e) {
      res.send({code: -1, msg: '更改失败'})
    }
  }
  async deleteSubCourse(req, res, next) {
    let {subcourse_id} = req.body;
    if (!subcourse_id) {
      res.send({ code: -2, msg: "缺少参数" });
      return;
    }
    try {
      await querysql(`delete from subcourse where id = ${subcourse_id}`);
      res.send({code: 1, msg: '删除成功'})
    } catch (e) {
      res.send({code: -1, msg: '删除失败'})
    }
  }
  async getWorkList(req, res, next) {
    let {subcourse_id} = req.query;
    if (!subcourse_id) {
      res.send({ code: -2, msg: "缺少参数" });
      return;
    }
    try {
      let res0 = await querysql(`select a.*, b.name from work a,student b where subcourse_id = ${subcourse_id} and a.student_id = b.id`);
      res.send(res0);
    } catch (e) {
      res.send({err: e})
    }
  }
  async searchCourse(req, res, next) {
    let {search = ''} = req.query;
    try {
      let res0 = await querysql(`select * from course where cName like '%${search}%'`);
      res.send(res0);
    } catch (e) {
      res.send({err: e})
    }
  }
}

module.exports = new Teacher()
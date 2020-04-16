var express = require('express');
var router = express.Router();
const querysql = require('../config/db');
const Teacher = require('../controller/teacher');

router.get('/teacherList', Teacher.getTeacherList);

router.get('/courseList', Teacher.getCourseList);

router.get('/subCourse', Teacher.getSubCourse);

router.post('/login', Teacher.login);

module.exports = router;

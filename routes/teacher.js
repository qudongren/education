var express = require('express');
var router = express.Router();
const querysql = require('../config/db');
const Teacher = require('../controller/teacher');

router.post('/login', Teacher.login);

router.get('/teacherList', Teacher.getTeacherList);

router.get('/courseList', Teacher.getCourseList);

router.get('/subCourse', Teacher.getSubCourse);

router.get('/studentList', Teacher.getStudentList);

router.post('/changeCourse', Teacher.changeCourse);

router.post('/deleteCourse', Teacher.deleteCourse);

router.post('/addCourse', Teacher.addCourse);

router.get('/searchCourse', Teacher.searchCourse);

router.post('/addSubCourse', Teacher.addSubCourse);

router.post('/changeSubCourse', Teacher.changeSubCourse);

router.post('/deleteSubCourse', Teacher.deleteSubCourse);

router.get('/getWorkList', Teacher.getWorkList);


module.exports = router;

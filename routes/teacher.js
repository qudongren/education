var express = require('express');
var router = express.Router();
const querysql = require('../config/db');
const Teacher = require('../controller/teacher');

router.post('/login', Teacher.login);

router.get('/teacherList', Teacher.getTeacherList);

router.get('/courseList', Teacher.getCourseList);

router.get('/subCourse', Teacher.getSubCourse);

router.get('/studentList', Teacher.getStudentByCourse);

router.post('/changeCourse', Teacher.changeCourse);

router.post('/deleteCourse', Teacher.deleteCourse);

router.post('/addCourse', Teacher.addCourse);

router.get('/searchCourse', Teacher.searchCourse);

router.post('/addSubCourse', Teacher.addSubCourse);

router.post('/changeSubCourse', Teacher.changeSubCourse);

router.post('/deleteSubCourse', Teacher.deleteSubCourse);

router.get('/getWorkList', Teacher.getWorkList);

router.post('/addTeacher', Teacher.addTeacher);

router.post('/deleteTeacher', Teacher.deleteTeacher);

router.post('/changeTeacher', Teacher.changeTeacher);

router.get('/getCourseOfTeacher', Teacher.getCourseOfTeacher);

router.get('/searchTeacher', Teacher.searchTeacher);

router.post('/changePasswordByAdmin', Teacher.changePasswordByAdmin);

router.post('/changePassword', Teacher.changePassword);

router.post('/changeOwn', Teacher.changeOwn);

router.get('/getAllStudent', Teacher.getAllStudent);

router.post('/changeStudent', Teacher.changeStudent);

router.post('/deleteStudent', Teacher.deleteStudent);

router.post('/addCate', Teacher.addCate);

router.post('/delCate', Teacher.delCate);

router.post('/changeCate', Teacher.changeCate);

module.exports = router;

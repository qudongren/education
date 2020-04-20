const querysql = require('../config/db');

// 过滤已过期的课程
async function filterCourse(courses) {
  let newCourses = [];
  for (let i = 0; i < courses.length; i++) {
    let sql = `select * from subcourse where course_id = ?`
    let sub_course = await querysql(sql, [courses[i].id]);
    if (sub_course.length == 0) continue;
    let now = new Date().toLocaleString().split(' ')[0];
    // // 对课次日期排序，升序
    sub_course.sort((a, b) => {return new Date(a.sub_date.replace(/-/g,"\/")) - new Date(b.sub_date.replace(/-/g,"\/"))});
    let sub_date = sub_course[0].sub_date;
    if (new Date(sub_date.replace(/-/g,"\/")) > new Date(now.replace(/-/g,"\/"))) {
      newCourses.push(courses[i]);
    }
  }
  return newCourses;
}

// 获取课程课次区间，并按时间排序课次
async function getTimeBlock(courses) {
  let newCourses = [];
  for (let i = 0; i < courses.length; i++) {
    let sql = `select * from subcourse where course_id = ?`
    let sub_course = await querysql(sql, [courses[i].id]);
    if (sub_course.length == 0) continue;
    let sub_course_times = sub_course.length;
    sub_course.sort((a, b) => {return new Date(a.sub_date.replace(/-/g,"\/")) - new Date(b.sub_date.replace(/-/g,"\/"))});
    let start = sub_course[0].sub_date;
    let end = sub_course[sub_course.length - 1].sub_date;
    start = start.replace(/-/g,"\/");
    end = end.replace(/-/g,"\/");
    let newItem = JSON.parse(JSON.stringify(courses[i]));
    newItem.time = newItem.start_time.slice(0, 5) + '-' + newItem.end_time.slice(0, 5);
    newItem.sub_course = sub_course;
    newCourses.push(Object.assign(newItem, {course_date: start + '-' + end, sub_course_times}));
  }
  return newCourses;
}

function randomOrder(j) {
  var random_no = "";
  for (var i = 0; i < j; i++) //j位随机数，用以加在时间戳后面。
  {
      random_no += Math.floor(Math.random() * 10);
  }
  random_no = new Date().getTime() + random_no;
  return random_no.toString();
};

module.exports = {filterCourse, getTimeBlock, randomOrder};
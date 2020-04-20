var express = require('express');
var router = express.Router();
const querysql = require('../config/db');


/* GET home page. */
router.get('/', async function(req, res, next) {
  let sql = `select * from category`;
  let categories = await querysql(sql);
  categories = categories.map(v => {return {id: v.id, dec: v.cate_dec, parent_id: v.parent_id}})
  res.send(categories);
})

module.exports = router;
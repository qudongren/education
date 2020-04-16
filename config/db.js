var mysql = require("mysql");

var pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: '123456',
  database: 'education',
  port: 3306,
  dateStrings : true
});

module.exports = function (sql, options) {
  return new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
      if (err) {
        console.log(err);
        return;
      }
      if (options) {
        connection.query(sql, options, function (err, results, fields) {
          if (err) {
            console.log(err);
          } else {
            resolve(results);
          }
        });
      } else {
        connection.query(sql, function (err, results, fields) {
          if (err) {
            console.log(err);
          } else {
            resolve(results);
          }
        });
      }
      connection.release();
    }
    )
  })
}

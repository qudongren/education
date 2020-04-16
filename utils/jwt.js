const jwt = require('jsonwebtoken');
const tokenKey = require('../config/tokenKey.json');
module.exports.createToken = (code, id, session_key) => {
  return jwt.sign({
    code,
    id,
    session_key
  }, tokenKey.key, {expiresIn: '6h'});
}
module.exports.verifyToken = (token) => {
  let res;
  try {
    let result = jwt.verify(token, tokenKey.key) || {};
    let {exp = 0} = result, current = Math.floor(Date.now() / 1000);
    if (current <= exp) {
      res = result.id || {};
    }
  } catch (e) {
    res = 'err';
  }
  return res;
}
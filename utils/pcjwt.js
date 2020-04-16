const jwt = require('jsonwebtoken');
const tokenKey = require('../config/tokenKey.json');
module.exports.createToken = (id, role) => {
  return jwt.sign({
    id,
    role
  }, tokenKey.sKey, {expiresIn: '6h'});
}
module.exports.verifyToken = (token) => {
  let res;
  try {
    let result = jwt.verify(token, tokenKey.sKey) || {};
    let {exp = 0} = result, current = Math.floor(Date.now() / 1000);
    if (current <= exp) {
      res = {id: result.id, role: result.role};
    }
  } catch (e) {
    res = 'err';
  }
  return res;
}
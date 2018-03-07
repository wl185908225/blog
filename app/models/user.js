// User model

const md5 = require("md5");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  created: { type: Date}
});


UserSchema.methods.verifyPassword = function(password) {   //此处password是传过来
	var isMatch = md5(password) === this.password;   //this指向当前查询出用户
	console.log('UserSchema.methods.verifyPassword:', password, this.password, isMatch);
	return isMatch;
}

mongoose.model('User', UserSchema);


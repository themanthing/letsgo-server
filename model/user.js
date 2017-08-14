/**
 * моделька пользователя
 * @type {*|Mongoose}
 */
var mongoose = require('mongoose'),
	crypto = require('crypto'),
	config = require('../libs/config'),
	Schema = mongoose.Schema,
	User = new Schema({
		username: {
			type: String,
			required: true
		},
		// как авторизоваля если native значит через нас
		auth_via: {
			type: String,
			enum: ['native', 'vk', 'facebook'],
			required: true
		},
		// собственно ID сети от которой мы зарегались
		social_id: {
			type: String
		},

		hashedPassword: {
			type: String,
			required: true
		},
		salt: {
			type: String,
			required: true
		},
		created: {
			type: Date,
			default: Date.now
		}
	});

// логин не меньше 5-ти но и не больше 150
User.path('username').validate(function (v) {
	return v.length > 5 && v.length < 150;
});

User.methods.encryptPassword = function (password) {
	//return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
	return crypto.pbkdf2Sync(password, this.salt, 10000, 512);
};

User.virtual('userId')
	.get(function () {
		return this.id;
	});

User.virtual('password')
	.set(function (password) {
		this._plainPassword = password;
		this.salt = crypto.randomBytes(config.get('security:randomLength')).toString('base64');
		this.hashedPassword = this.encryptPassword(password);
	})
	.get(function () {
		return this._plainPassword;
	});


User.methods.checkPassword = function (password) {
	return this.encryptPassword(password) == this.hashedPassword;
};

module.exports = mongoose.model('User', User);
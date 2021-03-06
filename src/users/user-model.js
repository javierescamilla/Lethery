let mongoose = require('mongoose');
mongoose.Promise = global.Promise;

let userSchema = mongoose.Schema({
    userId : {type : String},
    email : {type : String},
    password : {type : String},
    firstName : {type : String},
    isAdmin : {type : Boolean},
    lastName : {type : String},
    shippingAddress : {type : String},
    shippingZipCode : {type : String},
    shippingCity : {type : String},
    shippingState : {type : String},
    shippingCountry : {type : String},
});

let Uservar = mongoose.model('User', userSchema);

let UserMethods = {
    getUser : function(userId){
        return Uservar.findOne(userId)
				.then( blog => {
					return blog;
				})
				.catch( error => {
					throw Error( error );
				});
    },
    syncGetUser : function(userEmail){
        return Uservar.findOne(userEmail);
    },
    postUser : function(userInfo){
        return Uservar.create(userInfo)
                .then( blog => {
                    return blog;
                })
                .catch( err=> {
                    throw Error(err);   
                });
    },
    modifyUserInfo : function(userId, updatedUserInfo){
        return Uservar.updateOne(userId, updatedUserInfo)
                .then( blog => {
                    return blog;
                })
                .catch( err=> {
                    throw Error(err);   
                });
    },
    deleteUser :  function(userId){
        return Uservar.deleteOne(userId)
            .then( blog => {
                return blog;
            })
            .catch( err=> {
                throw Error(err);   
            });
    }
}

module.exports = { UserMethods };
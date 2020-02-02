let mongoose = require('mongoose');
mongoose.Promise = global.Promise;

let orderSchema = mongoose.Schema({
    userId : {type : String},
    items: {
        productId : {type : String},
        price: {type : Number},
        name : {type : String},
        category : {type : String},
        description : {type : String},
        imageUrl : {type : String},
        color : {type: String},
        ammount : {type: Number}
    },
    total : {type : Number},
    timestamp : {type : Number},
})

let OrderVar = mongoose.model('Order', orderSchema);

let OrderMethods = {
    getOrdersByUser : function(userId){
        return OrderVar.find(userId)
				.then( productResponse => {
					return productResponse;
				})
				.catch( error => {
					throw Error( error );
                });
    },
    postSortedOrder : function(orderInfo){
        return OrderVar.create(orderInfo)
                .then( productResponse => {
                    return productResponse;
                })
                .catch( err=> {
                    throw Error(err);   
                });
    }
}

module.exports = { OrderMethods };
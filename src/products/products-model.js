let mongoose = require('mongoose');
mongoose.Promise = global.Promise;

let productSchema = mongoose.Schema({
    productId : {type : String},
    price: {type : Number},
    name : {type : String},
    category : {type : String},
    description : {type : String},
    imageUrl : {type : String}
})

let ProductVar = mongoose.model('Product', productSchema);

let ProductMethods = {
    getProducts : function(params){
        return ProductVar.find(params)
				.then( productResponse => {
					return productResponse;
				})
				.catch( error => {
					throw Error( error );
                });
            
    },
    getNumberOfProducts : function(numberOdProducts){
        return ProductVar.find().limit(numberOdProducts)
				.then( productResponse => {
					return productResponse;
				})
				.catch( error => {
					throw Error( error );
                });
            
    },
    postProduct : function(productInfo){
        return ProductVar.create(productInfo)
                .then( productResponse => {
                    return productResponse;
                })
                .catch( err=> {
                    throw Error(err);   
                });
    },
    modifyProduct : function(productId, updatedProductInfo){
        return ProductVar.updateOne(productId, updatedProductInfo)
                .then( productResponse => {
                    return productResponse;
                })
                .catch( err=> {
                    throw Error(err);   
                });
    },
    deleteProduct :  function(productId){
        return ProductVar.deleteOne(productId)
            .then( blog => {
                return blog;
            })
            .catch( err=> {
                throw Error(err);   
            });
    }
}

module.exports = { ProductMethods };
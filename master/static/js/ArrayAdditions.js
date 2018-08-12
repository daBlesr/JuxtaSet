/**
 * Created by s115426 on 2-5-2017.
 */

/** ARRAY **/

Array.prototype.sum = function(){
    return this.reduce(function(a, b){ return a+ b;},0);
};

Array.prototype.getArrayByProperty = function(prop){
    return this.map(function(x){ return x[prop]});
};

Array.prototype.subtract = function(x) {
    return this.filter(function(y) {return x.indexOf(y) < 0;});
};

Array.prototype.intersect = function(x) {
    return this.filter(function(y) {return x.indexOf(y) >= 0;});
};

Array.prototype.union = function(x){
    var self = this;
    return this.concat(x.filter(function(y) {return self.indexOf(y) < 0;}));
};

Array.prototype.findByProperty = function(property, value){
    var i;
    for(i = 0; i < this.length; i++){
        if(this[i][property] === value){
            return this[i];
        }
    }
    return null;
};

Array.prototype.exists = function(a){
    return this.indexOf(a) > -1;
}
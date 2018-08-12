/**
 * Created by s115426 on 2-5-2017.
 */
/** SET **/

// MODIFIED EXAMPLE FROM http://stackoverflow.com/questions/31128855/comparing-ecma6-sets-for-equality

Set.prototype.equals = function(b){
    if(this.size !== b.size) return false;
    for(var i of this){
        if(!b.has(i)){
            return false;
        }
    }
    return true;
};


// from https://developer.mozilla.org/nl/docs/Web/JavaScript/Reference/Global_Objects/Set
Set.prototype.isSuperset = function(subset) {
    for (var elem of subset) {
        if (!this.has(elem)) {
            return false;
        }
    }
    return true;
};

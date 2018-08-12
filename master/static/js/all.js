String.prototype.truncate = function(x = 20){
    if(this.length > x) {
        return this.substr(0, x) + "..";
    }
    return this.toString();
};

function windowOpen(url){
    window.open(url, '_blank').focus();
}

var URL = new URI(window.location);
function getURL(){
    return new URI(window.location);
}

URI.prototype.go = function(){
    window.location = this;
};

function changeCSSRule(t){
    var s = document.getElementById('dynamicStyles');
    console.log(t);
    for(var i=0; i < t.length; i++){
        s.sheet.insertRule(t[i],s.sheet.cssRules.length);
    }
}

function addPallette(t){
    var n = document.getElementsByName('color-name')[0];
    if(n.value === ''){
        alert('give a name');
    } else{
        t.form.submit();
    }
}

String.prototype.ucfirst = function(){
  return this.slice(0,1).toUpperCase() + this.slice(1);
};
/**
 * Created by s115426 on 2-5-2017.
 */

function Column(col_name, col_num){
    this.colLabel = col_name;
    this.percentage = null;
    this.colNumber = col_num;
    this.cells = [];
    this.position = null;
    this.sorted = false;
    this.locked = false;
    this.reversed = false;
    this.filtered = false;
    this.filterLocked = false;
    this.description = globcategoryObj.filter(function(ant){return ant.category === col_name})[0].description;
    this.classification = globcategoryObj.filter(function(ant){return ant.category === col_name})[0].classificatie;
}

Column.prototype.setFiltered = function(bool){
    this.filtered = bool;
};

Column.prototype.setLockOnFilter = function(bool){
    this.filterLocked = bool;
};

Column.prototype.setSorted = function(bool){
  this.sorted = bool;
};

Column.prototype.setLocked = function(bool){
  this.locked = bool;

};

Column.prototype.reversedSort = function(bool){
  this.setSorted(true);
  this.reversed = bool;
};

Column.prototype.addCell = function(cell){
    this.cells.push(cell);
};

Column.prototype.setPosition = function(pos){
    this.position = pos;
};
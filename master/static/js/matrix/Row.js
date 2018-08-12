/**
 * Created by s115426 on 2-5-2017.
 */

/** ROW **/

function Row(label, percentage, percentage2, absolute){
    this.rowLabel = label;
    this.percentage = percentage;
    this.percentage2 = percentage2;
    this.rowNumber = undefined;
    this.cells = [];
    this.position = null;
    this.filtered = true;
    this.absolute = absolute;
}

Row.prototype.setFiltered = function(bool){
  this.filtered = bool;
};

Row.prototype.setRow = function(row){
    this.rowNumber = row;
};

Row.prototype.addCell = function(cell){
    this.cells.push(cell);
};

Row.prototype.setPosition = function(pos){
    this.position = pos;
};


Row.prototype.toLexicalRHS = function(totalColumns, rORl = 'r'){
    var sortableValue;
    var colIter;
    var i;
    var str = "";
    var colObj = {};

    for(i = 0; i < this.cells.length; i++){
        if(!this.cells[i].status && rORl === 'r'){
            sortableValue = "1";
        } else if(!this.cells[i].status && rORl === 'l'){
            sortableValue = "0";
        } else if(this.cells[i].status && rORl === 'r'){
            sortableValue = "0";
        } else{
            sortableValue = "1";
        }
        colObj[this.cells[i].column.position] = sortableValue;
    }

    for(colIter = 1; colIter < totalColumns; colIter++){
        if(colIter in colObj){
            str += colObj[colIter];
        } else{
            str += "0";
        }
    }
    return str;
};

Row.prototype.toLexicalLHS = function(totalColumns){
    return this.toLexicalRHS(totalColumns, 'l');
};

Row.prototype.computeImputedGram = function(totalRecords){
    var antibiogram = [];
    var self = this;
    this.imputationInformation.forEach(function (x) {
        var r = [
            x[1] / totalRecords * 100,
            self.cells.filter(function (cell) {
                return !cell.status && !x[0].exists(cell.column.colLabel);
            }).map(function (cell) {
                return cell.column.colLabel;
            }),
            self.cells.filter(function (cell) {
                return cell.status && !x[0].exists(cell.column.colLabel);
            }).map(function (cell) {
                return cell.column.colLabel;
            }),
            x[1]
        ];
        antibiogram.push(r);
    });
    return antibiogram;
};
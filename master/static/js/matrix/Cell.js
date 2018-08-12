/**
 * Created by s115426 on 2-5-2017.
 */

/** CELL **/

function Cell(row, column, status){
    this.row = row;
    this.column = column;
    this.status = status;
}

Cell.prototype.isSpecial = function(){
    return this.status == 0 || this.status == 2;
};
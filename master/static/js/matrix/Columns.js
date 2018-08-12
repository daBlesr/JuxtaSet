/**
 * Created by s115426 on 2-5-2017.
 */

PatternsMatrix.prototype.computeColumnFrequencies = function () {
    let unhighlightedCells;
    let cell;
    var self = this;
        this.columnList.forEach(function (col) {
            col.percentage = 0;
        });

        if(this.properties.cumulative) {
            unhighlightedCells = this.cells.filter(function (cell) {
                if(self instanceof ImputationBox) return cell.status === 2 && cell.row.filtered;
                return cell.status === 0 && cell.row.filtered;
            });
            for (let i = 0; i < unhighlightedCells.length; i++) {
                cell = unhighlightedCells[i];
                cell.column.percentage += cell.row.percentage;
            }
        } else if(this instanceof SubsetBox){
            this.columnList.map(function(col){
                for (let i = 0; i < self.parent.columnList.length; i++) {
                    var column = self.parent.columnList[i];
                    if(column.colLabel == col.colLabel){
                        col.percentage = column.percentage;
                    }
                }
            });
        }
};

PatternsMatrix.prototype.sortColumnsClicked = function(){
    if(this.columnsSorted === "columnsByFrequency"){
        this.columnsSorted = "columnsByName";
    } else if(this.columnsSorted === "columnsByName") {
        this.columnsSorted = "columnsByClassification";
    } else if(this.columnsSorted === "columnsByClassification"){
        this.columnsSorted = "columnsByFrequency";
    } else {
        this.columnsSorted = "columnsByName";
    }
    var a = this.columnsSorted;
    getViewBoxes().forEach(function(b){
       b.columnsSorted = a;
    });
    this.order(this.columnsSorted);
};
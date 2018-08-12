/**
 * Created by s115426 on 2-5-2017.
 */

PatternsMatrix.prototype.filterByColumns = function () {
    // deze kolommen moeten er uit
    var filteredColumns = this.columnList.filter(function (col) {
        return col.filtered;
    });
    var filteredRowList = this.rowList.filter(function (row) {
        return row.cells.filter(function (cell) {
                return filteredColumns.indexOf(cell.column) > -1 && (cell.isSpecial()) ;
            }).length === 0;
    });
    this.verticalSort(filteredRowList);
    //if(this.lockedRow && !filteredRowList.exists(this.lockedRow)){
    //    console.log(this.lockedRow, filteredRowList, this);
    //    this.unlockRow();
    //}
    this.resetScrollable();
    this.render();
};

PatternsMatrix.prototype.unfilterRows = function(){
  this.verticalSort(this.rowList);
  this.render();
};

PatternsMatrix.prototype.hoverColumnToggle = function(col, hover = true){
    getViewBoxes().forEach(function(b) {
        var boxCol = b.columnList.findByProperty('colLabel', col.colLabel);
        var toggles = b.columnToggles.selectAll("g").select(".toggle-inner")
                .filter(function(column){
                    return column === boxCol;
                });
        b.unlockRow(true);
        if ((boxCol.filterLocked && hover) || (!boxCol.filterLocked && !hover)) {
            toggles.transition().attr('class', "toggle-inner status0");
            b.removeColumnFromFilter(boxCol);
        } else {
            toggles.transition().attr('class', "toggle-inner whitefill");
            b.addColumnToFilter(boxCol);
        }
    });
};

PatternsMatrix.prototype.lockColumnToggle = function(col){
    getViewBoxes().forEach(function(b) {
        var boxCol = b.columnList.findByProperty('colLabel', col.colLabel);
        if (boxCol.filterLocked) {
            boxCol.setLockOnFilter(false);
        } else {
            boxCol.setLockOnFilter(true);
        }
        b.render();
    });
};

PatternsMatrix.prototype.addColumnToFilter = function (column) {
    column.setFiltered(true);
    this.filterByColumns();
    if(this instanceof SubsetBox){
        this.recomputeStatus();
    }
};

PatternsMatrix.prototype.removeColumnFromFilter = function (column) {
    column.setFiltered(false);
    this.filterByColumns();
    if(this instanceof SubsetBox){
        this.recomputeStatus();
    }
};

PatternsMatrix.prototype.filterBySharingLevel = function(column, sharing_level){
    var filteredRowList = this.rowList.filter(function (row) {
        return row.cells.filter(function(cell){
           return cell.column.colLabel === column && cell.isSpecial();
        }).length > 0 && row.cells.filter(function(cell){
           return cell.isSpecial();
        }).length === sharing_level;
    });
    this.verticalSort(filteredRowList);
    this.resetScrollable();
    this.render();
};

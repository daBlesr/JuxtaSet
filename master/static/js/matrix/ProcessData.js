/**
 * Created by s115426 on 2-5-2017.
 */

PatternsMatrix.prototype.processData = function () {
    // expects data of form:
    // [
    //      [ "PERCENTAGE" , [ "COLUMN1", "COLUMN2" ] ],
    //      [ "PERCENTAGE" , [ "COLUMN3" ] ],
    // ]
    var self = this;
    var cumulativePercentage = 0;
    var rowNumber = 1;
    var sets = this.properties.records.map(function(a){ return new Set(a[1])});

    this.properties.records.map(function (a, e) {
        var x;
        var i;
        var cell;
        var status;
        var column;
        var mostLeftBarValue;
        var row;
        var absolute;
        cumulativePercentage += parseFloat(a[0]);

        if (self.properties.ARM) {
            row = new Row('X-' + e + "-" + parseFloat(a[0]).toFixed(3), parseFloat(a[0]), 100 * parseFloat(a[3]));
        } else {
            if (self.properties.cumulative) {
                mostLeftBarValue = cumulativePercentage;
            } else {
                mostLeftBarValue = 0;
            }

            if(self instanceof ExactPatterns || self instanceof ImputationBox){
                absolute = a[3];
            } else if(self instanceof SubsetBox){
                absolute = a[2];
            }
            row = new Row('X-' + e + "-" + parseFloat(a[0]).toFixed(3), parseFloat(a[0]), mostLeftBarValue, absolute);
        }

        row.setRow(rowNumber);

        for (i = 0; i < a[1].length; i++) {
            column = self.columnList.findByProperty('colLabel', a[1][i]);

            status = 0;

            if(self instanceof SubsetBox){
                for(x = e + 1; x < sets.length; x++){
                    if(self.properties.records[x][2] < a[2]){
                        break;
                    }

                    if(sets[x].isSuperset(sets[e])){
                        status = 2;
                        break;
                    }
                }
            }

            // highlighting of cells
            if (self.properties.ARM && a[2].indexOf(a[1][i]) > -1) {
                status = 1;
            }

            cell = new Cell(row, column, status);

            self.cells.push(cell);
            row.addCell(cell);
            column.addCell(cell);

        }
        if (self instanceof ExactPatterns || self instanceof ImputationBox) {
            // measured not resistant
            for (i = 0; i < a[2].length; i++) {
                column = self.columnList.findByProperty('colLabel', a[2][i]);
                status = 1;
                cell = new Cell(row, column, status);

                self.cells.push(cell);
                row.addCell(cell);
                column.addCell(cell);
            }
        }

        row.setPosition(rowNumber);

        rowNumber++;
        self.rowList.push(row);
    });

    if(this instanceof ImputationBox) {
        this.rowList.forEach(function (row) {
            var emptyCells = self.properties.imputationIndex
                .subtract(row.cells.map(function(c){return c.column.colLabel;}));

            for (i = 0; i < emptyCells.length; i++) {
                var column = self.columnList.findByProperty('colLabel', emptyCells[i]);
                var status = 2;
                var cell = new Cell(row, column, status);

                self.cells.push(cell);
                row.addCell(cell);
                column.addCell(cell);
            }
        });
    }
};
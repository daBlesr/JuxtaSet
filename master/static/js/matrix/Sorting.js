/**
 * Created by s115426 on 2-5-2017.
 */
PatternsMatrix.prototype.sortableClicked = function (column, ctrl) {
    getViewBoxes().forEach(function(b){
        var boxCol = b.columnList.findByProperty('colLabel', column.colLabel);
        b.columnList.forEach(function (c) {
            if (c !== boxCol) {
                c.setSorted(false);
            }
        });

        // als de kolom al gesorteerd is, dan op locked zetten
        if (!boxCol.sorted) {
            boxCol.setSorted(true);
        }

        boxCol.reversedSort(false);
        b.defaultSorted = false;
        b.unlockRow(true);
        b.order("byColumn", boxCol, ctrl);
    });
};

PatternsMatrix.prototype.horizontalSort = function () {

    var self = this;
    var pos = 1;

    this.columnList.forEach(function (x) {
        x.setPosition(pos);
        pos++;
    });

    if (this.properties.showColumnBarChart) {
        this.columnBarChartOrdinal.domain(this.columnList.map(function (a) {
            return a.colLabel;
        }));
    }
};

PatternsMatrix.prototype.sortColumns = function (columns) {
    var self = this;
    console.log(this.columnList, this, columns);
    this.columnList = this.columnList.sort(function (col1, col2) {
        var y = columns.findByProperty('colLabel', col1.colLabel);
        var z = columns.findByProperty('colLabel', col2.colLabel);
        if (y && z) {
            return y.position - z.position;
        }
    });
    this.horizontalSort();
    this.render();
};


PatternsMatrix.prototype.verticalSort = function (slicedRowList) {
    var cumulativePercentage = 0;
    var self = this;
    var pos = 1;

    this.rowList.forEach(function (x) {
        x.setFiltered(false);
    });

    slicedRowList.forEach(function (x) {
        x.setPosition(pos);
        x.setFiltered(true);
        pos++;
    });

    this.visibleRowList = slicedRowList.filter(function (d) {
        // row is zichtbaar als: hij niet hidden is.. of als expand button opengeklapt is..
        return !self.rowHidden(d) || !self.collapsed;
    });

    this.visibleCells = this.cells.filter(function (cell) {
        return self.visibleRowList.indexOf(cell.row) > -1;
    });

    if (this.properties.extraInformationColumns) {
        this.visibleAdditionalColumnCells = this.additionalColumnCells.filter(function (cell) {
            return self.visibleRowList.indexOf(cell.row) > -1;
        });
    }

    this.rowsRightBarChartOrdinal.rangeRoundBands([0, this.SIZE_OF_CELL * slicedRowList.length], 0.1, 0);
    this.rowsLeftBarChartOrdinal.rangeRoundBands([0, this.SIZE_OF_CELL * slicedRowList.length], 0.1, 0);

    this.rowsRightBarChartOrdinal.domain(slicedRowList.map(function (a) {
        return a.rowLabel
    }));

    this.rowsLeftBarChartOrdinal.domain(slicedRowList.map(function (a) {
        return a.rowLabel
    }));

    if (this.properties.cumulative) {
        cumulativePercentage = 0;
        slicedRowList.forEach(function (a) {
            cumulativePercentage += a.percentage;
            a.percentage2 = cumulativePercentage;
        });
    }
};

PatternsMatrix.prototype.order = function (orderDescription, column, ctrl = false) {
    var additionColumnSort;
    var cellsOnThisColumn;
    var self = this;
    var i;
    var sorter = {
        horizontalSort: null,
        verticalSort: null,
    };

    if(orderDescription === "rowFrequency"){
        this.rowList = this.rowList.sort(function (row1, row2) {
            if(row2.percentage !== row1.percentage) return row2.percentage - row1.percentage;
            return row1.cells.filter(function(c){ return c.isSpecial();}).length -
                    row2.cells.filter(function(c){ return c.isSpecial();}).length;
        });

        sorter.verticalSort = true;
    } else if (orderDescription === "default") {
        this.rowList = this.rowList.sort(function (row1, row2) {
            if(row2.percentage !== row1.percentage) return row2.percentage - row1.percentage;
            return row1.cells.filter(function(c){ return c.isSpecial();}).length -
                    row2.cells.filter(function(c){ return c.isSpecial();}).length;
        });

        this.columnList = this.columnList.sort(function (col1, col2) {
            return col2.percentage - col1.percentage;
        });

        sorter.verticalSort = true;
        sorter.horizontalSort = true;

    } else if (orderDescription === "byColumn") {
        if(!ctrl){
            this.order("default");
        }

        cellsOnThisColumn = column.cells;

        // sorted is een lijst met nieuwe posities van kolommen.
        // de lijst is op volgorde van de kolommen die als eerst waren toegevoegd

        function columnSort(row1, row2) {
            var i;
            var cell2;
            var cell1;

            for(i = 0; i < row1.cells.length; i++){
                if(row1.cells[i].column === column){
                    cell1 = row1.cells[i];
                    break;
                }
            }

            for(i = 0; i < row2.cells.length; i++){
                if(row2.cells[i].column === column){
                    cell2 = row2.cells[i];
                    break;
                }
            }

            if (cell1 && !cell2) return -1;
            if (cell2 && !cell1) return +1;
            if (!cell1 && !cell2) return 0;
            if (cell1.isSpecial() && cell2.isSpecial())  return 0;
            if (cell1.isSpecial() && !cell2.isSpecial()) return -1;
            if (!cell1.isSpecial() && !cell2.isSpecial()) return 0;
            if (!cell1.isSpecial() && cell2.isSpecial()) return 1;
            throw 'impossible';
        }

        this.rowList = this.rowList.sort(function (row1, row2) {
            var s = columnSort(row1, row2);
            if (s === 0) {
                return stableSort(row1, row2);
            }
            return s;
        });
        sorter.verticalSort = true;

    } else if (orderDescription === "by Resistances") {
        sorter.verticalSort = d3.range(this.rowList.length).sort(function (a, b) {
            var resistantcells = self.rowList[a].cells.filter(function (x) {
                return !x.status;
            }).length;
            var resistanceCells2 = self.rowList[b].cells.filter(function (x) {
                return !x.status;
            }).length;
            if (resistantcells < resistanceCells2) {
                return 1;
            } else if (resistantcells === resistanceCells2) {
                // hier weten of this.rowList[a] boven this.rowList[b] staat voor stable search
                return stableSort(self.rowList[a], self.rowList[b]);
            } else {
                return -1;
            }
        });
    } else if (orderDescription === "columnsByFrequency"){
        this.columnList = this.columnList.sort(function (col1, col2) {
            return col2.percentage - col1.percentage;
        });
        sorter.horizontalSort = true;
    } else if( orderDescription === "columnsByName") {
        this.columnList = this.columnList.sort(function (col1, col2) {
            var colLabel1 = col1.colLabel.toLowerCase();
            var colLabel2 = col2.colLabel.toLowerCase();
            if(colLabel1 < colLabel2) return -1;
            if(colLabel1 > colLabel2) return 1;
            return 0;
        });
        sorter.horizontalSort = true;
    } else if(orderDescription === "columnsByClassification") {
        this.columnList = this.columnList.sort(function (col1, col2) {
            var class1 = col1.classification;
            var class2 = col2.classification;
            if(class1 === "" && class2 !== "") return 1;
            if(class1 !== "" && class2 === "") return -1;
            if(class1  < class2) return -1;
            if(class1 > class2) return 1;
            return col2.percentage - col1.percentage;
        });
        sorter.horizontalSort = true;
    } else{
        throw "Unknown sort";
    }

    if (sorter.verticalSort) {
        this.verticalSort(this.rowList);
    }

    if (sorter.horizontalSort) {
        this.horizontalSort();
        getViewBoxes().forEach(function(b) {
            //b.horizontalSort();
            if(b !== self) {
                b.sortColumns(self.columnList);
            }
        });
    }
    this.filterByColumns();
};
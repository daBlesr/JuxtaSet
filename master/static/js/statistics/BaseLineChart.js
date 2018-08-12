/**
 * Created by s115426 on 17-6-2017.
 */

BaseLineChart = function (parent, exactpatterns, g) {
    var self = this;
    this.parent = parent;
    this.g = g.append("g").attr("transform", "translate(" + [0, 40] + ")");
    this.exactpatterns = exactpatterns;
    this.lineHeight = 23;
    this.barHeight = 17;
    this.columnsLabels = this.g.append("g");
    this.row = null;

    this.columnsLabels.selectAll("text")
        .data(this.exactpatterns.columnList).enter()
        .append("text")
        .text(function (col) {
            return col.colLabel.truncate(10);
        });

    this.columnsLabels.selectAll("text")
        .attr("y", function (d, i) {
            return i * self.lineHeight + 15;
        })
        .attr("x", 40)
        .style("text-anchor", "end");

    this.nestingLabels = this.g.append("g");
    this.nestingLabels.selectAll("text")
        .data(d3.range(1, 10)).enter()
        .append("text")
        .text(function (d) {
            return d;
        });

    this.nestingLabels.selectAll("text")
        .attr("y", -3)
        .attr("x", function (d, i) {
            return (i + 1) * 50 + 20;
        })
        .style("text-anchor", "start");

    this.sharingData = [];
    this.maxNestingValue = 0;

    this.exactpatterns.columnList.forEach(function (col) {
        for (var i = 1; i < 10; i++) {
            self.sharingData.push({label: col.colLabel, nesting: i, value: 0});
        }
    });

    this.labels = this.exactpatterns.columnList.map(function (col) {
        return col.colLabel;
    });

    this.exactpatterns.rowList.forEach(function (row) {
        var cols = row.cells.filter(function (cell) {
            return cell.status === 0;
        }).map(function (cell) {
            return cell.column.colLabel;
        });
        self.sharingData.forEach(function (d) {
            if (cols.length === d.nesting && cols.exists(d.label)) {
                d.value += row.absolute;
                if (d.value > self.maxNestingValue) {
                    self.maxNestingValue = d.value;
                }
            }
        });
    });

    this.bars = this.g.append("g");
    this.bars.selectAll("g")
        .data(this.sharingData).enter()
        .append("g").append("rect");

    this.bars.selectAll("g").select("rect")
        .attr("x", function (d) {
            return 20 + d.nesting * 50;
        })
        .attr("y", function (d) {
            return self.labels.indexOf(d.label) * self.lineHeight + (self.lineHeight - self.barHeight) / 2;
        })
        .attr("height", self.barHeight)
        .attr('class', "status0")
        .style("cursor", "pointer")
        .on('mouseover', function () {
            d3.select(this).classed("hovered", true);
        })
        .on('mouseout', function () {
            d3.select(this).classed("hovered", false);
        })
        .on('click', function (d) {
            self.exactpatterns.filterBySharingLevel(d.label, d.nesting);
        });

    this.highlightedBars = this.g.append("g");
    this.highlightedBars.selectAll("g")
        .data(this.sharingData).enter()
        .append("g").append("rect");

    this.parent.baselinechartCollapsable.setChildren([this]);
    this.render();
};

BaseLineChart.prototype.loadNewData = function (row) {
    this.row = row;
    if(this.parent.baselinechartCollapsable.collapsableChartsCollapsed) {
        return;
    }
    this.render();
};

BaseLineChart.prototype.render = function () {
    var self = this;
    this.bars.selectAll("g").select("rect")
        .transition().duration(500).ease("linear")
        .attr("width", function (d) {
            if(self.parent.absolute){
                return d.value * 48 / self.maxNestingValue;
            }
            var s = d3.sum(self.sharingData.filter(function(x){
                return x.label === d.label;
            }).map(function(x){ return x.value;}));
            if(s > 0) return d.value * 48 / s;
            return 0;
        });

    if(!this.row){
        return;
    }
    var supersetRows;
    var colsSet;
    var row = this.row;
    var nest;
    var cols = row.cells.filter(function (cell) {
        return cell.isSpecial();
    }).map(function (cell) {
        return cell.column.colLabel;
    });
    var colsNot = row.cells.filter(function (cell) {
        return cell.status === 1;
    });
    var absolutes = {};
    if (colsNot.length === 0) {

        colsSet = new Set(cols);
        supersetRows = [];
        this.exactpatterns.rowList.forEach(function(r){
            var columnsInRow = r.cells.filter(function(cell){ return cell.isSpecial();})
                    .map(function(cell){ return cell.column.colLabel;});
            var colsSet2 = new Set(columnsInRow);
            if(colsSet2.isSuperset(colsSet)){
                supersetRows.push([columnsInRow, r.absolute]);
                for (nest = cols.length; nest < 10; nest++) {
                    if (columnsInRow.length === nest) {
                        if (nest in absolutes) {
                            absolutes[nest] += r.absolute;
                        } else {
                            absolutes[nest] = r.absolute;
                        }
                    }
                }
            }
        });
    } else {
        absolutes[cols.length] = row.absolute;
    }

    this.sharingData.forEach(function (d) {
        var ab;
        d.highlighted = 0;
        for (ab in absolutes) {
            if (parseInt(ab) === d.nesting && cols.exists(d.label)) {
                d.highlighted = absolutes[ab];
            }
        }
    });

    this.highlightedBars.selectAll("g").select("rect")
        .on('click', function (d) {
            self.exactpatterns.filterBySharingLevel(d.label, d.nesting);
        })
        .transition().duration(500).ease("linear")
        .attr("x", function (d) {
            return 20 + d.nesting * 50;
        })
        .attr("y", function (d) {
            return self.labels.indexOf(d.label) * self.lineHeight + (self.lineHeight - self.barHeight) / 2;
        })
        .attr("width", function (d) {
            if(self.parent.absolute){
                return d.highlighted * 48 / self.maxNestingValue;
            }
            var s = d3.sum(self.sharingData.filter(function(x){
                    return x.label === d.label;
            }).map(function(x){ return x.value;}));
            if(s > 0) return d.highlighted * 48 / s;
            return 0;

        })
        .attr("height", self.barHeight)
        .attr('class', "hovered");
};


BaseLineChart.prototype.switchRelativeAbsolute = function(){
    this.render();
};

BaseLineChart.prototype.removeData = function(){
    this.row = null;
    this.highlightedBars.selectAll("g").select("rect")
        .transition().duration(500).ease("linear")
        .attr("width", function (d) {
            return 0;
        });
};
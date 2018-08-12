// started with http://bl.ocks.org/ianyfchang/8119685
// but it is extremely customized, with hardly any overlap still.

PatternsMatrix = function (givenProperties) {
    var cumulativeTextDescr;
    var defaultProperties;
    var i;
    var cell;
    var fakeSpan;
    var height;
    var self;
    var maxLengthCollabel;
    console.log(this);
    this.LENGTH_OF_BARS = 40;
    this.OFFSET_BAR = 10;
    this.SPACE_BARS = this.LENGTH_OF_BARS + this.OFFSET_BAR;
    this.MIN_LENGTH_BAR = 0.5;
    this.X_OFFSET_TEXT_ON_BAR = 2;
    this.Y_OFFSET_TEXT_ON_BAR = 12;
    this.CUT_OFF_POINT_TEXT_ON_BAR = 38;

    this.Y_OFFSET_SORTABLES = -10;
    this.SPACE_SORTABLES = 15;
    this.OFFSET_QUERIABLES = 12;
    this.SPACE_QUERIABLES = 10;

    this.SPACE_VERTICAL_BAR_LABELS = 20;

    this.SIZE_OF_CELL = 18;
    this.HEIGHT_OF_TITLE = 30;

    defaultProperties = {
        records: [],
        columns: [],
        ARM: false,
        absolute_number_of_records: 0,
        cache_id: null,
        svg_element: givenProperties.svg_element ? null : d3.select("#chart").append("svg"),
        marginLeft: 500,
        marginTop: null,
        showColumnBarChart: true,
        showColumnLabels: true,
        cumulative: true,
        numberOfItemsShown: 30,
        parent: null,
        showCartograph: false,
        legendObjects: [],
    };

    this.properties = Object.assign(defaultProperties, givenProperties);

    if (this.properties.records.length === 0) {
        return;
    }

    this.cells = [];
    this.rowList = [];
    this.columnList = this.properties.columns.map(function (a, e) {
        var c = new Column(a, e + 1);
        c.setPosition(e + 1);
        return c;
    });

    self = this;

    this.parent = this.properties.parent;

    this.rowHidden = function (d) {
        return d.position > self.properties.numberOfItemsShown;
    };

    this.collapsed = true;

    this.processData();

    /** -------- DEFINE TOP MARGIN BASED ON THE LENGTH OF THE LONGEST LABEL --------- */

    if (this.properties.showColumnLabels) {
        maxLengthCollabel = "";
        for (i = 0; i < this.columnList.length; i++) {
            if (this.columnList[i].colLabel.length > maxLengthCollabel.length) {
                maxLengthCollabel = this.columnList[i].colLabel.truncate();
            }
        }

        fakeSpan = document.createElement('span');
        fakeSpan.innerText = maxLengthCollabel;
        document.querySelector("body").appendChild(fakeSpan);
        this.textMargin = fakeSpan.offsetWidth;
        document.querySelector("body").removeChild(fakeSpan);
    }

    /**  ------- END DEFINE TOP MARGIN BASED ON THE LENGTH OF THE LONGEST LABEL ------ */

    /** CONSTANTS */

    this.WIDTH_OF_CELLBOX = this.SIZE_OF_CELL * this.properties.columns.length + 2;
    height = this.SIZE_OF_CELL * this.rowList.length;
    if(this.rowList.length > this.properties.numberOfItemsShown){
        this.HEIGHT_OF_CELLBOX = this.properties.numberOfItemsShown * this.SIZE_OF_CELL + 2;
    } else{
        this.HEIGHT_OF_CELLBOX = this.rowList.length * this.SIZE_OF_CELL + 2;
    }
    this.WIDTH_SPACE_RIGHT_SIDE_BOX = 60;
    this.WIDTH_SPACE_LEFT_SIDE_BOX = (this.properties.cumulative ? 3 : 2 ) * this.SPACE_BARS;

    this.MARGIN_LEFT = this.properties.marginLeft;
    if(this.properties.marginTop !== null){
        this.MARGIN_TOP = this.properties.marginTop;
    } else{
        this.MARGIN_TOP = (this.properties.showColumnLabels ? this.textMargin : 0) +
            (this.properties.showColumnBarChart ? this.SPACE_BARS + this.SPACE_VERTICAL_BAR_LABELS : 0) +
            this.SPACE_SORTABLES + this.SPACE_QUERIABLES + 12 + this.HEIGHT_OF_TITLE;
    }
    this.MARGIN_LEFT = this.properties.marginLeft;
    this.OFFSET_TOP = (this.properties.showColumnLabels ? this.textMargin : 0) +
            (this.properties.showColumnBarChart ? this.SPACE_BARS + this.SPACE_VERTICAL_BAR_LABELS : 0) +
            this.SPACE_SORTABLES + this.SPACE_QUERIABLES + 12 + this.HEIGHT_OF_TITLE;
    /** END CONSTANST */

    this.visibleRowList = this.rowList.filter(function (d) {
        return !self.rowHidden(d);
    });

    this.visibleCells = this.cells.filter(function (d) {
        return !self.rowHidden(d.row);
    });

    this.lockedRow = null;
    this.hoveredRow = null;
    this.rowTimer = null;
    this.requestedImputationInformation = [];

     this.svg = this.properties.svg_element
        .attr("width", 1600)
        .attr("height", 900)
        .append("g")
        .attr("transform", "translate(" + this.MARGIN_LEFT + "," + this.MARGIN_TOP + ")");

     this.symbolBox = this.svg.append("g")
         .style("stroke-width",2)
         .attr("transform","translate(" + [this.columnList.length * this.SIZE_OF_CELL / 2 - (this.properties.title.length / 2 * 10.2 + 46), -this.OFFSET_TOP + 20 - 15] + ")");

     this.symbolBoxRight = this.svg.append("g")
         .attr("transform","translate(" + [this.columnList.length * this.SIZE_OF_CELL / 2 + (this.properties.title.length / 2 * 9.2 + 15), -this.OFFSET_TOP + 20 - 15] + ")");


     this.svg.append("text")
         .attr("transform","translate(" + [this.columnList.length * this.SIZE_OF_CELL / 2, -this.OFFSET_TOP + 20] + ")")
         .attr("text-anchor","middle")
         .style("font-size",20)
         .attr("class","view-title")
         .text(this.properties.title)
         .on('click', function(){
             if(helper.isHelping){
                 return helper.provideHelp("title",null,self);
             }
         });



    this.svg.append("text")
        .text("%")
        .style("font-size", 11)
        .attr("x", -45)
        .attr("y", -8);

    cumulativeTextDescr = this.svg.append("text")
        .attr("x", -98)
        .attr("y", -8);

    cumulativeTextDescr.append("tspan")
        .text(this.properties.cumulative ? "%cumu" : "")
        .style("font-size", 11);

    this.defaultSorted = true;

    this.percentageSortable = this.svg.append("g")
        .style("cursor","pointer")
        .attr("transform", function() {
            return "translate(" + [-25,-10] + ")";
        })
        .on("click", function () {
            getViewBoxes().forEach(function(b){
                b.defaultSorted = true;
                b.columnList.forEach(function (c) {c.setSorted(false);});
                b.order("default");
            });
        });

    this.percentageSortable.append("rect")
        .attr("class","seethrough")
        .attr("x",-this.SIZE_OF_CELL / 2)
        .attr("y",-this.SIZE_OF_CELL / 2)
        .attr("width",this.SIZE_OF_CELL)
        .attr("height", this.SIZE_OF_CELL);

    this.percentageSortable.append("path")
        .attr("d", d3.svg.symbol().type('triangle-down')());

    this.upsetHighlighter = this.svg.append("g");
    this.cellBlockBox = this.svg.append("g")
        .style("cursor","pointer")
        .on("mousemove",function(){
            self.triggerMouseMove(this);
        })
        .on("mouseleave", function(){
            self.unhighlightSelected();
        }).on("click", function(){
            var mouseCoordinates = d3.mouse(this);
            var xPositionHovered = parseInt(mouseCoordinates[1] / self.SIZE_OF_CELL) + 1;
            var rowClicked = self.visibleRowList.findByProperty('position', xPositionHovered);
            if(rowClicked){
                self.rowClicked(rowClicked);
            }
        });
    this.cellBlockBox.append("rect")
        .attr("width",this.WIDTH_OF_CELLBOX)
        .attr("height",this.HEIGHT_OF_CELLBOX)
        .style("fill","rgba(255,255,255,0)");
    this.horizontal_swim_lanes = this.cellBlockBox.append("g");

    this.currentNumberOfPatterns = this.svg.append("text")
        .style("font-size",9)
        .attr("x", this.WIDTH_OF_CELLBOX - 40)
        .attr("y", this.HEIGHT_OF_CELLBOX + 10)
        .style("text-anchor","right")
        .text((this.rowList.length > this.properties.numberOfItemsShown ? this.properties.numberOfItemsShown : this.rowList.length) + "/" + this.rowList.length);

    /* ------------- BEGIN BAR CHART -------------- */
    if (this.properties.showColumnBarChart) {
        this.computeColumnFrequencies();

        this.initialColumnValues = this.columnList.map(function (col) {
            return {column: col, percentage: col.percentage};
        });

        this.columnBarChartOrdinal = d3.scale.ordinal()
            .rangeRoundBands([0, this.WIDTH_OF_CELLBOX], 0.1, 0);

        this.columnBarChartScale = d3.scale.linear()
            .range([this.LENGTH_OF_BARS, 0]);

        this.columnBarChartOrdinal.domain(this.columnList.map(function (d) {
            return d.colLabel;
        }));
        this.columnBarChartScale.domain([0, d3.max(this.columnList, function (d) {
            return d.percentage;
        })]);

        this.columnBarChartBars = this.svg.append("g");

        this.verBarChartLabels = this.svg.append("g");
    }


    /* ------------- END VERTICAL BAR CHART -------------- */

    /* ------------- BEGIN HORIZONTAL BAR CHART -------------- */

    this.rowsRightBarChartOrdinal = d3.scale.ordinal()
        .rangeRoundBands([0, height], 0.1, 0);

    this.rowsRightBarChartLinear = d3.scale.linear()
        .range([0, this.LENGTH_OF_BARS]);

    this.rowsRightBarChartLinear.domain([0, 100]);
    this.rowsRightBarChartOrdinal.domain(this.rowList.map(function (d) {
        return d.rowLabel;
    }));

    this.horbars = this.svg.append("g");

    this.maxCumuBarValue = d3.max(this.rowList, function (d) {
        return d.percentage2;
    });

    this.rowsLeftBarChartOrdinal = d3.scale.ordinal()
        .rangeRoundBands([0, height], 0.1, 0);

    this.rowsLeftBarChartLinear = d3.scale.linear()
        .range([0, this.LENGTH_OF_BARS]);

    this.rowsLeftBarChartLinear.domain([0, this.maxCumuBarValue]);

    this.rowsLeftBarChartOrdinal.domain(this.rowList.map(function (d) {
        return d.rowLabel;
    }));

    this.left_outer_bar_chart = this.svg.append("g");

    this.sparkline = this.svg.append("g");
    this.sparklineVerticalAxes = d3.scale.linear()
        .range([0, this.rowsRightBarChartOrdinal.rangeBand()]);
    self.sparklineVerticalAxes.domain([-1,1]);
    this.sparklineHorizontalAxes = d3.scale.ordinal()
        .rangePoints([0, this.LENGTH_OF_BARS + 10]);

    this.sparklineLocation = function(points){
      return points.map(function(point){
         return [self.sparklineHorizontalAxes(point[0]), self.rowsRightBarChartOrdinal.rangeBand() - self.sparklineVerticalAxes(point[1])];
      });
    };

    this.sparklineFunc = d3.svg.line().interpolate("basis");


    /* ------------- END HORIZONTAL BAR CHART -------------- */

    /* ------------- LABELS -------------- */
    this.classificationlines = this.svg.append("g");
    if (this.properties.showColumnLabels) {
        this.columnLabels = this.svg.append("g");
    }

    /* ------------- END LABELS -------------- */

    /* ------------- BEGIN CELLS -------------- */

    this.cells_g = this.cellBlockBox.append("g");
    this.inter_cell_lines = this.cellBlockBox.append("g").attr("class", "inter-cell-line");

    if(this.rowList.length > this.properties.numberOfItemsShown){
        this.scrollbar = this.svg.append("g")
            .attr("transform","translate(" + [this.WIDTH_OF_CELLBOX + 5] + ")");

        this.scrollbar.append("line")
            .attr("y1",0)
            .attr("y2",this.HEIGHT_OF_CELLBOX)
            .style("stroke","#f2f2f2")
            .style("stroke-width",10)
            .style("cursor","pointer")
            .on('mousedown', function(){
                 var m = d3.mouse(this);
                 self.scrollDrag(m[1] - self.scrollPosY);
            });

        this.drag = d3.behavior.drag();
        this.dragging = false;
        this.drag.on("drag",function(d){
            d3.event.sourceEvent.stopPropagation();
            self.scrollDrag(d3.event.dy);
        });
        this.drag.on("dragend",function(){
           self.dragging = false;
           self.render();
        });

        this.length_scrollbar =  this.properties.numberOfItemsShown / this.rowList.length * this.HEIGHT_OF_CELLBOX;
        this.scrollCellsPerPixel = (this.rowList.length - this.properties.numberOfItemsShown)/(this.HEIGHT_OF_CELLBOX - this.length_scrollbar);

        this.scrollPosY = 0;
        this.scrolledElements = 0;
        this.scroller = this.scrollbar.append("line")
            .attr("y1",0)
            .attr("y2",this.length_scrollbar)
            .attr("class","stroke-status0")
            .style("stroke-width",10).style("cursor","pointer")
            .call(this.drag);
        this.scrollUp = this.svg.append("g")
            .attr("class","status0-with-hover")
            .attr("transform","translate(" + [this.WIDTH_OF_CELLBOX + 5, -8] +")")
            .on('click', function(){
                self.scrollDrag( - 1 / self.scrollCellsPerPixel);
            })
            .on('mousedown', function(){
                this.scrollinterval = setInterval(function(){
                    self.scrollDrag( -1 / self.scrollCellsPerPixel);
                },200);
            })
            .on('mouseup', function(){
                clearInterval(this.scrollinterval);
            });
        this.scrollUp.append("path")
            .attr("d",d3.svg.symbol().size(50).type("triangle-up"));
        this.scrollDown = this.svg.append("g")
            .attr("class","status0-with-hover")
            .attr("transform","translate(" + [this.WIDTH_OF_CELLBOX + 5, +8 + this.HEIGHT_OF_CELLBOX] +")")
            .on('click', function(){
                self.scrollDrag( 1 / self.scrollCellsPerPixel);
            })
            .on('mousedown', function(){
                this.scrollinterval = setInterval(function(){
                    self.scrollDrag( 1 / self.scrollCellsPerPixel);
                },200);
            })
            .on('mouseup', function(){
                clearInterval(this.scrollinterval);
            });
        this.scrollDown.append("path")
            .attr("d",d3.svg.symbol().size(50).type("triangle-down"));
    }

    /* ------------- END CELLS -------------- */
    /* ------------- SWIM LANES -------------- */


    /* ------------- END SWIM LANES ---------- */

    /* ---------- BEGIN SORT TRIANGLES ----------- */

    this.sortables = this.svg.append("g").style("cursor","pointer");

    this.columnSortable = this.svg.append("g")
        .attr("class","status0-with-hover")
        .attr("transform","translate(" +[-40,-60]+ ")")
        .on('click', function(){
            self.sortColumnsClicked();
        });
    this.columnSortable
        .append("rect")
        .attr("width", this.SIZE_OF_CELL)
        .attr("height", this.SIZE_OF_CELL)
        .style("fill", "rgba(255,255,255,0)");

    this.columnSortable
        .append("path")
//        .attr("class","status0")
        .attr("d",HOR_SORT_PATH);

    /* ---------- END SORT TRIANGLES ----------- */

    this.columnToggles = this.svg.append("g");
    this.visibleColumnList = this.columnList;

    this.icons = this.svg.append("g");
    this.imputationOnCells = this.svg.append("g");

    this.legend = this.svg.append("g")
        .attr("transform","translate("+[-self.OFFSET_BAR ,this.HEIGHT_OF_CELLBOX + 30]+")");

    if(this.columnList.length > 6)
        this.drawLegend();

};

PatternsMatrix.prototype.requestDataForMultipleRows = function (ids, datatype, callback) {
    var urlarg = 'sparklines';
    if(datatype == 'imputationInformation'){
        urlarg = 'before-imputation';
    }
    var pattern_ids = ids.join(",");
    var self = this;
    var filter = create_shallow_filter();
    var extraInfo = "";
    if(self instanceof ImputationBox && self.properties.fromRow){
         extraInfo = self.properties.fromRow.rowNumber;
    }
    if (pattern_ids.length) {
        extractSettingsAndSendRequest({
            url: base_url + "data-for-resistant-patterns/patterns/" + pattern_ids + "/" + urlarg + "/" + self.constructor.name + "/" + extraInfo,
            callback: function (a) {
                a.forEach(function (x) {
                    var row = self.rowList.findByProperty('rowNumber', x[0]);
                    if(row){
                        row[datatype] = x[1];
                    }
                });
                callback(datatype,a);
            }
        }, filter);
    } else {
        callback(datatype);
    }
};
/**
PatternsMatrix.prototype.colorRows = function (info, key, value) {
    var colouring_rows = [];
    var self = this;
    this.visibleRowList.forEach(function (row) {
        var valuesForKey = row[info][key];
        var exists = valuesForKey.filter(function (y) {
            return y[0] === String(value) && y[1] > 0;
        });
        if (exists.length > 0) {
            colouring_rows.push(row);
        }
    });

    this.highlightRows(colouring_rows);
};
*/

PatternsMatrix.prototype.highlightSpecificCells = function(cols){
    var colsSet = new Set(cols);
    var rowsWithHighlightedCells = [];
    for(var i=0; i < this.visibleRowList.length; i++){
        var colsSet2 = new Set(
            this.visibleRowList[i].cells.filter(function(cell){ return cell.isSpecial();})
                .map(function(cell){ return cell.column.colLabel;})
        );
        if( (this instanceof ExactPatterns && colsSet2.isSuperset(colsSet)) ||
            (this instanceof SubsetBox && colsSet.isSuperset(colsSet2))
        ) {
            rowsWithHighlightedCells.push(this.visibleRowList[i]);
        }
    }
    this.unhighlightSpecificCells();
    this.cells_g.selectAll("g").each(function (cell) {
        if(cols.exists(cell.column.colLabel) && rowsWithHighlightedCells.exists(cell.row)){
            d3.select(this.firstChild).classed('hovered', true);
        }
    });
    this.inter_cell_lines.selectAll("g").each(function(row){
        d3.select(this).selectAll("line").classed('hovered', rowsWithHighlightedCells.exists(row));
    });
};

PatternsMatrix.prototype.unhighlightSpecificCells = function(){
    this.cells_g.selectAll("g").each(function (cell) {
        d3.select(this.firstChild).classed('hovered', false);
    });
    this.inter_cell_lines.selectAll("g").each(function(row){
        d3.select(this).selectAll("line").classed('hidden', false);
    });
};

PatternsMatrix.prototype.triggerMouseMove = function(e, col=null){
    var url;
    var f;
    var cb;
    var colHovered;
    var yPositionHovered;
    var rowHovered;
    var xPositionHovered;
    var mouseCoordinates;
    var otherColumnsHovered = [];
    var otherColumnLabelsHovered = [];
    var colLabelHovered = null;
    var self = this;

    if (!this.lockedRow) {
        if(col){
            rowHovered = null;
            colHovered = col;
        } else{
            mouseCoordinates = d3.mouse(e);
            xPositionHovered = parseInt(mouseCoordinates[1] / this.SIZE_OF_CELL) + 1;
            yPositionHovered = parseInt(mouseCoordinates[0] / this.SIZE_OF_CELL) + 1;
            rowHovered = this.visibleRowList.findByProperty('position', xPositionHovered);
            colHovered = this.columnList.findByProperty('position', yPositionHovered);

            if(rowHovered){
                otherColumnsHovered = rowHovered.cells.filter(function(cell){
                    return cell.isSpecial();
                }).map(function(cell){
                   return cell.column;
                });
                if(colHovered) {
                    otherColumnsHovered.push(colHovered);
                }
                otherColumnLabelsHovered = otherColumnsHovered.map(function(col){
                   return col.colLabel;
                });
                this.hoveredRow = rowHovered;
            }
        }

        if(colHovered){
            colLabelHovered = colHovered.colLabel;
        }

        if(colHovered) {
            this.svg.selectAll(".highlighter-on-background").classed("verticalbar", function (swimlaneCol) {
                return colHovered === swimlaneCol;
            });

            this.columnLabels.selectAll(".colLabel").classed("hovered", function (swimLaneColumn) {
                return otherColumnsHovered.exists(swimLaneColumn);
            });

            if (this instanceof ExactPatterns && this.subsetBox) {

                this.subsetBox.columnLabels.selectAll(".colLabel").classed("hovered", function (swimLaneColumn) {
                    return otherColumnLabelsHovered.exists(swimLaneColumn.colLabel);
                });
                this.subsetBox.svg.selectAll(".highlighter-on-background").classed("verticalbar", function (swimLaneColumn) {
                    return colLabelHovered === swimLaneColumn.colLabel;
                });
            } else if (this instanceof SubsetBox) {
                this.parent.columnLabels.selectAll(".colLabel").classed("hovered", function (swimLaneColumn) {
                    return otherColumnLabelsHovered.exists(swimLaneColumn.colLabel);
                });
                this.parent.svg.selectAll(".highlighter-on-background").classed("verticalbar", function (swimLaneColumn) {
                    return colLabelHovered === swimLaneColumn.colLabel;
                });
            }

            if(rowHovered){
                if(this.rowTimer){
                    if(this.rowTimer.row === rowHovered){
                        // op dezelfde regel gebleven. maak geen nieuwe timer aan
                    } else{
                        // timer bestaat maar is nu andere row. verwijder timer
                        if(window.statisticalCharts) window.statisticalCharts.removeData();
                        this.clearRowTimer();
                        this.rowTimer = {
                            row: rowHovered,
                            timer: setTimeout(function(){
                                self.triggerStatisticsInformationForRow(rowHovered);
                            },400)
                        };
                    }
                } else{
                    // timer bestaat niet, maak timer aan
                    if(window.statisticalCharts) window.statisticalCharts.removeData();
                    this.rowTimer = {
                        row: rowHovered,
                        timer: setTimeout(function(){
                            self.triggerStatisticsInformationForRow(rowHovered);
                        },400)
                    };
                }

                this.svg.selectAll(".horbar-g").select("text").classed("hovered", function (row) {
                    return rowHovered === row;
                });
                if(!(this instanceof ImputationBox)){
                    d3.selectAll(".swimLanes-hor").classed("hidden", function (swimlaneRow) {
                        return swimlaneRow !== rowHovered;
                    });

                    d3.selectAll(".material-icon").classed("hidden", function (icon_row) {
                        return icon_row !== rowHovered;
                    });
                }
                if (!this.lockedRow) {
                    this.highlightRow(rowHovered);
                }
            }
        }
    }
};

PatternsMatrix.prototype.clearRowTimer = function(){
    if(this.rowTimer){
        clearTimeout(this.rowTimer.timer);
    }
    this.rowTimer = null;
};

PatternsMatrix.prototype.unhighlightSelected = function(){
    if(this.lockedRow) return;
    this.clearRowTimer();
    this.svg.selectAll(".highlighter-on-background").classed("verticalbar", false);
    this.columnLabels.selectAll(".colLabel").classed("hovered", false);
    d3.selectAll(".colLabel").classed("hovered", false);
    d3.selectAll(".highlighter-on-background").classed("verticalbar", false);
    d3.selectAll(".horbar-g").select("text").classed("hovered", false);
    d3.selectAll(".swimLanes-hor").classed("hidden", true);
    d3.selectAll(".material-icon").classed("hidden", true);
    if(window.statisticalCharts) window.statisticalCharts.removeData();
    window.exactPatterns.inter_cell_lines.selectAll("line").classed("hovered", false);
    window.subsetBox.inter_cell_lines.selectAll("line").classed("hovered", false);
    this.unhighlightSpecificCells();
    this.unhighlightRow();
};

PatternsMatrix.prototype.triggerStatisticsInformationForRow = function(row){
    var self = this;
    var f, url;
    if (this instanceof ExactPatterns || this instanceof SubsetBox) {
        url = '';
        f = create_shallow_filter();
        if(this instanceof SubsetBox) {
            f.addFilter('pattern_contains', this.selectSubset(row), 'AND');
            url = base_url + 'statistics';
        } else {
            url = base_url + 'statistics-resistance-pattern/cache/' + this.properties.cache_id + "/pattern/" + row.rowNumber;
        }
        cb = function (a) {
            if (row === self.hoveredRow) {
                window.statisticalCharts.loadNewData(a, f,row);
            }
            row.statisticalInformation = a;
        };
        if (!row.statisticalInformation && !row.hasRequestedStatisticalInformation) {
            row.hasRequestedStatisticalInformation = true;
            extractSettingsAndSendRequest({
                url: url,
                callback: cb,
            }, f);
        } else if(row.statisticalInformation && this.hoveredRow === row && window.statisticalCharts) {
            window.statisticalCharts.loadNewData(row.statisticalInformation,f,row);
        }
    }
};

PatternsMatrix.prototype.highlightRow = function(row){
    var self = this;
    this.cells_g.selectAll("g").each(function (cell) {
        if(self instanceof ImputationBox){
            if(cell.status === 0)
                d3.select(this.firstChild).classed('hovered', cell.row === row);
        } else if(cell.isSpecial()){
            d3.select(this.firstChild).classed('hovered', cell.row === row);
        }

    });
    this.inter_cell_lines.selectAll("g").each(function(row2){
        if(self instanceof ImputationBox){
            d3.select(this).selectAll("line").each(function(line){
                if(d3.select(this).classed("stroke-status0")){
                    d3.select(this).classed("hovered", row === row2);
                }
            });
        } else{
            d3.select(this).selectAll("line").classed('hovered', row === row2);
        }
    });

    if(this instanceof SubsetBox){
        this.parent.highlightSpecificCells(row.cells.map(function(cell){
            return cell.column.colLabel;
        }));
    } else if(this instanceof ExactPatterns && this.subsetBox){
        this.subsetBox.highlightSpecificCells(row.cells
            .filter(function(cell){
                return cell.status == 0;
            })
            .map(function(cell){
                return cell.column.colLabel;
            }));
    }
};

PatternsMatrix.prototype.unhighlightRow = function(row){
    var self = this;
    this.cells_g.selectAll("g").classed('hovered', false);
    this.inter_cell_lines.selectAll("g").classed('hovered', false);
    if(this instanceof SubsetBox){
        this.parent.unhighlightSpecificCells();
    } else if(this instanceof ExactPatterns && this.subsetBox){
        this.subsetBox.unhighlightSpecificCells();
    }
};

PatternsMatrix.prototype.drawLegend = function(){
    for(var i=0; i<this.properties.legendObjects.length; i++){
        var legendObject = this.properties.legendObjects[i];
        var g = this.legend.append("g").attr("transform","translate(0,"+(i * 25)+")");
        if (this instanceof SubsetBox) {
            g.append("circle")
                .attr("class", legendObject.class1)
                .attr("r", this.SIZE_OF_CELL / 2 * 0.9);
            g.append("circle")
                .attr("cx", 20)
                .attr("class", legendObject.class2)
                .attr("r", this.SIZE_OF_CELL / 2 * 0.9);
            g.append("line")
                .attr("x1", 0)
                .attr("x2", 20)
                .attr("class", "stroke-" + legendObject.class2)
                .style("stroke-width", 2);
        } else {
            g.append("rect")
                .attr("x", -this.SIZE_OF_CELL / 2)
                .attr("y", -this.SIZE_OF_CELL / 2)
                .attr("width", this.SIZE_OF_CELL)
                .attr("height", this.SIZE_OF_CELL)
                .attr("class", legendObject.class1);
            g.append("rect")
                .attr("y", -this.SIZE_OF_CELL / 2)
                .attr("x", -this.SIZE_OF_CELL / 2 + 20)
                .attr("width", this.SIZE_OF_CELL)
                .attr("height", this.SIZE_OF_CELL)
                .attr("class", legendObject.class2)
        }
        if(legendObject.imputed === true){
                g.append("circle")
                    .attr("class","imputed2")
                    .attr("r",this.SIZE_OF_CELL / 2 * 0.4);
                g.append("circle")
                    .attr("cx",20)
                    .attr("class","imputed1")
                    .attr("r",this.SIZE_OF_CELL / 2 * 0.2);
            }

        g.append("text")
            .attr("x", 40)
            .attr("y",3)
            .text(legendObject.text);
    }
};

PatternsMatrix.prototype.scrollDrag = function(dy){
    var newlyScrolledElements;
    var pos;
    var nextRows;
    var self = this;
    this.dragging = true;
    this.scrollPosY += dy;
    if(this.scrollPosY > this.HEIGHT_OF_CELLBOX - this.length_scrollbar){
        this.scrollPosY = this.HEIGHT_OF_CELLBOX - this.length_scrollbar;
    }
    if(this.scrollPosY < 0){
        this.scrollPosY = 0;
    }

    this.scroller.attr("y1", this.scrollPosY);
    this.scroller.attr("y2", this.scrollPosY + this.length_scrollbar);
    newlyScrolledElements = parseInt(this.scrollPosY * this.scrollCellsPerPixel);

    if(newlyScrolledElements !== this.scrolledElements) {
        this.scrolledElements = newlyScrolledElements;
        nextRows = this.rowList.filter(function (d, i) {
            return i >= self.scrolledElements && d.filtered;
        });
        pos = 1;
        nextRows.forEach(function (x) {
            x.setPosition(pos);
            pos++;
        });

        this.visibleRowList = nextRows.filter(function (d) {
            // row is zichtbaar als: hij niet hidden is.. of als expand button opengeklapt is..
            return !self.rowHidden(d);
        });

        this.visibleCells = this.cells.filter(function (cell) {
            return self.visibleRowList.indexOf(cell.row) > -1;
        });

        this.rowsRightBarChartOrdinal.rangeRoundBands([0, this.SIZE_OF_CELL * nextRows.length], 0.1, 0);
        this.rowsLeftBarChartOrdinal.rangeRoundBands([0, this.SIZE_OF_CELL * nextRows.length], 0.1, 0);

        this.rowsRightBarChartOrdinal.domain(nextRows.map(function (a) {
            return a.rowLabel
        }));

        this.rowsLeftBarChartOrdinal.domain(nextRows.map(function (a) {
            return a.rowLabel
        }));
        this.displayNoRows();
        this.render();
    }
};

PatternsMatrix.prototype.displayNoRows = function(){
    var all_rows = this.rowList.filter(function(d){
       return  d.filtered;
    }).length;
    var d = (parseInt(this.scrollPosY * this.scrollCellsPerPixel) + this.properties.numberOfItemsShown);
    if(!d){
        d = all_rows;
    }
    this.currentNumberOfPatterns.text( d + "/" + all_rows);
};

PatternsMatrix.prototype.resetScrollable = function(){
  this.scrolledElements = 0;
  this.scrollPosY = 0;
  if(this.scroller){
    this.scroller.attr("y1", this.scrollPosY);
    this.scroller.attr("y2", this.scrollPosY + this.length_scrollbar);
  }
  this.displayNoRows();
};

function formatPercentage(p){
    if(p < 10 && p >= 1){
        return p.toFixed(1);
    }
    if (p < 1) {
        if(p == 0.0){
            return "0";
        }
        return p.toFixed(2);
    }
    return p.toFixed(0);
}

function stableSort(row1, row2) {
    if (row1.position < row2.position) {
        return -1;
    }
    return 1;
}

function getViewBoxes(){
    var viewBoxes = [];
    if(window.exactPatterns){
        viewBoxes.push(window.exactPatterns);
    }
    if(window.imputationBox){
        viewBoxes.push(window.imputationBox);
    }
    if(window.subsetBox){
        viewBoxes.push(window.subsetBox);
    }
    return viewBoxes;
}

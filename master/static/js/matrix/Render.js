/**
 * Created by s115426 on 2-5-2017.
 */

PatternsMatrix.prototype.removeOutdatedData = function () {

    this.cells_g.selectAll("g").data(this.visibleCells).exit().remove();
    this.inter_cell_lines.selectAll("g").data(this.visibleRowList).exit().remove();
    this.inter_cell_lines.selectAll("g").remove();
    this.sortables.selectAll("g").data(this.columnList).exit().remove();
    this.horbars.selectAll("g").data(this.visibleRowList).exit().remove();
    this.left_outer_bar_chart.selectAll("g").data(this.visibleRowList).exit().remove();
    this.horizontal_swim_lanes.selectAll(".swimLanes-hor").data(this.visibleRowList).exit().remove();
    this.icons.selectAll("g").data(this.visibleRowList).exit().remove();
    this.columnToggles.selectAll("g").data(this.visibleColumnList).exit().remove();
    this.imputationOnCells.selectAll("g").remove();
    this.sparkline.selectAll("g").data(this.visibleRowList).exit().remove();
    this.classificationlines.selectAll("g").remove();
};

PatternsMatrix.prototype.render = function () {
    var columnsWithLine;
    var classificationlines;
    var pattern_ids;
    var sparkline;
    var label;
    var columnToggle;
    var iconInnerElement;
    var columnBarChartInner;
    var filteredRowList;
    var lastItemInVisibleRowList;
    var lastItemInRowList;
    var total_bar_value;
    var innerSortable;
    var verticalLabelGElement;
    var self = this;
    var leftOuterBarChartInner;
    var horbarInner;
    var innerCell;
    this.removeOutdatedData();
    this.computeColumnFrequencies();

    this.upsetHighlighter.selectAll(".highlighter-on-background")
        .data(this.columnList)
        .enter()
        .append("rect")
        .attr("class", "highlighter-on-background");

    this.upsetHighlighter.selectAll(".highlighter-on-background")
        .attr("x", function (column) {
            return (column.position - 1) * self.SIZE_OF_CELL;
        })
        .attr("width", this.SIZE_OF_CELL)
        .attr("y", - this.OFFSET_TOP + this.HEIGHT_OF_TITLE + this.textMargin)
        .attr("height", this.HEIGHT_OF_CELLBOX + this.OFFSET_TOP - this.HEIGHT_OF_TITLE - this.textMargin)
        //.on('mousemove', function(){
            // self.triggerMouseMove(this);
        //});

    innerCell = this.cells_g.selectAll("g")
        .data(this.visibleCells)
        .enter()
        .append("g")
        .attr("class", "cellg");

    if(this instanceof SubsetBox){
        innerCell.append("circle");
        this.cells_g.selectAll("g")
            .select("circle")
            .attr("cx", function (cell) {
                return (cell.column.position - 0.5) * self.SIZE_OF_CELL;
            })
            .attr("cy", function (cell) {
                return (cell.row.position - 0.5) * self.SIZE_OF_CELL;
            })
            .attr("class", function (d) {
                var color = "status0";
                if (d.status === 1) {
                    color = "status1";
                } else if (d.status === 2) {
                    if(self instanceof ImputationBox){
                        color = "status2 imputed";
                    } else{
                        color = "status2";
                    }
                }
                return color + " cell cell-border ";
            })
            .attr("r", this.SIZE_OF_CELL / 2 * 0.9);
    } else{
        var rad = 0.9;
        var actualSize = rad * self.SIZE_OF_CELL;
        var offset = (1 - rad) / 2 * self.SIZE_OF_CELL;
        innerCell.append("rect");
        this.cells_g.selectAll("g").select("rect")
            .attr("x", function (cell) {
                return (cell.column.position - 1) * self.SIZE_OF_CELL + offset;
            })
            .attr("y", function (cell) {
                return (cell.row.position - 1) * self.SIZE_OF_CELL + offset;
            })
            .attr("class", function (d) {
                var color = "status0";
                if (d.status === 1) {
                    color = "status1";
                } else if (d.status === 2) {
                    if(self instanceof ImputationBox){
                        color = "status2 imputed";
                    } else{
                        color = "status2";
                    }
                }
                return color + " cell cell-border ";
            })
            .attr("width", actualSize)
            .attr("height", actualSize);
    }

    this.cells_g.selectAll("g")
        .on('click', function( cell){
            if(helper.isHelping){
                return helper.provideHelp("hor-swimlane", cell.row, self);
            }
            //self.rowClicked(cell.row);
        });

    if(this instanceof SubsetBox){
        this.inter_cell_lines.selectAll("g")
            .data(this.visibleRowList)
            .enter()
            .append("g");

        this.inter_cell_lines.selectAll("g")
            .on('click', function(row){
                //self.rowClicked(row);
            })
            .each(function (row) {
                var cell;
                var i;
                var cellsInOrder = row.cells.sort(function (cell1, cell2) {
                    return cell1.column.position - cell2.column.position;
                });
                var lastPositionCellWithValue = undefined;
                var lastCellStatus = undefined;

                for (i = 0; i < cellsInOrder.length; i++) {
                    cell = cellsInOrder[i];
                    if (cell.isSpecial()) {
                        if (lastPositionCellWithValue !== undefined && lastPositionCellWithValue < cell.column.position && lastCellStatus === cell.status) {
                            d3.select(this).append("line")
                                .attr("x1", (lastPositionCellWithValue - 0.5) * self.SIZE_OF_CELL)
                                .attr("y1", (row.position - 0.5) * self.SIZE_OF_CELL)
                                .attr("x2", (cell.column.position - 0.5) * self.SIZE_OF_CELL)
                                .attr("y2", (row.position - 0.5) * self.SIZE_OF_CELL)
                                .attr("class", function () {
                                    if (cell.status == 0) return "stroke-status0";
                                    if(self instanceof ImputationBox) return "stroke-status2 imputed";
                                    return "stroke-status2";
                                })
                                .style("stroke-width", 2);
                        }
                        lastPositionCellWithValue = cell.column.position;
                        lastCellStatus = cell.status;
                    }
                }
            });
    }


    /** END RENDER CELLS */

    horbarInner = this.horbars.selectAll("g")
        .data(this.visibleRowList)
        .enter().append("g")
        .attr("class", "horbar-g");

    horbarInner.append("rect")
        .attr("class", "horbar horbar-background bar-background");
    horbarInner.append("rect").attr("class", "horbar horbar-foreground status0");

    this.horbars.selectAll("g").select(".horbar-foreground")
        .attr("x", -this.SPACE_BARS)
        .attr("width", function (a) {
            return (a.percentage > 0 ? self.MIN_LENGTH_BAR : 0) + self.rowsRightBarChartLinear(a.percentage);
        })
        .attr("y", function (a) {
            return self.rowsRightBarChartOrdinal(a.rowLabel);
        })
        .attr("height", this.rowsRightBarChartOrdinal.rangeBand());

    this.horbars.selectAll("g").select(".horbar-background")
        .attr("x", function (a) {
            return -self.SPACE_BARS;
        })
        .attr("width", function (a) {
            return self.MIN_LENGTH_BAR + self.rowsRightBarChartLinear(100);
        })
        .attr("y", function (a) {
            return self.rowsRightBarChartOrdinal(a.rowLabel);
        })
        .attr("height", this.rowsRightBarChartOrdinal.rangeBand());

    horbarInner.append("title");
    this.horbars.selectAll("g").select("title").html(function (d) {
        return parseInt(d.absolute);
    });

    horbarInner.append("text").attr("class", "horbar horbar-text");

    this.horbars.selectAll("g").select(".horbar-text")
        .text(function (d) {
            return formatPercentage(d.percentage);
        })
        .attr("x", function (a) {
            return self.X_OFFSET_TEXT_ON_BAR - self.SPACE_BARS +
                (a.percentage < self.CUT_OFF_POINT_TEXT_ON_BAR ? ( a.percentage > 0 ? self.MIN_LENGTH_BAR : 0) + self.rowsRightBarChartLinear(a.percentage) : 0);
        })
        .attr("y", function (a) {
            return self.rowsRightBarChartOrdinal(a.rowLabel);
        })
        .attr("dy", this.Y_OFFSET_TEXT_ON_BAR)
        .style("font-size", 11)
        .style("text-anchor", "start")
        .attr("class", function (a) {
            return "horbar horbar-text " + (a.percentage < self.CUT_OFF_POINT_TEXT_ON_BAR ? "bartextright" : "bartextleft");
        });

    /** END RENDER HORBARS */

    /** BEGIN RENDER LEFT-OUTER BARS */
    if (this.properties.cumulative && this.visibleRowList.length > 0) {
        filteredRowList = this.rowList.filter(function (row) {
            return row.filtered;
        });
        lastItemInRowList = filteredRowList[filteredRowList.length - 1];
        lastItemInVisibleRowList = this.visibleRowList[this.visibleRowList.length - 1];
        total_bar_value = {
            rowLabel: 'total-accumulated',
            percentage2: lastItemInRowList.percentage2
        };

        leftOuterBarChartInner = this.left_outer_bar_chart.selectAll("g")
            .data(this.visibleRowList.concat(total_bar_value))
            .enter()
            .append("g");

        leftOuterBarChartInner.append("rect")
            .attr("class", "horbar2 horbar2-background bar-background");

        this.left_outer_bar_chart.selectAll("g").select(".horbar2-background")
            .attr("x", function (a) {
                return -self.SPACE_BARS - self.OFFSET_BAR - self.rowsLeftBarChartLinear(self.maxCumuBarValue);
            })
            .attr("width", function (a) {
                return self.MIN_LENGTH_BAR + self.rowsLeftBarChartLinear(self.maxCumuBarValue);
            })
            .attr("y", function (a) {
                if (a.rowLabel === 'total-accumulated') {
                    if (lastItemInVisibleRowList !== undefined) {
                        return self.rowsLeftBarChartOrdinal(lastItemInVisibleRowList.rowLabel) + self.SIZE_OF_CELL;
                    } else {
                        return self.SIZE_OF_CELL;
                    }
                }
                return self.rowsLeftBarChartOrdinal(a.rowLabel);
            })
            .attr("height", self.rowsLeftBarChartOrdinal.rangeBand());

        leftOuterBarChartInner.append("rect")
            .attr("class", "horbar2 horbar2-foreground status0");

        this.left_outer_bar_chart.selectAll("g").select(".horbar2-foreground")
            .attr("x", function (a) {
                return -self.SPACE_BARS - self.OFFSET_BAR - self.rowsLeftBarChartLinear(self.maxCumuBarValue);
            })
            .attr("width", function (a) {
                return self.MIN_LENGTH_BAR + self.rowsLeftBarChartLinear(a.percentage2);
            })
            .attr("y", function (a) {
                if (a.rowLabel === 'total-accumulated') {
                    if (lastItemInVisibleRowList !== undefined) {
                        return self.rowsLeftBarChartOrdinal(lastItemInVisibleRowList.rowLabel) + self.SIZE_OF_CELL;
                    } else {
                        return self.SIZE_OF_CELL;
                    }
                }
                return self.rowsLeftBarChartOrdinal(a.rowLabel);
            })
            .attr("height", this.rowsLeftBarChartOrdinal.rangeBand());

        leftOuterBarChartInner.append("text")
            .attr("class", "horbar2 horbar2-text");

        this.left_outer_bar_chart.selectAll("g").select(".horbar2-text")
            .style("font-size", 11)
            .style("text-anchor", "start")
            .text(function (d) {
                return formatPercentage(d.percentage2);
            })
            .attr("x", function (a) {
                return self.X_OFFSET_TEXT_ON_BAR - self.SPACE_BARS - self.OFFSET_BAR - self.rowsLeftBarChartLinear(self.maxCumuBarValue) +
                    (a.percentage2 < self.CUT_OFF_POINT_TEXT_ON_BAR ? self.MIN_LENGTH_BAR + self.rowsLeftBarChartLinear(a.percentage2) : 0);
            })
            .attr("y", function (d) {
                if (d.rowLabel === 'total-accumulated') {
                    if (lastItemInVisibleRowList !== undefined) {
                        return self.rowsLeftBarChartOrdinal(lastItemInVisibleRowList.rowLabel) + self.SIZE_OF_CELL + self.Y_OFFSET_TEXT_ON_BAR;
                    } else {
                        return self.SIZE_OF_CELL + self.Y_OFFSET_TEXT_ON_BAR;
                    }
                }
                if (self.rowsLeftBarChartOrdinal.domain().indexOf(d.rowLabel) > -1) {
                    return self.rowsLeftBarChartOrdinal(d.rowLabel) + self.Y_OFFSET_TEXT_ON_BAR;
                }
                return null;
            })
            .attr("class", function (a) {
                return "horbar2 horbar2-text " + (a.percentage2 < self.CUT_OFF_POINT_TEXT_ON_BAR ? "bartextright" : "bartextleft");
            });
    }
    if(TEMPORAL && !(this instanceof ImputationBox)) {
        sparkline = this.sparkline.selectAll("g")
            .data(this.visibleRowList)
            .enter()
            .append("g");

        sparkline.append("rect");
        sparkline.append("path");

        this.sparkline.selectAll("g")
            .attr("transform", function (row) {
                return "translate(" + [-self.SPACE_BARS - self.OFFSET_BAR - self.rowsLeftBarChartLinear(self.maxCumuBarValue) - self.SPACE_BARS -
                (self.properties.cumulative ? self.OFFSET_BAR : 0), self.rowsRightBarChartOrdinal(row.rowLabel)] + ")";
            });

        this.sparkline.selectAll("g")
            .select("rect")
            .attr("class", "bar-background")
            .attr("width", self.SPACE_BARS)
            .attr("height", this.rowsRightBarChartOrdinal.rangeBand());

        this.sparkline.selectAll("g")
            .select("path")
            //.attr("class","hovered-stroke")
            .style("stroke", "#737373")
            .style("fill", "none")
            .attr("d", function (row) {
                if (row.temporalInformation && self.sparklineHorizontalAxes.domain().length) {
                    return self.sparklineFunc(self.sparklineLocation(row.temporalInformation));
                }
            });
    }
    /** END RENDER LEFT-OUTER BARS */

    /** RENDER HORIZONTAL SWIM LANES */

    this.horizontal_swim_lanes.selectAll(".swimLanes-hor")
        .data(this.visibleRowList)
        .enter()
        .append("rect")
        .attr("class", "swimLanes-hor hidden");

    this.horizontal_swim_lanes.selectAll(".swimLanes-hor")
        .attr("x", 0)
        .attr("width", this.WIDTH_OF_CELLBOX)
        .attr("y", function (row) {
            return (row.position - 1) * self.SIZE_OF_CELL;
        })
        .attr("height", this.SIZE_OF_CELL)
        .on('mousemove', function () {
            // self.triggerMouseMove(this);
        })
        .on('click', function (row) {
            if(helper.isHelping){
                return helper.provideHelp("hor-swimlane", row, self);
            }
            //self.rowClicked(row);
        });

    this.percentageSortable.attr("class", function () {
            if(self.defaultSorted){
                return "locked";
            }
            return "status0";
        })
        .on('mouseover', function (column) {
            d3.select(this).attr('class', "hovered");
        })
        .on('mouseout', function (column) {
            var cls;
            if(self.defaultSorted){
                cls = "locked";
            } else{
                cls = "status0";
            }
            d3.select(this).attr('class', cls);
        });

    innerSortable = this.sortables.selectAll("g")
        .data(this.columnList)
        .enter()
        .append("g")
        .attr("class","sortable");


    this.sortables.selectAll("g")
        .attr("transform", function (column) {
            return "translate(" +
                ( (column.position - 0.5) * self.SIZE_OF_CELL)
                + "," +
                ( self.Y_OFFSET_SORTABLES )
                + ")";
        });


    innerSortable.append("rect")
        .attr("class","seethrough")
        .attr("x",-this.SIZE_OF_CELL / 2)
        .attr("y",-this.SIZE_OF_CELL / 2)
        .attr("width",this.SIZE_OF_CELL)
        .attr("height", this.SIZE_OF_CELL);
    innerSortable.append("path");

    this.sortables.selectAll("g").select("path")
        .attr("d", function (column) {
            return d3.svg.symbol().type('triangle-' + (column.reversed ? 'up' : 'down'))();
        })
        .attr("class", function (column) {
            if (column.sorted) {
                return 'sort';
            }
            return "status0";
        });

    this.sortables.selectAll("g")
        .on("click", function (column) {
            if(helper.isHelping){
                return helper.provideHelp("sortable",column,self);
            }
            self.sortableClicked(column, d3.event.ctrlKey);
        })
        .on('mouseover', function (column) {
            if (column.sorted) {
                // kolom niet gelocked, wel al gesorteerd
                // hover moet groen zijn.
                 d3.select(this).select("path").attr("class",'status0');
            } else {
                // kolom niet gelocked, niet gesorteerd, dus wordt geel bij hover
                d3.select(this).select("path").attr('class', "hovered");
            }
            // self.triggerMouseMove(this, column);
        })
        .on('mouseout', function (column) {
            if (column.sorted) {
                // kolom niet gelocked, wel al gesorteerd
                // hover out moet geel zijn.
                d3.select(this).select("path").attr('class', 'sort');
            } else {
                // kolom niet gelocked, niet gesorteerd, dus wordt paars bij hover out
                d3.select(this).select("path").attr('class', 'status0');
            }
        });


    if (this.properties.showColumnBarChart) {
        columnBarChartInner = this.columnBarChartBars.selectAll("g")
            .data(this.columnList)
            .enter()
            .append("g")
            .on('click',function(column){
                if(helper.isHelping){
                    return helper.provideHelp("column-bar-chart", column, self);
                }
            });

        columnBarChartInner.append("rect").attr("class", "horbar horbar-background bar-background");
        columnBarChartInner.append("rect").attr("class", `horbar horbar-foreground ${this instanceof ImputationBox ? "status2 imputed" : "status0"}`);

        this.columnBarChartBars.selectAll("g").select(".horbar-background")
            .attr("x", function (d) {
                return self.columnBarChartOrdinal(d.colLabel);
            })
            .attr("width", this.columnBarChartOrdinal.rangeBand())
            .attr("y", function (d) {
                return -self.SPACE_SORTABLES - self.SPACE_BARS +
                    self.columnBarChartScale(self.initialColumnValues.findByProperty('column', d).percentage);
            })
            .attr("height", function (d) {
                return self.LENGTH_OF_BARS -
                    self.columnBarChartScale(self.initialColumnValues.findByProperty('column', d).percentage);
            });

        this.columnBarChartBars.selectAll("g").select(".horbar-foreground")
            .attr("x", function (d) {
                return self.columnBarChartOrdinal(d.colLabel);
            })
            .attr("width", this.columnBarChartOrdinal.rangeBand())
            .attr("y", function (d) {
                return -self.SPACE_SORTABLES - self.SPACE_BARS + self.columnBarChartScale(d.percentage);
            })
            .attr("height", function (d) {
                return self.LENGTH_OF_BARS - self.columnBarChartScale(d.percentage);
            });

        verticalLabelGElement = this.verBarChartLabels.selectAll(".verBarLabel")
            .data(this.columnList)
            .enter().append("g").attr("class", "verBarLabel");

        this.verBarChartLabels.selectAll(".verBarLabel")
            .attr("transform", function (column) {
                return "translate(" + ((column.position - 1) * self.SIZE_OF_CELL + 13) + "," +
                    ( -self.SPACE_BARS - self.SPACE_SORTABLES - 3 +
                    self.columnBarChartScale(self.initialColumnValues.findByProperty('column', column).percentage)) +
                    ")";
            });

        verticalLabelGElement.append("text");

        this.verBarChartLabels.selectAll(".verBarLabel").select("text")
            .text(function (d) {
                return formatPercentage(d.percentage);
            })
            .style("font-size", 12)
            .attr("transform", "rotate(-90)");
    }

    if (this.properties.showColumnLabels) {
        label = this.columnLabels.selectAll(".colLabelg")
            .data(this.columnList)
            .enter()
            .append("g").attr("class", "colLabelg mono");

        label.append("text").attr("class", "colLabel mono");
        label.append("title");


        this.columnLabels.selectAll(".colLabelg")
            .attr("transform",function(column){ return "translate(" +
                [   (column.position - 0.5) * self.SIZE_OF_CELL,
                    -(self.properties.showColumnBarChart ? self.SPACE_BARS + self.SPACE_VERTICAL_BAR_LABELS : 0) + self.SPACE_SORTABLES + self.SPACE_QUERIABLES - 50,
                ] + ")";})
            .select(".colLabel")
            .text(function (d) {
                return d.colLabel.truncate();
            })
            .style("text-anchor", "start")
            .style("font-size", 14)
            .attr("transform", "translate(" + (this.SIZE_OF_CELL / 2 ) + ",-15) rotate (-45)")
            .on("mouseover", function (column) {
                // self.triggerMouseMove(null, column);
            });

        this.columnLabels.selectAll(".colLabelg")
            .select("title").html(function (d) {
                return d.description;
            });
    }

    iconInnerElement = this.icons.selectAll(".material-icon")
        .data(this.visibleRowList)
        .enter().append("g").attr("class", "material-icon status0 hidden");

    this.icons.selectAll("g")
        .attr("transform", function (row) {
            return "translate(" + [self.WIDTH_OF_CELLBOX + 10, (row.position - 1) * self.SIZE_OF_CELL] + ")";
        });

    iconInnerElement.append("g").attr("class", "icon-lock clickable").append("path");

    if (this instanceof ExactPatterns) {
        iconInnerElement.append("g").attr("class", "icon-imputation-list clickable").append("path");
    }

    iconInnerElement.select("g")
        .append("rect")
        .attr("width", this.SIZE_OF_CELL)
        .attr("height", this.SIZE_OF_CELL)
        .style("fill", "rgba(255,255,255,0)");

    this.icons.selectAll("g").select(".icon-lock")
        .select("rect")
        .on('click', function (row) {
            if (self.lockedRow === row) {
                self.unlockRow(true);
            } else {
                self.lockRow(row);
            }
        }).on('mouseover', function (row) {
            if(self.lockedRow){
                d3.select(this.parentNode).select("path").attr("d", self.lockedRow === row ? LOCK_OPEN_ICON_PATH : LOCK_ICON_PATH);
            } else{
                self.highlightRow(row);
            }
        })
        .on('mouseout', function (row) {
            if(self.lockedRow){
                d3.select(this.parentNode).select("path").attr("d", self.lockedRow === row ? LOCK_ICON_PATH : LOCK_OPEN_ICON_PATH);
            } else{
                self.unhighlightRow(row);
            }
        });

    this.icons.selectAll("g").select(".icon-lock")
        .attr("transform", "translate(0,0)")
        .select("path")
        .attr("d", function(row){
           if(self.lockedRow && self.lockedRow === row){
                return LOCK_ICON_PATH;
           }
           return LOCK_OPEN_ICON_PATH;
        });

    this.icons.selectAll("g").select("path").attr("transform", "scale(0.8)");

    columnToggle = this.columnToggles.selectAll("g")
        .data(this.visibleColumnList)
        .enter()
        .append("g")
        .attr("class", "status0 toggle")
        .style("cursor","pointer")
        .on('click', function(col){
            if(helper.isHelping){
                return helper.provideHelp("column-toggle", column, self);
            }
            self.lockColumnToggle(col);
        })
        .on('mouseover', function (col) {
            self.hoverColumnToggle(col);
            col.toggleMouseOver = true;
        })
        .on('mouseleave', function (col) {
            self.hoverColumnToggle(col, false);
            col.toggleMouseOver = false;
        });

    columnToggle.append("circle").attr("class", "toggle-outer");
    columnToggle.append("circle").attr("class", "toggle-inner");

    this.columnToggles.selectAll("g").select(".toggle-outer")
        .attr("cx", function (col) {
            return (col.position - 0.5) * self.SIZE_OF_CELL;
        })
        .attr("cy", (this.properties.showColumnBarChart ? -this.SPACE_BARS - this.SPACE_VERTICAL_BAR_LABELS : 0) - self.SPACE_SORTABLES - self.OFFSET_QUERIABLES)
        .attr("r", 7)
        .style("stroke-width", 2)
        .attr("class", function(col){
            return "whitefill toggle-outer " + (col.filterLocked ? "stroke-locked" : "stroke-status0");
        });

    this.columnToggles.selectAll("g").select(".toggle-inner")
        .style("cursor", "pointer")
        .attr("cx", function (col) {
            return (col.position - 0.5) * self.SIZE_OF_CELL;
        })
        .attr("cy", (this.properties.showColumnBarChart ? -this.SPACE_BARS - this.SPACE_VERTICAL_BAR_LABELS : 0) - self.SPACE_SORTABLES - self.OFFSET_QUERIABLES)
        .attr("r",4);


    this.renderClassificationAreas();

    /* -----------------------------------------------*/

    pattern_ids = this.visibleRowList
            .filter(function (x) {
                return !x.temporalInformation;
            })
            .map(function (x) {
                return x.rowNumber;
            });

    var notYetRequested = pattern_ids.subtract(this.requestedImputationInformation);

    if(notYetRequested.length && !this.dragging) {
        this.requestedImputationInformation = this.requestedImputationInformation.union(notYetRequested);
        if(TEMPORAL) {
            this.requestDataForMultipleRows(notYetRequested, "temporalInformation", function (a, b) {
                var timeRange = b[0][1].map(function (x) {
                    return x[0];
                });
                self.sparklineHorizontalAxes.domain(timeRange);
                self.render();
            });
        }
        if(this instanceof  ExactPatterns){
            this.requestDataForMultipleRows(notYetRequested, "imputationInformation", function () {
                self.render();
            });
        }
    }

    if (this instanceof ExactPatterns && !this.dragging){

        var imputations;
        self.visibleRowList.forEach(function (row) {
            self.computePercentageImputed(row);
        });

        imputations = self.imputationOnCells.selectAll("g")
            .data(self.visibleCells.filter(function (cell) {
                return cell.percentageImputed;
            }))
            .enter()
            .append("g").attr("class", "imputed")
            .on('click', function (cell) {
                if (helper.isHelping) {
                    return helper.provideHelp("imputed-cell", cell, self);
                }
            });

        imputations.append("circle");

        self.imputationOnCells.selectAll("g").select('circle')
            .attr("cx", function (cell) {
                return (cell.column.position - 0.5) * self.SIZE_OF_CELL;
            })
            .attr("cy", function (cell) {
                return (cell.row.position - 0.5) * self.SIZE_OF_CELL;
            })
            .attr("r", function (d) {
                return 1 + d.percentageImputed * 5 / 100;
            })
            .attr('class', function (d) {
                return d.status ? 'imputed1' : 'imputed2';
            });
    }
};

PatternsMatrix.prototype.renderClassificationAreas = function(){
    var self = this;
    var pair;
    var pairs;
    if(this.columnsSorted === "columnsByClassification"){
        pairs = [];
        pair = [];
        this.columnList.forEach(function(col, i){
            if(i > 0){
                if(pair.length > 0 && pair[pair.length - 1].classification === col.classification){

                } else if(self.columnList[i - 1].classification !== col.classification){
                    if(pair.length > 0){
                        pairs.push(pair);
                        pair = [];
                    }
                }
            }
            pair.push(col);
            if(i === self.columnList.length - 1){
                pairs.push(pair);
            }
        });
        var pathpoints = [];
        if(pairs.length > 1){
            for(var i = 0; i < pairs.length; i += 1){
                var pair = pairs[i];
                var firstcol = pair[0];
                var lastcol = pair[pair.length - 1];
                var p = [
                    { //bottom left
                        x: (firstcol.position - 1) * self.SIZE_OF_CELL,
                        y:  - this.OFFSET_TOP + this.HEIGHT_OF_TITLE + this.textMargin
                    },
                    {  //bottom right
                        x: (lastcol.position) * self.SIZE_OF_CELL,
                        y: - this.OFFSET_TOP + this.HEIGHT_OF_TITLE + this.textMargin
                    },
                    { // top right
                        x: (lastcol.position) * self.SIZE_OF_CELL + this.textMargin,
                        y: - this.OFFSET_TOP + this.HEIGHT_OF_TITLE
                    },
                    { // top left
                        x: (firstcol.position - 1) * self.SIZE_OF_CELL + this.textMargin,
                        y: - this.OFFSET_TOP + this.HEIGHT_OF_TITLE
                    }
                ];
                pathpoints.push(p);
            }
        }

        var ar = d3.svg.line()
            .x(function(d){ return d.x;})
            .y(function(d){ return d.y;});

        this.classificationlines.selectAll("g")
            .data(pathpoints)
            .enter()
            .append("g").append("path");

        this.classificationlines.selectAll("g")
            .select("path")
            .attr("d",function(d){ return ar(d);})
            .attr("fill",function(d,i){ return i % 2 == 0 ? COLOR_STATUS1 : COLOR_STATUS2; });
    }
};
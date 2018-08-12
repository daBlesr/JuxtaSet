/**
 * Created by s115426 on 22-6-2017.
 */

ReferenceBarChart = function(parent, g, xpos, ypos, key) {
    this.parent = parent;
    this.key = key;
    this.yOffset = 20;
    this.trueHeight = this.parent.barChartHeight - 10 - this.yOffset;
    var self = this;

    this.data = this.parent.referenceData[this.key];
    this.newData = [];
    this.oldData = [];
    this.totalRecords = 0;

    this.g = g.append("g")
        .attr("transform", "translate(" + xpos + ", " + ypos + ")");

    this.x = d3.scale.ordinal()
        .rangeBands([30, this.parent.barChartWidth - 10], 0.1, 0);

    this.y = d3.scale.linear()
        .range([this.trueHeight, 0]);

    this.xaxis = d3.svg.axis()
        .scale(this.x)
        .orient("bottom")
        .outerTickSize(0);

    this.yaxis = d3.svg.axis()
        .scale(this.y)
        .outerTickSize(0)
        .ticks(4)
        .orient("left")
        //.tickFormat(d3.format("s"));

    if (this.data.length > 10) {
        this.xaxis.tickValues([]);
    }

    this.maxDataHeight = 1.5 * d3.max(this.data, function (d) {
            return d[1];
        });

    this.x.domain(this.data.map(function (d) {
        return d[0];
    }));

    this.xInnerBands = null;
    if (this.data.length < 20) {
        this.xInnerBands = d3.scale.ordinal()
            .rangeRoundBands([0, this.x.rangeBand()], 0)
            .domain(['reference', 'pattern'])
    }

    this.y.domain([0, this.maxDataHeight]);
    this.lastLocked = null;

    this.barEffects = function (x) {
        x.on("mouseover", function (d) {
            //if (!) {
            var v = window.filters.hasFilterValue(self.key, d[0]);
            self.barG.selectAll(".barref").filter(function(d2){
                return d2[0] === d[0];
            }).classed("locked",!v);
            self.newDataBars.selectAll(".newdatabar").filter(function(d2){
                return d2[0] === d[0];
            }).classed("locked",!v).classed("hovered",v);
            //}
            self.label.select("text").text(d[0]);
        })
            .on('mouseout', function (d) {
                var v = window.filters.hasFilterValue(self.key, d[0]);
                self.barG.selectAll(".barref").filter(function(d2){
                    return d2[0] === d[0];
                }).classed("locked",v);
                self.newDataBars.selectAll(".newdatabar").filter(function(d2){
                    return d2[0] === d[0];
                }).classed("locked",false).classed("hovered",true);

                self.label.select("text").text('');
            })
            .on('click', function (d) {
                if(window.filters.hasFilterValue(self.key, d[0])){
                    window.filters.removeValueFromFilter(self.key, d[0]);
                    self.lastLocked = null;
                } else{
                    if (d3.event.ctrlKey) {
                        window.filters.addFilter(self.key, d[0], 'OR', true);
                    } else if(d3.event.shiftKey) {
                        if(window.filters.hasFilter(self.key)){
                            // console.log(self.key, self.data, window.filters.);
                            var startpos = undefined;
                            var endpos = undefined;
                            self.data.forEach(function(c, i){
                                if(c[0] === self.lastLocked){
                                    startpos = i;
                                }
                                if(c[0] === d[0]){
                                    endpos = i;
                                }
                            });
                            if(startpos !== undefined && endpos !== undefined){
                                self.data.slice(startpos, endpos + 1).forEach(function(a){
                                    window.filters.addFilter(self.key, a[0], 'OR', true);
                                });
                            }
                        } else{
                            window.filters.addFilter(self.key, d[0], 'OR', true);
                        }
                    } else{
                        window.filters.addFilter(self.key, d[0], 'AND', true);
                    }
                    self.lastLocked = d[0];
                }
                self.barG.selectAll(".barref").each(function(d){
                    var v = window.filters.hasFilterValue(self.key, d[0]);
                    d3.select(this).classed("locked",v);
                });
                self.newDataBars.selectAll(".newdatabar").each(function(d){
                    var v = window.filters.hasFilterValue(self.key, d[0]);
                    d3.select(this).classed("locked",v).classed("hovered",!v);
                });
            });
    };

    this.g.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", this.parent.barChartWidth)
        .attr("height", this.parent.barChartHeight)
        .style("fill", "rgba(255,255,255,0)")
        .on('mousemove', function () {
            var mouseCoordinates = d3.mouse(this);
            var rb = self.x.range();
            var col = null;
            var rbw = self.x.rangeBand();
            if (self.parent.barChartHeight - mouseCoordinates[1] < 100) {
                for (var i = rb.length - 1; i >= 0; i--) {
                    if (mouseCoordinates[0] >= rb[i] + rbw / 4 && mouseCoordinates[0] <= rb[i] + rbw * 3 / 4) {
                        col = self.x.domain()[i];
                        break;
                    }
                }
            }
            self.barG.selectAll(".barref").each(function (bar) {
                var value = 0;
                if(self.parent.absolute){
                    value = bar[1];
                } else{
                    value = bar[1] / self.parent.referenceData["total_records"];
                }
                if (bar[0] == col && self.trueHeight - self.y(value) < self.trueHeight / 10) {
                    d3.select(this)
                        .transition().duration(500).ease("linear")
                        .attr("height", self.trueHeight / 10)
                        .attr("y", self.trueHeight - self.trueHeight / 10)

                } else {
                    d3.select(this)
                        .transition().duration(500).ease("linear")
                        .attr("height", self.trueHeight - self.y(value))
                        .attr("y", self.y(value));
                }

            });
        });

    this.barG = this.g.append("g").attr('transform', "translate(" + [0, this.yOffset] + ")");
    this.barG.selectAll(".barref")
        .data(this.data)
        .enter().append("rect").attr("class", "barref")
        .append("title").html(function (d) {
        return formatPercentage(d[1] / self.parent.referenceData["total_records"])  + "% | " +  d[1];
    });

    this.barG.selectAll(".barref")
        .attr("x", function (d) {
            return self.x(d[0]);
        })
        .attr("width", self.xInnerBands ? self.xInnerBands.rangeBand() : self.x.rangeBand())
        .classed("locked", function(d){
            return window.filters.hasFilterValue(self.key, d[0]);
        });

    this.newDataBars = this.barG.append("g");

    this.barEffects(this.barG.selectAll(".barref"));

    if (this.data.length > 10) {
        var name = this.g.append("g")
            .attr("transform", "translate(" + (this.parent.barChartWidth - 20) + ", " + (this.parent.barChartHeight + 5) + ")");
        name.append("text").attr("text-anchor", "end").text(this.key.replace(/\_/g, " ").ucfirst());
    }

    this.label = this.g.append("g")
        .attr("transform", "translate(" + (this.parent.barChartWidth - 20) + ", " + ( 40) + ")");
    this.label.append("text").attr("text-anchor", "end");

    this.g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (this.parent.barChartHeight - 10) + ")")
        .call(this.xaxis)
        .selectAll("text")
        .attr("y", 10)
        .attr("x", 3)
        .attr("dy", ".35em")
        .attr("transform", "rotate(30)")
        .style("text-anchor", "start");

    this.gyaxis = this.g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(30," + this.yOffset + ")")
        .call(this.yaxis);

    if(!self.xInnerBands &&  (URL.hasQuery("bars") === false || URL.hasQuery("bars", "1"))){
        this.barG.selectAll("line")
            .data(this.data)
            .enter().append("line")
            .attr("x1", function (d) {
                return self.x(d[0]);
            })
            .attr("y1", function (d) {
                return self.y(d[1]);
            })
            .attr("x2", function (d) {
                return self.x(d[0]) + self.x.rangeBand();
            })
            .attr("y2", function (d) {
                return self.y(d[1]);
            })
            .style("stroke", "black")
            .style("stroke-width", 1);
    }


    this.render();

};

ReferenceBarChart.prototype.render = function () {
    var self = this;
    var oldMaxData = this.maxDataHeight;
    this.maxDataHeight = d3.max(this.data, function (d) {
        return d[1];
    }) ;
    if(!this.parent.absolute){
        var maxDataHeight2 = d3.max(this.newData, function (d) {
            return d[1];
        }) ;
        var maxDataHeight1 = this.maxDataHeight / self.parent.referenceData["total_records"];
        var newDataHeight = d3.min([d3.max([maxDataHeight2, maxDataHeight1]),1]);
        if(newDataHeight < 1.1 * oldMaxData && newDataHeight > 0.7 * oldMaxData){
            this.maxDataHeight = oldMaxData;
        } else{
            this.maxDataHeight = newDataHeight;
        }
    } else{
        this.maxDataHeight *= 1.5;
    }
    this.y.domain([0, this.maxDataHeight]);
    this.yaxis.scale(this.y);
    if(this.parent.absolute){
        this.yaxis.tickFormat(d3.format("s"));
    } else{
        this.yaxis.tickFormat(d3.format(".0%"));
    }
    this.gyaxis.transition().duration(300).ease("linear").call(this.yaxis);

    this.barG.selectAll(".barref")
        .transition().duration(300).ease("linear")
        .attr("y", function (d) {
            if(self.parent.absolute){
                return self.y(d[1]);
            }
            return self.y(d[1] / self.parent.referenceData["total_records"]);
        })
        .attr("height", function (d) {
            if(self.parent.absolute){
                return self.trueHeight - self.y(d[1]);
            }
            return self.trueHeight - self.y(d[1] / self.parent.referenceData["total_records"]);
        });

    if(!self.xInnerBands && (URL.hasQuery("bars") === false || URL.hasQuery("bars", "1"))){
        this.barG.transition().duration(300).ease("linear").selectAll("line")
            .attr("x1", function (d) {
                return self.x(d[0]);
            })
            .attr("y1", function (d) {
                if(self.parent.absolute){
                return self.y(d[1]);
            }
            return self.y(d[1] / self.parent.referenceData["total_records"]);
            })
            .attr("x2", function (d) {
                return self.x(d[0]) + self.x.rangeBand();
            })
            .attr("y2", function (d) {
                if(self.parent.absolute){
                return self.y(d[1]);
            }
            return self.y(d[1] / self.parent.referenceData["total_records"]);
            })
            .style("stroke", "black")
            .style("stroke-width", 1);
    }

    var bars = this.newDataBars.selectAll(".newdatabar")
        .data(this.newData, function (x) {
            return x[0];
        });

    var enteredBar = bars.enter()
        .append("rect").attr("class", "newdatabar hovered")
        .attr("y", function (d) {
            if(self.xInnerBands || self.parent.absolute) return self.y(0);
            if (URL.hasQuery("bars", "2")) {
                return self.y(self.findReferencePoint(d));
            }
            return self.y(0);
        })
        .attr("height", self.trueHeight - self.y(0))
        .append("title");

    bars.exit().transition().duration(500).ease("linear")
        .attr("y", function (d) {
            return self.y(0);
        })
        .attr("height", function (d) {
            return self.trueHeight - self.y(0);
        })
        .remove();

    this.barEffects(bars);

    this.barG.selectAll(".barref").classed("locked", function(d){
        return window.filters.hasFilterValue(self.key, d[0]);
    });
    bars.classed("locked", function(d){
        return false;
        //return window.filters.hasFilterValue(self.key, d[0]);
    }).classed("hovered", function(d){
        return true;
        return !window.filters.hasFilterValue(self.key, d[0]);
    });

    bars.select("title")
        .html(function (d) {
            return formatPercentage(d[2] / self.totalRecords)  + "% | " +  d[2];
        });

    bars.attr("x", function (d) {
        if (self.xInnerBands) {
            return self.x(d[0]) + self.xInnerBands('pattern') - 1;
        }
        return self.x(d[0]);
    })
        .attr("width", self.xInnerBands ? self.xInnerBands.rangeBand() : self.x.rangeBand())
        //.classed("hovered", self.xInnerBands || self.parent.absolute)
        .classed("locked", function (d) {
            return window.filters.hasFilterValue(self.key, d[0]);
        })
        .classed("bar-negative", function (d) {
            if (self.xInnerBands || self.parent.absolute) return false;
            if (URL.hasQuery("bars", "2")) {
                var referencePoint = self.findReferencePoint(d);
                if (referencePoint >= d[1]) {
                    return true;
                }
            }
        })
        .classed("bar-positive", function (d) {
            if (self.xInnerBands || self.parent.absolute) return false;
            if (URL.hasQuery("bars", "2")) {
                var referencePoint = self.findReferencePoint(d);
                if (referencePoint < d[1]) {
                    return true;
                }
            }
        })
        .transition().duration(500).ease("linear")
        .attr("y", function (d) {
            var referendataPoint;
            if (self.xInnerBands || self.parent.absolute || URL.hasQuery("bars") === false || URL.hasQuery("bars", "1")) {
                if (d[1] > self.maxDataHeight) {
                    return self.y(self.maxDataHeight);
                }
                return self.y(d[1]);
            } else if (URL.hasQuery("bars", "2")) {
                referendataPoint = self.findReferencePoint(d);
                if (referendataPoint >= d[1]) {
                    return self.y(referendataPoint);
                }
                var dis = self.y(d[1]);
                if (dis < 0) {
                    return 0;
                }
                return dis;
            }
        })
        .attr("height", function (d) {
            var referendataPoint;
            if (self.xInnerBands || self.parent.absolute || URL.hasQuery("bars") === false || URL.hasQuery("bars", "1")) {
                if (d[1] > self.maxDataHeight) {
                    return self.trueHeight - self.y(self.maxDataHeight);
                }
                return self.trueHeight - self.y(d[1]);
            } else if (URL.hasQuery("bars", "2")) {
                referendataPoint = self.findReferencePoint(d);
                var dis = self.y(d[1]);
                var ydif = Math.abs(self.y(d[1]) - self.y(referendataPoint));
                if (dis < 0 && self.y(ydif) > self.y(referendataPoint)) {
                    return self.y(referendataPoint);
                }
                return ydif;
            }
        });
};

ReferenceBarChart.prototype.findReferencePoint = function (d) {
    var a = this.data.filter(function (row) {
        return row[0] === d[0];
    })[0];
    if(this.parent.absolute){
        return a[1];
    } else{
        return a[1] / this.parent.referenceData["total_records"];
    }
};

ReferenceBarChart.prototype.updateData = function (data) {
    var self = this;
    this.oldData = data[this.key];
    this.totalRecords = data["total_records"];
    this.newData = data[this.key].map(function (a) {
        return self.rescale(a);
    });
    var xrange = self.x.domain();

    this.newData = this.newData.filter(function (d) {
        return xrange.indexOf(d[0]) > -1;
    });

    if(this.parent.statisticsCollapsable.collapsableChartsCollapsed){
        return;
    }
    this.render();
};

ReferenceBarChart.prototype.removeData = function(){
    this.newData = this.data.map(function(a){
       return [a[0], 0];
    });
    this.totalRecords = 0;
    if(this.parent.statisticsCollapsable.collapsableChartsCollapsed){
        return;
    }
    this.render();
};

ReferenceBarChart.prototype.rescale = function (x) {
    if(this.parent.absolute){
        return [x[0], x[1], x[1]];
    }
    if(this.totalRecords === 0){
        return [x[0], 0, 0];
    }
    return [x[0], x[1] / this.totalRecords, x[1]];
};

ReferenceBarChart.prototype.switchRelativeAbsolute = function(){
    var self = this;
    this.newData = this.oldData.map(function (a) {
        return self.rescale(a);
    });
    var xrange = self.x.domain();

    this.newData = this.newData.filter(function (d) {
        return xrange.indexOf(d[0]) > -1;
    });
    if(this.parent.statisticsCollapsable.collapsableChartsCollapsed){
        return;
    }
    this.render();
};

ReferenceBarChart.prototype.formatting = function(d){
    if(d > 1000){
        return (d / 1000);
    }
};

/**
 * Created by s115426 on 22-6-2017.
 */

ReferenceLineDiagram = function (parent, g, xpos, ypos, startValue, maxValue, key, keyValue = "") {
    var filterline;
    this.parent = parent;
    this.xpos = xpos;
    this.ypos = ypos;
    this.startValue = startValue;
    this.maxValue = maxValue;
    this.key = key;
    this.newData = 0;
    this.endLineWidth = this.parent.lineWidth - 10;
    this.keyValue = keyValue;
    this.total = this.newData;

    this.x = d3.scale.linear()
        .range([0, this.endLineWidth]);

    this.x.domain([0, 100]);

    this.xaxis = d3.svg.axis()
        .scale(this.x)
        .orient("bottom")
        .tickFormat(d3.format("s"))
        .ticks(4);

    this.g = g.append("g").attr("transform", "translate(" + (xpos + 20) + ", " + ( ypos + 10) + ")");

    this.g.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", this.endLineWidth)
        .attr("height", 30)
        .attr("class", "bar-background");

    this.backgroundClickable = this.g.append("rect")
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 30)
        .attr("class", "bar-background");

    this.backgroundClickable.append("title")
        .html((this.startValue / this.maxValue * 100).toFixed(2) + "%" + "  |  " + (this.startValue));

    this.darkBar = this.g.append("rect")
        .attr("x", 0)
        .attr("y", 10)
        .attr("height", 10)
        .attr("class", "status0");

    this.darkBar.append("title")
        .html((this.startValue / this.maxValue * 100).toFixed(2) + "%"  + "  |  " + (this.startValue));

    filterline = this.g.append("g")
        .attr("class", "new-line-diagram-block");

    filterline.append("rect")
        .attr("x", 0)
        .attr("y", 10)
        .attr("width", 0)
        .attr("height", 10)
        .attr("class", "hovered")
        .append("title");

    this.verticalLine = this.g.append("line")
        .attr("y1", 5)
        .attr("y2", 25)
        .style("stroke-width", 3)
        .attr("class", "stroke-locked");

    this.verticalLine.append("title")
        .html((this.startValue / this.maxValue * 100).toFixed(2) + "%"  + "  |  " + (this.startValue));

    this.g.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .text(this.key.ucfirst() + " - " + this.keyValue);

    this.horizontalAxis = this.g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + ( 30 ) + ")")
        .call(this.xaxis);

    this.horizontalAxis.select("path").style("display", "none");

    this.render();
};

ReferenceLineDiagram.prototype.render = function () {
    var perspective = 0;
    //if(this.parent.absolute){
        this.x.domain([0, this.maxValue]);
        perspective = this.maxValue;
    //} else{
    //    this.x.domain([0, 100]);

        //perspective = this.total;
    //    perspective = this.maxValue;
    //    console.log(this.total, this.startValue, this.maxValue, this.startValue / this.maxValue, this.newData);
   // }

    this.xaxis.scale(this.x);
    this.horizontalAxis.call(this.xaxis);

    this.backgroundClickable.attr("x", this.startValue / this.maxValue * this.endLineWidth - 10);
    this.darkBar.attr("width", this.startValue / this.maxValue * this.endLineWidth);
    this.verticalLine
        .attr("x1", this.startValue / this.maxValue * this.endLineWidth)
        .attr("x2", this.startValue / this.maxValue * this.endLineWidth);

    var line = this.g.select(".new-line-diagram-block");

    line.select("rect").transition().duration(500)
        .attr("width", this.newData / perspective * this.endLineWidth >= 2 ? this.newData / perspective * this.endLineWidth : 2);

    line.select("title")
        .html((this.newData / perspective * 100).toFixed(2) + "%"  + "  |  " + (this.newData));

};

ReferenceLineDiagram.prototype.updateData = function (data) {
    if(data[this.key] instanceof Array){
        this.newData = data[this.key][0][1];
        this.total = data[this.key][0][1] + data[this.key][1][1];
    } else{
        this.newData = data["total_records"];
        this.total = this.newData;
    }
    if(this.parent.statisticsCollapsable.collapsableChartsCollapsed){
        return;
    }
    this.render();
};

ReferenceLineDiagram.prototype.removeData = function(){
    this.newData = 0;
    if(this.parent.statisticsCollapsable.collapsableChartsCollapsed){
        return;
    }
    this.render();
};

ReferenceLineDiagram.prototype.switchRelativeAbsolute = function(){
    if(this.parent.statisticsCollapsable.collapsableChartsCollapsed){
        return;
    }
    this.render();
};
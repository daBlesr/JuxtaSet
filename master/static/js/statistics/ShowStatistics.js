/**
 * Created by s115426 on 8-3-2017.
 */

StatisticalCharts = function (parent, g_element, referenceData) {
    var toggle;
    var self = this;
    this.parent = parent;
    this.svg = g_element;
    this.data = null;
    this.barChartHeight = 200 - 30;
    this.barChartWidth = 300 - 30;
    this.lineWidth = 250 - 30;
    this.lineHeight = 100 - 30;
    this.referenceData = referenceData;
    this.barCharts = [];
    this.lineDiagrams = [];
    this.absolute = false;

    var keys = Object.keys(this.referenceData).subtract(["total_records", "elements"]);
    var currentX = 0;
    var currentY = 50;

    this.collapsables = [];
    this.statisticsCollapsable = new Collapsable(this,0,"Attribute Statistics");
    this.attributeCharts = this.statisticsCollapsable.collapsableCharts;

    this.lineDiagrams.push(new ReferenceLineDiagram(this, this.attributeCharts, 0, currentY, this.referenceData["total_records"], this.referenceData["total_records"], "total_records"));
    //currentX += this.barChartWidth + 5;
    /**
    for(var i = 0; i < keys.length; i++){
        if(this.referenceData[keys[i]].length == 2){
            this.lineDiagrams.push(new ReferenceLineDiagram(this, this.attributeCharts, currentX, currentY, this.referenceData[keys[i]][0][1], this.referenceData["total_records"], keys[i], this.referenceData[keys[i]][0][0]));
            if(currentX > 0){
                currentX = 0;
                currentY += this.lineHeight;
            } else{
                currentX = this.barChartWidth + 5;
            }
        }
    }*/

    //if(currentX > 0){
    currentX = 0;
    currentY += this.lineHeight;
    //}

    for(var i = 0; i < keys.length; i++){
        if(this.referenceData[keys[i]].length >= 2){
            this.barCharts.push(new ReferenceBarChart(this, this.attributeCharts, currentX, currentY, keys[i]));
            if(currentX > 0){
                currentX = 0;
                currentY += this.barChartHeight;
            } else{
                currentX = this.barChartWidth;
            }
        }
    }

    if(currentX > 0){
        currentX = 0;
        currentY += this.barChartHeight;
    }

    this.statisticsCollapsable.setChildren(this.barCharts.concat(this.lineDiagrams));


    currentY += 30;
    this.statisticsCollapsable.setHeight(currentY);
    this.baselinechartCollapsable = new Collapsable(this, 30, "Set Degree Comparison Chart");
    this.baselinechart = new BaseLineChart(this, parent, this.baselinechartCollapsable.collapsableCharts);
    var sizeblc = this.baselinechart.lineHeight * parent.columnList.length + 40;
    currentY += sizeblc;

    this.baselinechartCollapsable.setHeight(sizeblc);


    this.elementsCollapsable = new Collapsable(this, 60, "Elements View");
    this.elementsView = new ElementsTable(this, this.elementsCollapsable.collapsableCharts);

    this.columnToggle = this.svg.append("g")
        .attr("transform", "translate(" +[40,-60] +")").attr("class","absolute-relative-toggle");

    toggle = this.columnToggle.selectAll("absolute-relative-toggle")
        .data(["absolute", "relative"])
        .enter()
        .append("g")
        .attr("transform",function(d){
            if(d === "absolute"){
                a = [0,0];
            } else{
                a = [100, 0];
            }
            return "translate(" + a + ")";
        });

    toggle.append("circle")
        .attr("class", "whitefill toggle-outer stroke-status0")
        .attr("r", 7)
        .style("stroke-width", 2);

    toggle.append("circle")
        .attr("class",function(d){ return "toggle-inner " +(d === "relative"?"status0" : "whitefill"); })
        .attr("r", 4)
        .style("cursor","pointer")
        .on('click', function(d){
            self.toAbsolute(d === "absolute");
        });
    toggle.append("text")
        .attr("x", 20)
        .attr("y", 3)
        .text(function(d){ return d});

    this.isolateCount = this.svg.append("g")
        .attr("transform", "translate(" +[this.barChartWidth + 20,-55]+")")

    this.isolateCount.append("g")
        .attr("class","hovered")
        .append("text")
        .attr("font-size",25);
    this.isolateCount.append("text")
        .attr("font-size",25)
        .attr("class","mono");

    this.hoveredTotalRecords = 0;
    this.renderCounts();
};

StatisticalCharts.prototype.loadNewData = function (s, f, row) {
    this.hoveredTotalRecords = s["total_records"];
    this.renderCounts();

    for (var i = 0; i < this.lineDiagrams.length; i++) {
        this.lineDiagrams[i].updateData(s);
    }

    for (var i = 0; i < this.barCharts.length; i++) {
        this.barCharts[i].updateData(s);
    }

    this.elementsView.loadNewData(s["elements"], f);
    this.baselinechart.loadNewData(row);
};

StatisticalCharts.prototype.removeData = function(){
    this.isolateCount.select("text")
        .text("");
    for (var i = 0; i < this.lineDiagrams.length; i++) {
        this.lineDiagrams[i].removeData();
    }

    for (var i = 0; i < this.barCharts.length; i++) {
        this.barCharts[i].removeData();
    }
    this.baselinechart.removeData();
};

StatisticalCharts.prototype.toAbsolute = function(a) {
    this.columnToggle.selectAll(".toggle-inner")
        .classed("whitefill",function(d){ return (d === "absolute" && !a) || (d==="relative" && a)})
        .classed("status0",function(d){ return (d === "absolute" && a) || (d==="relative" && !a)});
    this.absolute = a;
    for (var i = 0; i < this.lineDiagrams.length; i++) {
        this.lineDiagrams[i].switchRelativeAbsolute();
    }
    for (var i = 0; i < this.barCharts.length; i++) {
        this.barCharts[i].switchRelativeAbsolute();
    }
    this.baselinechart.switchRelativeAbsolute();
    this.renderCounts();
};

StatisticalCharts.prototype.renderCounts = function(){
    if (this.absolute) {
        this.isolateCount.select("text")
            .attr("x", (String(this.referenceData["total_records"]).length - String(this.hoveredTotalRecords).length) * 14)
            .text(this.hoveredTotalRecords);
        this.isolateCount.select("text.mono")
            .attr("x",String(this.referenceData["total_records"]).length * 14 + 6)
            .text("/ " + this.referenceData["total_records"]);
    } else {
        var new_value = formatPercentage(this.hoveredTotalRecords / this.referenceData["total_records"] * 100) +"%";
        this.isolateCount.select("text")
            .attr("x", ("/ 100%".length - new_value.length) * 14)
            .text(new_value);
        this.isolateCount.select("text.mono")
            .attr("x","/ 100%".length * 14 + 6)
            .text("/ 100%");
    }
};
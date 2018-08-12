/**
 * Created by s115426 on 17-6-2017.
 */

Collapsable = function(parent, yOffset = 0, name){
    var self = this;
    this.height = 0;
    this.yOffset = yOffset;
    this.currentY = this.yOffset;
    this.parent = parent;
    this.children = [];
    this.name = name;
    this.parent.collapsables.push(this);
    this.collapsableChartsG = parent.svg.append("g")
        .attr("transform","translate(" + [0,yOffset] +")");
    this.collapsableChartsCollapsed = true;
    this.collapsablesBarToggle = this.collapsableChartsG.append("g")
        .on('click', function(){
            self.triggerToggles();
        })
        .on('mouseover',function(){
            d3.select(this).classed("hovered",true);
        })
        .on('mouseout',function(){
            d3.select(this).classed("hovered",false);
        })
        .style("cursor","pointer");
    this.collapsablesBarToggle.append("rect")
        .attr("width", this.parent.barChartWidth * 2)
        .attr("height", 20)
        .attr("class","bar-background");
    this.collapsablesBarToggle.append("text")
        .text("Show - " + name)
        .style("text-anchor","middle")
        .attr("x",this.parent.barChartWidth)
        .attr("y", 15);
    this.collapsableCharts = this.collapsableChartsG.append("g")
        .attr("transform","translate(0,"+(self.collapsableChartsCollapsed ? -100: 0)+")")
        .style("opacity", this.collapsableChartsCollapsed ? 0: 1)
        .classed("hidden",this.collapsableChartsCollapsed);
};

Collapsable.prototype.setHeight = function(height){
    this.height = height;
};

Collapsable.prototype.triggerToggles = function(){
    var self = this;
    var indexToggled = this.parent.collapsables.indexOf(this);
    this.toggle();
    this.parent.collapsables.forEach(function(a, i){
        if(i > indexToggled){
            a.move(self.collapsableChartsCollapsed, self.height);
        }
    });
};

Collapsable.prototype.toggle = function(){
    var self = this;
    this.children.forEach(function(child){
        child.render();
    });
    this.collapsableChartsCollapsed = !this.collapsableChartsCollapsed;
    if(!this.collapsableChartsCollapsed) this.collapsableCharts.classed("hidden", false);

    this.collapsableCharts
        .transition().ease("linear")
        .duration(400)
        .style("opacity", this.collapsableChartsCollapsed ? 0 : 1)
        .attr("transform","translate(0,"+(this.collapsableChartsCollapsed ? -100: 0)+")")
        .each("end",function(){
            if(self.collapsableChartsCollapsed) self.collapsableCharts.classed("hidden", true);
        });
    this.collapsablesBarToggle.select("text").text((this.collapsableChartsCollapsed ? "Show - " : "Hide - ")+this.name);
};

Collapsable.prototype.move = function(up, height){
    this.currentY += up ? -height : height;
    this.collapsableChartsG
        .transition().ease("linear")
        .duration(600)
        .attr("transform","translate(0,"+ this.currentY + ")");
};

Collapsable.prototype.setChildren = function(children){
    this.children = children;
};
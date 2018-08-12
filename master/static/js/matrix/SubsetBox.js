/**
 * Created by s115426 on 2-5-2017.
 */

SubsetBox = function(additional_props){
    var reset_field;
    var help_field;
    var self = this;
    var props = {
        showColumnBarChart: true,
        cumulative: false,
        expandable: false,
        numberOfItemsShown: 30,
        showColumnLabels: true,
        title: 'Combined Patterns',
        legendObjects: [
            {class1: "status0", class2: "status0", text: "Subset non-susceptible patterns"},
            {class1: "status2", class2: "status2", text: "Redundant subset non-susceptible patterns" +
            ""},
        ],
    };
    var combinedProperties = Object.assign(props, additional_props);
    PatternsMatrix.call(this, combinedProperties);

    var r = 7;
    this.symbolBox.append("circle")
        .attr("r", r)
        .attr("cy", 8)
        .style("stroke",COLOR_STATUS0)
        .style("fill",COLOR_STATUS0);
    this.symbolBox.append("circle")
        .attr("r", r)
        .style("fill","white")
        .style("stroke",COLOR_STATUS0)
        .style("stroke",COLOR_STATUS0)
        .attr("cx",r * 2 + 2)
        .attr("cy", 8);
    this.symbolBox.append("circle")
        .attr("r", r)
        .attr("cx",r * 4 + 2 * 2)
        .attr("cy", 8)
        .style("fill","rgba(255,255,255,0")
        .style("stroke",COLOR_STATUS0);

    var arc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(5)
        .startAngle(Math.PI * 0.5 )
        .endAngle(Math.PI * 2);

    this.symbolBox.append("g")
        .attr("transform", "translate(" + [r * 2 + 2, 8] + ")")
        .append("path")
        .style("fill", COLOR_STATUS0)
        .attr("d",arc);

    var arc2 = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(5)
        .startAngle(Math.PI )
        .endAngle(Math.PI * 2);

    this.symbolBox.append("g")
        .attr("transform", "translate(" + [r * 4 + 2* 2, 8] + ")")
        .append("path")
        .style("fill", COLOR_STATUS0)
        .attr("d",arc2);

    this.order("rowFrequency");

};

SubsetBox.prototype = Object.create(PatternsMatrix.prototype);
SubsetBox.prototype.constructor = SubsetBox;

SubsetBox.prototype.selectSubset = function (row) {
    /**
    this.highlightRow(row);
     */
    var categoriesHovered = [];

    this.cells_g.selectAll("g").each(function (cell) {
        if (cell.row === row) {
            categoriesHovered.push(cell.column.colLabel);
        }
    });

    return categoriesHovered;

    // window.filters.addFilter('pattern_contains', categoriesHovered, 'AND', true);
};

SubsetBox.prototype.deselectSubset = function (){
    //window.filters.removeFilter('pattern_contains');
};

SubsetBox.prototype.recomputeStatus = function(){
    var sets = this.visibleRowList.map(function(row){
        return new Set(row.cells.map(function(cell){ return cell.column.colLabel;}));
    });
    var self = this;

    this.visibleRowList.forEach(function(row, idx){
        var x;
        var status = 0;
        for(x = idx + 1; x < sets.length; x++){
            if(self.visibleRowList[x].absolute < row.absolute){
                break;
            }

            if(sets[x].isSuperset(sets[idx])){
                status = 2;
                break;
            }
        }
        row.cells.forEach(function(cell){
            cell.status = status;
        })
    });
    this.render();
};
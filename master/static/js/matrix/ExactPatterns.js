/**
 * Created by s115426 on 4-5-2017.
 */

ExactPatterns = function(additional_props){
    var self = this;
    var props = {
        marginLeft: 600,
        cumulative: true,
        expandable: false,
        title: 'Exact Patterns',
        legendObjects: [
            {class1: "status1", class2:"status1", text: "Isolates susceptible against categories"},
            {class1: "status0", class2:"status0", text: "Isolates non-susceptible against categories"},
            {class1: "status0", class2:"status1", text: "Measurement data has been imputed", imputed: true},
        ],
    };
    var combinedProperties = Object.assign(props, additional_props);
    PatternsMatrix.call(this, combinedProperties);
    window.exactPatterns = this;
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
        .attr("cx",r * 2 + 2)
        .attr("cy", 8);
    this.symbolBox.append("circle")
        .attr("r", r)
        .attr("cx",r * 4 + 2 * 2)
        .attr("cy", 8)
        .style("fill","rgba(255,255,255,0")
        .style("stroke",COLOR_STATUS0);

    this.statisticalChartsElement = this.svg.append("g")
            .attr("transform", "translate(" + (this.WIDTH_OF_CELLBOX + this.WIDTH_SPACE_RIGHT_SIDE_BOX + 20) + ", " + (0) + ")");
    this.statisticalCharts = null;

    this.filtersBox = this.svg.append("g").attr("transform", "translate(" + (this.WIDTH_OF_CELLBOX + this.WIDTH_SPACE_RIGHT_SIDE_BOX + 20) + ", " + (-165) + ")");
    window.filters.draw(this.filtersBox);

    this.order("default");

    extractSettingsAndSendRequest({
        url: base_url + "statistics",
        callback: function (a) {
            window.statisticalCharts = new StatisticalCharts(self, self.statisticalChartsElement, a);
        },
    });

    extractSettingsAndSendRequest({
        url: base_url + "treatments",
        callback: function (a) {
            self.addSubsetBox(a);
        }
    });
};

ExactPatterns.prototype = Object.create(PatternsMatrix.prototype);
ExactPatterns.prototype.constructor = ExactPatterns;

ExactPatterns.prototype.addSubsetBox = function (data) {
    var offsetToLeft = this.WIDTH_SPACE_LEFT_SIDE_BOX + this.WIDTH_SPACE_RIGHT_SIDE_BOX + this.WIDTH_OF_CELLBOX - 8;

    this.subsetBox = new SubsetBox({
        records: data.antibiogram.antibiogram,
        columns: data.categories.map(function (d) {
            return d.category;
        }),
        absolute_number_of_records: data.antibiogram.no_records,
        svg_element: this.svg,
        marginLeft: - offsetToLeft,
        marginTop: 0,
        parent: this,
    });

    window.subsetBox = this.subsetBox;

    this.subsetBox.sortColumns(this.columnList);
};

ExactPatterns.prototype.filterRows = function (columns) {
    var filteredRowList = this.rowList.filter(function (row) {
        // rows behouden die geschrapte cellen nog steeds lengte > 0 heeft
        // cellen die behouden worden:
        // -    cel bestaat niet voor categoryum
        // -    cel is groen

        // er moeten werkende categorya overblijven in het lijstje
        // anders kunnen we de bacterie niet doden.
        return row.filtered && columns.filter(function (col) {
                // er mogen van de row geen cells over blijven
                // row kan cell hebben die niet bestaat voor categoryum
                // wat betekent dat je bacterie kunt doden
                // als cell wel bestaat voor row dan moet die groen zijn
                // als de cell paars is dan komt ie in t lijstje en kunnen we bacterie niet doden
                return row.cells.filter(function (cell) {
                        return cell.column.colLabel === col && !cell.status;
                    }).length === 0;
            }).length === 0;
    });
    this.verticalSort(filteredRowList);
    this.resetScrollable();
    this.render();
};

ExactPatterns.prototype.removeImputation = function(){
    d3.select("#imputation-box").remove();
    window.imputationBox = null;
    this.moveStatisticalBox('left');
};

ExactPatterns.prototype.showImputation = function (row) {
    var createImputationRecords;
    var self = this;

    this.removeImputation();

    createImputationRecords = function () {
        var imputationIndex;
        var g;
        var g2;
        var antibiogram;
        var total_records;
        self.moveStatisticalBox('right');

        total_records = row.imputationInformation.map(function (x) {
            return x[1];
        }).sum();
        antibiogram = row.computeImputedGram(total_records);
        imputationIndex = row.cells.map(function(c){ return c.column.colLabel});

        g = self.svg.append("g")
            .attr("id","imputation-box")
            .attr("transform", "translate(" + [self.WIDTH_OF_CELLBOX + self.WIDTH_SPACE_RIGHT_SIDE_BOX + self.WIDTH_SPACE_LEFT_SIDE_BOX, 0]+ ")");

        g2 = g.append("g").attr("class", "clickable") .attr("transform", "translate(" +[-100,-100]+")");

        g2.append("path").attr("d", CLOSE_ICON_PATH).attr("class","status0");
        g2.append("path")
            .attr("d", RECT_ICON_PATH)
            .style("fill", "rgba(255,255,255,0)")
            .on('click', function () {
                self.removeImputation();
            });

        props = {
            records: antibiogram,
            columns: self.properties.columns,
            absolute_number_of_records: total_records,
            svg_element: g,
            imputationIndex: imputationIndex,
            fromRow: row,
        };
        window.imputationBox = new ImputationBox(props);
        window.imputationBox.columnsSorted = self.columnsSorted;
        window.imputationBox.sortColumns(self.columnList);
    };

    createImputationRecords();
};

ExactPatterns.prototype.computePercentageImputed = function (row) {
    var totalRecords;
    var self = this;
    if(row.imputationInformation) {

        totalRecords = row.imputationInformation.map(function (x) {
            return x[1];
        }).sum();

        var antibiogram = row.computeImputedGram(totalRecords);

        // for every column zero to multiple values have been imputed.
        // each cell on this row gets an indicator when values been imputed.

        row.cells.forEach(function (cell) {
            cell.percentageImputed = 0;
            antibiogram.forEach(function (a) {
                var imputed = !a[cell.status + 1].exists(cell.column.colLabel);
                if (imputed) {
                    cell.percentageImputed += parseFloat(a[0]);
                }
            });
        });
    }
};

ExactPatterns.prototype.moveStatisticalBox = function(direction){
    var pixels = 0;
    if(direction == 'left'){
        pixels = this.WIDTH_OF_CELLBOX + this.WIDTH_SPACE_RIGHT_SIDE_BOX;
    } else{
        pixels = (2 * (this.WIDTH_OF_CELLBOX + this.WIDTH_SPACE_RIGHT_SIDE_BOX) + this.WIDTH_SPACE_LEFT_SIDE_BOX);
    }
    this.statisticalChartsElement.transition().duration(200).ease("linear").attr("transform", "translate(" + (pixels) + ", " + 0 + ")");
};
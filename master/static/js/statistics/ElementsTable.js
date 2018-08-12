/**
 * Created by s115426 on 20-6-2017.
 */

ElementsTable = function(parent, g) {
    this.g = g;
    this.table = this.g.append("g")
        .attr("transform","translate(" + [0,30]+")")
        .append("switch")
        .append("foreignObject")
        .attr("width", parent.barChartWidth * 2)
        .attr("height", 300)
        .append("xhtml:div")
        .style("overflow","scroll")
        .style("width",parent.barChartWidth * 2)
        .style("height", "350px")
        .append("xhtml:table")
        .attr("class","tableSection")
        .attr("width", parent.barChartWidth * 2);
    this.parent = parent;
    this.data = [];
    this.filter = null;
    this.sorted = null;
    this.order = 'ASC';
    this.parent.elementsCollapsable.setChildren([this]);
};

ElementsTable.prototype.loadNewData = function(a, filter, t = true){
    if(t){
        this.sorted = null;
        this.order = 'ASC';
    }
    this.data = a;
    this.filter = filter;
    if(this.parent.elementsCollapsable.collapsableChartsCollapsed) {
        return;
    }
    this.render();
};

ElementsTable.prototype.render = function(){
    var keys;
    var tr;
    var row;
    var self = this;
    this.table.selectAll("*").remove();
    if(this.data.length >0){
        row = this.data[0];
        tr = self.table.append("xhtml:thead").append("xhtml:tr");
        keys = Object.keys(row).sort();
        keys.forEach(function(key){
            var th = tr.append("xhtml:th").html(key)
                .on('click',function(){
                    if(self.sorted === key){
                        if(self.order === 'ASC'){
                            self.order = 'DESC';
                        } else{
                            self.order = 'ASC';
                        }
                    } else{
                        self.sorted = key;
                    }

                    extractSettingsAndSendRequest({
                        url: base_url + "elements/offset/0/order-by/" + key + "/order/" + self.order,
                        callback: function(x){
                            self.loadNewData(x, self.filter, false);
                        },
                    }, self.filter);
                });
            if(self.sorted === key){
                th //.style("display","inline")
                    .html(key + `<i class="material-icons" style="font-size:36px;">${self.order === 'ASC' ? 'arrow_drop_up' : 'arrow_drop_down'}</i>`);
            }

        });
        var body = this.table.append("xhtml:tbody");
        this.data.forEach(function(row){
            tr = body.append("xhtml:tr");
            keys.forEach(function(key){
                tr.append("xhtml:td").html(row[key]);
            });
        });
    }
};

ElementsTable.prototype.loadExtraData = function(a){

};
/**
 * Created by s115426 on 8-5-2017.
 */

Filters = function(){
    this.filters = [];
    this.drawable = false;
    this.filtersNotDrawn = ["nesting", "classifications", "items_filtered"];
    this.originalFilter = [];
};

Filter = function(key, value, queryable = 'AND'){
    this.key = key;
    this.value = value;
    this.queryable = queryable;
};

Filters.prototype.draw = function(svg){
    this.svg = svg;
    this.innerBox = this.svg.append("g");
    this.filterRows = this.innerBox.append("switch")
        .append("foreignObject")
        .attr("width", 540)
        .attr("height", 100)
        .append("xhtml:div")
        .style("width", "540px")
        .style("height", "100px")
        ;
    this.rowHeight = 20;
    this.yOffsetText = 15;

    this.drawable = true;
    this.render();
};

Filters.prototype.analyzeDocument = function(){
    this.filters = [];
    var documentanalysis = new documentAnalysis();
    for(var x in documentanalysis.postObjects){
        var value = documentanalysis.postObjects[x];
        this.addFilter(x, value, 'AND');
    }
    this.render();
};

Filters.prototype.addFilter = function(key, value, queryable = 'AND'){
    var i, self = this;
    var existingFilter = this.filters.findByProperty('key', key);
    if(existingFilter){
        if(queryable === 'OR'){
            console.log('queryable or');
            if(existingFilter.value instanceof Array){
                if(!existingFilter.value.exists(value)){
                    existingFilter.value.push(value);
                }
            } else if(value instanceof Array && ! (existingFilter.value instanceof Array)){
                existingFilter.value = [existingFilter.value].union(value);
            } else if(value instanceof Array && existingFilter.value instanceof Array){
                existingFilter.value = existingFilter.value.union(value);
            } else if(! (value instanceof Array) && ! (existingFilter.value instanceof Array) && value !== existingFilter.value){
                existingFilter.value = [existingFilter.value, value];
            }
        } else{
            existingFilter.value = value;
        }
        existingFilter.queryable = queryable;
    } else{
        this.filters.unshift(new Filter(key, value, queryable));
    }
    this.render();
    if(this.drawable) this.filterRows.select(".filter-button")
        .transition().delay(100).duration(1000)
        .style("color",COLOR_HOVERED)
        .each("end", function(){
            d3.select(this).transition().delay(1000).duration(1000)
            .style("color",COLOR_LOCKED);
        });
};

Filters.prototype.removeFilter = function(key){
    var filter = this.filters.findByProperty('key', key);
    if(filter){
        filter.value = [];
    }
    this.render();
};

Filters.prototype.hasFilterValue = function(key, value){
    var filter = this.filters.findByProperty('key', key);
    if(filter){
        if(filter.value instanceof Array){
            return filter.value.exists(value)
        } else{
            return filter.value === value;
        }
    } else{
        return false;
    }
};

Filters.prototype.removeValueFromFilter = function(key, value){
    var filter = this.activeFilters().findByProperty('key', key);
    if(filter){
        if(filter.value instanceof Array){
            filter.value.splice(filter.value.indexOf(value), 1)
        } else{
            filter.value = [];
        }
    }
    this.render();
};

Filters.prototype.hasFilter = function(key){
    var filter = this.activeFilters().findByProperty('key', key);
    if(filter.value instanceof Array){
        if(filter.value.length === 0){
            return false;
        }
        return true;
    } else{
        return !!filter.value;
    }
};
Filters.prototype.originalFilters = function(){
    var self = this;
    return this.originalFilter.filter(function(row){
        return !self.filtersNotDrawn.exists(row.key) && !(row.value instanceof Array && row.value.length === 0);
    });
};

Filters.prototype.activeFilters = function(){
  var self = this;
  return this.filters.filter(function(row){
      return !self.filtersNotDrawn.exists(row.key) && !(row.value instanceof Array && row.value.length === 0);
  });
};


Filters.prototype.render = function(){
    if(!this.drawable) return;
    var of = JSON.parse(JSON.stringify(this.originalFilters()));
    of.forEach(function(a){
       a.original = true;
    });
    var activeFilters = this.activeFilters().concat(of);
    this.filterRows.selectAll("div.filter-top-node").data(activeFilters).exit().remove();
    this.filterRows.html("");
    var new_rows;
    var self = this;
    new_rows = this.filterRows.selectAll("div.filter-top-node")
        .data(activeFilters)
        .enter()
        .append("xhtml:div").attr("class","filter-top-node");

    new_rows.filter(function(d){return d.original})
         .style("background-color",COLOR_LOCKED)
         .style("color","#e6e6e6");

    new_rows.append("xhtml:span").attr("class","text-key");
    new_rows.append("xhtml:div").attr("class","text-value");
    new_rows.filter(function(d){return !d.original})
        .append("i").attr("class","material-icons icon-status0")
        .style("font-size","20px").text("cancel")
        .on('click', function(s){
            self.removeFilter(s.key);
        });

    this.filterRows.selectAll("div.filter-top-node")
        .select('.text-key')
        .transition().duration(1000)
        .text(function(row){ return row.key.replace(/\_/g," ") + ": "})
        .style("margin-right","2px")
        .style("text-decoration", "underline");

    this.filterRows.selectAll("div.filter-top-node")
        .select('.text-value')
        .transition().duration(1000)
        .each(function(row){
            var self2 = this;
            if(row.value instanceof Array){
                if(row.value.length > 4){
                    d3.select(self2).append("span")
                        .transition().duration(1000)
                           .style("font-style","italic")
                           .style("margin-left","2px")
                           .text(row.value.length + " values");
                } else{
                    row.value.forEach(function(v, i){
                        var inlinespan = d3.select(self2).append("span");
                        inlinespan.transition().duration(1000)
                               .style("font-style","italic")
                               .style("margin-left","2px")
                               .text(v);

                        if(!row.original){
                            inlinespan
                               .on('mouseover', function(){
                                    d3.select(this).style("text-decoration","line-through")
                                        .style("cursor","pointer");
                               })
                               .on('mouseout', function(){
                                    d3.select(this).style("text-decoration","none");
                               })
                               .on('click', function(s){
                                   d3.select(this).transition().duration(1000).text("")
                                       .each("end", function(){
                                            self.removeValueFromFilter(s.key,v);
                                           //self.render();
                                       });
                               });
                        }

                       if(i < row.value.length - 1) {

                           d3.select(self2).append("span")
                               .transition().duration(1000)
                               .style("margin-left","2px")
                               .style("margin-right","2px")
                               .text(row.queryable.toLowerCase());
                       }
                    });
                }

            } else{
                d3.select(self2).append("span")
                    .transition().duration(1000)
                    .text(function(row){ return row.value;})
            }
        });

    if(activeFilters.length > 0 && JSON.stringify(this.originalFilter) !== JSON.stringify(this.filters)){
        var executefilter = this.filterRows.append("div")
            .attr("class","filter-top-node filter-button")
            .style("font-weight","bold")
            .style("cursor","pointer");
        executefilter.append("span").text("Drill down");
        executefilter.on("click",function(){
            extractSettingsAndSendRequest({
                rebuild: true,
            });
            self.originalFilter = self.cloneFilters();
        });

    }

    var resetfilter = this.filterRows.append("div")
        .attr("class", "filter-top-node")
        .style("font-weight", "bold")
        .style("cursor", "pointer");
    resetfilter.append("span").text("Reset");
    resetfilter.on("click", function () {
        extractSettingsAndSendRequest();
    });
};

Filters.prototype.cloneFilters = function(){
  return JSON.parse(JSON.stringify(this.filters));
};

Filters.prototype.update = function(){
    this.filters = [];
    var documentanalysis = new documentAnalysis();
    for(var x in documentanalysis.postObjects){
        var value = documentanalysis.postObjects[x];
        this.addFilter(x, value);
    }
    this.originalFilter = this.cloneFilters();
    this.render();
};

/**
Filters.prototype.lockFilters = function(){
  this.activeFilters().forEach(function(f){
      f.locked = true;
  })
};*/

create_shallow_filter = function(){
    var f = new Filters(false);
    f.filters = JSON.parse(JSON.stringify(window.filters.originalFilter));
    return f;
};

create_from_filter = function(g){
    var f = new Filters(false);
    f.filters = g;
    return f;
};
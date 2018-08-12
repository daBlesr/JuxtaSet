/**
 * Created by s115426 on 2-5-2017.
 */

PatternsMatrix.prototype.rowClicked = function(row){
    if(this.lockedRow){
        if(this.lockedRow === row){
            this.unlockRow();
            if(this instanceof ExactPatterns){
                this.removeImputation(row);
            }
        } else{
            this.unlockRow();
        }
    } else{
        this.lockRow(row);
        if(this instanceof ExactPatterns){
            this.showImputation(row);
        }
    }
};

PatternsMatrix.prototype.lockRow = function (row) {
    this.lockedRow = row;
    this.icons.selectAll("g").select(".icon-lock").select("path").attr("d", function(row2){
        if(row === row2) return LOCK_ICON_PATH;
        return LOCK_OPEN_ICON_PATH;
    });
    if (this instanceof SubsetBox) {
        window.filters.addFilter('pattern_contains', this.selectSubset(row), 'AND', true);
        window.exactPatterns.filterRows(row.cells.map(function(cell){ return  cell.column.colLabel;}));
        window.statisticalCharts.barCharts.forEach(function(a){
           if(a.key === "pattern_contains"){
               a.render();
           }
        });
        this.parent.lockedRow = row;
    } else if(this instanceof ExactPatterns){
        this.subsetBox.lockedRow = row;
    }

    this.cells_g.selectAll("g").each(function (cell) {
        if(self instanceof ImputationBox){
            if(cell.status === 0)
                d3.select(this.firstChild).classed('hovered',false).classed('locked', cell.row === row);
        } else if(cell.isSpecial()){
            d3.select(this.firstChild).classed('hovered',false).classed('locked', cell.row === row);
        }

    });
    this.inter_cell_lines.selectAll("g").each(function(row2){
        if(self instanceof ImputationBox){
            d3.select(this).selectAll("line").each(function(line){
                if(d3.select(this).classed("stroke-status0")){
                    d3.select(this).classed('hovered',false).classed("stroke-locked", row === row2);
                }
            });
        } else{
            d3.select(this).selectAll("line").classed('hovered',false).classed('stroke-locked', row === row2);
        }
    });
};

PatternsMatrix.prototype.unlockRow = function(forced = false){
    if(window.subsetBox.lockedRow){
        window.filters.removeFilter('pattern_contains');
        window.exactPatterns.unfilterRows();
    }
    getViewBoxes().forEach(function(b){
        if(b.lockedRow){
            b.icons.selectAll("g").select(".icon-lock").select("path").attr("d", function(row2){
                return LOCK_OPEN_ICON_PATH;
            });
            b.cells_g.selectAll("g").each(function (cell) {
                d3.select(this.firstChild).classed('hovered',false).classed('locked', false);
            });
            b.inter_cell_lines.selectAll("g").each(function(row2){
                d3.select(this).selectAll("line").classed('hovered',false).classed('stroke-locked', false);
            });
            b.lockedRow = null;
            if(forced) b.unhighlightSelected();
        }
    });

};
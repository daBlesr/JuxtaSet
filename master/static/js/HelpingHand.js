/**
 * Created by s115426 on 29-5-2017.
 */

HelpingHand = function(){
    this.isHelping = false;
    this.selector = ".swimLanes-hor, .cell, .sortable, .column-bar-chart, .toggle, .imputed1, .imputed2, .view-title";
};

var helper = new HelpingHand();

HelpingHand.prototype.turnOff = function(){
    this.isHelping = false;
    window.filters.innerBox.classed("hidden", false);
    // d3.select("#helpertext").classed("hidden", true);
    d3.select("#chart").select("svg")
        .selectAll(this.selector)
        .style("cursor","pointer");
    d3.select("#helpertext").html(`Click on the question mark icon and then on some entity for an explanation about the
                            entity.`);

};

HelpingHand.prototype.turnOn = function(){
    this.isHelping = true;
    d3.select("#helpertext").classed("hidden", false);
    d3.select("#chart").select("svg")
        .selectAll(this.selector)
        .style("cursor","help");
};

HelpingHand.prototype.provideHelp = function(descr, obj, parent){
    window.filters.innerBox.classed("hidden", true);
    var text = '';
    var spanStart = '<span style="color:red">';
    var spanEnd = '</span>';
    if(descr === "hor-swimlane"){
        var resistant = ''; var not_resistant = ''; var imputed = ''; var redundant = false;
        //+ " (" + c.column.description +")"
        var formatter = function(a){ return a.map(function(c){ return c.column.colLabel }).join(", ")};
        if(parent instanceof SubsetBox){
            resistant = formatter(obj.cells);
            if(obj.cells[0].status === 2){
                redundant = true;
            }
        } else {
            resistant = formatter(obj.cells.filter(function(c){ return c.status == 0}));
            not_resistant = formatter(obj.cells.filter(function(c){ return c.status == 1}));
            if(parent instanceof  ImputationBox){
                imputed =  formatter(obj.cells.filter(function(c){ return c.status == 2}));
            }
        }

        text = `The current row clicked shows that ${obj.percentage.toFixed(2)}% of the current filter is resistant against 
            ${spanStart} ${parent instanceof SubsetBox ? 'at least' : 'exactly'} ${spanEnd} the categories ${resistant}
            ${parent instanceof SubsetBox ? (redundant ? '. This one has another color than one of the rows below. ' +
            'Since the number of isolates is practically the same as the number of isolates and the row below is resistant against one more ' +
            'category, this row is redundant and therefore is classified as such. ' : '') :
            ` and  ${spanStart} exactly not resistant ${spanEnd} against ${not_resistant} `}.
            ${parent instanceof ImputationBox ? 
            `However, data for ${imputed} were ${spanStart} missing ${spanEnd} and have been ${spanStart} imputed ${spanEnd}.` : ''}
            When hovering over the bar on the left, the absolute number of isolates is shown, which is ${obj.absolute}.
            ${parent.properties.cumulative ? 
            `Moreover, The number of isolates from the top row up to and including the selected row comprise ${obj.percentage2.toFixed(2)}% of the isolates.`: ''} 
            ${parent instanceof ExactPatterns ? `Some of the cells are marked with a blue dot,
                this means that some of isolates had missing data for that category` : ''}
        `
    } else if(descr === "sortable"){
        text = `
             This triangle allows you to sort resistance patterns.
             It will sort the patterns such that patterns 
             where there is resistance for (in this case) ${obj.colLabel} will come up highest.
             When you want to undo the sorting operation you can sort on percentage which is the default. 
        `
    } else if(descr === "column-bar-chart"){
        text = `
            The number ${formatPercentage(obj.percentage)} tells us that ${formatPercentage(obj.percentage)}% of the isolates is resistant against
            ${obj.colLabel}.`
    } else if(descr === "column-toggle"){
        text = `
            This round toggle allows us to filter resistance patterns which are resistant against (in this case) ${obj.colLabel}.
        `
    } else if(descr === "imputed-cell"){
        text = `For this resistance pattern data has been imputed. Bigger circles on the cells mean more imputed data for a specific category.
         By selecting the resistance pattern (click on it), 
        a diagram opens which shows for this specific resistance pattern where missing data was imputed.`
    } else if(descr === "title"){
        if(parent instanceof ExactPatterns){
            text = `
                This view shows the exact resistance patterns. Thus, the patterns which are measured with these exact resistances and measured with exact susceptibilities.
                 The resistance patterns are ordered
                 by frequency, therefore the top row is the most frequent resistance pattern in the dataset. 
                 Some of the cells are marked with a blue dot,
                this means that some of isolates had missing data for that category.
            `;
        } else if(parent instanceof SubsetBox){
            text = `This view shows the resistance patterns in an aggregated form.
                The percentage is the percentage of isolates in the data that are ${spanStart} at least ${spanEnd} resistant for the given categories.
                
            `;
        }
    }
    d3.select("#helpertext").html(text);
};




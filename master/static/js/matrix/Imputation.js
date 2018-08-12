/**
 * Created by s115426 on 2-5-2017.
 */

ImputationBox = function(additional_props){
    var props = {
        marginLeft: 0,
        marginTop: 0,
        hasSubsetBox: false,
        cumulative: true,
        expandable: false,
        title: 'Missing data patterns',
        legendObjects: [
            {class1: "status2 imputed", class2:"status2 imputed", text: "Data was missing"},
            {class1: "status1", class2:"status1", text: "Isolates susceptible against categories"},
            {class1: "status0", class2:"status0", text: "Isolates non-susceptible against categories"},
        ],
    };
    var combinedProperties = Object.assign(props, additional_props);
    PatternsMatrix.call(this, combinedProperties);

    this.order("rowFrequency");
};

ImputationBox.prototype = Object.create(PatternsMatrix.prototype);
ImputationBox.prototype.constructor = ImputationBox;

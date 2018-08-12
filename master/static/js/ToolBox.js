/**
 * Created by s115426 on 27-2-2017.
 */

function filtercategory(ele, category, recompute){

    if(items_filtered.indexOf(category) > -1){
        if(ele.children[0].innerText == 'lock_outline'){
            // dit mag niet, hij is locked
            return;
        }
        // terug toegevoegd
        items_filtered.splice(items_filtered.indexOf(category), 1);
        ele.parentNode.style.background = 'forestgreen';
        ele.children[0].innerText = 'cancel';
    } else{
        // nog niet verwijderd
        items_filtered.push(category);
        ele.parentNode.style.background = 'rgba(255,0,0,0.4)';
        if(recompute){
            ele.children[0].innerText = 'add_circle';
        }
    }
    if(recompute){
        extractSettingsAndSendRequest();
    }
}

var queued = null;

function extractSettingsAndSendRequest(request_caller, customFilter = null){

    if(queued){
        queued.abort();
    }

    var documentAns = new documentAnalysis();

    if(!window.filters){
        window.filters = new Filters();
    }

    if(!request_caller) {
        window.filters.update();
    }

    var filter;
    if(customFilter){
        filter = customFilter;
    } else{
        filter = window.filters;
    }

    function readyToVisualizeData(error, urlResult){
        var props;
        if(error){
            if(error.message == "abort"){

                return;
            } else{
                throw error;
            }
        }
        var c = document.getElementById('chart');
        while (c.firstChild) {
            c.removeChild(c.firstChild);
        }
        document.getElementById('chart2').innerHTML = "";
        d3.select("#tooltip").classed('hidden', true);

        if(documentAns.resistancePatternMethod.value === 'resistance-pattern-mining' && documentAns.dataMiningTechnique.value === 'arm'){

            function formatRules(d){
                var confidence = d[1];
                var RHS = d[0][1];
                var LHS = d[0][0];
                var cells = LHS.concat(RHS);

                var support = 0;
                for(var i = 0; i < urlResult.items.length; i++){
                    if((new Set(urlResult.items[i][0])).equals(new Set(LHS))){
                        support = urlResult.items[i][1];
                    }
                }
                return [confidence, cells, RHS, support];
            }
            props = {
                records: urlResult.rules.map(formatRules),
                columns: documentAns.categories,
                ARM: true,
                absolute_number_of_records: urlResult.no_records
            };
            new PatternsMatrix(props);

        } else if (documentAns.resistancePatternMethod.value === 'resistance-pattern-mining' && documentAns.dataMiningTechnique.value === 'clustering') {

            ClusterPlot(urlResult.clusters, urlResult.pca, urlResult.antibiogram, documentAns.categories, urlResult.cache_id, documentAns.outlierAnalysis.checked, documentAns.postObjects);

            if (documentAns.clusterTrendAnalysis.checked && documentAns.clusterMethod.value === 'k-means') {
                ClusterTrend(urlResult.trends);
            }
        } else if(documentAns.resistancePatternMethod.value === 'cartographic-chart'){
            Cartographic(urlResult, documentAns.cartographicAbsoluteOrRelative.checked);
        } else {
            props = {
                records: urlResult.antibiogram,
                columns: documentAns.categories,
                absolute_number_of_records: urlResult.no_records,
                cache_id: urlResult.cache_id,
            };
            new ExactPatterns(props);
        }

    }

    var tries = 0;
    var url = documentAns.url;

    documentAns.postObjects.data = filter.filters;

    function postRequest(callback){
        d3.xhr(url)
            .header("Content-Type", "application/json")
            .post(
                JSON.stringify(documentAns.postObjects),
                function(err, rawData){
                    if(!rawData && tries < 2){
                        return
                    } else{
                        callback(null, JSON.parse(rawData.responseText));
                    }
                }
            );
    }

    var tries2 = 0;

    if (request_caller && !request_caller.rebuild) {
        var url = request_caller.url;
        if (request_caller.method && request_caller.method === "GET") {
            d3.queue()
                .defer(d3.json, url)
                .await(function (error, urlResult) {
                    request_caller.callback(urlResult);
                });
        } else{
            d3.queue()
                .defer(postRequest)
                .await(function (error, urlResult) {
                    request_caller.callback(urlResult);
                });
        }
    } else {
        queued = d3.queue()
            .defer(postRequest)
            .await(function (error, urlResult) {
                queued = null;
                readyToVisualizeData(error, urlResult);
                //window.filters.lockFilters();
                //var originalFilter = create_from_filter(window.filters.cloneFilters());
            });
    }
}

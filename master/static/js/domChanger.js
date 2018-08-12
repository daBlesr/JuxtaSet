/**
 * Created by s115426 on 27-2-2017.
 */

function toggleDisplay(ele, value) {
    if (!value) {
        ele.style.display = 'none';
        if (ele.type == 'text' || ele.type == 'checkbox') {
            ele.parentNode.style.display = 'none';
        }
    } else {
        ele.style.display = 'block';
        if (ele.type == 'text' || ele.type == 'checkbox') {
            ele.parentNode.style.display = 'block';
        }
    }
}

// from http://stackoverflow.com/a/7018987/1094516
function hexToRGBA(h, o) {
    return 'rgba(' + parseInt(h.substring(1, 3), 16) + ',' + parseInt(h.substring(3, 5), 16) + ',' + parseInt(h.substring(5, 7), 16) + ',' + o + ')';
}

documentAnalysis = function () {
   // this.sexSelection = document.querySelector('input[name="sex-selection"]:checked');
   // this.materialSelection = document.querySelector('input[name="material-selection"]:checked');
    this.nestingLevel = document.querySelector('input[name="nesting-level"]:checked');
    this.supportField = document.getElementById('support');
    this.confidenceField = document.getElementById('confidence');
    this.dataMiningTechnique = document.querySelector('input[name="data-mining-options"]:checked');
    this.numberOfClusters = document.getElementById('number_of_clusters');
    this.categoryChips = document.getElementsByClassName('category-chip');
    this.clusterTrendAnalysis = document.getElementById('cluster-trend-analysis');
    this.clustering = document.getElementById('clustering');
    this.clusterMethod = document.querySelector('input[name="clustering-method"]:checked');
    this.dbscanEpsilon = document.getElementById('dbscan_epsilon');
    this.dbscanMinSamples = document.getElementById('dbscan_min_samples');
    this.outlierAnalysis = document.getElementById('outlier-analysis');
    this.sideInformation = document.getElementById('side-info');
    this.resistancePatternMethod = document.querySelector('input[name="resistance-pattern-method"]:checked');
    this.flippedNestedView = document.getElementById('flipped-nested-view');
    this.categories_or_classifications = document.getElementById("categories_or_classifications");
    this.cartographicAbsoluteOrRelative = document.getElementById('cartographic-absolute-or-relative');
    this.displayMedicinToolbox = document.getElementById('medicin-box-display');

    this.categories = [];
    for (var i = 0; i < this.categoryChips.length; i++) {
        this.categories.push(this.categoryChips[i].innerHTML);
    }


    this.categories = this.categories.subtract(items_filtered);

    this.postObjects = {
        items_filtered: items_filtered,
        classifications: this.categories_or_classifications.checked,
        nesting: this.nestingLevel.value,
        pattern_contains: [],
    };

    if (cache_id && cluster_id) {
        this.postObjects['cache_id'] = cache_id;
        this.postObjects['cluster_id'] = cluster_id;
    }
    this.url = '';

    // RESISTANCE PATTERNS -- EXACT OR RELATIVE
    toggleDisplay(this.nestingLevel, this.resistancePatternMethod.value !== 'resistance-pattern-relative');

    // DATA MINING
    toggleDisplay(this.supportField, this.dataMiningTechnique.value === 'arm');
    toggleDisplay(this.confidenceField, this.dataMiningTechnique.value === 'arm');

    toggleDisplay(this.numberOfClusters, this.clusterMethod.value === 'k-means');
    toggleDisplay(this.clusterTrendAnalysis, this.clusterMethod.value === 'k-means');
    toggleDisplay(this.clustering, this.dataMiningTechnique.value === 'clustering');

    toggleDisplay(this.dbscanEpsilon, this.clusterMethod.value === 'DBSCAN');
    toggleDisplay(this.dbscanMinSamples, this.clusterMethod.value === 'DBSCAN');


    if (this.resistancePatternMethod.value === 'resistance-pattern-mining' && this.dataMiningTechnique.value === 'arm') {
        this.url = base_url + "apriori/support/" + this.supportField.value + "/confidence/" + this.confidenceField.value;
    } else if (this.resistancePatternMethod.value === 'resistance-pattern-mining' && this.dataMiningTechnique.value === 'clustering') {
        this.url = base_url + "clustering/method/" + this.clusterMethod.value;
        this.postObjects['cluster_parameters'] = {};
        if (this.clusterMethod.value === 'k-means') {
            this.postObjects['cluster_parameters']['cluster_number'] = parseInt(this.numberOfClusters.value);
            if (this.clusterTrendAnalysis.checked) {
                this.postObjects['cluster_parameters']['trend_analysis'] = true;
            }
        } else if (this.clusterMethod.value === 'DBSCAN') {
            this.postObjects['cluster_parameters']['eps'] = parseFloat(this.dbscanEpsilon.value);
            this.postObjects['cluster_parameters']['min_samples'] = parseInt(this.dbscanMinSamples.value);
            if (this.outlierAnalysis.checked) {
                this.postObjects['cluster_parameters']['outlier_analysis'] = true;
            }
        }
    } else if (this.resistancePatternMethod.value === 'resistance-pattern-panels') {
        this.url = base_url + "antibiogram/panels"
    } else if (this.resistancePatternMethod.value === 'resistance-pattern-exact') {
        this.url = base_url + "antibiogram/exact";
    } else if (this.resistancePatternMethod.value === 'resistance-pattern-relative') {
        if (this.flippedNestedView.checked) {
            this.postObjects['effectiveness'] = true;
        }
        this.postObjects['nesting'] = this.nestingLevel.value;
        this.url = base_url + "antibiogram/relative";
    } else if (this.resistancePatternMethod.value === 'cartographic-chart') {
        this.url = base_url + "cartography";
    }
};
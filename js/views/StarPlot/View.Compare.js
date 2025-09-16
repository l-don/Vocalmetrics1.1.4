var Compare = new Class({

    // extend an existing class
    Extends: View,

    ////////////////
    // Attributes //
    ////////////////
    
    name: 'Compare',

    rendered: false,
    showLabels: false,

    
    initialize: function(){
		var that = this;

        // getting globals
        that.parent();

        that.options = {
			// SVG canvas for matrix
        	svgSize: {w: VM.settings.width, h: VM.settings.height},
            compSize: VM.settings.height / 4
        };

        // that.defineTools();
        that.addEvents();
	},

    /**
     * render svg canvases once on view startup
     * sets that.rendered = true
     */
    createCanvas: function() {
        var that = this;

        that.svg = VM.getCanvas().getDom('d3')
            .append('svg')
            .attr({
                width: that.options.svgSize.w,
                height: that.options.svgSize.h,
                id: 'Compare'
            });

        that.rendered = true;
    },

	render: function() {
        var that = this;

        if(!that.rendered) that.createCanvas();
        
        VM.ui.show();

        that.renderGroups();
   },

    renderGroups: function() {
        var that = this;

        that.prepareData();

        var numberOfCols = 3;


        ///////////////
        // Data join //
        ///////////////
        var datasetSel = that.svg.selectAll('.dataset')
            .data(that.data, function(d) {
                return d.get('id');
            });

        ///////////
        // Enter //
        ///////////
        datasetSel
            .enter()
            .append('g')
            .attr({
                id: function(d) {
                    return d.get('id');
                },
                'class': 'dataset',
                'transform': function(d, i) {
                    var col = i % numberOfCols,
                        row = Math.floor(i / numberOfCols);
                    return 'translate('+  (that.options.svgSize.w / 3 + col*(that.options.compSize + that.padding)) +','+ (that.options.compSize / 2 + that.padding + row*(that.options.compSize + that.padding)) +')';
                }
            })
            .each(function(d){
                new Radar().render(this, d, that.options.compSize);
            })
            .on('click', function(d){
                VM.getUI().get('detailsArea').showDataset(d);
            })
            .on('mouseover', function(d,i) {
                var featuresToShow = VM.getCurrentProject().featureGroups.headingsFeatures;
                var text = d.getFeature(featuresToShow[0].get('name'));
                VM.getUI().get('tooltip').showText(text);
            })
            .on('mousemove', function(d,i) {
                var e = d3.event;
                VM.getUI().get('tooltip').getDOMElement().setStyles({top: e.pageY, left: e.pageX +10});
            })
            .on('mouseout', function(d,i) {
                VM.getUI().get('tooltip').getDOMElement().hide();
            })
            .on('contextmenu', function(d,i) {
                d3.event.preventDefault();
                VM.getCurrentUser().removeSelectedDataset(d);
                VM.getCanvas().loadView(new Compare());
            });

        ////////////
        // UPDATE //
        ////////////
        datasetSel
            .each(function(d){
                $(this).empty();
                new Radar().render(this, d, that.options.compSize);
            });

        //////////
        // Exit //
        //////////
        datasetSel.exit().remove();

    },

    prepareData: function(){
        var that = this;

        var maxNumberOfPolarCharts = 9;

        that.data = VM.getCurrentUser().getSelectedDatasets().slice(0, maxNumberOfPolarCharts);
    },

    addEvents: function(){
        var that = this;
        
        that.listen('filtersChanged', function(){
            that.renderGroups();
        });
    },

    removeEvents: function(){
        var that = this;

        // call parent
        that.parent();

        that.unlisten('filtersChanged');
    }


});
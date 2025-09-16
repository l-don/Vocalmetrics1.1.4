var BarView = new Class({
    
    /*
     * VARS
     */
    
    settings: {
		width: $('#canvas').width() - 30,
		height: 400,
		padding: 30	
	},
	
    
    /*
     * construct
     */
    
    initialize: function(dom, sounds){
        
        var barPadding = 1;
		
		var svg = d3.select('#svg2').append('svg')
			.attr({
				width: settings.width,
				height: settings.height
			});
		
		var rects = svg.selectAll("rect")
			.data(dataset)
			.enter()
			.append("rect");
			
		rects.attr({
			x : function(d,i) {
				return i*(settings.width/dataset.length);
			},
			y : function(d){
				return settings.height -d*5;
			},
			width : settings.width/dataset.length - barPadding,
			height : function(d){
				return d*5;
			},
			fill: function(d){
				return 'rgb(0,0,'+(d*5)+')'	
			}
		});
		
		// labels
		var labels = svg.selectAll("text")
			.data(dataset)
			.enter()
			.append("text")
			.text(function(d){
				return d;
			})
			.attr({
				x : function(d,i) {
					return i*(settings.width/dataset.length) + (settings.width / dataset.length - barPadding) / 2;
				},
				y : function(d){
					return settings.height - d*5 -2;
				}
			});
    },
    
    
    /*
     * Methods
     */
    
    someFunction: function() {
    	var self = this;
    },
    
    // scales
	xScale: function() {
		var self = this;
		var func = d3.scale.linear()
        	.domain([1900, 1960])
        	.range([self.settings.padding, self.settings.width - self.settings.padding]);
    	return func;
	},
    
    yScale: function() { 
    	d3.scale.linear()
	     //.domain([d3.min(singings, function(d) { return d.length; }), d3.max(singings, function(d) { return d.length; })])
	    .domain([5,20])
     	.range([this.settings.padding, this.settings.height - this.settings.padding])
	},
	// axes		
	xAxis: d3.svg.axis()
              .scale(this.xScale)
              .orient("bottom"),
    
    
});
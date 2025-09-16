var Radar = new Class({

    // extend an existing class
    Extends: View,
    
    ////////////////
    // Attributes //
    ////////////////

    options: {
    	marginFromCenter: 0,
    	numberOfRasterLines: 5
    },

    initialize: function(VM){
		
		var that = this;

        // getting globals
        that.parent();
     },
    
    render: function(el, dataset, size) {
		var that = this;
		
        // console.log(el);
		
    	that.dataset = dataset;
    	that.data = that.prepareData(that.dataset);

    	var w = size;
    	var h = w;
		var showScales = true;
    	var container = d3.select(el);

		
		var series, hours, minVal, maxVal;
		var vizPadding = {
			top : 10,
			right : 0,
			bottom : 15,
			left : 0
		};
		var radius, radiusLength;
		var ruleColor = "#444";
		
		// featureCount = VM.settings.featureList.length;
		var featureDefinitions = VM.getCurrentProject().featureGroups.ratableFeatures;
		var featureCount = featureDefinitions.length;

		// DO IT
		loadData();
		buildBase();
		setScales();
		if(showScales) addAxes();
		draw();

		function loadData() {

			series = [[], []];
			hours = [];

			_.each(featureDefinitions, function(fd, i){
				var value = that.dataset.getFeature(fd.get('name'));
				if(value === 0) value = that.options.marginFromCenter;
				series[0][i] = value;
				hours[i] = i;
			});

			minVal = VM.settings.ratingScaleRange[0];
			maxVal = VM.settings.ratingScaleRange[1];

			//to complete the radial lines
			// for ( i = 0; i < series.length; i += 1) {
			// 	series[i].push(series[i][0]);
			// }
		};

		function buildBase() {
			// container.append("svg:rect").attr('id', 'axis-separator').attr('x', 0).attr('y', 0).attr('height', 0).attr('width', 0);
			that.vizBody = container.append("svg:g").attr('id', 'body');
		};

		function setScales() {

			var heightCircleConstraint, widthCircleConstraint, circleConstraint, centerXPos, centerYPos;

			//need a circle so find constraining dimension
			heightCircleConstraint = h - vizPadding.top - vizPadding.bottom;
			widthCircleConstraint = w - vizPadding.left - vizPadding.right;
			circleConstraint = d3.min([heightCircleConstraint, widthCircleConstraint]);
			radius = d3.scale.linear().domain(VM.settings.ratingScaleRange).range([0, (circleConstraint / 2)]);
			radiusLength = radius(maxVal);

			//attach everything to the group that is centered around middle
			centerXPos = widthCircleConstraint / 2 + vizPadding.left;
			centerYPos = heightCircleConstraint / 2 + vizPadding.top;
			//that.vizBody.attr("transform", "translate(" + centerXPos + ", " + centerYPos + ")");
		};

		function addAxes() {

			var radialTicks = radius.ticks(that.options.numberOfRasterLines), i, circleAxes, lineAxes;
			that.vizBody.selectAll('.circle-ticks').remove();
			that.vizBody.selectAll('.line-ticks').remove();

			circleAxes = that.vizBody.selectAll('.circle-ticks').data(radialTicks);
			circleAxes
				.enter()
				.append('svg:g')
				.attr("class", "circle-ticks");
			
			circleAxes
				.append("svg:circle")
				.attr("r", function(d, i) {
					return radius(d);
				});

			circleAxes
				.append("svg:text").attr("text-anchor", "middle")
				.attr({
	                'class': 'grid tickLabel hidden',
	                "dy": function(d) {
					    return -1 * radius(d);
	                }
				})
				.text(String);

			lineAxes = that.vizBody.selectAll('.line-ticks').data(hours);

			lineAxes
				.enter()
				.append('svg:g')
				.attr("transform", function(d, i) {
					return "rotate(" + ((i / hours.length * 360) - 90) + ")translate(" + radius(maxVal) + ")";
				})
				.attr("class", "line-ticks");

			lineAxes
				.append('svg:line')
				.attr("x2", -1 * radius(maxVal));
			
			lineAxes
				.append('svg:text')
				.text(function(d,i) {
					return featureDefinitions[i].get('displayName');
				})
				.attr({
	                'class': 'grid axisLabel hidden',
	                "dx": function(d, i) {
					    // return 15;
					    // return (i / hours.length * 360) < 180 ? -15 : 15;
					    return (i / hours.length * 360) < 180 ? 15 : -15;
	                },
	                "text-anchor": function(d,i) {
	                    var align;
	                    (i < featureCount/2) ? align = 'left' : align = 'end';
	                    return align;
				    },
				    'transform':  function(d, i) {
					return (i / hours.length * 360) < 180 ? null : "rotate(180)";
					}
				});

		};

		function draw() {

			var groups, lines, linesToUpdate;

			highlightedDotSize = 4;

			//////////////////
			// Data join //
			//////////////////
			groups = that.vizBody.selectAll('.series').data(series);
			
			///////////
			// Enter //
			///////////
			groups
				.enter()
				.append("svg:g")
				.attr({
					'class': 'shape'
				});

			groups.exit().remove();

			lines = groups.append('svg:path')
				.attr("class", "line")
				.attr("d", d3.svg.line.radial().radius(function(d) {
					return 0;
				})
				.angle(function(d, i) {
					if (i === featureCount) {
						i = 0;
					}//close the line
					return (i / featureCount) * 2 * Math.PI;
				}))
				.style({
					"stroke-width": 1,
					opacity: 0.5,
				});
	            

			groups.selectAll(".curr-point").data(function(d) {
				return [d[0]];
			})
			.enter().append("svg:circle").attr("class", "curr-point").attr("r", 0);

			groups.selectAll(".clicked-point").data(function(d) {
				return [d[0]];
			})
			.enter().append("svg:circle").attr('r', 0).attr("class", "clicked-point");

			lines.attr("d", d3.svg.line.radial().radius(function(d) {
				return radius(d);
			}).angle(function(d, i) {
				if (i === featureCount) {
					i = 0;
				}

				return (i / featureCount) * 2 * Math.PI;

			}));
		}; 

    },
    
    prepareData: function(dataset) {
    	var result = [];
    	var sum = 0;			// to calculate the percentage of the segment
    	
    	// var list = ['vibrato', 'glissando', 'intensity', 'roughness', 'breathiness', 'register', 'articulation', 'rubato', 'offbeat'];
    	
		var featureDefinitions = VM.getCurrentProject().featureGroups.ratableFeatures;

		_.each(featureDefinitions, function(fd){
			var obj = {};
			obj.name = fd.get('name');
			obj.value = dataset.getFeature(fd.get('name'));
			sum += obj.value;
			result.push(obj);
		});

    // 	for(var attribute in dataset) {
    		
    // 		if(list.contains(attribute)) {
				// var obj = {};
				// obj.name = attribute;
				// obj.value = dataset[attribute];
				// sum += parseFloat(obj.value);
				// result.push(obj);
    // 		}
    // 	}
		
		result.forEach(function(element,i){
			element.perc = element.value / sum;
		});
		
    	return result;
    },

    _prepareData: function(dataset) {
    	var result = [];
    	var sum = 0;			// to calculate the percentage of the segment
    	
    	var list = ['vibrato', 'glissando', 'intensity', 'roughness', 'breathiness', 'register', 'articulation', 'rubato', 'offbeat'];
    	
    	for(var attribute in dataset) {
    		
    		if(list.contains(attribute)) {
				var obj = {};
				obj.name = attribute;
				obj.value = dataset[attribute];
				sum += parseFloat(obj.value);
				result.push(obj);
    		}
    	}
		
		result.forEach(function(element,i){
			element.perc = element.value / sum;
		});
		
    	return result;
    }
});
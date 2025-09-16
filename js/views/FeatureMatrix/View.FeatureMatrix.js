var FeatureMatrix = new Class({

    // extend an existing class
    Extends: View,

    // mix in properties from following classes/objects
    // Implements: [VM],
   
    /*
     * VARS
     */
	
    rendered: false,            // rendered var for setting svg canvases as created
    selectedMatrixPoints: [],

    /*
     * construct
     */
    
    initialize: function(VM){
		var self = this;
				
        // getting globals
        self.VM = VM;

        self.options = {
			// SVG canvas for matrix
        	svgSize: {w: self.VM.settings.width, h: self.VM.settings.height * 2/5},

	        // SVG canvas for sounds
	        svgSize2: {w: self.VM.settings.width, h: self.VM.settings.height * 3/5},

            legend: [
                {type: 'color', color: 'rgb(38,41,74)', text: 'vibrato'},
                {type: 'color', color: 'rgb(1,84,90)', text: 'glissando'}
            ]
        };

        self.defineScales();
        self.defineAxes();
        self.setToolbox();
        self.setLegend(self.options.legend);

//        self.createCanvas();

        self.hoverbox = $('hoverbox');
	},

    /**
     * render svg canvases once on view startup
     * sets self.rendered = true
     */
    createCanvas: function() {
        var self = this;

        // TWO SVGs in this view

        // #1 svg canvas for matrix
        self.svg = self.VM.getCanvas().getDom('d3')
            .append('svg')
            .attr({
                width: self.options.svgSize.w,
                height: self.options.svgSize.h,
                id: 'FeatureMatrix'
            });

        // #2 svg canvas for sounds
        self.svg2 = self.VM.getCanvas().getDom('d3')
            .append('svg')
            .attr({
                width: self.options.svgSize2.w,
                height: self.options.svgSize2.h,
                // id: 'FeatureMatrixSounds',
                id: 'FeatureMatrix'
            });

        self.rendered = true;
    },

	render: function() {
        var self = this;

        if(!self.rendered) self.createCanvas();

        self.drawAxes();
        self.drawGrid();
        self.renderMatrix();
    },

    renderMatrix: function() {
        var self = this;

        self.prepareData();

        // JOIN
        // join new data with old elements, if any
        self.datapointsMatrix = self.svg.selectAll('g')
            .data(self.data);

        // UPDATE
        // update old elements as needed
        self.datapointsMatrix
            .transition()
            .attr({
                cy: function(d){
                    return self.yScale(self.VM.settings.featureList.indexOf(d.feature));
                }
            })
            .duration(1000)
            .delay(1000);

        // ENTER
        // create new elements as needed
        self.datapointsMatrix
            .enter()
            .append('circle')
            .attr({
                cx: function(d){
                    return self.xScale(d.release_year);
                },
                cy: -20,
                r: function(d){
                    return Math.sqrt(self.rScale(d.value));
                },
                "stroke-width" : function(d){
                    return 0;
                    // return d.vibrato;
                },
                'class': function(d){
                    return d.feature;
                }
            })
            .on(self.VM.settings.mouseevents.mouseover, function(d,i) {
                self.hoverbox.empty().show();
                self.hoverbox.grab(new Element('span', {text: d.release_year}));
                self.hoverbox.grab(new Element('span', {text: d.feature + ': ' + d.value}));

                self.bringToFront(this, self.svg);
            })
            .on('mousemove', function(d,i) {
                var e = d3.event;
                self.hoverbox.setStyles({top: e.pageY, left: e.pageX +10});
            })
            .on(self.VM.settings.mouseevents.mouseout, function(d,i) {
                self.hoverbox.hide();
            })
            .on('click', function(d,i) {
                // add to selection and toggle class 'selection'
                self.selectDataPoint({element: this, d: d, type: 'matrix'});

//                console.log(self.selectedMatrixPoints);
                // load sounds of the selected matrix points
                self.renderSounds(self.selectedMatrixPoints);
            })
            .on('contextmenu', function(d,i) {
                // d3.event.preventDefault();
                // self.loadContextMenu(d, d3.event);
            })
            .transition()
            .attr({
                cy: function(d){
                    return self.yScale(self.VM.settings.featureList.indexOf(d.feature));
                }
            })
            .duration(1000)
            .delay(1000);

        // EXIT
        // remove old elements as needed
//        self.datapoints.exit()
//            .attr({
//                'class': function(d){
//                    return 'exit ' + matrixpoint.feature
//                }
//            })
//            .transition()
//            .duration(0)
//            .attr("y", 60)
//            .style("fill-opacity", 1e-6)
//            .remove();

    },

    renderSounds: function(matrixpoints) {
   		
   		var self = this;
   		
        self.prepareSoundsData(matrixpoints);
        console.log(self.data2);

        // JOIN 
        // join new data with old elements, if any
        self.datapoints = self.svg2.selectAll('circle')
			.data(self.data2, function(d) { return d.id; });

        // UPDATE 
        // update old elements as needed
        self.datapoints
        	.transition()
        	.attr({
        		'class': function(d){
                    var dom = d3.select(this);
                    var value = d[d.selectedFeature];

                    var classes = 'update ' + d.selectedFeature;
                    if(value==0) classes += ' zero';
                    if(dom.classed('selected')) classes += ' selected';
                    if(dom.classed('subselected')) classes += ' subselected';

                    return classes;
        		},
        		r: function(d){
                    var value = d[d.selectedFeature];
                    if(value==0) value = 0.5;
                    return Math.sqrt(self.rScale(value));
				}
        	});
        
        // ENTER
        // create new elements as needed
        self.datapoints
       		.enter()
			.append('circle')
			.attr({
				cx: function(d){
					return self.xScale(d.release_year);
				},
				cy: -20,
				r: function(d){
                    var value = d[d.selectedFeature];
                    if(value==0) value = 0.5;
                    return Math.sqrt(self.rScale(value));
				},
				'class': function(d){
                    var dom = d3.select(this);
                    var value = d[d.selectedFeature];

                    var classes = 'enter ' + d.selectedFeature;
                    if(value==0) classes += ' zero';
                    if(dom.classed('selected')) classes += ' selected';
                    if(dom.classed('subselected')) classes += ' subselected';

                    return classes;
        		}
        	})
			//.call(new PieView(self.VM, function(d){ return d;}).getDom(this))
			.on(self.VM.settings.mouseevents.mouseover, function(d,i) {
				self.hoverbox.empty().show();
                self.hoverbox.grab(new Element('span', {text: d.title + ' - ' + d.artist}));
                self.bringToFront(this, self.svg2);
			})
			.on('mousemove', function(d,i) {
				var e = d3.event;
                self.hoverbox.setStyles({top: e.pageY, left: e.pageX +10});
			})
			.on(self.VM.settings.mouseevents.mouseout, function(d,i) {
				self.hoverbox.hide();
			})
			.on('click', function(d,i) {
                self.selectDataPoint({element: this, d: d});
			})
            .on('contextmenu', function(d,i) {
                d3.event.preventDefault();
                self.loadAttachmentMenu(d, d3.event);
            })
			.transition()
			.attr({
				cy: function(d){
					return self.yScale(self.stackPositions[d.id]);
				}
			})
			.duration(1000);

		// EXIT
		// remove old elements as needed
		self.datapoints.exit()
	      	.attr({
	      		'class': function(d){
        			return 'exit ' + d.selectedFeature
        		}
	      	})
			.transition()
            .style("opacity", 0)
			.duration(0)
//			.attr("cy", 60)
			.remove();
   },

    prepareData: function(){

        var self = this;

        // order sounds by year
        var dataMan = new DataManager(self.VM);
        self.data = dataMan.calculateFeatureMatrix();
    },

   prepareSoundsData: function(d){
   		
   		var self = this;
   		
   		// order sounds by year
		var dataMan = new DataManager(self.VM);

        var sounds = [];
        self.selectedMatrixPoints.each(function(item, i) {
            var soundSelection = dataMan.filter({'release_year': item.release_year.toString(), 'feature': item.feature});
            soundSelection.each(function(sound, i) {
                sound.selectedFeature = item.feature;
            });
            sounds.combine(soundSelection);
        });

        console.log(sounds);
		self.data2 = dataMan.sortByYear(sounds);
        console.log(self.data2);
   		// calculate stack positions
   		self.calculateStackPositions('title');
   },
   
   calculateStackPositions: function(sortBy){
   		
   		var self = this;
   		
   		// stack = {0: 0, 1: 0, 2: 0, 3: 1, 4: 2}	->  {sound_id: position}
   		var yearGroups = {};
   		var stack = {};
		
			// group sounds by year   		
	   		self.VM.sounds.forEach(function(el,i){
	   			//console.log(el);
	   			if(yearGroups[el.release_year] === undefined) {
	   				yearGroups[el.release_year] = [el];
	   			} else {
	   				yearGroups[el.release_year].push(el);
	   			}
	   		});
	   		
	   		// do the calculation
	   		for(year in yearGroups){
	   			
	   			// sort year by feature strength
	   			yearGroups[year].sort(function(a,b){
	   				if(a[sortBy] < b[sortBy])
						return -1;
					if(a[sortBy] > b[sortBy])
						return 1;
					return 0;
	   			});
	   			
	   			var k = 0;
	   			for(var i=0;i<yearGroups[year].length;i++){
	   				if(yearGroups[year][i][self.selectedFeature] == '0'){
	   					stack[yearGroups[year][i].id] = k;
	   				} else {
	   					stack[yearGroups[year][i].id] = k;
	   					k++;
	   				}
	   			}
	   			// yearGroups[year].forEach(function(el,i){
	   				// stack[el.id] = i;
	   			// });
	   		}
		
   		self.stackPositions = stack;
   },

   defineScales: function(){
   		var self = this;

   		// scales
		self.xScale = d3.scale.linear()
//                .domain([1900, 1960])
//                .domain([d3.min(sounds, function(d) { return d.release_year; }), d3.max(sounds, function(d) { return d.release_year; })])
                .domain([1899, d3.max(VM.sounds, function(d) { return d.release_year; })])
                .range([self.padding, self.options.svgSize.w - self.padding]);
    	self.yScale = d3.scale.linear()
                 //.domain([d3.min(sounds, function(d) { return d.id; }), d3.max(sounds, function(d) { return d.id; })])
                 .domain([0,9])
                .range([self.paddingTop, self.options.svgSize.h - self.paddingBottom]);

		self.rScale = d3.scale.linear()
                 .domain([0,4])
                 .range([0, self.VM.settings.width * 0.2]);
   },
   
   defineAxes: function(){
   	
   		var self = this;
   		
   		self.xAxis = d3.svg.axis()
          .scale(self.xScale)
          .tickFormat(d3.format(".0f"))
          .tickSubdivide([4])
          //.tickSize(6, 3, 0)
          //.tickValues([1900, 1901, 1902])
          .orient("bottom");
   },

    drawAxes: function() {
        var self = this;

        self.svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (self.options.svgSize.h - self.paddingBottom) + ")")
            .call(self.xAxis);
    },

    drawGrid: function() {
        var self = this;

        var num = 60;

        // draw the X grid lines
        self.grid = self.svg
            .append('g')
            .attr("class", "grid hidden");

        self.grid
            .selectAll("line.x")
            .data(self.xScale.ticks(num))
            .enter().append("line")
            .attr({
                "class": 'x',
                'x1': self.xScale,
                'x2': self.xScale,
                'y1': self.paddingTop,
                'y2': self.options.svgSize.h - self.paddingBottom
            });

        self.grid
            .selectAll("line.y")
            .data(self.yScale.ticks(9))
            .enter().append("line")
            .attr({
                "class": 'y',
                'x1': self.padding,
                'x2': self.options.svgSize.w - self.padding,
                'y1': self.yScale,
                'y2': self.yScale
            });
        self.grid
            .selectAll("text.legend")
            .data(self.yScale.ticks(9))
            .enter().append("text")
            .text(function(d,i){
                return VM.settings.featureList[i];
            })
            .attr({
                'class': 'legend',
                x: self.padding-5,
                y: self.yScale,
                dy: '0.5em',
                'text-anchor': 'end'
            });
    },

    setToolbox: function() {
        var self = this;

        self.toolboxSettings = {
            toolBinding: null,
            toolShowSound: null,
            toolMetaArtist: null,
            toolMetaLabel: null,
            toolMetaGenre: null,
            toolMetaYear: null,
            toolMetaGender: null,
            toolInverse: null,
            toolLegend: null,
            toolFilter: null,
            toolLight: null
        }
    }
});
var TimeFeatureView = new Class({
    
    // extend an existing class
    Extends: View,

    // mix in properties from following classes/objects
    // Implements: [VM],
   
    /*
     * VARS
     */
	
	options: {
		
	},
	    
    /*
     * construct
     */
    
    initialize: function(VM){
		
		var self = this;
				
        // getting globals
        self.VM = VM;
        
        // console.log(self.VM.settings.autoplay);
        // self.VM.settings.autoplay = true;
        // console.log(self.VM.settings.autoplay);
        
        self.selectedFeature = 'vibrato';
        //console.log(VM.currentView);
        
        self.defineScales();
        self.defineAxes();
        
        self.hoverbox = $('div#hoverbox');
	},
	    
    /*
     * Methods
     */
    
	render: function() {
		// keep reference to the instance
        var self = this;   
        
        self.prepareData();
        
        /* raphael paper
        self.paper = Raphael(self.VM.settings.canvas_id_name, self.VM.settings.width, self.VM.settings.height);
        
		var svg = d3.select(self.VM.settings.canvas_id + ' svg')
			.attr({
				width: self.VM.settings.width,
				height: self.VM.settings.height,
				id: 'TimeFeatureView'
			});
		*/
		self.svg = self.VM.getCanvas().getDom('d3')
			.append('svg')
			.attr({
				width: self.VM.settings.width,
				height: self.VM.settings.height,
				id: 'TimeFeatureView'
			});
		
		self.loadMenu();
		
		self.circles = self.svg.selectAll('g')
			.data(self.data)
			.enter()
			.append('circle')
			.attr({
				cx: function(d){
					return self.xScale(d.release_year);
				},
				cy: -20,
				// cy: function(d){
					// return self.VM.settings.height - yScale(self.stackPositions[d.id]);
				// },

				r: function(d){
					return Math.sqrt(self.rScale(d[self.selectedFeature]));
				},
				"stroke-width" : function(d){
					return 0;
					// return d.vibrato;
				},
				'class': 'enlarge'
			})
			//.call(new PieView(self.VM, function(d){ return d;}).getDom(this))
			.on('mouseenter', function(d,i) {
				self.hoverbox.empty().show();
				
			    self.hoverbox.append('<span>' + d.title + ' - ' + d.artist + '</span>');
				
				var el = d3.select(this);
				el.transition().attr("r",10);
				
				// var mouse = d3.mouse(this);
				// console.log(mouse);
				// console.log(d3.event.clientX, d3.event.clientY);
				// console.log(self.paper.getElementByPoint(d3.event.clientX, d3.event.clientY).attr({stroke: "#f00"}));
			})
			.on('mousemove', function(d,i) {
				var e = d3.event;
				self.hoverbox.css('top',e.pageY -60).css('left',e.pageX +10);
			})
			.on('mouseleave', function(d,i) {
				self.hoverbox.hide();
				d3.select(this).transition().attr({
					r: function(d){
						return Math.sqrt(self.rScale(d[self.selectedFeature]));
					}
				});
			})
			.on('click', function(d,i) {
				self.loadDetails(d);
				// call audio player instance
				self.VM.ui.audioplayer.loadSound(d);
				
				d3.select(this).attr('class', 'selected');
			})
			.on('contextmenu', function(d,i) {
				d3.event.preventDefault();
				self.loadContextMenu(d, d3.event);
			})
			.transition()
			.attr({
				cy: function(d){
					return self.VM.settings.height - self.yScale(self.stackPositions[d.id]);
				}
			})
			.duration(1000)
			.delay(1000);
		
		// axes
		self.svg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + (self.VM.settings.height - self.VM.settings.padding) + ")")
			.call(self.xAxis);
   },
   
   prepareData: function(){
   		
   		var self = this;
   		
   		// order sounds by year
		var dataMan = new DataManager(self.VM);
		self.data = dataMan.sortByYear(self.VM.sounds);
   		
   		// calculate stack positions
   		self.calculateStackPositions();
   },
   
   calculateStackPositions: function(){
   		
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
	   				if(a[self.selectedFeature] < b[self.selectedFeature])
						return -1;
					if(a[self.selectedFeature] > b[self.selectedFeature])
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
   
   changeFeature: function(selectedFeature) {
   	
   		var self = this;
   		
   		self.selectedFeature = selectedFeature;
   		
   		self.calculateStackPositions();
   		
   		self.circles.transition()
   		.attr({
			cy: function(d){
				return self.VM.settings.height - self.yScale(self.stackPositions[d.id]);
			},
			r: function(d){
				return Math.sqrt(self.rScale(d[self.selectedFeature]));
			}
		})
		.duration(5000);
   },
   
   defineScales: function(){
   	
   		var self = this;
   		
   		// scales
		self.xScale = d3.scale.linear()
                 .domain([1900, 1960])
                 .range([self.VM.settings.padding, self.VM.settings.width - self.VM.settings.padding]);
    	self.yScale = d3.scale.linear()
                 //.domain([d3.min(sounds, function(d) { return d.id; }), d3.max(sounds, function(d) { return d.id; })])
                 .domain([0,30])
                 .range([self.VM.settings.padding + self.VM.settings.padding_from_axis, self.VM.settings.height - self.VM.settings.padding]);
		
		self.rScale = d3.scale.linear()
                 .domain([0,4])
                 .range([0, self.VM.settings.width * 0.08]);
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
    
   loadMenu: function(){
   	
   		var self = this;
   		
   		self.svg
   		.on('dblclick', function(d){
			
			var e = d3.event;
			self.hoverbox.empty().show();
			
			self.VM.settings.featureList.forEach(function(el,i){
				$feature = $('<span>' + el + '</span>');
				var feature = self.hoverbox.append($feature);
				$feature.hover(function(e){
					console.log($(this).text());
					self.changeFeature($(this).text());
				});
				self.hoverbox.css('top',e.pageY).css('left',e.pageX);
			});
			    
		})
		.on('click', function(d){
			var e = d3.event;
			self.hoverbox.empty().hide();
		});
   },
   
   createSvg: function(){
   		
   		var self = this;
   }
});
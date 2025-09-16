var StartPie = new Class({
    
    // extend an existing class
    Extends: View,

    // mix in properties from following classes/objects
    //Implements: [VM, View],
   
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
        
        self.defineScales();
	},
	    
    /*
     * Methods
     */
    
    // scales
	render: function() {
		// keep reference to the instance
        var self = this;
        
        self.prepareData();
        
        var $hoverbox = $('div#hoverbox');
        
        // // scales
		// var xScale = d3.scale.linear()
                 // .domain([1900, 1960])
                 // .range([self.VM.settings.padding, self.VM.settings.width - self.VM.settings.padding]);
    	// var yScale = d3.scale.linear()
                 // //.domain([d3.min(self.VM.sounds, function(d) { return d.id; }), d3.max(self.VM.sounds, function(d) { return d.id; })])
                 // .domain([0,60])
                 // .range([self.VM.settings.padding, self.VM.settings.height - self.VM.settings.padding]);
// 		
		var xAxis = d3.svg.axis()
                  .scale(self.xScale)
                  .tickFormat(d3.format(".0f"))
                  .tickSubdivide([4])
                  //.tickSize(6, 3, 0)
                  //.tickValues([1900, 1901, 1902])
                  .orient("bottom");
        
        // generation 
		var svg = self.VM.getCanvas().getDom('d3')
			.append('svg')
			.attr({
				width: self.VM.settings.width,
				height: self.VM.settings.height
			});
		
		svg.selectAll('g')
			.data(self.data)
			.enter()
			.append('g')
			.attr({
				transform: function(d){
					new Donut(self.VM).render(this, d);
					// new Radar(self.VM).render(this, d);
					// return 'translate(' + self.xScale(d.release_year) + ',' + (self.VM.settings.height - self.yScale(d.id)) + ')';
					return 'translate(' + self.xScale(d.release_year) + ',' + 0 + ')';
				}
			})
			//.call(new PieView(self.VM, function(d){ return d;}).getDom(this))
			// .on('mouseenter', function(d,i) {
				// $hoverbox.empty().show();
// 				
				// for (var prop in d) {
				    // $hoverbox.append('<span>' + prop + ': ' + d[prop] + '</span><br>');
				// }
// 				
				// //$.each(d, function(key, value) {
					// //console.log(key+':'+value);
				// //});
			// })
			// .on('mousemove', function(d,i) {
				// var e = d3.event;
				// //d3.mouse('body');
				// $hoverbox.css('top',e.pageY +10).css('left',e.pageX +10);
			// })
			// .on('mouseleave', function(d,i) {
				// $hoverbox.hide();
			// })
			.on('click', function(d,i) {
				self.loadDetails(d);
				// call audio player instance
				self.VM.ui.audioplayer.loadSound(d);
			})
			.transition()
			.attr({
				// cy: function(d){
					// return self.VM.settings.height - self.yScale(self.stackPositions[d.id]);
				// }
				transform: function(d){
					// new Donut(self.VM).render(this, d);
					// new Radar(self.VM).render(this, d);
					// return 'translate(' + self.xScale(d.release_year) + ',' + (self.VM.settings.height - self.yScale(d.id)) + ')';
					return 'translate(' + self.xScale(d.release_year) + ',' + (self.VM.settings.height - self.yScale(self.stackPositions[d.id])) + ')';
				}
			})
			.duration(1000)
			.delay(1000);

		
		// axes
		svg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0," + (self.VM.settings.height - self.VM.settings.padding) + ")")
			.call(xAxis);
	},
    
    defineScales: function(){
   	
   		var self = this;
   		
   		// scales
		self.xScale = d3.scale.linear()
                 .domain([1900, 1960])
                 .range([self.VM.settings.padding, self.VM.settings.width - self.VM.settings.padding]);
    	self.yScale = d3.scale.linear()
                 //.domain([d3.min(sounds, function(d) { return d.id; }), d3.max(sounds, function(d) { return d.id; })])
                 .domain([0,15])
                 .range([self.VM.settings.padding + self.VM.settings.padding_from_axis, self.VM.settings.height - self.VM.settings.padding]);
		
		self.rScale = d3.scale.linear()
                 .domain([0,4])
                 .range([0, self.VM.settings.width * 0.08]);
   },
   
	prepareData: function(){
   		var self = this;
   		
   		// order sounds by year
		var dataMan = new DataManager(self.VM);
		self.data = dataMan.sortByYear(self.VM.sounds);
   		// calculate stack positions
   		self.calculateStackPositions();
   },

	calculateStackPositions: function() {
		var self = this;

		// stack = {0: 0, 1: 0, 2: 0, 3: 1, 4: 2}	->  {sound_id: position}
		var yearGroups = {};
		var stack = {};

		// group sounds by year
		self.VM.sounds.forEach(function(el, i) {
			//console.log(el);
			if (yearGroups[el.release_year] === undefined) {
				yearGroups[el.release_year] = [el];
			} else {
				yearGroups[el.release_year].push(el);
			}
		});

		// do the calculation
		for (year in yearGroups) {
   			// sort year by feature strength
	   			yearGroups[year].sort(function(a,b){
	   				if(a[self.selectedFeature] < b[self.selectedFeature])
						return -1;
					if(a[self.selectedFeature] > b[self.selectedFeature])
						return 1;
					return 0;
	   			});

			var k = 0;
			for (var i = 0; i < yearGroups[year].length; i++) {
				if (yearGroups[year][i][self.selectedFeature] == '0') {
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
	}
    
});
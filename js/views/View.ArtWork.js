var ArtWorkView = new Class({
    
    // extend an existing class
    Extends: View,

	data: null,		// sounds collection of only one artist or one label etc.
	data_2: null,	// average attributes of the sounds collection above
	    
    /*
     * construct
     */
    
    initialize: function(VM){
		var self = this;

		console.log('initialize ArtWorkView');

        // getting globals
        this.parent(VM);

        self.options = {
            // SVG canvas for matrix
            svgSize: {w: self.VM.settings.width, h: self.VM.settings.height}
        };
        
        // prepare data
        this.prepareData(this.VM.sounds);
	},
	    
    /*
     * Methods
     */
    
    // scales
	render: function() {
		// keep reference to the instance
        var self = this;   
        
        // scales
        var radiusScale = d3.scale.linear()
        	.domain([0,4])
        	.range([0, (self.options.svgSize.h - self.padding) / 2]);
        	
        var vibrateScale = d3.scale.linear()
        	.domain([0,4])
        	.range([0, 0.2]);
        	
		var xScale = d3.scale.linear()
                 .domain([1900, 1960])
                 .range([self.padding, self.options.svgSize.w - self.padding]);
    	var yScale = d3.scale.linear()
                 //.domain([d3.min(sounds, function(d) { return d.length; }), d3.max(sounds, function(d) { return d.length; })])
                 .domain([5,20])
                 .range([self.padding, self.options.svgSize.h - self.padding]);
		
        
        // generation 
		var svg = self.VM.getCanvas().getDom('d3')
			.append('svg')
			.attr({
				width: self.options.svgSize.w,
				height: self.options.svgSize.h,
				id: 'ArtWorkView'
			});
		
		console.log(self.data);
		console.log(self.data_2);
		
		svg.selectAll('circle')
			.data(self.data_2)
			.enter()
			.append('circle')
			.attr({
				cx: function(d){
					//return this.xScale(d.release_year);
					return self.options.svgSize.w / 2;
				},
				cy: function(d){
					return self.options.svgSize.h / 2;
				},
				r: function(d){
					return radiusScale(d.intensity);
				},
				"stroke-width" : function(d){
                    console.log(d.breathiness);
					return d.breathiness*20;
				}
				/* style: function(d){
					return 'animation: bump '+d.vibrato+';';					
				},*/
				//class: 'ani-vibrate'
			})
            .on(self.VM.settings.mouseevents.mouseover, function(d,i) {

                // show details in hoverbox
                self.loadHoverBox(d, 'artwork');

                // bring to front
//                self.bringToFront( this.parentNode, self.soundGroup);
            })
            .on('mousemove', function(d,i) {
                var e = d3.event;
                self.hoverbox.setStyles({top: e.pageY, left: e.pageX +10});
            })
            .on(self.VM.settings.mouseevents.mouseout, function(d,i) {
                self.hoverbox.hide();
            })
            .on('click', function(d,i) {
                self.selectDataPoint(this, d);
            })
            .on('contextmenu', function(d,i) {
//                d3.event.preventDefault();
//                self.loadAttachmentMenu(d, d3.event);
            })
            .on(self.VM.settings.mouseevents.mousewheel, function(d,i) {
                d3.event.preventDefault();
                // show next in group
//                self.showNextInGroup(d, d3.event);
            })
			.append('animateTransform').attr({
				attributeName: 'transform',
				type: 'translate',
				from: function(d) {
					return '0 2';
				},
				to: function(d) {
					return '2 0';
				},
				dur: function(d) {
					//return vibrateScale(d.vibrato)+'s';
					return vibrateScale(2)+'s';
				},
				repeatCount: "indefinite"
			});
		
   },
   
   prepareData: function(sounds) {
   		
   		var self = this;
   		
   		var dataMan = new DataManager(self.VM);
   		
   		// var artist = 'Ethel Waters';
   		//var artist = 'Mahalia Jackson';
   		var artist = 'Aretha Franklin';
   		
   		var artist_sounds = dataMan.filter({artist: artist});
   		
   		var artist_average = dataMan.average({artist: artist}, artist_sounds);
   		
   		self.data = artist_sounds;
   		self.data_2 = [artist_average];
   }
    
    
});
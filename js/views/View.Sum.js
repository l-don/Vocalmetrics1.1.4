var SumView = new Class({
    
    // extend an existing class
    //Extends: View,

    // mix in properties from following classes/objects
    //Implements: [VM, View],
   
    /*
     * VARS
     */
	
	data: null,		// sounds collection of only one artist or one label etc.
	data_2: null,	// average attributes of the sounds collection above
	    
    /*
     * construct
     */
    
    initialize: function(VM){
		
		console.log('initialize ArtWorkView');
		        
        // getting globals
        this.VM = VM;
        
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
        
        // clear canvas
        //self.settings.canvas.clear();
        
        var $hoverbox = $('div#hoverbox');
        
        // scales
        var radiusScale = d3.scale.linear()
        	.domain([0,4])
        	.range([0, (self.VM.settings.height - self.VM.settings.padding) / 2]);
        	
        var vibrateScale = d3.scale.linear()
        	.domain([0,4])
        	.range([0, 0.2]);
        	
		var xScale = d3.scale.linear()
                 .domain([1900, 1960])
                 .range([self.VM.settings.padding, self.VM.settings.width - self.VM.settings.padding]);
    	var yScale = d3.scale.linear()
                 //.domain([d3.min(sounds, function(d) { return d.length; }), d3.max(sounds, function(d) { return d.length; })])
                 .domain([5,20])
                 .range([self.VM.settings.padding, self.VM.settings.height - self.VM.settings.padding]);
		
        
        // generation 
		var svg = self.VM.getCanvas().getDom('d3')
			.append('svg')
			.attr({
				width: self.VM.settings.width,
				height: self.VM.settings.height
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
					return self.VM.settings.width / 2;
				},
				cy: function(d){
					return self.VM.settings.height / 2;
				},
				r: function(d){
					return radiusScale(d.intensity);
				},
				"stroke-width" : function(d){
					return d.breathiness*100;
				}
				/* style: function(d){
					return 'animation: bump '+d.vibrato+';';					
				},*/
				//class: 'ani-vibrate'
			})
			.on('mouseenter', function(d,i) {
				$hoverbox.empty().show();
				
				for (var prop in d) {
				    $hoverbox.append('<span>' + prop + ': ' + d[prop] + '</span><br>');
				}
				
			})
			.on('mousemove', function(d,i) {
				var e = d3.event;
				//d3.mouse('body');
				$hoverbox.css('top',e.pageY +10).css('left',e.pageX +10);
			})
			.on('mouseleave', function(d,i) {
				$hoverbox.hide();
			})
			.on('click', function(d,i) {
				$('div#audioplayer').fadeTo(0, 0).empty().append('<audio controls="controls"><source src="' + self.VM.settings.path_audio + d.file_audio +'" type="audio/ogg">Your browser does not support the HTML5 audio element.</audio>').fadeTo(300, 1);
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
   		
   		console.log(sounds.length);
   		var dataMan = new DataManager(self.VM);
   		
   		var artist = 'Ethel Waters';
   		// var artist = 'Mahalia Jackson';
   		// var artist = 'Robert Johnson';



   		
   		var artist_sounds = dataMan.filter({artist: artist});
   		
   		var artist_average = dataMan.average({artist: artist}, artist_sounds);
   		
   		self.data = artist_sounds;
   		self.data_2 = artist_average;
   }
    
    
});
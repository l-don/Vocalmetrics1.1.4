var Donut = new Class({
    
    /*
     * VARS
     */
    
    data: null,
    
    /*
     * construct
     */
    
    initialize: function(VM){
		
		var self = this;
		
        // getting globals
        self.VM = VM;
     },
    
    /*
     * Methods
     */
    
    render: function(el, data) {
		
		var self = this;
		
		var container, radius, radiusInner, arc_size;
		
		// check if data is defined (due to call from external view) or not (render as full view)
        if(data !== undefined) {
        	self.sound = data;
        	self.data = self.prepareData(self.sound);
        	
			radius = self.VM.settings.height / 40, //radius
			arc_size = 1/9;
        	
        	container = d3.select(el);
        	
        } else {
        	self.sound = self.VM.sounds[0];
        	self.data = self.prepareData(self.sound);
        	
			radius = self.VM.settings.height / 2, //radius
			arc_size = 1/9;
			
        	container = self.VM.getCanvas().getDom('d3')
				.append("svg")
				.attr("width", self.VM.settings.width)
				.attr("height", self.VM.settings.height)
				.append("g") //make a group to hold our pie chart
				.attr("transform", "translate(" + self.VM.settings.width / 2 + "," + radius + ")") //move the center of the pie chart from 0, 0 to radius, radius
				.attr({
					'id': 'pie'
			});
        }
		
		radiusInner = radius*0.5;
		
        var $hoverbox = $('div#hoverbox');
        
        var arc = d3.svg.arc()
		    .outerRadius(radius)
		    .innerRadius(radiusInner);
		
		var pie = d3.layout.pie()
		    .sort(null)
		    .value(function(d) { return d.value; });
		
		  self.data.forEach(function(d) {
		    d.value = +d.value;
		  });
		
		  var slices = container.selectAll(".arc")
		      .data(pie(self.data))
		      .enter()
		      .append("g")
		      .attr({
				'class': function(d){
					return "arc " + d.data.name;
				}
			})
			.on('mouseenter', function(d,i) {
				$hoverbox.empty().show();
			    $hoverbox.append('<span>' + d.data.name + ': ' + d.data.value + '</span>');
			})
			.on('mousemove', function(d,i) {
				var e = d3.event;
				//d3.mouse('body');
				$hoverbox.css('top',e.pageY +10).css('left',e.pageX +10);
			})
			.on('mouseleave', function(d,i) {
				$hoverbox.hide();
			});
		
		  slices.append("path")
		      .attr({
		      	"d": arc,
		      	'class': function(d){
					return "slice " + d.data.name;
				}
		      });
		
		container.append('circle')
			.attr({
				'cx': 0,
				cy: 0,
				r: radiusInner,
				fill: 'rgba(255,255,255,0)'
			})
			.on('click', function(d,i) {
				$('div#audioplayer').fadeTo(0, 0).empty().append('<audio controls="controls"><source src="' + self.VM.settings.path_audio + self.sound.file_audio +'" type="audio/ogg">Your browser does not support the HTML5 audio element.</audio>').fadeTo(300, 1);
			});
			
    },
    
    prepareData: function(sound) {
    	
    	var self = this;
    	
    	var result = [];
    	var sum = 0;			// to calculate the percentage of the segment
    	
    	for(var attribute in sound) {
    		
    		if($.inArray(attribute, self.VM.settings.featureList) > -1) {
				var obj = {};
				obj.name = attribute;
				obj.value = sound[attribute];
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
var PieView = new Class({

    // extend an existing class
    Extends: View,
    
    data: null,
    
    initialize: function(VM){
		
		var self = this;

        // getting globals
        this.parent(VM);
     },
    
    /*
     * Methods
     */
    
    render: function(el, data) {
		
		var self = this;
		
		var container, radius, radiusInner, arc_size, radiusScale;
		
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
		
		radiusScale = d3.scale.linear()
                 .domain([0, 4])
                 .range([0, radius]);
		
		var arc = d3.svg.arc()
			.startAngle(function(d,i) { return 0 + i*(arc_size * 2 * Math.PI); })
			.endAngle(function(d,i) { return (arc_size * 2 * Math.PI) + i*(arc_size * 2 * Math.PI);  })
			.innerRadius(0)
			.outerRadius(function(d,i) { return Math.sqrt((radiusScale(d.value)) * radius); });
		
		var segments = container.selectAll("g")
			.data(self.data)
			.enter()
			.append("g")
			.attr({
				'class': function(d){
					return "arc " + d.name;
				}
			})
			.on(self.VM.settings.mouseevents.mouseover, function(d,i) {
                self.loadHoverBox(d, 'pie');
			})
			.on('mousemove', function(d,i) {
                var e = d3.event;
                self.hoverbox.setStyles({top: e.pageY, left: e.pageX +10});
			})
            .on(self.VM.settings.mouseevents.mouseout, function(d,i) {
                self.hoverbox.hide();
            });
		
		segments.append("path")
			.attr("d", arc)
			.attr({
				'class': function(d){
					return "slice " + d.name;
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
				$('div#audioplayer').fadeTo(0, 0).empty().append('<audio controls="controls"><source src="' + self.vm.settings.path_audio + self.sound.file_audio +'" type="audio/ogg">Your browser does not support the HTML5 audio element.</audio>').fadeTo(300, 1);
			});
			
    },
    
    prepareData: function(sound) {
    	var result = [];
    	var sum = 0;			// to calculate the percentage of the segment
    	
    	var list = ['vibrato', 'glissando', 'intensity', 'roughness', 'breathiness', 'register', 'articulation', 'rubato', 'offbeat'];
    	
    	for(var attribute in sound) {
    		
//    		if($.inArray(attribute, list) > -1) {
    		if(list.contains(attribute)) {
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
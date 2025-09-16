var Geometry = new Class({

	initialize: function(){
		var that = this;

	},

	_euklidDist: function(d,c, weights){
		var sum = 0;

		Object.each(c.filter, function(value, key){
			// if(self.VM.settings.featureList.indexOf(key) > -1) sum += (d[key] - value) * (d[key] - value);
			var featureDistance = (d.getFeature(key) - value) * (d.getFeature(key) - value);
			

			featureDistance *= weights[key];
			
			sum += featureDistance;
		});

		var sumWeights = 0;
		_.each(weights, function(weight){
			sumWeights += weight;
		});

		sum = sum / sumWeights * sumWeights * 5;
		
		return Math.sqrt(sum);
	},

	_euklidDist: function(d,c, weights){
		var sum = 0;

		Object.each(c.filter, function(value, key){
			// if(self.VM.settings.featureList.indexOf(key) > -1) sum += (d[key] - value) * (d[key] - value);
			var featureDistance = (d.getFeature(key) - value) * (d.getFeature(key) - value);
			
			featureDistance *= weights[key];
			
			sum += featureDistance;
		});

		var sumWeights = 0;
		_.each(weights, function(weight){
			sumWeights += weight;
		});

		sum = sum / sumWeights * sumWeights * 5;
		
		return Math.sqrt(sum);
	},

	euklidDist: function(d,c, weights){
		var sum = 0;

		Object.each(c.filter, function(value, key){
			// if(self.VM.settings.featureList.indexOf(key) > -1) sum += (d[key] - value) * (d[key] - value);
			var featureDistance = (d.getFeature(key) - value) * (d.getFeature(key) - value);
			featureDistance *= weights[key];
			sum += featureDistance;
		});

		return Math.sqrt(sum);
	},

	circleDistance: function( d, d2 ){
		var that = this;
		return Math.sqrt( Math.pow((d.x-d2.x),2) + Math.pow((d.y-d2.y),2) ) - d.radius - d2.radius;	
	},

	getVectorAngle: function( d, d2 ){
		var xDiff = d2.x - d.x,
			yDiff = d2.y - d.y,
			angle = Math.atan2(yDiff, xDiff) * (180 / Math.PI);	// arcus tangent == tan^-1;
		if(angle>=0) angle = 180-angle;
		else angle = 180 + Math.abs(angle);

		angle = angle * Math.PI / 180;
		return angle;
	},

	getPositionOfLineEnd: function(start, length, angle){
		var dx, dy;

		dx = length * Math.cos(angle);
		dy = length * Math.sin(angle);
		return {x: start.x + dx, y: start.y - dy};
	},

	getTranslateXY: function(obj) {
		var matrix = obj.attr("-webkit-transform") ||
			obj.attr("-moz-transform")    ||
			obj.attr("-ms-transform")     ||
			obj.attr("-o-transform")      ||
			obj.attr("transform");
		console.debug(matrix);
		if(matrix !== 'none') {
			var values = matrix.split('(')[1].split(')')[0].split(',');
			var a = values[0] *1;
			var b = values[1] *1;
			var translate = {x: a, y: b};
		} else { var translate = {x: 0, y: 0}; }

		return translate;
	},

	getRotationDegrees: function(obj) {
		var matrix = obj.css("-webkit-transform") ||
			obj.css("-moz-transform")    ||
			obj.css("-ms-transform")     ||
			obj.css("-o-transform")      ||
			obj.css("transform");
		if(matrix !== 'none') {
			var values = matrix.split('(')[1].split(')')[0].split(',');
			var a = values[0];
			var b = values[1];
			var angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
		} else { var angle = 0; }

		if(angle < 0) angle +=360;
		return angle;
	}

});
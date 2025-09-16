var Gravity = new Class({

	// extend an existing class
	Extends: View,

	/////////////////
	// Attributes //
	/////////////////
	
	name: 'Gravity',

	rendered: false,
	dragging: { active: false, rating: {} },
	ratingMode: false,
	zeroMode: false,
	DOM_nodes: {},
	featureWeights: null,	// coming from the feature weight sliders

	settings: {
		chef_root_type: 0,
		chef_sound_type: 1,
		chef_feature_type: 2,
		chef_meta_type: 3,
		drag_treshold: 5
	},

	initialize: function(){
		var that = this;

		// getting globals
		this.parent(VM);

		that.options = {
			// SVG canvas for matrix
			svgSize: {w: VM.settings.width, h: VM.settings.height},
			force: {
				// visible influences
				collision_detection: true,
				chefOnly_collision_detection: false,
				multiple_chefs: true,
				show_links: true,
				// distanceToRootMagnet: 20,
				// datasetRadius: 8,
				// magnetRadius: 12,
				datasetRadius: VM.settings.height * .008,
				magnetRadius: VM.settings.height * .015,
				eggCellRadius: VM.settings.height * .618 / 2,
				candidateRadius: VM.settings.height * .012,
				coreRadius: VM.settings.height * .03,
				coreMargin: 25,
				// inner_membran_radius: VM.settings.height * .2 / 2,
				// feature_chef_color: 'yellow',
				root_chef_name: 'Leftovers',
				world_gravity: 0,
				general_sound_gravity: .2,
				general_sound_charge: 20,
				general_chef_charge: 0,
				rating_chef_charge: -4000,
				chefDistanceRange: [30,200],
				padding: 10,
				distanceLimit: 50,
				stdFeatureWeight: 1
			}
		};

		that.defineScales();
		that.defineTools();
		that.addEvents();
		that.defineEventHandlers();
	},

	render: function() {
		var that = this;
        
        console.log('Gravity:render()');
		
		if(!that.rendered) that.createCanvas();
		VM.ui.show();
		that.renderStart();
		that.renderOne();

	},

	/** render svg canvases once on view startup */
	createCanvas: function() {
		var that = this;

		that.svg = VM.getCanvas().getDom('d3')
			.append('svg')
			.attr({
				width: that.options.svgSize.w,
				height: that.options.svgSize.h,
				id: that.name
			});

		that.rendered = true;
	},

	renderStart: function() {
		var that = this;

		//------------------------------------
		// Vars
		//------------------------------------
		var	width = that.options.svgSize.w,
			height = that.options.svgSize.h;

		//------------------------------------
		// Data
		//------------------------------------
		that.prepareData();

		//------------------------------------
		// DOM preparation
		//------------------------------------
		that.svg.append('svg:g').attr('class', 'membran');
		that.svg.append('svg:g').attr('class', 'links');

		//------------------------------------
		// force:init()
		//------------------------------------
		that.force = d3.layout.force()
			.nodes(that.datasets)
			.size([width, height])
			.gravity(that.options.force.world_gravity)
			.charge(function(d,i){
				
				// no charge in general
				var charge = 0;
				
				// if (d.charge !== undefined) {
				// // if individual charge exists, take that
				// 	charge = d.charge;
				// } else if (d.chef) {
				// // charge for chefs
				// 	charge = that.options.force.general_chef_charge;
				// }

				return charge;
			})
			.on("tick", tick);
		
		that.force
			.links(that.links)
			.linkDistance(function(d,i){
				
				// dataset has only 1 focus
				if(
					d.source.chefs
					&& d.source.chefs.length === 1
				){
					// focus is a prototype
					if ( d.source.chefs[0].chef.type === that.settings.chef_sound_type ) {
						
						return that.distanceScale(d.source.chefs[0].distance);
					
					} 
					// focus is the root magnet
					else if ( d.source.chefs[0].chef.type === that.settings.chef_root_type ) {
						
						// position the datasets only in zeroMode
						if ( that.zeroMode )
							return that.distanceScale( 10 );
							// return that.distanceScale( that.options.force.datasetRadius + that.options.force.magnetRadius );
					}
					// focus is the feature magnet
					else if ( d.source.chefs[0].chef.type === that.settings.chef_feature_type ) {
						
						// position the datasets only in zeroMode
						return that.distanceScale( 20 );
							// return that.distanceScale( that.options.force.datasetRadius + that.options.force.magnetRadius );
					}
				}
				else{
					return false;
				}

			})
			.linkStrength(function(d,i){
				return .5;
				// if(that.ratingMode && d.target.type == that.settings.chef_root_type)
				// 	return 1;
				// else
				// 	if(d.source.chefs && d.source.chefs.length == 1 && d.source.chefs[0].chef.type != that.settings.chef_root_type)
				// 		// return 0;
				// 		return .5;
				// 	else
				// 		return 1;
			})
			.start();

		//------------------------------------
		// Force:tick()
		//------------------------------------
		function tick(e) {	// TODO in ratingMode do gravity/ collide and .attr() only for the candidate and the sounds attached to the dragged_el
		 	
		 	var datasetSel = that.svg.selectAll(".dataset");
		 	
		 	// moving towards a focus
			datasetSel.each(gravity(e.alpha));
	  		
	  		// general collision detection
	  		if (that.options.force.collision_detection)
  				datasetSel.each(collide(.5));

  			// screen borders collision detection
		 	datasetSel.each(borderCollide());

		 	// egg cell collision detection
			if ( that.ratingMode )
				datasetSel.each(eggCollide());

			datasetSel
		      .attr({
		      	'transform': function(d) {
                    // var xValue = d.getFeature(that.xFeature.get('name'));
                    // var yValue = d.getFeature(that.yFeature.get('name'));

                    // // if Dataset has no Ratings
                    // if(xValue === null) xValue = 0;
                    // if(yValue === null) yValue = 0;

                    // fetch calculation errors that may occured somewhere
                    // if (d.x === undefined || d.x === NaN ) d.x = 20;
                    // if (d.y === undefined || d.y === NaN ) d.y = 20;
                    if (d.x === undefined || d.x === NaN ) d.x = that.options.svgSize.w/2 + 5;
                    if (d.y === undefined || d.y === NaN ) d.y = that.options.svgSize.h/2 + 5;

                    // if (d.x === undefined ) d.x = 20;
                    // if (d.y === undefined ) d.y = 20;
                    
                    return 'translate(' + d.x + ',' + d.y + ')';
                }
		      });

	      	if(that.options.force.show_links) {
				that.svg.selectAll(".link")
					.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; });
	      	}

		}

		// Move nodes toward cluster focus.
		function gravity(a) {
		  return function(d) {

		  	// dont use gravity for datasets with ONE prototype,
		  	// because they use linkDistance to set their position
		  	if ( d.chefs && d.chefs.length < 2 ) return;

			if (that.ratingMode && d.chef){
				
				if(d.type == that.settings.chef_root_type) {

					// ...

				}
				else if (d.type == that.settings.chef_feature_type) {
				
					if (!d.fixed) {
						
						if (that.options.force.multiple_chefs) {
							d.chefs.forEach(function(c,i){
								d.x += (c.chef.x - d.x) * (c.gravity * a);
								d.y += (c.chef.y - d.y) * (c.gravity * a);
							});
						}
						else {
							d.x += (d.chefs[0].chef.x - d.x) * (d.chefs[0].gravity * a);
							d.y += (d.chefs[0].chef.y - d.y) * (d.chefs[0].gravity * a);
						}
					}
				}
			}
			else {
				if (!d.fixed) {
					
					if (that.options.force.multiple_chefs) {
						d.chefs.forEach(function(c,i){
							d.x += (c.chef.x - d.x) * (c.gravity * a);
							d.y += (c.chef.y - d.y) * (c.gravity * a);
						});
					}
					else {
						d.x += (d.chefs[0].chef.x - d.x) * (d.chefs[0].gravity * a);
						d.y += (d.chefs[0].chef.y - d.y) * (d.chefs[0].gravity * a);
					}
				}
			}

		  };
		}

		// move nodes out of the egg cell
		function eggCollide() {
			return function(d) {
				
				// dont move feature or root magnet
				if (
					d.chef
					&& (
						d.type === that.settings.chef_feature_type
						|| d.type === that.settings.chef_root_type
						|| (
							d.type === that.settings.chef_sound_type
							&& that.ratingMode
						)
					)
				) return;

				// move everything else away
				var distanceToCore = VM.Util.Geometry.circleDistance( d, {x: that.options.svgSize.w/2, y: that.options.svgSize.h/2, radius: 0} );
				if ( distanceToCore < that.options.force.eggCellRadius ) {
					
					var angle = VM.Util.Geometry.getVectorAngle(d, {x: that.options.svgSize.w/2, y: that.options.svgSize.h/2} )
					var newPos = VM.Util.Geometry.getPositionOfLineEnd( {x: that.options.svgSize.w/2, y: that.options.svgSize.h/2}, that.options.force.eggCellRadius + d.radius, angle );
					
					d.x = newPos.x;
					d.y = newPos.y;
				}

			};
		}

		// keep nodes within the view borders
		function borderCollide() {
			return function(d) {

				if ( d.x < 0 ) d.x = 0 + d.radius;
				else if ( d.x > that.options.svgSize.w ) d.x = that.options.svgSize.w - d.radius;
				if ( d.y < 0 ) d.y = 0 + d.radius;
				else if ( d.y > that.options.svgSize.h ) d.y = that.options.svgSize.h - d.radius;
					
			};
		}


		// Resolve collisions between nodes.
		function collide(alpha) {
		  var quadtree = d3.geom.quadtree(that.datasets);
		  return function(d) {
		  	if(!d.chef && that.options.force.chefOnly_collision_detection) return;
		  	// if(that.ratingMode && d.chef && d.type == that.settings.chef_root_type) {
		  	// 	return;
		  	// }
		  	if(that.dragging.active && (d.type == that.settings.chef_root_type || that.dragging.dragged_el == d)) return;
			var r = d.radius + that.radius.domain()[1] + that.options.force.padding,
				nx1 = d.x - r,
				nx2 = d.x + r,
				ny1 = d.y - r,
				ny2 = d.y + r;
			quadtree.visit(function(quad, x1, y1, x2, y2) {
			  if (quad.point && (quad.point !== d)) {
				var x = d.x - quad.point.x,
					y = d.y - quad.point.y,
					l = Math.sqrt(x * x + y * y),
					r = d.radius + quad.point.radius + (d.color !== quad.point.color) * that.options.force.padding;
				if (l < r) {
				  l = (l - r) / l * alpha;
				  d.x -= x *= l;
				  d.y -= y *= l;
				  quad.point.x += x;
				  quad.point.y += y;
				}
			  }
			  return x1 > nx2
				  || x2 < nx1
				  || y1 > ny2
				  || y2 < ny1;
			});
		  };
		}

	},

	prepareData: function(){
		var that = this;

		// it's important not to reset the arrays
		// bound to force.nodes() and force.links()
		// e.g. empty them wit pop or splice and not datasets = [];
		
		//////////////
		// Datasets //
		//////////////
		if(!that.datasets) that.datasets = [];
		
		that.datasets.splice(0,that.datasets.length);
		_.each(VM.getCurrentProject().getAllDatasets(), function(d){
			that.datasets.push(d);
		});
		// that.datasets = _.clone(VM.getCurrentProject().getAllDatasets());
		
		// perpare datasets with view-specific attributes (if view rendered for first time)
		that.datasets.each(function(d,i){
			if(!d.radius) d.radius = that.options.force.datasetRadius;
		});

		///////////
		// Chefs //
		///////////
		if (!that.chefs) {
			
			that.chefs = [
				{chef: true, type: that.settings.chef_root_type, attributes: {name: that.options.force.root_chef_name}, x: VM.settings.width/2, y: VM.settings.height/2, color: '#BD2F56'}
			];

			_.each(that.chefs, function(chef, i){
				chef.id = 'c'+i;
				chef.chef = true;
				// chef.type = chef.type,
				chef.fixed = true;
				// chef.filter = o.filter,
				// attributes: o.attributes,
				chef.radius = that.options.force.magnetRadius;
				// preset position
				// x: (o.x) ? o.x : undefined,
				// y: (o.y) ? o.y : undefined
			});

		}
		
		// that.datasets = that.chefs.concat(that.datasets);
		_.each(that.chefs, function(c){
			that.datasets.push(c);
		});

		if (!that.featureWeights) {

        	that.featureWeights = {};

            var featureDefinitions = VM.getCurrentProject().featureGroups.ratableFeatures;

            _.each(featureDefinitions, function(fd){
            	that.featureWeights[fd.get('name')] = that.options.force.stdFeatureWeight;
            });
		}

		/////////////
		// Links //
		/////////////
		if(!that.links)
			that.links = [];

		that.getChefs();
	},

	getChefs: function(sound){
		var that = this,
		
		reference_sounds = [];

		// reserve reference sounds for feature-chefs
		if(that.ratingMode) {
			
			var datasets = that.datasets.filter(function(o){
				return (!o.chef);
			});

			// VM.settings.featureList.forEach(function(feature){
			// _.each(VM.getCurrentProject().getAllFeatureDefinitions(), function(fd){
			_.each(VM.getCurrentProject().featureGroups.ratableFeatures, function(fd){
				datasets.sort(function(a,b){
					return a.getFeature(fd.get('name')) - b.getFeature(fd.get('name'));
				});
				// reference_sounds.push( {feature: feature, sounds: [ sounds[0], sounds[sounds.length-1] ]} );
				reference_sounds.push( {feature: fd, datasets: [ datasets.splice(0,1)[0], datasets.pop() ]} );
			});
		}

		// if sound specified, calculate chef only for this sound (performance opt)
		if(sound) { 
			var chefs_changed = false;
			calc(sound);
		}
		// else calculate chefs for all sounds
		else {
			that.datasets.each(function(d){
				if(!d.fixed) calc(d);
			});
		}

		function calc(d) {
			
			console.log('Prototype:getChefs() > calc()');
			
			var chefs = [],
				distances = [],
				old_chefs = d.chefs;

			// distance calculation
			that.chefs.forEach(function(c,i){
				// Sound-Magnet
				if(c.type == that.settings.chef_sound_type) {
					var dist = VM.Util.Geometry.euklidDist(d, c, that.featureWeights);
					distances.push({chef: c, dist: dist});
				}
				// Meta-Magnet
				// ...
			});

			// tolerance filter
			distances = distances.filter(function(a){
				return (a.dist < that.options.force.distanceLimit);
			});

			// sort by distance (nearest chefs first)
			distances.sort(function(a,b){
				return a.dist - b.dist;
			});
			// distances = distances.reverse();

			// check if sound is reserved as reference of a feature-chef
			var found = _.find(reference_sounds, function(rs){
				return ( rs.datasets[0].get('id') === d.get('id') || rs.datasets[1].get('id') === d.get('id') );
			});

			// take as reference for feature magnet
			// if( found && f_chef.length > 0 && !d.candidate ) {
			if( found && !d.candidate ) {
				var feature = (found) ? found.feature.get('name') : '';
				var f_chef = that.chefs.filter(function(c){
					return (c.type == that.settings.chef_feature_type && c.filter[feature] == 100);
				});
				var dist = VM.Util.Geometry.euklidDist(d, f_chef[0], that.featureWeights);
				chefs.push({chef: f_chef[0],  distance: dist, gravity: that.gravityScale(dist)});
			}
			// at least 1 chef found
			else if(distances.length > 0) {
				distances.forEach(function(c,i){
					chefs.push({chef: c.chef, distance: c.dist, gravity: that.gravityScale(c.dist)});
				});
			} 
			// no chef found, take root chef
			else {
				var gravity = (that.zeroMode) ? 0 : that.options.force.general_sound_gravity
				chefs.push({chef: that.chefs[0], gravity: gravity});
			}

			chefs_changed = !(chefs == old_chefs);
			// if(chefs_changed) d.chefs = chefs;	// TODO enable
			d.chefs = chefs;
		}

		// update links
		that.links.splice(0,that.links.length);
		function link(d){
			// get array index for each chef of the sound
			d.chefs.forEach(function(c){
				var chef = that.datasets.filter(filter);
				function filter(element) {
					if(element.chef && element.id == c.chef.id) return true; else return false;
				}
				// var link = {id: d.get('id')+'-'+c.chef.id, source: that.datasets.indexOf(d), target: that.datasets.indexOf(chef[0])};
				var link = {id: d.get('id')+'-'+c.chef.id, source: d, target: chef[0]};
				that.links.push(link);
			})
		}

		if(that.options.force.show_links) {
			Object.forEach(that.datasets, function(d,i){
				
				// link all sounds with their chefs
				if(!d.chef) {

					// link lonely data sets with root magnet only in zeroMode
					if ( 
						d.chefs[0].chef.type === that.settings.chef_root_type
						&& !that.zeroMode
					) return;
					
					link(d);
				}

			});
		}
		// if(that.force && chefs_changed) that.force.start(); // TODO enable
		if(that.force) that.force.start();
	},

	renderOne: function(block_fs_call) {	// TODO if in ratingMode: do everything only for the candidate, maybe even only updating linkSel
		var that = this;

		console.debug('renderOne()');
        
        //////////////////
        // Data Binding //
        //////////////////
		that.linkSel = that.svg.select('g.links').selectAll(".link")
			.data(that.links)

			// if ratingMode
			// if(that.ratingMode && that.dragging.active) {
			// 	console.log('renderOne(candidate)');
			// 	createLinks(that.linkSel);
			// 	if(!that.DOM_nodes[that.soundCandidate.id]) that.DOM_nodes[that.soundCandidate.id] = d3.select('circle.dataset.candidate');	// zwischenspeicher, vlt an allgemeinerer stelle platzieren
			// 	updateNodes(that.DOM_nodes[that.soundCandidate.id]);
			// 	updateLinks(d3.select('line.link.candidate'));
			// 	return;
			// }
			
		that.datapoints = that.svg.selectAll(".dataset")
			.data(that.datasets, function(d) {
                if(d.chef) return d.id;
                else return d.get('id');
            });


		///////////
		// Enter //
		///////////

        // LINKS -----------------------------
		function createLinks(selection) {
			selection
				.enter()
				.append('line');
		}

		createLinks(that.linkSel);

		// GRID -----------------------------
		function buildGrid(containerSel, hidden){
			containerSel.append('g')
				.attr({
					'class': hidden? 'grid hidden' : 'grid'
				})
				.each(function(){

					var gridSel = d3.select(this);

					var maxDistance = that.distanceScale(that.options.force.distanceLimit);
					var numberOfRings = Math.ceil(that.options.force.distanceLimit / 10);
					
					for(var i=1; i<=numberOfRings; i++){
						gridSel.append('circle')
							.attr({
								r: that.distanceScale(i*10)
							});

						gridSel.append('text')
							.attr({
								dy: -that.distanceScale(i*10)
							})
							.text(i*10);
					}

				});
		}

		// NODES -----------------------------
		that.datapoints
			.enter()
			.append('g')
			.attr({
				id: function(d) {
                    if(d.chef) return d.id;
                	else return d.get('id');
            	}
        	})
			.call(that.myForceDrag)
			.each(function(d){
				var gSel = d3.select(this);

				if (d.chef && d.type !== that.settings.chef_root_type){
					buildGrid(gSel, true);
				}
			})
			.append("circle")
			.attr('class', 'body')
			// .call(that.force.drag)
			.on('mouseover', function(d,i) {
				// show details in hoverbox
				if(!that.dragging.active) {
					if(d.chef){
						VM.getUI().get('tooltip').showText(d.attributes.name);
					} else {
						var featureDefinitions = VM.getCurrentProject().get('featureGroups').headingsFeatures
						var text = d.getFeature(featureDefinitions[0].get('name'));
						VM.getUI().get('tooltip').showText(text);
					}
				}
			})
			.on('mousemove', function(d,i) {
				var e = d3.event;
				// if(!that.dragging.active) that.hoverbox.setStyles({top: e.pageY, left: e.pageX +10});
				if(!that.dragging.active)
					// VM.getUI().get('tooltip').getDOMElement().empty().show();
					VM.getUI().get('tooltip').getDOMElement().setStyles({top: e.pageY, left: e.pageX +10});
					// that.hoverbox.setStyles({top: e.pageY, left: e.pageX +10});
			})
			.on('mouseout', function(d,i) {
				// that.hoverbox.hide();
				VM.getUI().get('tooltip').getDOMElement().hide();
			})
			.on('click', function(d,i) {

				if(d.chef) {
					
					// load prototyped dataset
					if (d.type === that.settings.chef_sound_type)
						that.selectDataset(d.dataset);
					
					// zeroMode on root magnet
					else if(d.type === that.settings.chef_root_type) {
						
						if ( that.ratingMode ){
							that.stopRating(d);
						} else {
							that.zeroMode = !that.zeroMode;
							that.force.resume();
							that.getChefs();
							that.renderOne();
						}
					}
					
				} else {

					// load dataset
					that.selectDataset(d);
				}

				console.debug('node clicked', d);
			})
			.on('dblclick', function(d,i) {
				if(!d.chef) {
					that.selectDataset(d);
	                VM.getUI().get('datasetMask').loadModel(d);
				}
            })
			.on('contextmenu', function(d,i) {
				d3.event.preventDefault();
				
				if(d.chef) {
					
					// destroy prototype
					if (d.type === that.settings.chef_sound_type)
						that.destroyChef(d);

					// start/ stop rating
					// else if (d.type === that.settings.chef_root_type)
					// 	that.startRating(d);
				
				} else {

					// create prototype
					that.createChef(d3.event, d, that.settings.chef_sound_type);
				}

			});


		////////////
		// Update //
		////////////
		
		// NODES -----------------------------
		that.datapoints
		  	.attr("class", function(d){
		  		
		  		var class_name = 'dataset';
		  		
		  		if ( !d.chef ) {
		  		
		  			class_name += ' sound';
		  			if(d.chefs && d.chefs[0].chef.type != that.settings.chef_root_type) class_name += ' attracted';
		  			if(that.ratingMode && d.candidate) class_name += ' candidate';
		  			// if(!d.validate()) class_name += ' invalid';
		  		
		  		} else {
		  		
		  			class_name += ' chef-'+d.type;
		  			if(that.ratingMode) class_name += ' ratingMode';
		  		}

		  		return class_name;
		  	});

		that.datapoints.select('circle.body')
			.attr("r", function(d) { return d.radius; });
		
		that.datapoints.select('.grid')
			.each(function(d){
				var gSel = d3.select(this);

				if (d.chef && d.type !== that.settings.chef_root_type){
					$(this).empty();
					buildGrid(gSel, false);
				}
			});

		// LINKS -----------------------------
		that.linkSel
			.attr({
				'stroke-width': function(d){
					var width;
					_.each(d.source.chefs, function(o,i){
						if(o.chef == d.target) {
							// width = that.linkWidthScale(o.gravity);
							width = that.linkWidthScale(o.distance);
						}
					});
					return width;
				},
				'class': function(d) {
					var class_name = 'link';
					if(d.target.type == that.settings.chef_root_type) class_name += ' invisible';
					if(d.source.candidate) class_name += ' candidate';
					return class_name;
					// return (d.target.type == that.settings.chef_root_type) ? 'link invisible' : 'link';
				}
			});

		
		//////////
		// Exit //
		//////////
		that.datapoints
			.exit()
			.transition()
            .duration(400)
            .style('opacity', 0)
            .remove();
        that.linkSel.exit().remove();

		// !!! needs to be called after changing the dataset, which is bound to the force
		if(!block_fs_call) that.force.start();

	},
	/**
	 * @param d the root chef, which click event called this function
	 * @param dataset to be edited
	 */
	startRating: function(d, sound) {
		var that = this;

		that.ratingMode = true;

		// move root chef to screen mid
		d.x = that.options.svgSize.w/2;
		d.y = that.options.svgSize.h/2;
		d.px = that.options.svgSize.w/2;
		d.py = that.options.svgSize.h/2;

		// enlarge root chef
		d.radius = that.options.force.coreRadius;
		sound.radius = that.options.force.candidateRadius;

		// create circle membrans around
		that.svg.select('g.membran')
			.append('circle')
			.attr({
				'class': 'membran',
				cx: d.px,
				cy: d.py,
				r: that.options.force.eggCellRadius
			});


		// array of prototypes which are influencing the dataset candidate
		that.raters = [];

		that.soundCandidate = sound;
		that.soundCandidate.candidate = true;
		that.getChefs(that.soundCandidate);
		that.renderOne();

		// ------------
		// load rater configuration

		// #1 create 9 feature chefs
		// VM.settings.featureList.each(function(feature, i){
		var featureDefinitions = VM.getCurrentProject().featureGroups.ratableFeatures;
		
		_.each(featureDefinitions, function(fd, i){

			var angle = (360 / featureDefinitions.length) * i * Math.PI / 180,
				offset = 50,
				block_gc_call = (i==(featureDefinitions.length-1)) ? false : true,	// call getChefs() only once when creating the last chef
				block_render_call = (i==(featureDefinitions.length-1)) ? false : true;	// call renderOne() only once when creating the last chef

			// set position of feature magnets
			var pos = VM.Util.Geometry.getPositionOfLineEnd(d, that.options.force.eggCellRadius + offset, angle);	// null position
			if(sound && !sound.raters) { 
				// load values of editing sound
				pos = VM.Util.Geometry.getPositionOfLineEnd(d, (1-that.soundCandidate.getFeature(fd.get('name'))/100) * (that.options.force.coreMargin + that.options.force.eggCellRadius), angle);
			} 
			// else {
			// 	// put feature magnets to null position 
			// 	pos = VM.Util.Geometry.getPositionOfLineEnd(d, that.options.force.eggCellRadius + offset, angle);
			// }
			pos.angle = angle;
			
			var f_mag = that.createChef(null, fd.get('name'), that.settings.chef_feature_type, pos, block_gc_call, block_render_call);
			
			if (
				sound &&
				!sound.raters &&
				that.soundCandidate.getFeature(fd.get('name'))/100 > 0
			) {
				that.raters.push({
					rater: f_mag,
					influence: that.soundCandidate.getFeature(fd.get('name'))/100}
				);
			}
		
		});

		// #2 load config from previous rating, if exists
		if(sound && sound.raters) {
			sound.raters.forEach(function(rater,i){
				// prototype magnet
				if(rater.rater.type == that.settings.chef_sound_type) {
					// does the prototype magnet already exist?
					var	magnet = null;
					that.chefs.forEach(function(d2,i){ 
						if(d2.type == rater.rater.type && rater.rater.filter.id == d2.filter.id){ magnet = d2; }
					});
					
					var distance = (1-rater.influence) * (that.options.force.coreMargin + that.options.force.eggCellRadius);
						min_distance = that.options.force.coreMargin +that.options.force.coreRadius +that.options.force.magnetRadius;
					if(distance < min_distance) distance = min_distance;
					var pos = VM.Util.Geometry.getPositionOfLineEnd(d, distance, rater.rater.angle);
					
					if(magnet){
						magnet.px = pos.x; magnet.py = pos.y;
						magnet.x = pos.x; magnet.y = pos.y;
						that.raters.push({rater: magnet, influence: rater.influence});
					} else {

					}
				}
				// feature magnet
				else if(rater.rater.type == that.settings.chef_feature_type) {
					that.datasets
						.filter(function(d2,i) { 
							if(d2.type == rater.rater.type && d2.attributes.name == rater.rater.attributes.name) {
								var distance = (1-rater.influence) * (that.options.force.coreMargin + that.options.force.eggCellRadius);
									min_distance = that.options.force.coreMargin +that.options.force.coreRadius +that.options.force.magnetRadius;
								if(distance < min_distance) distance = min_distance;
								var pos = VM.Util.Geometry.getPositionOfLineEnd(d, distance, rater.rater.angle);
								
								d2.cx = pos.x; d2.cy = pos.y;
								d2.px = pos.x; d2.py = pos.y;
								d2.x = pos.x; d2.y = pos.y;
								that.raters.push({rater: d2, influence: rater.influence});
								return true;
							}
						});
				}
			});
		}


		// that.getChefs();
		// that.renderOne();
		// that.force.start();

	},

	stopRating: function(d) {
		var that = this;

		that.ratingMode = false;

		// destroy membran
		that.svg.selectAll('circle.membran').remove();

		d.radius = that.options.force.magnetRadius;
		that.soundCandidate.radius = that.options.force.datasetRadius;

		// destroy feature chefs
		var dead = [];
		that.chefs.forEach(function(chef){
			if(chef.type == that.settings.chef_feature_type) dead.push(chef);
		});
		dead.forEach(function(chef, i){
			var block_gc_call = (i==(dead.length-1)) ? false : true,	// call getChefs() only once when creating the last chef
				block_render_call = (i==(dead.length-1)) ? false : true;	// call renderOne() only once when creating the last chef
			that.destroyChef(chef, block_gc_call, block_render_call);
		});

		// save chefs of the rating to restore the configuration later
		that.soundCandidate.raters = that.raters;
		that.soundCandidate.candidate = false;
	},

	calculateCandidateValues: function() {
		var that = this;

		var values = [];
		var featureDefinitions = VM.getCurrentProject().featureGroups.ratableFeatures;
	
		if(that.raters.length < 1) return values;
	
		// VM.settings.featureList.forEach(function(feature){
		_.each(featureDefinitions, function(fd){	
			var feature_sum = 0;
			var s_raters = that.raters.filter(function(rater){
				return (rater.rater.type == that.settings.chef_sound_type);
			});
			var f_raters = that.raters.filter(function(rater){
				return (rater.rater.type == that.settings.chef_feature_type);
			});
			var f_rater = that.raters.filter(function(rater){
				return (rater.rater.type == that.settings.chef_feature_type && rater.rater.filter[fd.get('name')] == 100);
			});
			if(f_rater.length > 0) {
				// values[fd.get('name')] = 100 * f_rater[0].influence;
				values.push( {fd: fd, value: Math.round( 100 * f_rater[0].influence ) } );
			} else {
				s_raters.forEach(function(o){
					feature_sum += parseFloat(o.rater.filter[fd.get('name')]) * o.influence;
				});
				
				// values[fd.get('name')] = (s_raters.length > 0) ? feature_sum / (s_raters.length) : feature_sum;
				values.push( {fd: fd, value: Math.round( (s_raters.length > 0) ? feature_sum / (s_raters.length) : feature_sum ) } );
			}
		});
		return values;
	},

	updateRating: function(d, newValues){
		var that = this;
		_.each(newValues, function( value ){
			d.updateFeature( value.fd, value.value);
		});
		that.getChefs(d);
		that.renderOne(true);
        VM.getUI().get('detailsArea').showDataset(d);
	},

	createChef: function(event, d, type, prepos, block_gc_call, block_render_call) {
		var that = this;

		// console.log(d, event.layerX, event.layerY);

		var proto = {filter: {}, attributes: {}, fixed: true },
			pos;
		if(event) { pos = {cx: event.offsetX, cy: event.offsetY, x: event.offsetX, y: event.offsetY}; }
			else if (prepos) { pos = {cx: prepos.x, cy: prepos.y, x: prepos.x, y: prepos.y}; }
			else { pos = {cx: 10, cy: 10, x: 10, y: 10}; }
		switch(type) {
			// sound magnet
			case that.settings.chef_sound_type:
				
				VM.getCurrentProject().getAllFeatureDefinitions().each(function(fd){
					if(fd.get('ratable'))
						proto.filter[fd.get('name')] = d.getFeature(fd.get('name'));
				});
				
				// labeling
				var featureDefinitions = VM.getCurrentProject().get('featureGroups').headingsFeatures
				// var text = d.get(VM.getModel(featureDefinitions[0]).get('name'));
				var text = d.getFeature(featureDefinitions[0].get('name'));
				proto.attributes = {
					name: text
				}
				break;
			// meta magnet
			case that.settings.chef_meta_type:
				proto.filter = {
					genre: d.genre,
					label: d.label,
					year: d.release_year,
					gender: d.gender
				}
				break;
			// feature magnet (d holds name string of feature)
			case that.settings.chef_feature_type:
				// VM.settings.featureList.forEach(function(f){
				
				_.each(VM.getCurrentProject().getAllFeatureDefinitions(), function(fd){
					if(fd.get('ratable')){

						if(fd.get('name')==d)
							proto.filter[fd.get('name')] = 100;
						else
							proto.filter[fd.get('name')] = 0;
					}
				});
				
				proto.attributes = { name: d };
				// proto.chefs = [{chef: that.datasets[0], gravity: .2}];
				// proto.charge = -300;
				proto.fixed = true;
				proto.angle = prepos.angle;
				break;
		}

		// new chef
		var chef = {
			id: 'c'+(that.chefs.length)+'-'+new Date().getTime(),
			chef: true,
			chefs: (proto.chefs) ? proto.chefs : [],
			dataset: d,
			type: type,
			fixed: proto.fixed,
			// fixed: true,
			filter: proto.filter,
			attributes: proto.attributes,
			radius: that.options.force.magnetRadius,
			// color: (proto.color) ? proto.color : that.options.force.general_chef_color,
			angle: (proto.angle) ? proto.angle : null,
			cx: pos.cx,
			cy: pos.cy,
			x: pos.x,
			y: pos.y
		};
		
		that.datasets.push(chef);
		that.chefs.push(chef);
		if(!block_gc_call) that.getChefs();
		// VM.dm.store('view.gravity.chefs', that.chefs);
		if(!block_render_call) that.renderOne();

		return chef;

	},
	destroyChef: function(d, block_gc_call, block_render_call) {
		var that = this;

		if(d.type == that.settings.chef_root_type) return;

		index = that.datasets.indexOf(d);
		chef_index = that.chefs.indexOf(d);

		// console.debug(index, chef_index);
		if (index > -1) {
    		that.datasets.splice(index, 1);
		}
		if (chef_index > -1) {
    		that.chefs.splice(chef_index, 1);
		}

		if(!block_gc_call) that.getChefs();
		// VM.dm.store('view.gravity.chefs', that.chefs);
		if(!block_render_call) that.renderOne();
		window.fireEvent('chefDestroyed', d);
		// that.force.resume();
	},

	defineScales: function() {
		var that = this;

		that.gravityScale = d3.scale.linear()
            .domain([0, that.options.force.distanceLimit])
            .range([0.9,0.1]);
        
        that.distanceScale = d3.scale.linear()
            .domain([0, that.options.force.distanceLimit])
            .range(that.options.force.chefDistanceRange);
        
        that.linkWidthScale = d3.scale.linear()
            .domain([0, that.options.force.distanceLimit])
            .range([5,.2]);
        
        that.featureGravityScale = d3.scale.linear()
            .domain(VM.settings.ratingScaleRange)
            .range([0.1,0.9]);
		
		that.radius = d3.scale.sqrt().range([0, 12]);
	},
	addEvents: function() {
		var that = this;

		that.listen('filtersChanged', function(){
			that.getChefs();
    		that.renderOne();
        });


		that.custom_events = [
			{name: 'chefDestroyed', handler: chefDestroyed},
			{name: 'candidateChanged', handler: candidateChanged},
			{name: 'illustrationClicked', handler: candidateChanged}				
		];

		Object.forEach(that.custom_events, function(ev){
			window.addEvent(ev.name, function(){
				console.log('custom event fired: '+ev.name);
			});
			window.addEvent(ev.name, ev.handler);
		});

		function chefDestroyed(d) {
			// delete destroyed chef from that.raters
			if(that.ratingMode) {
				var index;
				var found = that.raters.filter(function(r,i){
	        		if(r.rater == d){
	        			index = i;
	        			return true;
	        		} else {return false;}
	        	});
	        	if(found.length > 0) {
	        		that.raters.splice(index,1);
	        		var newValues = that.calculateCandidateValues();
	        		that.updateRating(that.soundCandidate, newValues);
					// that.updateSound(that.soundCandidate, that.calculateCandidateValues());
				}
			}
		}

		function candidateChanged() {
			var inputs = [
				{ui_name: 'title', attribute_name: 'title'},
				{ui_name: 'artist', attribute_name: 'artist'},
				{ui_name: 'year', attribute_name: 'release_year'},
				{ui_name: 'label', attribute_name: 'label'},
				{ui_name: 'genre', attribute_name: 'genre'}
			];
			inputs.each(function(input){
				$$('#sound-' + input.ui_name + ' input.candidate').set('value', that.soundCandidate[input.attribute_name]);
			})
			// VM.settings.featureList.each(function(feature,i){
			_.each(VM.getCurrentProject().getAllFeatureDefinitions(), function(fd){
				$$('#sound-' + fd.get('name') + ' span.candidate').set('text', parseFloat(that.soundCandidate.getFeature(fd.get('name'))));
			});
		}

	},

	removeEvents: function(){
		var that = this;

		// call parent
        that.parent();

        that.unlisten('filtersChanged');
	},
	defineEventHandlers: function() {
		var that = this;

		//------------------------------------
		// Drag behavior
		//------------------------------------

		that.myForceDrag = d3.behavior.drag()
	        .on("dragstart", dragstart)
	        .on("drag", dragmove)
	        .on("dragend", dragend);
	    function dragstart(d, i) {
	        // that.force.stop() // stops the force auto positioning before you start dragging
	        d.fixed = true;
	        that.dragging = { active: true, dragged_el: d, edit: false, dx: 0, dy: 0 };
	    }
	    function dragmove(d, i) {
	        
	        var dx = d3.event.dx,
	        	dy = d3.event.dy;
	        that.dragging.dx += dx;
	        that.dragging.dy += dy;
	        if(Math.abs(that.dragging.dx)<that.settings.drag_treshold && Math.abs(that.dragging.dy) < that.settings.drag_treshold) return;
	        that.dragging.edit = false;

			// var angle = VM.Util.Geometry.getVectorAngle(d, {x: that.options.svgSize.w/2, y: that.options.svgSize.h/2} )

	    	if ( that.ratingMode
	    		&& d.chef
    		) {

	    		// dont move root chef
	    		if(d.type === that.settings.chef_root_type) return;
	    		
	    		// if ( d.type === that.settings.chef_feature_type ){

	    		// calculate distance to core = rating value
	    		var	distance, angle,
	    			percent = 0,
	    			margin = that.options.force.coreMargin;
    			// var d_copy = Object.clone(d),
    			// var d_copy = d,
    			var d_copy = _.clone(d),
	    			track_length = that.options.force.eggCellRadius - that.options.force.coreRadius -margin,
	        		value, rater, index, found;

	        	// try
				d_copy.x += dx;
		        d_copy.y += dy;
	        	distance = VM.Util.Geometry.circleDistance(d_copy ,that.chefs[0]) -margin;
	        	angle = VM.Util.Geometry.getVectorAngle(d_copy ,that.chefs[0]);

        		if(distance <= track_length) {
        			percent = (1 - distance / track_length ) * 100;
        			if(percent >= 100) percent = 100;
	        	}

	        	// value = that.featureScale(Math.round(percent));
	        	value = Math.round(percent);
	        	
	        	// check if dragged chef is a rater already
	        	found = that.raters.filter(function(r,i){
	        		if(r.rater == d){
	        			index = i;
	        			return true;
	        		} else {return false;}
	        	});
	        	found = (found.length > 0);
	        	
	        	// show percentage in hoverbox
	        	function showPercentage(){
			        var e = d3.event.sourceEvent;
			        var text = percent.toFixed(0)+'%   '+d.attributes.name;
			        VM.getUI().get('tooltip').showText(text);
			        VM.getUI().get('tooltip').getDOMElement().setStyles({top: e.pageY, left: e.pageX +10});
	        	}

	        	// calculate sound candidate ratings if necessary
	        	dragged_rater = {rater: d, influence: percent/100};
	        	if(value>0) {
	        		if(!found) that.raters.push(dragged_rater); else that.raters[index].influence = percent/100;
	        		var newValues = that.calculateCandidateValues();
	        		that.updateRating(that.soundCandidate, newValues);
			        showPercentage();
			        
        		} else {
        			if(found) {
        				that.raters.splice(index,1);
	        			var newValues = that.calculateCandidateValues();
	        			that.updateRating(that.soundCandidate, newValues);
				        showPercentage();
    				}
        		}

        		if(d.type == that.settings.chef_feature_type && distance >= 0){
        			var pos = VM.Util.Geometry.getPositionOfLineEnd(that.chefs[0], distance +that.options.force.coreRadius +margin +10, d.angle);
        			d.px = pos.x;
        			d.py = pos.y;
        			// d.x = pos.x;
        			// d.y = pos.y;
        		}
        		else if(distance >= 0) {
        			d.angle = angle;
	        		d.px += dx;
	        		d.py += dy;
					d.x += dx;
			        d.y += dy;
        		}

	    	} else {
	    		// set position
		        d.px += dx;
		        d.py += dy;
		        d.x += dx;
		        d.y += dy; 

	    		// dragged on root chef?
	    		if(!d.chef) {
	    			var rpos = that.svg.node().createSVGRect();
					rpos.x = d.x - d.radius;
					rpos.y = d.y - d.radius;
					rpos.width = d.radius*2;
					rpos.height = d.radius*2;
	    			var collisionList = that.svg.node().getIntersectionList(rpos, null);
	    			Object.forEach(collisionList, function(el){
	    				d3.select(el).each(function(d){
	    					if(d && d.type == that.settings.chef_root_type) that.dragging.edit = true;
	    				});
	    			});
    				var r_chef = that.datapoints.filter(function(d) { return (d.type == that.settings.chef_root_type); });
	    			if(that.dragging.edit) {
	    				if(!that.ratingMode) r_chef.attr('r', 17);
	    			} else {
	    				if(!that.ratingMode) r_chef.attr('r', that.options.force.magnetRadius);
	    			}
	    			console.debug(that.dragging.edit);
	    		}
	    	}
	        
	        that.force.resume();

	    }
	    function dragend(d, i) {
	    	var distance = VM.Util.Geometry.circleDistance(d,that.chefs[0]) - that.options.force.magnetRadius,
	    		r_chef = that.datapoints.filter(function(d) { return (d.type == that.settings.chef_root_type); });
	        if(!d.chef) d.fixed = false;
	        // if(d.chef && d.type == that.settings.chef_feature_type && distance > that.options.force.eggCellRadius) d.fixed = false;
			// if(d.chef) VM.dm.store('view.gravity.chefs', that.chefs);
			if(!that.ratingMode) r_chef.attr('r', that.options.force.magnetRadius);
			// that.hoverbox.hide();
			VM.getUI().get('tooltip').getDOMElement().hide();
			that.dragging.active = false;
			if(that.dragging.edit) {
				r_chef.each(function(rc_d){
					that.startRating(rc_d, d);
				});
			}
			// that.force.start();
	    }
	},

	defineTools: function(){
        var that = this;
        
        var tools = [
            {
            	title: 'Set distance limit',
            	cssId: 'tool-limit',
            	fn: limitCallback
        	},
        	{
            	title: 'Set feature weights',
            	cssId: 'tool-weight',
            	fn: weightCallback
        	}
        	// {
         //        title: 'Multiple prototypes',
         //        cssId: 'tool-multiplePrototypes',
         //        fn: function(){
         //        	that.options.force.multiple_chefs = !that.options.force.multiple_chefs;
		       //      that.force.resume();
		       //      return that.options.force.multiple_chefs;
         //        }
         //    },
        	// {
         //        title: 'Show links',
         //        cssId: 'tool-showLinks',
         //        fn: function(){
         //        	that.options.force.show_links = !that.options.force.show_links;
		       //      that.force.resume();
		       //      that.getChefs();
		       //      that.renderOne();
		       //      return that.options.force.show_links;
         //        }
         //    }
        ];

        ////////////////
        // limit tool //
        ////////////////
        function limitCallback(){
            var items = [];

            var numberInput = new Element('div.ui#numberInput');
            var inputField = new Element('input', {type: 'range', min: 0, max: 200, value: that.options.force.distanceLimit});
            var btn = new Element('button', {text: 'OK'});
            
            d3.select(inputField).on('input', function(){
            	var newValue = parseInt(inputField.get('value'));
        		VM.getCurrentView().options.force.distanceLimit = newValue;
        		// numberInput.destroy();
        		that.getChefs();
        		that.renderOne();
            });
            d3.select(btn).on('click', function(){
        		numberInput.destroy();
            });
            numberInput.grab(inputField).grab(btn);
            VM.getUI().get('outerSpace').grab(numberInput);
            return false;
        }

        /////////////////
        // weight tool //
        /////////////////
        function weightCallback(){
            var items = [];

            var weightInput = new Element('div.ui#weightInput');
			
            var featureDefinitions = VM.getCurrentProject().featureGroups.ratableFeatures;
			
            var inputs = {};
            
            _.each(featureDefinitions, function(fd){
            
            	var inputField = new Element('input', {type: 'range', min: 0, max: 10, value: that.featureWeights[fd.get('name')] *10});
            	inputs[fd.get('name')] = inputField;
	            
	            var label = new Element('span', {text: fd.get('name')});

	            weightInput.grab(label);
	            weightInput.grab(new Element('br'));
	            weightInput.grab(inputField);
	            weightInput.grab(new Element('br'));

	            d3.select(inputField).on('input', function(){
	            	var newValue = parseInt(inputField.get('value'));
	        		// VM.getCurrentView().options.force.distanceLimit = newValue;
	        		that.featureWeights[fd.get('name')] = newValue / 10;
	        		console.debug(that.featureWeights);
	        		that.getChefs();
	        		that.renderOne();
            	});

            });
            
            var btn = new Element('button', {text: 'OK'});
            
            weightInput.grab(btn);
            
            d3.select(btn).on('click', function(){
        		weightInput.destroy();
            });
            
            VM.getUI().get('outerSpace').grab(weightInput);
            
            return false;
        }

        that.toolBoxTools = _.union(that.toolBoxTools, tools);
    },


});
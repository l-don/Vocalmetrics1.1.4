var Flex = new Class({

    // extend an existing class
    Extends: View,

    ////////////////
    // Attributes //
    ////////////////

    name: 'Flex',

    rendered: false,            // rendered var for setting svg canvases as created
    xFeature: null,             // y-axes
    yFeature: null,             // y-axes
    rFeature: null,             // circle radius
    oFeature: null,             // circle opacity
    oFeatureStatus: false,      // use transparency dimension or not
    activeAverages: [],         // [featureDefinition] containing the activated features for the average points
    showSounds: true,
    filter: [],
    filterActive: false,

    initialize: function(){
		var that = this;

        // getting globals
        that.parent();

        that.options = {
			// SVG canvas size
        	svgSize: {w: VM.settings.width, h: VM.settings.height}
        };

        // set features available on the axes (all ratable features)
        that.axesFeatures = _.union( VM.getCurrentProject().featureGroups.ratableFeatures, VM.getCurrentProject().featureGroups.numericalFeatures );
        // sort features as to put ratable features in the front
        that.axesFeatures = _.sortBy(that.axesFeatures, function( fd ){
            return !fd.get('ratable');
        });

        // initial axes-feature setting
        that.yFeature = that.axesFeatures[0];
        that.xFeature = that.axesFeatures[1];
        that.rFeature = (that.axesFeatures[2]) ? that.axesFeatures[2] : null;
        that.oFeature = (that.axesFeatures[3]) ? that.axesFeatures[3] : null;

        that.defineTools();
        // that.defineScales();
        that.defineAxes();
        that.addEvents();
    },

    render: function() {
        var that = this;

        console.log('Flex:render()');

        if(!that.rendered) that.createCanvas();
        
        VM.ui.show();
        
        that.drawAxes();
        that.drawGrid();

        that.renderDatasets();
        // that.renderAverages();
   },

    /** render svg canvases once on view startup */
    createCanvas: function() {
        var that = this;

        that.svg = VM.getCanvas().getDom('d3')
            .append('svg')
            .attr({
                width: that.options.svgSize.w,
                height: that.options.svgSize.h,
                id: 'Flex'
            });

        that.soundGroup = that.svg.append('g').attr('class', 'sounds');
        that.averageGroup = that.svg.append('g').attr('class', 'averages');
        that.ratingGroup = that.svg.append('g').attr('class', 'ratings');

        that.rendered = true;
    },

    renderDatasets: function() {
        var that = this;

        console.log('Flex:renderDatasets()');

        that.prepareData();

        ///////////////
        // Data join //
        ///////////////
        
        var datasetSel = that.soundGroup.selectAll('.dataset')
            .data(that.data, function(d) {
                return d.get('id');
            });
        that.datasetSel = datasetSel;


        ///////////
        // Enter //
        ///////////
        
        datasetSel
            .enter()
            .append('g')
            .attr({
                id: function(d) {
                    return d.get('id');
                },
                'transform': function(d) {
                    var xValue = d.getFeature(that.xFeature.get('name'));
                    var yValue = d.getFeature(that.yFeature.get('name'));

                    // if Dataset has no Ratings
                    if(xValue === null) xValue = 0;
                    if(yValue === null) yValue = 0;

                    return 'translate(' + that.xScale( xValue ) + ',' + that.yScale( yValue ) + ')';
                }
            })
            /** circle */
            .append('circle')
            .on('mouseover', function(d,i) {

                // show details in hoverbox
                var featuresToShow = VM.getCurrentProject().featureGroups.headingsFeatures;
                
                if(that.groups)
                    var group = that.groups[d.group];

                if ( group && group.length > 1 ) {
                    
                    var values = [];
                    
                    _.each(group, function( point ){
                        var value = {
                            text: point.d.getFeature(featuresToShow[0].get('name')),
                            active: (point.d.get('id') === d.get('id'))
                        };
                        values.push( value );
                    });
                    
                    VM.getUI().get('tooltip').showValues(values);

                } else {

                    var text = d.getFeature(featuresToShow[0].get('name'));
                    VM.getUI().get('tooltip').showText(text);
                    
                }

                // bring to front
                that.bringToFront( d );
            })
            .on('mousemove', function(d,i) {
                var e = d3.event;
                VM.getUI().get('tooltip').getDOMElement().setStyles({top: e.pageY, left: e.pageX +10});
            })
            .on('mouseout', function(d,i) {
                VM.getUI().get('tooltip').getDOMElement().hide();
            })
            .on('click', function(d,i) {
                that.selectDataset(d);
            })
            .on('dblclick', function(d,i) {
                that.selectDataset(d);
                VM.getUI().get('datasetMask').loadModel(d);
            })
            .on('contextmenu', function(d,i) {
                d3.event.preventDefault();
                // that.loadAttachmentMenu(d, d3.event);
            })
            // .on(VM.settings.mouseevents.mousewheel, function(d,i) {
            .on('wheel', function(d,i) {
                d3.event.preventDefault();
                // show next in group
                that.showNextInGroup(d, d3.event);
            });
        

        ////////////
        // UPDATE //
        ////////////

        datasetSel
            .each(function(d){
                var gSel = d3.select(this);
                
                gSel.classed('dataset', true);
                gSel.classed('hidden', false);
                
                // remove group-x class
                var classes = gSel.attr('class');
                if(classes) {
                    classes.split(' ').each(function( className ){
                        if( !className.contains('group') )
                            gSel.classed(className, true);
                        else
                            gSel.classed(className, false);

                    });
                }

                // add new group-x class
                gSel.classed('group-' + d.group, true);

                // no Rating at all
                gSel.classed('noRating', false);
                if(d.getAllRatings().length < 1){
                    gSel.classed('noRating', true);
                }

                // no Rating of currentUser
                gSel.classed('noRatingOfCurrentUser', false);
                var userRating = _.find( d.getAllRatings(), function(rating){
                    return rating.get('user').get('id') === VM.getCurrentUser().get('id');
                });
                if( !userRating ){
                    gSel.classed('noRatingOfCurrentUser', true);
                }
            })
            .transition()
            .attr({
                'transform': function(d) {
                    var xValue = d.getFeature(that.xFeature.get('name'));
                    var yValue = d.getFeature(that.yFeature.get('name'));

                    // if Dataset has no Ratings
                    if(xValue === null) xValue = 0;
                    if(yValue === null) yValue = 0;

                    return 'translate(' + that.xScale( xValue ) + ',' + that.yScale( yValue ) + ')';
                }
            })
            .duration(VM.settings.stdAnimationTime);

        datasetSel.select('circle')
            .each(function(d){
                var circleSel = d3.select(this);
                
                // remove group-x class
                var classes = circleSel.attr('class');
                if(classes) {
                    classes.split(' ').each(function( className ){
                        if( !className.contains('group') )
                            circleSel.classed(className, true);
                        else
                            circleSel.classed(className, false);

                    });
                }

                // add new group-x class
                circleSel.classed('group-' + d.group, true);
                
                if(that.rFeature){
                    var value = d.getFeature(that.rFeature.get('name'));
                    if(value === 0)
                        circleSel.classed('zero', true);
                    else
                        circleSel.classed('zero', false);
                }

            })
            .attr({
                opacity: function(d) {
                    if(that.oFeature && that.oFeatureStatus)
                        return that.oScale( d.getFeature(that.oFeature.get('name')) );
                    else
                        return 1;
                }
            })
            .transition()
            .attr({
                r: function(d){
                    var value = 20;
                    
                    if(that.rFeature)
                        var value = d.getFeature(that.rFeature.get('name'));
                    
                    return Math.sqrt( that.rScale(value) );
                }
            })
            .duration(VM.settings.stdAnimationTime)
            .each("end", function(d,i) {
                if(i==0) that.groupDatapointsBy('group');
            });


        //////////
        // EXIT //
        //////////

        datasetSel.exit()
            .transition()
            .style("fill-opacity", 0)
            .duration(VM.settings.stdAnimationTime)
            .remove();

    },

    renderAverages: function() {
        var that = this;

        console.log('Flex:renderAverages()');

        that.prepareAveragesData();

        ///////////////
        // Data join //
        ///////////////

        var averageSel = that.averageGroup.selectAll('.average')
            .data(that.data2, function(d) {
                return d.id;    // specific id for average item
            });


        ///////////
        // Enter //
        ///////////

        // var averageSelEnter = averageSel
        averageSel
            .enter()
            /** group */
            .append('g')
            .attr({
                "id": function(d) {
                    return d.id;
                },
                'transform': function(d) {
                    var xValue, yValue;

                    d.averages.each(function( average ){

                        if(average.feature == that.xFeature) { xValue = average.averageValue; }
                        if(average.feature == that.yFeature) { yValue = average.averageValue; }

                        // exit loop if x and y found
                        if (xValue != undefined && yValue != undefined) {return;};
                    });

                    return 'translate(' + that.xScale(xValue) + ',' + that.yScale(yValue) + ')';
                }
            })
            .append('circle')
            .on('mouseover', function(d,i) {

                // show details in hoverbox
                VM.getUI().get('tooltip').showText(d.unique);

                // bring to front
                that.bringToFront( this.parentNode );
            })
            .on('mousemove', function(d,i) {
                var e = d3.event;
                VM.getUI().get('tooltip').getDOMElement().setStyles({top: e.pageY, left: e.pageX +10});
            })
            .on('mouseout', function(d,i) {
                VM.getUI().get('tooltip').getDOMElement().hide();
            })
            .on('click', function(d,i) {
                console.debug(d);
                VM.get('ui').searchbox.set('value', d.unique);
                VM.get('ui').searchbox.fireEvent('input');
                VM.get('ui').searchbox.fireEvent('change');
                // that.selectDataset(d);
            })
            .on('contextmenu', function(d,i) {
                d3.event.preventDefault();
            })
            .on(VM.settings.mouseevents.mousewheel, function(d,i) {
                d3.event.preventDefault();
                // show next in group
                // that.showNextInGroup(d, d3.event);
            });

        // averageSelEnter
        //     /** text */
        //     .append('text')
        //     .attr({
        //         'class': 'trendLabel',
        //         dx: function(d) {
        //             var value;
                    
        //             d.averages.each(function( average ){
        //                 if(average.feature == that.rFeature) { value = average.averageValue; }

        //                 // exit loop if rFeature found
        //                 if (value != undefined) {return;};
        //             });

        //             return Math.sqrt(that.rScale(value));
        //         }
        //     })
        //     .text(function(d) {
        //         return d.unique;
        //     })
        //     .transition()
        //     .attr({
        //         dy: function(d) {
        //             var value;
                    
        //             d.averages.each(function( average ){
        //                 if(average.feature == that.rFeature) { value = average.averageValue; }

        //                 // exit loop if rFeature found
        //                 if (value != undefined) {return;};
        //             });

        //             return ( Math.sqrt(that.rScale(value)) *-1 );
        //         }
        //     })
        //     .duration(VM.settings.stdAnimationTime);


        ////////////
        // UPDATE //
        ////////////

        averageSel
            .each(function(d){
                var gSel = d3.select(this);

                gSel.classed('average', true);
                gSel.classed('hidden', false);
                
                // remove group-x class
                var classes = gSel.attr('class');
                if(classes) {
                    classes.split(' ').each(function( className ){
                        if( !className.contains('group') )
                            gSel.classed(className, true);
                        else
                            gSel.classed(className, false);
                    });
                }

                // add new group-x class
                gSel.classed('group-' + d.group, true);
            })
            .transition()
            .attr({
                'transform': function(d) {
                    var xValue, yValue;

                    d.averages.each(function( average ){

                        if(average.feature == that.xFeature) { xValue = average.averageValue; }
                        if(average.feature == that.yFeature) { yValue = average.averageValue; }

                        // exit loop if x and y found
                        if (xValue != undefined && yValue != undefined) {return;};
                    });

                    return 'translate(' + that.xScale(xValue) + ',' + that.yScale(yValue) + ')';
                }
            })
            .duration(VM.settings.stdAnimationTime);

        averageSel.select('circle')
            .each(function(d){
                var circleSel = d3.select(this);
                
                var rValue;
                d.averages.each(function( average ){
                    if(average.feature == that.rFeature) { rValue = average.averageValue; }

                    // exit loop if rFeature found
                    if (rValue != undefined) {return;};
                });
                
                // remove group-x class
                var classes = circleSel.attr('class');
                if(classes) {
                    classes.split(' ').each(function( className ){
                        if( !className.contains('group') )
                            circleSel.classed(className, true);
                        else
                            circleSel.classed(className, false);

                    });
                }

                // add new group-x class
                circleSel.classed('group-' + d.group, true);
                
                if(rValue === 0)
                    circleSel.classed('zero', true);
                else
                    circleSel.classed('zero', false);
                    
            })
            .attr({
                opacity: function(d) {
                    var value;
                    
                    if(that.oFeatureStatus) {
                        d.averages.each(function( average ){
                            if(average.feature == that.oFeature) { value = average.averageValue; }

                            // exit loop if rFeature found
                            if (value != undefined) {return;};
                        });

                        return that.oScale(value);
                    }
                    else {
                        // TODO not working
                        return 1;
                    }
                }
            })
            .transition()
            .attr({
                r: function(d){
                    var value;
                    
                    d.averages.each(function( average ){
                        if(average.feature == that.rFeature) { value = average.averageValue; }

                        // exit loop if rFeature found
                        if (value != undefined) {return;};
                    });
                    return Math.sqrt(that.rScale(value));
                }
            })
            .duration(VM.settings.stdAnimationTime)
            .each("end", function(d,i) {
                // if(i==0) that.groupDatapointsBy('group');
            });

        averageSel.select('text')
            .text(function(d) {
                return d.unique;
            });

        //////////
        // EXIT //
        //////////

        averageSel
            .exit()
            // .transition()
            // .style("fill-opacity", 0)
            // .duration(VM.settings.stdAnimationTime)
            .remove();

    },

    renderRatingsOfUser: function(){
        var that = this;

        console.debug('Flex:renderRatingsOfUser()');

        var selectedDataset = VM.getCurrentUser().getSelectedDatasets()[0];
        if(!selectedDataset) {
            alert('Select a dataset!');
            return false;
        }

        var ratings = selectedDataset.getAllRatings();

        ///////////////
        // Data join //
        ///////////////
        
        var datasetSel = that.ratingGroup.selectAll('.dataset')
            .data(ratings, function(d) {
                return d.get('user').get('id');
            });
        // that.datasetSel = datasetSel;


        ///////////
        // Enter //
        ///////////
        
        datasetSel
            .enter()
            .append('g')
            .attr({
                id: function(d) {
                    return d.get('user').get('id');
                },
                'transform': function(d) {
                    // var xValue = d.getFeature(that.xFeature.get('name'));
                    // var yValue = d.getFeature(that.yFeature.get('name'));

                    var xValue = _.find(d.get('values'), function(value){
                        return value.featureDefinition === that.xFeature.get('id');
                    }).value;

                    var yValue = _.find(d.get('values'), function(value){
                        return value.featureDefinition === that.yFeature.get('id');
                    }).value;

                    // if Dataset has no Ratings
                    if(xValue === null) xValue = 0;
                    if(yValue === null) yValue = 0;

                    return 'translate(' + that.xScale( xValue ) + ',' + that.yScale( yValue ) + ')';
                }
            })
            /** circle */
            .append('circle')
            .on('mouseover', function(d,i) {

                // show details in hoverbox
                // var featuresToShow = VM.getCurrentProject().featureGroups.headingsFeatures;
                var text = d.get('user').get('firstname') + ' ' + d.get('user').get('surname');
                VM.getUI().get('tooltip').showText(text);

                // bring to front
                // that.bringToFront( this.parentNode );
            })
            .on('mousemove', function(d,i) {
                var e = d3.event;
                VM.getUI().get('tooltip').getDOMElement().setStyles({top: e.pageY, left: e.pageX +10});
            })
            .on('mouseout', function(d,i) {
                VM.getUI().get('tooltip').getDOMElement().hide();
            })
            .on('click', function(d,i) {
                that.selectDataset(d.get('parentModel'));
            });
            // .on('contextmenu', function(d,i) {
            //     d3.event.preventDefault();
            //     that.loadAttachmentMenu(d, d3.event);
            // })
            // // .on(VM.settings.mouseevents.mousewheel, function(d,i) {
            // .on('wheel', function(d,i) {
            //     d3.event.preventDefault();
            //     // show next in group
            //     that.showNextInGroup(d, d3.event);
            // });
        

        ////////////
        // UPDATE //
        ////////////

        datasetSel
            .each(function(d){
                var gSel = d3.select(this);
                
                gSel.classed('dataset', true);
                gSel.classed('rating', true);
                gSel.classed('hidden', false);
                
                // remove group-x class
                var classes = gSel.attr('class');
                if(classes) {
                    classes.split(' ').each(function( className ){
                        if( !className.contains('group') )
                            gSel.classed(className, true);
                        else
                            gSel.classed(className, false);

                    });
                }

                // add new group-x class
                // gSel.classed('group-' + d.group, true);

                // // no Rating at all
                // gSel.classed('noRating', false);
                // if(d.getAllRatings().length < 1){
                //     gSel.classed('noRating', true);
                // }

                // // no Rating of currentUser
                // gSel.classed('noRatingOfCurrentUser', false);
                // var userRating = _.find( d.getAllRatings(), function(rating){
                //     return rating.get('user').get('id') === VM.getCurrentUser().get('id');
                // });
                // if( !userRating ){
                //     gSel.classed('noRatingOfCurrentUser', true);
                // }
            })
            .transition()
            .attr({
                'transform': function(d) {
                    // var xValue = d.getFeature(that.xFeature.get('name'));
                    // var yValue = d.getFeature(that.yFeature.get('name'));

                    var xValue = _.find(d.get('values'), function(value){
                        return value.featureDefinition === that.xFeature.get('id');
                    }).value;

                    var yValue = _.find(d.get('values'), function(value){
                        return value.featureDefinition === that.yFeature.get('id');
                    }).value;

                    // if Dataset has no Ratings
                    if(xValue === null) xValue = 0;
                    if(yValue === null) yValue = 0;

                    return 'translate(' + that.xScale( xValue ) + ',' + that.yScale( yValue ) + ')';
                }
            })
            .duration(VM.settings.stdAnimationTime);

        datasetSel.select('circle')
            .each(function(d){
                var circleSel = d3.select(this);
                
                // remove group-x class
                var classes = circleSel.attr('class');
                if(classes) {
                    classes.split(' ').each(function( className ){
                        if( !className.contains('group') )
                            circleSel.classed(className, true);
                        else
                            circleSel.classed(className, false);

                    });
                }

                // add new group-x class
                // circleSel.classed('group-' + d.group, true);
                
                if(that.rFeature){
                    // var value = d.getFeature(that.rFeature.get('name'));

                    var value = _.find(d.get('values'), function(value){
                        return value.featureDefinition === that.rFeature.get('id');
                    }).value;

                    if(value === 0)
                        circleSel.classed('zero', true);
                    else
                        circleSel.classed('zero', false);
                }

            })
            .attr({
                opacity: function(d) {
                    if(that.oFeature && that.oFeatureStatus)
                        return that.oScale( d.getFeature(that.oFeature.get('name')) );
                    else
                        return 1;
                }
            })
            .transition()
            .attr({
                r: function(d){
                    var value = 20;
                    
                    if(that.rFeature){
                        // var value = d.getFeature(that.rFeature.get('name'));
                        var value = _.find(d.get('values'), function(value){
                            return value.featureDefinition === that.rFeature.get('id');
                        }).value;
                    }
                    
                    return Math.sqrt( that.rScale(value) );
                }
            })
            .duration(VM.settings.stdAnimationTime)
            .each("end", function(d,i) {
                if(i==0) that.groupDatapointsBy('group');
            });


        //////////
        // EXIT //
        //////////

        datasetSel.exit()
            .transition()
            .style("fill-opacity", 0)
            .duration(VM.settings.stdAnimationTime)
            .remove();        

        return true;
    },

    addActiveAverageFeature: function( featureDefinition ){
        var that = this;

        if( !_.contains(that.activeAverages, featureDefinition) )
            that.activeAverages.push(featureDefinition);

        console.debug(that.activeAverages);
        
        that.renderAverages();
    },

    removeActiveAverageFeature: function( featureDefinition ){
        var that = this;

        that.activeAverages = _.without(that.activeAverages, featureDefinition);

        console.debug(that.activeAverages);
        
        that.renderAverages();
    },

    prepareData: function(){
        var that = this;

        // console.log('prepareData()')
        
        // get all datasets of current project
        that.data = VM.getCurrentProject().getAllDatasets();
        if(that.filter.length > 0) that.data = that.filter;

        // groups sounds with same (x,y) position
        VM.dm.groupByXY(that.data, that.xFeature.get('name'), that.yFeature.get('name'));
    },

    prepareAveragesData: function(){
        var that = this;

        console.log('prepareAveragesData()')
        
        var result = [];

        // active averages can be one or more of [features != ratable && != file datatype]
        that.activeAverages.each(function( fd ) {

            // find all unique feature values concerning a certain feature
            // e.g. get all different artists
            var uniques = [];
            var uniqueDatasets = _.uniq(that.data, function( dataset ){
                return dataset.getFeature(fd.get('name'));
            });
            uniqueDatasets.each( function( dataset ){
                uniques.push(dataset.getFeature(fd.get('name')));
            });
            
            // get averages of all datasets for each unique feature value
            // e.g. average values of a certain artist
            uniques.each(function ( unique, i ){
                var certainDatasets = _.filter(that.data, function( dataset ){
                    return dataset.getFeature(fd.get('name')) === unique;
                });
                
                var averages = VM.getDM().getAverageValuesOf( {datasets: certainDatasets, features: that.axesFeatures} );

                result.push({
                    id: fd.get('name') + '_' + unique,
                    feature: fd,
                    unique: unique,
                    averages: averages,
                    datasets: certainDatasets
                });
            });

        });
        
        // TODO return directly instead of storing in the view scope
        that.data2 = result;

        // groups sounds with same (x,y) position
        // that.data2 = dataMan.groupByXY(that.data2, that.xFeature.get('name'), that.yFeature.get('name'));
    },

    /**
     * define view specific tools here
     * @return -
     */
    defineTools: function(){
        var that = this;
        
        var tools = [
            {
                title: 'Show all ratings of selected dataset',
                cssId: 'tool-allratings',
                fn: function(){
                    
                    var selectedDataset = VM.getCurrentUser().getSelectedDatasets()[0];
                    if(!selectedDataset) {
                        alert('Select a dataset!');
                        return false;
                    }

                    if ( that.showRatings === undefined )
                        that.showRatings = true;
                    else
                        that.showRatings = !that.showRatings;
                    
                    if(that.showRatings){
                        that.soundGroup.classed('hidden', true);
                        that.averageGroup.classed('hidden', true);
                        that.ratingGroup.classed('hidden', false);
                        that.renderRatingsOfUser();
                    } else {
                        that.soundGroup.classed('hidden', false);
                        that.averageGroup.classed('hidden', false);
                        that.ratingGroup.classed('hidden', true);
                    }

                    return that.showRatings;
                }
                // callingObject: that
            },
            {
                title: 'Set diameter feature',
                cssId: 'tool-diameter',
                items: getDiameterItems(),
                singleSelection: true
            },
            {
                title: 'Set transparency feature',
                cssId: 'tool-transparency',
                items: getTransparencyItems(),
                singleSelection: true
            },
            {
                title: 'Show average values',
                cssId: 'tool-average',
                items: getAverageItems()
            }
            // {
            //     title: 'Set dynamic range on/off',
            //     cssId: 'tool-range',
            //     fn: rangeCallback,
            //     isActive: function(){return VM.getCurrentProject().get('dynamicRangeOfValues');}
            // }
        ];

        ///////////////////
        // diameter tool //
        ///////////////////
        function getDiameterItems(){
            var items = [];

            that.axesFeatures.each(function( fd ){
                
                items.push({
                    label: fd.get('displayName'),
                    fn: callback,
                    args: [fd],
                    isActive: isActive
                });
            });

            return items;
            
            function callback(fd, btnStatus) {

                that.changeFeature('rFeature', fd);
            }
            
            function isActive( item ){
                return (that.rFeature == item.args[0]);
            }
        }

        ///////////////////////
        // transparency tool //
        ///////////////////////
        function getTransparencyItems(){
            var items = [];

            that.axesFeatures.each(function( fd ){
                
                items.push({
                    label: fd.get('displayName'),
                    fn: callback,
                    args: [fd],
                    isActive: isActive
                });
            });

            items.push({
                    label: 'none',
                    fn: callback,
                    args: [null],
                    isActive: isActive
                });

            return items;
            
            function callback(fd, btnStatus) {

                // if "none" item, fd in args is null
                that.oFeatureStatus = (fd)? true : false;

                if(fd)
                    that.changeFeature('oFeature', fd);
                else
                    that.renderDatasets();
            }

            function isActive( item ){
                // if transparency is disabled, only make "none" item active
                if( !that.oFeatureStatus )
                    return (!item.args[0]);
                else
                    return (that.oFeature == item.args[0]);
            }
        }

        //////////////////
        // Average tool //
        //////////////////
        function getAverageItems(){
            var items = [];

            var possibleFeatures = _.union(VM.getCurrentProject().featureGroups.headingsFeatures, VM.getCurrentProject().featureGroups.remainingFeatures);
            possibleFeatures.each(function( fd ){
                
                items.push({
                    label: fd.get('displayName'),
                    fn: callback,
                    args: [fd],
                    isActive: isActive
                });

            });
            
            items.push({
                label: 'Hide others',
                fn: callback,
                args: [null],
                isActive: isActive
            });

            return items;
            
            function callback(fd, btnStatus) {

                if(btnStatus){
                    if(fd)
                        that.addActiveAverageFeature(fd);
                    else
                        that.soundGroup.classed('hidden', true);
                } else {
                    if(fd)
                        that.removeActiveAverageFeature(fd);
                    else
                        that.soundGroup.classed('hidden', false);
                }
            }

            function isActive( item ){
                return ( _.contains(that.currentAverages, item.args[0]) );
            }
        }

        ////////////////
        // range tool //
        ////////////////
        function rangeCallback(btnStatus){
            VM.getCurrentProject().setDynamicRangeOfValues(btnStatus);

            // TODO use of changeFeature() is not too nice, 
            // used just because no other method is available to update
            // everything required after range changed
            that.changeFeature('xFeature', that.xFeature);
            that.changeFeature('yFeature', that.yFeature);
            that.changeFeature('rFeature', that.rFeature);
            that.changeFeature('oFeature', that.oFeature);
            return VM.getCurrentProject().get('dynamicRangeOfValues');
        }

        that.toolBoxTools = _.union(that.toolBoxTools, tools);
    },

   defineScales: function(){
        var that = this;

        var xDomain = that.xFeature.getRangeOfValues(),
            yDomain = that.yFeature.getRangeOfValues();
        
        //////////////////
        // Radius Scale //
        //////////////////
        that.rScale = d3.scale.linear()
            .domain([0,100])
            .range([VM.settings.width * 0.02, VM.settings.width * 0.2]);
        
        // overwrite scale if a rFeature exists    
        if(that.rFeature) {
            var rDomain = that.rFeature.getRangeOfValues();
            
    		that.rScale = d3.scale.linear()
                .domain(rDomain)
                .range([VM.settings.width * 0.02, VM.settings.width * 0.2]);
        }

        ///////////////////
        // Opacity Scale //
        ///////////////////
        if(that.oFeature){
            var oDomain = that.oFeature.getRangeOfValues();
            
            that.oScale = d3.scale.linear()
                .domain(oDomain)
                .range([0.1, 1]);
        }

        // scales
        that.xScale = d3.scale.linear()
            .domain(xDomain)
            .range([that.padding + that.paddingFromAxis, that.options.svgSize.w - that.padding]);
        
        that.yScale = d3.scale.linear()
            .domain(yDomain)
            .range([that.options.svgSize.h - that.padding - that.paddingFromAxis, that.padding]);

   },
   
   defineAxes: function(){
   	
   	    var that = this;
   		
        that.defineScales();

        that.xAxis = d3.svg.axis()
           .scale(that.xScale)
           // .tickFormat(d3.format(".0f"))
           // .tickSubdivide([1])
           .orient("bottom");

        that.yAxis = d3.svg.axis()
           .scale(that.yScale)
           // .tickFormat(d3.format(".0f"))
           // .tickSubdivide([1])
           // .tickSize(6)
           .orient("left");
   },

    drawAxes: function() {
        var that = this;

        that.defineAxes();
        
        console.warn('drawAxes');

        if(that.xAxisDom) $$(that.xAxisDom.node()).destroy();
        if(that.yAxisDom) $$(that.yAxisDom.node()).destroy();

        // X axis
        that.xAxisDom = that.svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + (that.options.svgSize.h - that.padding) + ")")
            .call(that.xAxis)
            .on('click', function(d,i) {
                d3.event.preventDefault();
                that.loadAxisMenu('xFeature');
            });

            // append label
            that.xLabel = that.xAxisDom.append('text')
                .text(that.xFeature.get('displayName'))
                .attr({
                    'class': 'axisLabel',
                    dx: that.options.svgSize.w - 2*that.padding,
                    dy: 25
                });

        // Y axis
        that.yAxisDom = that.svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + that.padding + ",0)")
            .call(that.yAxis)
            .on('click', function(d,i) {
                d3.event.preventDefault();
                that.loadAxisMenu('yFeature');
            });

            // append label
            that.yLabel = that.yAxisDom.append('text')
                .text(that.yFeature.get('displayName'))
                .attr({
                    'class': 'axisLabel',
                    x: -0.5*that.padding,
                    y: that.paddingTop*1.8
                });
    },

    drawGrid: function() {
        var that = this;

        if(that.grid) $$(that.grid.node()).destroy();

        var xNum, yNum;

        if( that.xFeature.get('ratable') )
            xNum = 10;
        else
            xNum = Math.round( (d3.max(VM.getCurrentProject().getAllDatasets(), function(d) { return d.getFeature(that.xFeature.get('name')); }) - d3.min(VM.getCurrentProject().getAllDatasets(), function(d) { return d.getFeature(that.xFeature.get('name')); })) /10);

        if( that.yFeature.get('ratable') )
            yNum = 10;
        else
            yNum = Math.round( (d3.max(VM.getCurrentProject().getAllDatasets(), function(d) { return d.getFeature(that.yFeature.get('name')); }) - d3.min(VM.getCurrentProject().getAllDatasets(), function(d) { return d.getFeature(that.yFeature.get('name')); })) /10);

        if(xNum > 50) xNum = 50;
        if(yNum > 50) yNum = 50;

        // draw the X grid lines
        that.grid = that.svg
            .append('g')
            .attr("class", "grid hidden");

        that.grid
            .selectAll("line.x")
            .data(that.xScale.ticks(xNum))
            .enter().append("line")
            .attr({
                "class": 'x',
                'x1': that.xScale,
                'x2': that.xScale,
                'y1': that.padding,
                'y2': that.options.svgSize.h - that.padding
            });

        // draw the Y grid lines
        that.grid
            .selectAll("line.y")
            .data(that.yScale.ticks(yNum))
            .enter().append("line")
            .attr({
                "class": 'y',
                'x1': that.padding,
                'x2': that.options.svgSize.w - that.padding,
                'y1': that.yScale,
                'y2': that.yScale
            });
    },

    addEvents: function(){
        var that = this;

        that.listen('filtersChanged', function(){
            that.renderDatasets();
            that.renderAverages();
        });
    },

    removeEvents: function(){
        var that = this;

        // call parent
        that.parent();

        that.unlisten('filtersChanged');
    },

    /** loads context menu to change an axis' dimension */
    loadAxisMenu: function( dimension ){
        var that = this;

        var e = d3.event;

        var pos = { x: e.pageX, y: e.pageY };

        var menuItems = [];

        that.axesFeatures.each(function( fd ){
            menuItems.push( {
                label: fd.get('displayName'),
                fn: that.changeFeature,
                args: [dimension, fd],
                callingObject: that
            });
        });

        VM.getUI().get('contextMenu').showMenuItems( menuItems, pos );
    },

    changeFeature: function(dimension, fd) {
        var that = this;

        that[dimension] = fd;
        that.defineScales();
        that.defineAxes();
        that.drawAxes();
        that.drawGrid();
        that.renderDatasets();
        that.renderAverages();
    },

    showSoundPoints: function(bool) {
        var that = this;

        that.showSounds = bool;
        if(that.showSounds) {
            that.soundGroup.classed('hidden', false);
            VM.ui.toolShowSound.addClass('active');
        } else {
            that.soundGroup.classed('hidden', true);
            VM.ui.toolShowSound.removeClass('active');
        }


    },

    loadTrendPoints: function(d, e) {
        var that = this;

        that.showSoundPoints(true);

        var dataMan = new DataManager(VM);

        // NO FILTER ACTIVE
        if(!that.filterActive) {
            console.log(1);
            var filterObject = {};
            filterObject[d.trend] = d[d.trend];
            var sounds = dataMan.filter(filterObject);

            that.isolatePoint(d, that.datapointsTrends);
            that.filter = sounds;
            that.filterOrigin = d.id;
            that.filterActive = true;
        }
        // FILTER IS ALREADY ACTIVE
        else {
            // clicked on same trend point again
            if(that.filterOrigin == d.id) {
                console.log(2);

                that.showSoundPoints(false);
                that.deIsolatePoint(that.datapointsTrends);
                that.filter = [];
                that.filterActive = false;
            }
            // clicked on another trend point
            else {
                console.log(3);
                var filterObject = {};
                filterObject[d.trend] = d[d.trend];
                var sounds = dataMan.filter(filterObject);

                that.isolatePoint(d, that.datapointsTrends);
                that.filter = sounds;
                that.filterOrigin = d.id;
                that.filterActive = true;
            }
        }

        that.renderDatasets();
    },

    /**
     * group datapoints by a certain attribute to make them "scrollable"
     * "scrollable" means to have the choice which element of the group to show (only one at the same time)
     * TODO 
     */
    groupDatapointsBy: function( attribute ) {
        var that = this;

        console.log('grouping..');

        var groups = [];

        // put elements with same attribute in one group
        // that.svg.selectAll('.dataset').each(function(dataset) {
        that.datasetSel.each(function(dataset) {
            if( groups[ dataset.get(attribute) ] === undefined) {
                groups[ dataset.get(attribute) ] = [{d: dataset, el: this, representativeEl: d3.select(this).select('circle').node() }];
            } else {
                groups[ dataset.get(attribute) ].push({d: dataset, el: this, representativeEl: d3.select(this).select('circle').node() });
            }
        });

        that.groups = groups;

        // only show one element of group, make others hidden
        that.groups.each(function(group) {

            // determine the element to show (depending on its status)
            var found = [false, false, false];  // [selected, subselected, first in group]
            group.each(function(groupMember, i) {
                var representativeEl = d3.select(groupMember.representativeEl);
                var el = d3.select(groupMember.el);

                // append group label (show number of elements in group)
                    var label = el.select('text');
                    if(label[0][0] == null) {
                        
                        var rValue = .5;

                        if(that.rFeature)
                            rValue = groupMember.d.getFeature(that.rFeature.get('name'));
                        
                        if( rValue == 0 ) rValue = .5;
                        
                        var dx = dy = Math.sqrt(that.rScale(rValue));
                        if(group.length > 1) {
                            el.append('text')
                                .attr({'class': 'groupLabel', dy: dy*1, dx: dx})
                                .text(group.length);
                        }
                    } else {
                        if(group.length < 2)
                            label.remove();
                        else
                            label.text(group.length);
                    };
                    el.classed('hidden', true);


                if(representativeEl.classed('selected')) {
                    found[0] = el;
                    return;
                } else if(representativeEl.classed('subselected')) {
                    found[1] = el
                    return;
                } else if(i==0) {
                    found[2] = el;
                    return;
                }
            });

            // show the determined element
            if(found[0] != false) {
                found[0].classed('hidden', false);
            } else if(found[1] != false) {
                found[1].classed('hidden', false);
            } else if(found[2] != false) {
                found[2].classed('hidden', false);
            }

        });

    },

    showNextInGroup: function(d, event) {
        var that = this;
        var direction = event.wheelDelta;
        var group = that.groups[d.get('group')];
        var nextOne;

        group.each(function(groupMember, i) {
            if(groupMember.d.get('id') == d.get('id')) {
                if(direction < 0) {
                    var nextIndex = i+1;
                    if(nextIndex >= group.length) nextIndex = 0;
                    nextOne = group[nextIndex];
                } else {
                    var nextIndex = i-1;
                    if(nextIndex < 0) nextIndex = group.length -1;
                    nextOne = group[nextIndex];
                }
            }
            d3.select(groupMember.el).classed('hidden', true);
        });
        d3.select(nextOne.el).classed('hidden', false);
        
        that.bringToFront( nextOne.d );

        // update Tooltip
        var featuresToShow = VM.getCurrentProject().featureGroups.headingsFeatures;
        var values = [];
        _.each(group, function( point ){
            var value = {
                text: point.d.getFeature(featuresToShow[0].get('name')),
                active: (point.d.get('id') === nextOne.d.get('id'))
            };
            values.push( value );
        });
        
        VM.getUI().get('tooltip').showValues(values);
    }
   
});
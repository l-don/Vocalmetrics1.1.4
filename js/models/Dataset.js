var Dataset = new Class({ // TODO rename to "Dataset"
    
    ////////////
    //Example //
    ////////////

    /*
    example: {
        parent: {   // Project
            name: 'Vocalmetrics'
        },
        features: [
            {
                featureDefinition: {FeatureDefinition},
                value: 'cmon everybody'
            },
            {
                featureDefinition: 'f_1399972789109',
                value: this.getValue(example.ratings)
            }
        ],
        ratings: [
            {
                user: {},   // User
                feature: {
                    featureDefinition: {FeatureDefinition},
                    value: 53
                }
            }
        ]
    },
    */

    Extends: AbstractModel,

    ///////////////
    //Attributes //
    ///////////////

    attributes: {
        nameInDataModel: 'Dataset'
    },

    initialize: function( attributes ){
        var that = this;

        // CALL PARENT (creates properties)
        this.parent(that.attributes.nameInDataModel, attributes);

        // TODO put this into Gravity.prepareData()
        if(!that.fixed) that.fixed = false;
    },

    /////////////
    // Feature //
    /////////////
    getAllFeatures: function() {
        console.debug('Dataset:getAllFeatures()');
        return this.get('features');
    },

    addFeature: function( model ) {
        this.get('features').push(model);
    },

    updateFeature: function( fd, value ){
        var that = this;

        // RATABLE feature --> change belonging Rating
        if( fd.get('ratable') ){

            var existingRating = _.find(that.getAllRatings(), function(rating){
                return rating.get('user').get('id') === VM.getCurrentUser().get('id');
            });

            // update rating (user already rated the dataset)
            if(existingRating){

                var existingValue = _.find(existingRating.get('values'), function(value){
                    return value.featureDefinition === fd.get('id');
                });
                
                if(existingValue){
                    existingValue.value = value;
                }
                // in case new features were defined later sometime
                else {
                    existingRating.get('values').push({
                        featureDefinition: fd.get('id'),
                        value: value
                    });
                }

            }
            // create new rating (user not yet rated the dataset)
            else {

                /////////////////////
                // Rating creation //
                /////////////////////
                
                var ratingData = {
                    parentModel: that,
                    user: VM.getCurrentUser(),
                    values: []
                };
                
                // set a value for the ratable feature
                ratingData.values.push({
                    featureDefinition: fd.get('id'),
                    value: value
                });

                var newRating = new Rating(ratingData);
                
                // add new Rating to VM
                VM.addRating(newRating);
                // VM.addModel(newRating);

            }

        }
        // NON-ratable feature --> change feature.value directly
        else {
            
            var existingFeature = _.find(that.getAllFeatures(), function(feature){
                return feature.get('featureDefinition').get('id') === fd.get('id');
            });
            existingFeature.set('value', value);

        }
        
    },

    removeFeature: function( model ) {
        var that = this;
        // that.get('features') = _.without(that.get('features'), model);
        that.set('features', _.without(that.get('features'), model));
    },

    ////////////
    // Rating //
    ////////////
    getAllRatings: function() {
        // console.debug('Dataset:getAllRatings()');
        return this.get('ratings');
    },

    addRating: function( model ) {
        this.get('ratings').push(model);
    },

    removeRating: function( model ) {
        var that = this;
        // that.get('ratings') = _.without(that.get('ratings'), model);
        that.set('ratings', _.without(that.get('ratings'), model));
    },

    validate: function() {
        var that = this;

        var check = true;
        if(that.title == '') check = false;
        else if(that.artist == '') check = false;
        else if(that.release_year == '') check = false;
        else if(that.label == '') check = false;
        else if(that.genre == '') check = false;
        // else if(that.gender == '') check = false;
        return check;
    },

    getFeature: function( attributeName, user ) {
        var that = this;

        // requesting a Feature value
        var featureDefinitions = that.get('parentModel').getAllFeatureDefinitions();
        
        var featureDefinition = _.find(featureDefinitions, function(fd){
            return fd.get('name') === attributeName;
        });
        
        if( featureDefinition ) {

            // read value from Features
            var feature = _.find(that.get('features'), function(f) {
                return f.get('featureDefinition').get('name') === attributeName;
            });

            return user? feature.getValue(user) : feature.getValue();
        }

    },

    /** overwrites parent.set() method */
    set: function( attributeName, value ) {
        var that = this;

        if(
            attributeName === 'id' ||
            attributeName === 'parentModel'
        ){
            // call parent.set() method
            that.parent( attributeName, value );
        }
        else if( 
            that.get('parentModel') &&
            !_.isString( that.get('parentModel') ) &&
            that.get('parentModel').getListOfFeatureDefinitions().contains(attributeName) 
        ){

            // change value in belonging feature (stored in dataset.features)
            that.get('features').each( function(f) {
                if( f.get('featureDefinition').get('name') === attributeName )
                    f.set('value', value);
            });
            
        }
        else {

            // call parent.get() method
            that.parent( attributeName, value );

        }
    },

    /** fill a blank dataset with values (e.g. with data from csv import) */
    setup: function( attributes ){
        var that = this;

        // if(!attributes) var attributes = {};
        
        //////////////////////
        // Feature creation //
        //////////////////////

        // create new Features and add to Dataset + VM
        var featureDefinitions = that.get('parentModel').getAllFeatureDefinitions();
        featureDefinitions.each(function(fd){
            
            var featureData = {
                parentModel: that,
                featureDefinition: fd
            };
            
            // only set a value for not-ratable features                
            if(!fd.get('ratable')){
                featureData.value = attributes? attributes[fd.get('name')] : null;
            }

            var newFeature = new Feature(featureData);

            // add new Feature to VM
            VM.addFeature(newFeature);

            // add new Feature to dataset
            that.addFeature(newFeature);
            
        });


        /////////////////////
        // Rating creation //
        /////////////////////
        // create new Rating and add to Dataset + User + VM
        
        var ratingData = {
            parentModel: that,
            user: VM.getCurrentUser(),
            values: []
        };
        
        // set a value for each ratable feature
        featureDefinitions.each(function(fd){
            if(fd.get('ratable')){
                ratingData.values.push({
                    // featureDefinition: fd,
                    featureDefinition: fd.get('id'),
                    value: attributes? attributes[fd.get('name')] : null
                });
            }
        });

        var newRating = new Rating(ratingData);
        
        // add new Rating to VM
        VM.addRating(newRating);

       
        ////////////////////
        // DATASET adding //
        ////////////////////

        // add new Dataset to VM
        VM.addDataset(that);

    },

    /**
     * map ratable features' values into [0,100]
     * TODO only suitable for importing the old xml file of VOICE AND SINGING, but probably not needed elsewhere
     * @param  {Dataset} d [description]
     * @return -
     */
    scaleRatableFeatureValues: function( settings ){
        var that = this;

        var ratingScale = d3.scale.linear()
            .domain([0, 4])
            .range(settings.ratingScaleRange);

        var ratableFeatures = that.parentDataset.getAllFeatureDefinitions().filter( function( fd ){
            return fd.get('ratable');
        });

        // set the new value for each ratable feature
        ratableFeatures.each(function( fd ){
            var newValue = Math.round( ratingScale(that.get( fd.get('name') )) );
            that.set( fd.get('name'), newValue );
        });
    }
    
});
var Feature = new Class({
    
    Extends: AbstractModel,

    ///////////////
    //Attributes //
    ///////////////

    attributes: {
        nameInDataModel: 'Feature'
    },


    initialize: function( attributes ){
        var that = this;

        // CALL PARENT (creates properties)
        this.parent(that.attributes.nameInDataModel, attributes);
    },

    getValue: function( user ){
        var that = this;

        var fd = that.get('featureDefinition');
        
        // if feature is ratable, calculate value based on ratings
        if(fd.get('ratable')) {
            
            var datasetRatings = that.get('parentModel').getAllRatings();
            
            if(datasetRatings.length < 1)
                return null;

            var value = 0;

            // return value of a rating of one specific user
            if(user){
                var userRating = _.find(datasetRatings, function(r){
                    return user.get('id') === r.get('user').get('id');
                });

                if(userRating){
                    var featureValue = _.find(userRating.get('values'), function(value){
                        return value.featureDefinition === fd.get('id');
                    });
                    
                    value = featureValue.value;
                } else{
                    value = null;
                }

            }
            // return average value of all ratings
            else {

                // FILTER active? then use only ratings of selected users
                if(VM.activeFilters.raters.length){
                    datasetRatings = _.filter(datasetRatings, function(rating){
                        return _.contains(VM.activeFilters.raters, rating.get('user'));
                    });
                }

                var valueSum = 0;
                datasetRatings.each(function(rating){
                    var value = _.find(rating.get('values'), function(value){
                        return value.featureDefinition === fd.get('id');
                    });
                    
                    if(value !== undefined)
                        valueSum += value.value;
                    
                });

                if(datasetRatings.length)
                    value = valueSum / datasetRatings.length;
                else
                    value = null;
            }
            
            return value;
        } 
        // if feature is not ratable, the value is fixed (and not differentiated by users)
        else {
            return that.get('value');
        }
    },
    
});
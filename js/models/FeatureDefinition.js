var FeatureDefinition = new Class({
    
    Extends: AbstractModel,

    ///////////////
    //Attributes //
    ///////////////

    attributes: {
        nameInDataModel: 'FeatureDefinition'
    },


    initialize: function( attributes ){
        var that = this;

        // CALL PARENT (creates properties)
        this.parent(that.attributes.nameInDataModel, attributes);

        that.getSorting();
    },

    getRangeOfValues: function(){
        var that = this;

        var range;
        
        if(
            that.get('ratable') ||
            that.get('parentModel').getAllDatasets().length < 1
         ) {
            range = VM.settings.ratingScaleRange;
        }
        else {
            range = [
                d3.min(VM.getCurrentProject().getAllDatasets(), function(d) { return d.getFeature(that.get('name')); }),
                d3.max(VM.getCurrentProject().getAllDatasets(), function(d) { return d.getFeature(that.get('name')); })
            ];

            // adjustments if not enough information
            if(range[0] == range[1]){
                if(range[0] == 0) range[1] = 100;
                if(range[0] > 0) range[1] = 10*range[0];
            }
        }

        return range;
    },

    getSorting: function(){
        var that = this;
    }
});
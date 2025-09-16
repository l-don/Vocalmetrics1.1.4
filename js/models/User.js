var User = new Class({
    
    Extends: AbstractModel,

    ///////////////
    //Attributes //
    ///////////////
    
    attributes: {
        nameInDataModel: 'User'
    },

    initialize: function( attributes ){
        var that = this;

        // if(!attributes) throw new Error( "missing parameter in Constructor" );

        // CALL PARENT (creates properties)
        this.parent(that.attributes.nameInDataModel, attributes);

        // return that;
    },

    ////////////
    // Rating //
    ////////////

    getAllRatings: function(){
        return this.get('ratings');
    },
    
    addRating: function( model ) {
        // this.ratings.push(model.get('id'));
        this.get('ratings').push(model);
    },

    removeRating: function(model){
        var that = this;
        that.set('ratings', _.reject(that.get('ratings'), function(m){
            return m.get('id') === model.get('id');
        }));
        // that.get('ratings') = _.reject(that.get('ratings'), function(m){
        //     return m.get('id') === model.get('id');
        // });
    },

    ///////////////////////
    // Dataset selection //
    ///////////////////////
    
    getSelectedDatasets: function(){
        return this.get('settings').selectedDatasets;
    },

    addSelectedDataset: function( model ){
        this.get('settings').selectedDatasets.push(model);
        VM.getUI().updateSelectedDatasets();
    },

    removeSelectedDataset: function( model ){
        this.get('settings').selectedDatasets = _.reject(this.get('settings').selectedDatasets, function(m){
            return m.get('id') === model.get('id');
        });
        VM.getUI().updateSelectedDatasets();
    },

    emptySelectedDatasets: function( model ){
        this.get('settings').selectedDatasets = [];
        VM.getUI().updateSelectedDatasets();
    },
    
    /////////////////
    // Permissions //
    /////////////////

    isAuthorized: function( project ) {
        var that = this;

        // admin is always authorized
        if(that.get('role') === 0)
            return true;
        
        return false;

        // authorized if user is creator of the project
        // ...
    },

    /**
     * returns the specific configurations a user made for a view
     * @param  {View}   view if null, the current view is taken
     * @return {Object} the user specific view data
     */
    getViewData: function( view ) {
        var that = this;

        var viewData = null;

        if(!view) view = VM.getCurrentView();
        viewData = that.get('settings').view[view.get('name')];
        
        return viewData;
    },

});
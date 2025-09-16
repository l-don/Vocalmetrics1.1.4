var VM = new Class({
    
    Extends: AbstractClass,
    
    ///////////////////
    //Attributes     //
    ///////////////////

    canvas: null,	// class Canvas
    ui: null,		// class UI
    activeFilters: {
        raters: []
    },
    

    initialize: function( settings ){
        
        var that = this;
        
        if(!settings) throw new Error( "missing parameter in Constructor" );

        that.settings = settings;

        that.context = new Context();

        // that.settings = settings;
        // that.sounds = sounds;
        // that.user_settings = user_settings;
        that.detectBrowser();
        that.Util = {
            Geometry: new Geometry()
        };

        that.addEvents();

        // console.debug('user_settings', that.user_settings);
    },

    getCanvas: function() {
    	return this.canvas;
    },
    setCanvas: function(canvas) {
    	this.canvas = canvas;
    },
    
    getUI: function() {
    	return this.ui;
    },
    setUI: function(ui) {
    	this.ui = ui;
    },

    getDM: function() {
        return this.dm;
    },
    setDM: function(dm) {
        this.dm = dm;
    },

    getStorageManager: function() {
        return this.storageManager;
    },
    setStorageManager: function(storageManager) {
        this.storageManager = storageManager;
    },

    /////////////
    // Generic //
    /////////////

    /** adds new model (detects type) and returns it;
        if already existing, returns the existing one */
    addModel: function( model ){
        var that = this;

        var tableName = that.settings.dataModel[model.attributes.nameInDataModel].tableName;

        var existing = _.find(that[tableName], function( existingModel ){
                return existingModel.get('id') === model.get('id');
            });
        
        if( existing )
            return existing;
        
        that[tableName].push(model);

        return model;
    },

    getModel: function( modelId ){
        var that = this;

        console.debug('VM:getModel()', modelId);
        
        var model = null;
        
        var idPrefix = modelId.split('_')[0];
        
        switch(idPrefix){
            case 'U':
                model = VM.getUser(modelId);
                break;
            case 'P':
                model = VM.getProject(modelId);
                break;
            case 'FD':
                model = VM.getFeatureDefinition(modelId);
                break;
            case 'D':
                model = VM.getDataset(modelId);
                break;
            case 'F':
                model = VM.getFeature(modelId);
                break;
            case 'R':
                model = VM.getRating(modelId);
                break;
        }

        return model;
    },

    getModels: function( idList ){
        var that = this;


        var models = [];
        
        _.each(idList, function(modelId){
            var model = VM.getModel(modelId);
            if(model) models.push(model);
        });

        return models;
    },

    //////////
    // User //
    //////////

    getUsers: function() {
        return this.users;
    },

    setUsers: function( users ){
        this.users = users;
    },

    getUser: function( userID ){
        var that = this;

        console.warn('deprecated VM:getUser()');
        
        var model = _.find(that.users, function(d){
            return d.get('id') === userID;
        });
        return model;
    },
    
    removeUser: function(model){
        var that = this;
        if(
            that.users.length > 1 &&
            that.getCurrentUser() != model
        ){
            // remove related Ratings
            model.getAllRatings().each(function(model){
                VM.removeRating(model);
            });

            // remove User
            that.users = _.reject(that.users, function(m){
                return m.get('id') === model.get('id');
            });
        }
    },

    //////////////
    // Projects //
    //////////////
    getProjects: function() {
        return this.projects;
    },

    setProjects: function(projects){
        this.projects = projects;
    },

    getProject: function(projectID){
        var that = this;
        console.warn('deprecated VM:getProject()');
        var model = _.find(that.projects, function(d){ return d.get('id') == projectID; });
        return model;
    },

    addProject: function( model ){
        this.addModel(model);
    },

    removeProject: function( model ){
        var that = this;
        
        if(
            // only admin
            that.getCurrentUser().isAuthorized()
        ){
            // remove related Datasets
            model.getAllDatasets().each(function(model){
                VM.removeDataset(model);
            });

            // remove related FeatureDefinitions
            model.getAllFeatureDefinitions().each(function(model){
                VM.removeFeatureDefinition(model);
            });

            // remove Project
            that.projects = _.reject(that.projects, function(m){
                return m.get('id') === model.get('id');
            });
        }
    },

    ///////////////////////
    // FeatureDefinition //
    ///////////////////////
    getAllFeatureDefinitions: function() {
        return this.featureDefinitions.sort(function(a, b){return a.get('sort')-b.get('sort')});
    },

    setFeatureDefinitions: function(featureDefinitions){
        this.featureDefinitions = featureDefinitions;
    },

    getFeatureDefinition: function(fdID){
        console.warn('deprecated VM:getFeatureDefinition()');
        var that = this;
        var model = _.find(that.featureDefinitions, function(d){ return d.get('id') == fdID; });
        return model;
    },

    addFeatureDefinition: function( model ){
        var that = this;
        
        // this.featureDefinitions.push(model);
        model = this.addModel(model);

        // add to parentModel (Project)
        model.get('parentModel').addFeatureDefinition(model);

        // create new Feature for all Datasets of the parentModel (Project)
        model.get('parentModel').getAllDatasets().each(function(dataset){

            var featureData = {
                parentModel: dataset,
                featureDefinition: model
            };

            var newFeature = new Feature(featureData);

            // add new Feature to VM
            VM.addFeature(newFeature);

            // add new Feature to the existing dataset
            dataset.addFeature(newFeature);

        });

        model.get('parentModel').sortFeatureDefinitions();
        
    },

    removeFeatureDefinition: function( model ){
        var that = this;

        model.get('parentModel').removeFeatureDefinition(model);

        VM.getAllFeatures().each(function(feature){
            if( feature.get('featureDefinition').get('id') === model.get('id') )
                VM.removeFeature(feature);
        });

        // TODO remove values in Ratings based on FeatureDefinition
        VM.getAllRatings().each(function(rating){
            
            var exitValues = [];
            rating.get('values').each(function(value){
                if(value.featureDefinition === model.get('id')){
                    exitValues.push(value);
                }
            });
            
            rating.set('values', _.without(rating.get('values'), exitValues) );
        
        });

        // remove FeatureDefinition
        that.featureDefinitions = _.reject(that.featureDefinitions, function(m){
            return m.get('id') === model.get('id');
        });
        
        model.get('parentModel').sortFeatureDefinitions();
    },

    /////////////
    // Dataset //
    /////////////
    getAllDatasets: function() {
        return this.datasets;
    },

    setDatasets: function(models){
        this.datasets = models;
    },

    getDataset: function( modelId ){
        console.warn('deprecated VM:getDataset()');
        var that = this;
        var model = _.find(that.datasets, function(d){ return d.get('id') == modelId; });
        return model;
    },

    addDataset: function( model ){
        
        model = this.addModel(model);
        
        // add dataset to parent project
        model.get('parentModel').addDataset(model);
    },

    removeDataset: function( model ){
        var that = this;

        // remove from user selection
        if(that.getCurrentProject())
            VM.getCurrentUser().removeSelectedDataset(model);

        // remove related Features
        model.getAllFeatures().each(function(feature){
            VM.removeFeature(feature);
        });

        // remove related Ratings
        model.getAllRatings().each(function(rating){
            VM.removeRating(rating);
        });

        // remove related Dataset in Project
        model.get('parentModel').removeDataset(model);
        
        // remove Dataset
        that.datasets = _.reject(that.datasets, function(m){
            return m.get('id') === model.get('id');
        });
    },

    /////////////
    // Feature //
    /////////////
    getAllFeatures: function() {
        return this.features;
    },

    setFeatures: function(models){
        this.features = models;
    },

    getFeature: function( modelId ){
        console.warn('deprecated VM:getFeature()');
        var that = this;
        var model = _.find(that.features, function(d){ return d.get('id') == modelId; });
        return model;
    },

    addFeature: function( model ){
        model = this.addModel(model);
    },

    removeFeature: function( model ){
        var that = this;
        
        // remove related Features in Datasets
        VM.getAllDatasets().each(function(dataset){
            dataset.removeFeature(model);
        });

        // remove Feature        
        that.features = _.reject(that.features, function(m){
            return m.get('id') === model.get('id');
        });
    },

    ////////////
    // Rating //
    ////////////
    getAllRatings: function() {
        return this.ratings;
    },

    setRatings: function(models){
        this.ratings = models;
    },

    getRating: function( modelId ){
        console.warn('deprecated VM:getRating()');
        var that = this;
        var model = _.find(that.ratings, function(d){ return d.get('id') == modelId; });
        return model;
    },

    addRating: function( model ){
        
        model = this.addModel(model);

        // add to parent model
        model.get('parentModel').addRating(model);

        // add new Rating to rater (user)
        model.get('user').addRating(model);

    },

    removeRating: function( model ){
        var that = this;
        if(
            // only admin AND rating owner
            that.getCurrentUser().isAuthorized() ||
            that.getCurrentUser().get('id') === model.get('user').get('id')
        ){

            // remove related Ratings in User
            model.get('user').removeRating(model);
            
            // remove related Rating in Dataset
            model.get('parentModel').removeRating(model);

            // remove Rating
            that.ratings = _.reject(that.ratings, function(m){
                return m.get('id') === model.get('id');
            });
        }

    },

    /////////////
    // Context //
    /////////////
    getContext: function(context){
        return this.context;
    },

    setContext: function(context){
        this.context = context;
    },

    detectBrowser: function() {
        var self = this;

        var mouseevents = {};

        if(Browser.firefox) {
//            console.log('firefox');
            mouseevents = {
                mouseover: 'mouseenter',
                mousemove: 'mousemove',
                mouseout: 'mouseleave',
                mousewheel: 'wheel'
            };
        } else if(Browser.chrome) {
//            console.log('chrome');
            mouseevents = {
                mouseover: 'mouseover',
                mousemove: 'mousemove',
                mouseout: 'mouseout',
                mousewheel: 'mousewheel'
            };
        }

        self.settings.mouseevents = mouseevents;
    },

    getCurrentUser: function() {
        var that = this;

        return that.context.currentUser;
    },
    setCurrentUser: function( user ) {
        var that = this;
        console.log( 'set current user: ' + (user? user.get('firstname') : user) );
        that.context.currentUser = user;
    },

    getCurrentProject: function() {
        var that = this;
        return that.context.currentProject;
    },
    setCurrentProject: function( project ) {
        var that = this;
        console.log( 'set current project: ' + (project? project.get('name') : project) );
        
        project.groupFeatureDefinitions();
        that.context.currentProject = project;

    },

    getCurrentView: function() {
        var that = this;

        return that.context.currentView;
    },
    setCurrentView: function( view ) {
        var that = this;

        that.context.currentView = view;

    },
    loadView: function(view, blockUIRender) {
        var that = this;

        // delegate to canvas
        that.getCanvas().loadView(view);
        
        // render UI elements which depends on the current context (user, project, view)
        if(!blockUIRender)
            that.getUI().render();
    },

    save: function(cb){
        var that = this;
        // write to storage
        that.getStorageManager().save(cb, that);
    },

    addEvents: function(){
        var that = this;

        //////////////
        // Keyboard //
        //////////////
        
        // shortcuts
        Mousetrap.bind(['command+shift+e', 'ctrl++shift+e'], function(e) {
            VM.getStorageManager().exportAllDataToFile();
        });

        // CTRL key active?
        DOMEvent.defineKeys({
            // '16': 'shift',
            '17': 'control'
        });
        $(document).addEvent('keydown', function(event){
            if (event.key == 'control') that.ctrlKey = true;
            // console.log('ctrlKey', that.ctrlKey);
        });
        $(document).addEvent('keyup', function(event){
            if (event.key == 'control') that.ctrlKey = false;
            // console.log('ctrlKey', that.ctrlKey);
        });
    }
    
});
var UI = new Class({
    
    Extends: AbstractClass,

    ////////////////
    // Attributes //
    ////////////////

    buttons: {},
    tools: [],

    /** @type {Boolean} false if UI has never been rendered since app start */
    rendered: false,

    /** save the context the ui was rendered for */
    lastUser: null,
    lastProject: null,
    lastView: null,

    /** determine which context changed to make certain UI elements render again */
    userChanged: true,
    projectChanged: true,
    viewChanged: true,
    
    initialize: function(){
        
        var that = this;
        
        that.referenceDOMElements();
    },

    referenceDOMElements: function() {
        var that = this;

        that.bodyElement = $$('body');
        that.outerSpace = $$('#outerSpace');

        // get all buttons
        $$('button, a.button, .interactionBtn').each(function(el, i) {
            that.buttons[el.get('id')] = el;
        });

        

    },

    render: function() {

        var that = this;

        // ui rendering the first time
        if(!that.rendered) {
            that.lastUser = VM.getCurrentUser();
            that.lastProject = VM.getCurrentProject();
            that.lastView = VM.getCurrentView();
        } else
        {
            that.userChanged = (that.lastUser != VM.getCurrentUser());
            that.projectChanged = (that.lastProject != VM.getCurrentProject());
            that.viewChanged = (that.lastView != VM.getCurrentView());
        }
        
        that.lastUser = VM.getCurrentUser();
        that.lastProject = VM.getCurrentProject();
        that.lastView = VM.getCurrentView();

        that.createDOMElements();

        // TODO only needed until NAVIGATION + SEARCHBOX are put in own classes
        if(!that.rendered) that.bindEvents();

        if(!that.rendered) that.rendered = true;
    },

    createStaticDOMElements: function() {
        var that = this;

        
        
        ///////////////
        // Main menu //
        ///////////////
        if(!that.mainMenu)
            that.mainMenu = new MainMenu();

        /////////////
        // Tooltip //
        /////////////
        if(!that.tooltip)
            that.tooltip = new Tooltip();

        //////////////////
        // Context Menu //
        //////////////////
        if(!that.contextMenu)
            that.contextMenu = new ContextMenu();

        ///////////////
        // Model Masks //
        ///////////////
        if(!that.userMask)
            that.userMask = new UserMask();

        if(!that.projectMask)
            that.projectMask = new ProjectMask();

        if(!that.featureDefinitionMask)
            that.featureDefinitionMask = new FeatureDefinitionMask();

        if(!that.datasetMask)
            that.datasetMask = new DatasetMask();
    },

    createDOMElements: function() {
        var that = this;

        //////////////////
        // Details Area //
        //////////////////
        if(that.userChanged || that.projectChanged || that.viewChanged){
            if(that.detailsArea)
                that.detailsArea.getDOMElement().destroy();
            that.detailsArea = new DetailsArea();
        }

        //////////////////
        // Audio player //
        //////////////////
        if(that.projectChanged && VM.getCurrentProject().get('featureGroups').fileAudioFeature.length){
            if(that.audioPlayer)
                that.audioPlayer.getDOMElement().destroy();
            that.audioPlayer = new AudioPlayer();
        }

        //////////////
        // Tool box //
        //////////////
        if(that.userChanged || that.projectChanged || that.viewChanged){
            if(that.toolBox)
                that.toolBox.getDOMElement().destroy();
            that.toolBox = new ToolBox();
        }

        /////////////////
        // Search Tool //
        /////////////////

        // TODO put it in an own class
        if(!that.searchbox) {
            that.searchbox = new Element('input');
            $('navigation').grab(new Element('div#searchbox').grab(that.searchbox));
            var eye = new Element('span#searcheye.interactionBtn');
            eye.addEvent('click', function(){
                VM.settings.hideFilter = !VM.settings.hideFilter;
            });
            that.searchbox.grab(eye, 'before');
        }

    },

    updateSelectedDatasets: function(){
        var that = this;

        // unhighlight everything
        d3.selectAll('.dataset').each(function( d ){
            d3.select(this).classed('selected', false);
            d3.select(this).classed('subselected', false);
        });

        // highlight the selected ones
        var selectedDatasets = VM.getCurrentUser().getSelectedDatasets();
        
        // if selection is empty, reset details area
        if(!selectedDatasets.length) that.get('detailsArea').showDataset(null);

        selectedDatasets.each(function( d, i ){
            var cssClasses = ['selected', 'subselected'];

            // last one is the most recently selected one
            if( i === selectedDatasets.length -1 ) {
                d3.select('#' + d.get('id')).classed(cssClasses[0], true);
                // load this one's details
                that.get('detailsArea').showDataset(d);
            }
            else {
                d3.select('#' + d.get('id')).classed(cssClasses[1], true);
            }
        });

    },

    changeColorScheme: function(){
        // console.debug('UI:changeColorScheme()');

        var bright = d3.select('body').classed('brightTheme');
        d3.select('body').classed('brightTheme', !bright);

        // return for toolbox
        return !bright;
    },
    // },

    bindEvents: function() {
        
        var that = this;

        ///////////////
        // Main Menu //
        ///////////////

        that.buttons['settingsBtn'].addEvent('click', function(e){
            e.preventDefault();
            that.mainMenu.show();
        });

        ////////////////
        // Search box //
        ////////////////
       
        that.searchbox.addEvent('input', function(){
            
            var searchQuery = $(this).get('value').split("++");
            searchQuery.each(function( q, i ) {
                if(q.substr(-1) == ' ') q = q.substr(0, q.length-1);
                if(q.substr(0,1) == ' ') q = q.substr(1);
                if(q.substr(-2) == ' +') q = q.substr(0, q.length-2);
                searchQuery[i] = q.toString().toLowerCase();
            });
            searchQuery = searchQuery.filter(function(q){ 
                if( !q.length ) 
                    return false; 
                else 
                    return true; 
            });
            console.log(searchQuery);

            var datasets;
            if(VM.getCurrentView().name === 'Gravity')
                datasets = VM.getCurrentView().datapoints;
            else
                datasets = VM.getCurrentView().datasetSel;
            
            datasets
                .classed('match', false)
                .classed('invisible', false);

            // if( VM.settings.hideFilter && searchQuery[0] != '') VM.getCurrentView().datapoints.classed('invisible', true);


            // filter out matching datasets
            var matches;
            if( searchQuery[0] != '' ) {


                matches = datasets.filter(function(d,i){
                        var found = false;
                        
                        if( d.chef ) return false;
                        
                        searchQuery.each(function( q ){
                            // ['artist', 'gender', 'genre', 'label', 'release_year', 'title'].each(function(att){
                            VM.getCurrentProject().getAllFeatureDefinitions().each(function(fd){
                                if(d.getFeature(fd.get('name')) && d.getFeature(fd.get('name')).toString().toLowerCase().contains( q )) {
                                    found = true;
                                }
                                if(found) return false;
                            })

                            if(found) return false;
                        });

                        return found;
                    });
            
            }
            
            // highlight matching datasets
            if ( matches ) {
                matches.classed('match', true).classed('invisible', false);

                matches.each(function(d){
                    VM.getCurrentView().bringToFront( d );
                });
            }

        });


        ////////////////
        // Navigation //
        ////////////////
        
        that.buttons["btn_Gravity"].addEvent('click', function(e) {
            for (var name in that.buttons){
                $(that.buttons[name]).removeClass('active');
            }
            $(this).addClass('active');
            VM.loadView(new Gravity());
        });

        // that.buttons["btn_FeatureMatrix"].addEvent('click', function(e) {
        //     for (var name in that.buttons){
        //         $(that.buttons[name]).removeClass('active');
        //     }
        //     $(this).addClass('active');
        //     VM.loadView(new FeatureMatrix());
        // });

        that.buttons["btn_Flex"].addEvent('click', function(e) {
            for (var name in that.buttons){
                $(that.buttons[name]).removeClass('active');
            }
            $(this).addClass('active');
            VM.loadView(new Flex());
        });

        that.buttons["btn_Compare"].addEvent('click', function(e) {
            for (var name in that.buttons){
                $(that.buttons[name]).removeClass('active');
            }
            $(this).addClass('active');
            VM.loadView(new Compare());
        });

    },

    hide: function() {
        var that = this;

        if(that.detailsArea) $(that.detailsArea.DOMElement).addClass('invisible');
        if(that.toolbox) $(that.toolbox).addClass('invisible');
        if(that.audioPlayer) $(that.audioPlayer.DOMElement).addClass('invisible');
        $('navigation').addClass('invisible');
    },

    show: function() {
        var that = this;

        if(that.detailsArea) $(that.detailsArea.DOMElement).removeClass('invisible');
        if(that.toolbox) $(that.toolbox).removeClass('invisible');
        if(that.audioPlayer) $(that.audioPlayer.DOMElement).removeClass('invisible');
        $('navigation').removeClass('invisible');
    }
    
});
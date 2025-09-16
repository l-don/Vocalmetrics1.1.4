var View = new Class({

    Extends: AbstractClass,

    ////////////////
    // Attributes //
    ////////////////

    rendered: false,
    DOMElements: null,

    padding: 70,
    paddingTop: 30,
    paddingBottom: 30,
    paddingFromAxis: 20,
    inverted: false,

    // set tools in toolbox: true = set, false = unset, null = unvisible
    toolboxSettings: {},
    toolBoxTools: [],

	initialize: function(){

        this.defineGeneralTools();
    },
	
    getName: function() {
        var that = this;

        return that.name;
    },
    
	loadAttachmentMenu: function(d, e){
   	
   		var that = this;

        console.log('attachment');
        that.hoverbox.hide();
        that.contextMenu.show();

        that.contextMenu.setStyles({'top': e.pageY, 'left': e.pageX});
		
		if(d.file_pdf != '0') {
            that.contextMenu.grab(new Element('span').grab(new Element('a', {target: '_blank', href: VM.settings.path_pdf + d.file_pdf, text: 'PDF'})));
		}
		
		if(d.file_frequence !== undefined) {
            that.contextMenu.grab(new Element('span').grab(new Element('a', {target: '_blank', href: VM.settings.path_img + d.file_frequence, text: 'Spektrogram'})));
		}
		
   },

    loadHoverBox: function(d, type, value) {
        var that = this;

        VM.getUI().get('tooltip').getDOMElement().empty().show();

        if(value){
            var span = new Element('span', {text: value});
            that.hoverbox.grab(span);
        }
        else if(type === undefined) {
            that.groups[d.group].each(function(point) {
                var span = new Element('span', {text: point.d.get('artist') + ' - ' + point.d.get('title') });
                if(point.d.id == d.id) span.addClass('chosen-group-element');
                that.hoverbox.grab(span);
            });
        }
        else if(type == 'trend') {
            var span = new Element('span', {text: d[d.trend]});
            that.hoverbox.grab(span);
        }
        else if(type == 'pie') {
            var span = new Element('span', {text: d.name + ': ' + d.value});
            that.hoverbox.grab(span);
        }

        else if(type == 'radar') {
            var span = new Element('span', {text: d.artist + ': ' + d.title});
            that.hoverbox.grab(span);
        }
        else if(type == 'artwork') {
            var span = new Element('span', {text: d.artist});
            that.hoverbox.grab(span);
        }
        else if(type == 'gravity') {
            if(d.chef){
                var span = new Element('span', {text: d.attributes.name});
                that.hoverbox.grab(span);
            } else {
                var span = new Element('span', {text:  d.title + ' (' + d.artist +')'});
                that.hoverbox.grab(span);
            }
        }
    },

    setLegend: function(data) {
        var that = this;

        VM.ui.secondLevel.empty();
        data.each(function(el, index){
            console.log(el);
            var span = new Element('span', {text: el.text});
            VM.ui.secondLevel.grab(span);
        });
    },

    bringToFront: function( model ) {
        var that = this;

        var element = $(model.get('id'));
        var container = element.getParent();
        if(that.frontElement !== element) container.grab(element);
        that.frontElement = element;
    },

    selectDataset: function( d ){
        var that = this;

        // var ctrlKey = false;

        if ( !VM.ctrlKey ) {

            VM.getCurrentUser().emptySelectedDatasets();
            VM.getCurrentUser().addSelectedDataset(d);

        } else {

            if( _.contains(VM.getCurrentUser().getSelectedDatasets(), d) )
                // remove dataset from user's selection
                VM.getCurrentUser().removeSelectedDataset(d);
            else
                // throw dataset into user's selection
                VM.getCurrentUser().addSelectedDataset(d);

        }
    },

    getDOM: function(id, framework) {
        var that = this;

        var dom;
        that.datapoints.each(function(item) {
//            console.log(id, item.id);
            if(item.id == id) {
                dom = this;
//                break;    TODO break out of loop when id was found and dont check following items
            }
        });

        return dom;
    },

    showGrid: function( bool ){
        var that = this;

        d3.selectAll('.grid').classed('hidden', !bool);
    },

    /**
     * define view specific tools here
     * @return -
     */
    defineGeneralTools: function(){
        var that = this;

        /** @type {Array} standard tools that are always available */
        var generalTools = [
            {
                title: 'Show grid',
                cssId: 'tool-grid',
                fn: that.showGrid,
                callingObject: that
            },
            {
                title: 'Change color scheme',
                cssId: 'tool-scheme',
                fn: VM.getUI().changeColorScheme
            },
            {divider: true},
            {
                title: 'Add dataset',
                cssId: 'tool-add',
                fn: function(){
                    VM.getUI().get('datasetMask').loadModel(null, VM.getCurrentProject());
                    return false;
                }
            },
            {
                title: 'Relevant Raters',
                cssId: 'tool-raters',
                items: getRatersItems()
            },
            {divider: true}
        ];

        //////////////////
        // Average tool //
        //////////////////
        function getRatersItems(){
            var items = [];

            var possibleUsers = VM.getUsers();
            possibleUsers.each(function( user ){
                
                items.push({
                    label: user.get('firstname'),
                    fn: callback,
                    args: [user],
                    isActive: isActive
                });

            });
            
            return items;
            
            function callback(user, btnStatus) {

                if(btnStatus)
                    VM.activeFilters.raters.push(user);
                else
                    VM.activeFilters.raters = _.without(VM.activeFilters.raters, user);

                that.say('filtersChanged');
            }

            function isActive( item ){
                return ( _.contains(VM.activeFilters.raters, item.args[0]) );
            }
        }


        that.toolBoxTools = _.union(that.toolBoxTools, generalTools);
    },

    invertDataPoints: function() {
        var that = this;

        console.log('invert datapoints');

        that.datapoints.each(function(d, i) {
            var el = d3.select(this);

            var value = d[that.rFeature.get('name')];
            var newValue;

            console.log(that.inverted);
            if(!that.inverted) {
                if(value==4) {
                    newValue = 0.5;
                    el.classed('zero', true);
                } else {
                    newValue = 4-value;
                    el.classed('zero', false);
                }
            } else {
                if(value==0) {
                    newValue = 0.5;
                    el.classed('zero', true);
                } else {
                    newValue = value;
                    el.classed('zero', false);
                }
            }
            el.transition().duration(1000).attr('r', Math.sqrt( that.rScale(newValue) ));
        });

        (!that.inverted) ? that.inverted = true : that.inverted = false;
    },

    /**
     * isolate one point, i.e. hide all others
     * @param d datapoint to show
     * @param datapoints group in which all other points get hidden
     */
    isolatePoint: function(d, datapoints) {
        var that = this;

        datapoints.each(function(point,i) {
           if(point.id != d.id) {
               d3.select(this.parentNode).classed('hidden', true);
           }
        });
    },

    deIsolatePoint: function(datapoints) {
        var that = this;

        datapoints.each(function(point,i) {
            d3.select(this.parentNode).classed('hidden', false);
        });
    },

    removeEvents: function() {
        var that = this;

        if(!that.custom_events) return;
        Object.forEach(that.custom_events, function(ev){
            window.removeEvent(ev.name, ev.handler);        // TODO not working properly and causes custom events in views to get added multiple times (when rendering the view multiple times in one session)
        });
    }

})

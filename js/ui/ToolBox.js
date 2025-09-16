var ToolBox = new Class({

    Extends: UIElement,

    /////////////////
    // Attributes //
    /////////////////
    
    /** @type {Array} current toolbox repertoire */
    currentTools: [],
    // generalTools: [],
    
    initialize: function(){
        
        var that = this;
        
        // creates this.DOMElement
        that.parent(new Element('div.ui#toolbox'));
        
        that.render();
    },
    
    render: function(){
        var that = this;

        that.firstLevel = new Element('div#first-level', {'class': 'tool-level'});
        that.secondLevel = new Element('div#second-level', {'class': 'tool-level hidden'});

        that.DOMElement.grab(that.firstLevel);
        that.DOMElement.grab(that.secondLevel);

        // append UIElement to live DOM
        VM.getUI().get('outerSpace').grab(that.DOMElement);

        that.showTools();
    },
    
    showTools: function(){
        var that = this;

        // empty tools
        that.firstLevel.empty();

        // show general + specified tools
        that.currentTools = VM.getCurrentView().get('toolBoxTools');
        
        // create DOM for tools
        that.currentTools.each(function( tool ){
            
            var toolDOMElement;

            // visual divider
            if( tool.divider ){
                
                toolDOMElement = new Element('div.divider');
            
            }
            // tool that fires action on first level
            else if( tool.fn ) {
            
                if(!tool.args) tool.args = [];
                
                toolDOMElement = new Element('div.tool', {id: tool.cssId, title: tool.title});

                // show as active?
                d3.select(toolDOMElement).classed( 'active', tool.isActive? tool.isActive() : false );
                
                toolDOMElement.addEvent('click', function(){
                    divSel = d3.select(this);

                    // toggle "active" class
                    var btnStatus = !divSel.classed('active');
                    divSel.classed('active', btnStatus);

                    d3.select(that.secondLevel).classed('hidden', true);

                    // TODO use callingObject and args only if set
                    var cbReturn = tool.fn.apply( tool.callingObject, _.union(tool.args, [btnStatus]) );

                    // if callback returns bool, set btn status to this bool
                    if( _.isBoolean(cbReturn) )
                        divSel.classed('active', cbReturn);
                });
            
            }
            // tool that requires second level items
            else if( tool.items ){
                
                toolDOMElement = new Element('div.tool', {id: tool.cssId, title: tool.title} );
                
                toolDOMElement.addEvent('click', function(){
                    
                    divSel = d3.select(this);

                    // toggle "active" class
                    var btnStatus = !divSel.classed('active');
                    // remove "active" class from all other tools with second level
                    d3.select(that.firstLevel).selectAll('.tool').classed('active', false);
                    // set clicked tool active
                    divSel.classed('active', btnStatus);

                    that.secondLevel.empty();
                    d3.select(that.secondLevel).classed('hidden', !btnStatus);
                    
                    // create second level items
                    tool.items.each(function( item ){
                        
                        if(!item.args) item.args = [];
                        
                        var span = new Element('span', {text: item.label});
                        
                        // show as active?
                        d3.select(span).classed( 'active', item.isActive(item) );
                        
                        span.addEvent('click', function(e) {
                            spanSel = d3.select(this);
                            
                            // toggle "active" class
                            var btnStatus = !spanSel.classed('active');
                            
                            // tool allows to select only one item?
                            if(tool.singleSelection) {
                                // remove active class of all items
                                d3.select(that.secondLevel).selectAll('span').classed('active', false);
                            }
                            // set clicked item active
                            spanSel.classed('active', btnStatus);
                            
                            // var cbReturn = item.fn.apply(item.callingObject, _.union(item.args, [btnStatus]));
                            item.fn.apply(item.callingObject, _.union(item.args, [btnStatus]));

                            // if callback returns bool, set btn status to this bool
                            // if( _.isBoolean(cbReturn) )
                            //     spanSel.classed('active', cbReturn);
                        });
                        
                        that.secondLevel.grab(span);
                        that.secondLevel.setStyles({ top: toolDOMElement.getPosition(that.firstLevel).y });
                    });
                });
            }
            else {
                throw new Error('tool not defined correctly: ' + tool[Object.keys(tool)[0]] );
            }

            that.firstLevel.grab(toolDOMElement);

        });
    }

});
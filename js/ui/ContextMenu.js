var ContextMenu = new Class({

	Extends: UIElement,

	/////////////////
	// Attributes //
	/////////////////

	initialize: function(){
        
        var that = this;
        
        // creates this.DOMElement
        that.parent(new Element('div.ui#contextmenu'));
        
        that.render();
    },
    
    
    render: function(){
    	var that = this;

        that.DOMElement.addEvent('mouseleave', function(){
            var e = d3.event;
            that.DOMElement.empty().hide();
        });

        // append UIElement to live DOM
        VM.getUI().get('outerSpace').grab(that.DOMElement);
    },

    /**
     * shows specified menuItems for further interaction
     * @param  {Array} menuItems containing the menuItems like
     *                           [ 
     *                               {label: 'Vibrato', fn: changeFeature, args: [arg1, arg2], callingObject: View},
     *                               {label: 'Delete', fn: delete, args: [d]}
     *                               {label: menuItemLabel, fn: functionToCall, args: argsArray, callingObject: anyObject}
     *                           ]
     * @return -
     */
    showMenuItems: function( menuItems, pos ){
        var that = this;

        that.getDOMElement().empty();

        menuItems.each(function( command ){
           
            var menuItem = new Element('span', {text: command.label} );
            menuItem.addEvent('click', function(){
                command.fn.apply(command.callingObject, command.args);
            });

            that.DOMElement.grab(menuItem);

        });
        
        // show the menu
        that.getDOMElement().show();
        
        // show the menu according to its height/width and position on screen (upper or lower half/ left or right half)
        if( pos.y > window.innerHeight / 2) {
            pos.y -= that.getDOMElement().getSize().y;
        }
        if( pos.x > window.innerWidth / 2) {
            pos.x -= that.getDOMElement().getSize().x;
        }

        that.getDOMElement().setStyles({'top': pos.y, 'left': pos.x})
    }
        
});
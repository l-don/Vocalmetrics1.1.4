var ModelMask = new Class({

	Extends: UIElement,

	/////////////////
	// Attributes //
	/////////////////

    modes: {
        'new': 0,
        'edit': 1
    },

	initialize: function( modelName, options ){
        
        var that = this;
        
        that.modelName = modelName;
        
        // creates this.DOMElement
        that.parent(new Element('div.ui.ModelMask#' + that.modelName + 'Mask'));

        if(!VM.settings.dataModel[that.modelName]) console.warn('data model definition needed for ' + that.modelName);
        
        // create input only for unlocked fields
        that.fields = _.filter(VM.settings.dataModel[that.modelName].fields, function(field){
                return !field.locked;
            });

        that.fieldsRelational = VM.settings.dataModel[that.modelName].fieldsRelational;

        if(!options || !options.blockRender)
            that.render();
    },
    
    render: function(){
        var that = this;

        console.log('render ' + that.modelName+'Mask');

        // hide the mask on creation
        that.DOMElement.addClass('hidden');
        
        /////////////
        // Heading //
        /////////////
        that.heading = new Element('h2');
        that.DOMElement.grab(that.heading);
        

        ////////////
        // Fields //
        ////////////
        
        var table = new Element('table');
        _.each(that.fields, function(field){
            var tr = new Element('tr'),
                td1 = new Element('td'),
                td2 = new Element('td.value');
            tr.grab(td1).grab(td2);
            td1.grab(new Element('label', {text: field.label}));
            
            switch(field.type){
                case VM.settings.DataType.enum:
                    that[field.name] = new Element('select');
                    _.each(field.options, function(option){
                        that[field.name].grab(new Element('option', {text: option.label, value: option.value}));
                    });
                    break;
                case VM.settings.DataType.bool:
                    that[field.name] = new Element('input', {type: 'checkbox'});
                    break;
                case VM.settings.DataType.range:
                    that[field.name] = new Element('input', {type: 'range'});
                    // TODO
                    break;
                default:
                    that[field.name] = new Element('input', {type: 'text'});
                    break;
            }
            
            that[field.name].addClass(field.name);
            td2.grab(that[field.name]);
            table.grab(tr);
        });
        that.DOMElement.grab(new Element('p').grab(table));

        ///////////////////////
        // Fields relational //
        ///////////////////////
        // handle relational fields in the model-specific ModelMask instance
        if(that.fieldsRelational) {
            _.each(that.fieldsRelational, function(field){
                that.DOMElement.grab(new Element('h3', {text: field.label}));
                that[field.name] = new Element('div.relationals');
                that.DOMElement.grab(that[field.name]);
            });
        }
        
        // Create Action Buttons
        that.createActionButtons();
        
        // that.registerShortcuts();

        // append UIElement to live DOM
        VM.getUI().get('outerSpace').grab(that.DOMElement, 'top');

    },

    createActionButtons: function( additionals ){
        var that = this;

        var container = new Element('p.alignRight');
        that.saveBtn = new Element('button.save', {text: 'Save'});
        that.cancelBtn = new Element('button.cancel', {text: 'Cancel'});
        that.deleteBtn = new Element('button.delete', {text: 'Remove', disabled: true});
        
        // d3.select(saveBtn).on('click', that.save);
        d3.select(that.saveBtn).on('click', function(){
            that.parseFormFields();
        });
        d3.select(that.cancelBtn).on('click',  function(){
            that.cancel();
        });
        d3.select(that.deleteBtn).on('click',  function(){
            that.delete();
        });
        
        container
            .grab(that.saveBtn)
            .grab(that.cancelBtn)
            .grab(that.deleteBtn);

        // model specific buttons passed in from the specific Mask-Model
        if( additionals ) {
            container.grab(new Element('br'));
            additionals.each(function(btn){
                container.grab(btn);
            });
        }

        that.DOMElement.grab(container); 
    },
    
    registerShortcuts: function(){
        var that = this;

        Mousetrap.bind(['command+s', 'ctrl+s'], function(e) {
            that.parseFormFields();
            // return false;
        });

        Mousetrap.bind(['esc', 'escape'], function(e) {
            that.cancel.call(that);
            // return false;
        });

        Mousetrap.bind('del', function(e) {
            that.delete();
            // return false;
        });
    },

    unregisterShortcuts: function(){
        var that = this;

        Mousetrap.unbind(['command+s', 'ctrl+s']);

        Mousetrap.bind(['esc', 'escape']);

        Mousetrap.bind('del');
    },    

    loadModel: function( model, parentModel ){
        var that = this;

        console.log('load model of type ' + that.modelName, model);

        // show the mask
        that.DOMElement.removeClass('hidden');

        // focus on the first field
        that[that.fields[0].name].focus();

        if(!model) {
            // create new model
            if(
                // instantiate with parentModel attribute
                parentModel &&
                _.find(that.fieldsRelational, function(field){
                    return field.name === 'parentModel'
                })
            ){
                that.model = new window[that.modelName]({
                    parentModel: parentModel
                });
            } else {
                // instantiate without any attributes (blank)
                that.model = new window[that.modelName];
            }
            that.mode = that.modes.new;
        }
        else {
            // edit existing model
            // clone the model to avoid working on the original
            that.model = _.clone(model);
            that.mode = that.modes.edit;
        }

        ///////////////////////
        // Heading + Buttons //
        ///////////////////////

        var heading;
        switch (that.mode){
            case that.modes.new:
                heading = 'New ' + that.modelName;
                that.deleteBtn.setProperty('disabled', true);
                if(that.importBtn) that.importBtn.setProperty('disabled', true);
                if(that.exportBtn) that.exportBtn.setProperty('disabled', true);
                if(that.emptyBtn) that.emptyBtn.setProperty('disabled', true);
                break;
            case that.modes.edit:
                heading = 'Edit ' + that.modelName;
                that.deleteBtn.setProperty('disabled', false);
                if(that.importBtn) that.importBtn.setProperty('disabled', false);
                if(that.exportBtn) that.exportBtn.setProperty('disabled', false);
                if(that.emptyBtn) that.emptyBtn.setProperty('disabled', false);
                break;
        }
        that.heading.set('text', heading);


        ////////////
        // Fields //
        ////////////
        _.each(that.fields, function(field){
            
            // enable all input fields (in case they were disabled)
            $(that[field.name]).set('disabled', false);

            switch(field.type){
                // case VM.settings.DataType.enum:
                //     break;
                case VM.settings.DataType.bool:
                    $(that[field.name]).set('checked', that.model.get(field.name));
                    break;
                // case VM.settings.DataType.range:
                //     break;
                default:
                    $(that[field.name]).set('value', that.model.get(field.name));
                    break;
            }
        });

        
        ///////////////////////
        // Fields relational //
        ///////////////////////
        if(that.fieldsRelational)
            that.loadRelationalFields();


    },

    loadRelationalFields: function(){
        var that = this;
        console.warn('must implement renderRelationalFields() method in ' + that.modelName+'Mask');
    },

    parseFormFields: function(){
        var that = this;

        _.each(that.fields, function(field){
            var value;
            switch(field.type){
                case VM.settings.DataType.enum:
                    value = parseInt($(that[field.name]).get('value'));
                    break;
                case VM.settings.DataType.bool:
                    value = $(that[field.name]).get('checked');
                    break;
                default:
                    value = $(that[field.name]).get('value');
                    break;
            }
            // that.model[field.name] = value;
            that.model.set(field.name, value);
        });

        that.save();
    },

    save: function(){
        var that = this;
        console.warn('must implement save() method in ' + that.modelName+'Mask');
    },
    
    cancel: function(){
        var that = this;
        that.close();
    },


    delete: function(){
        var that = this;
        console.warn('must implement delete() method in ' + that.modelName+'Mask');
    },

    close: function(){
        var that = this;
        
        that.user = null;
        that.DOMElement.addClass('hidden');
        
        if (VM.getCurrentView().name === 'Gravity') {
            
            // VM.getCurrentView().force.start();
            // VM.getCurrentView().datasets.push(that.model);
            // VM.getCurrentView().getChefs();
            VM.getCurrentView().prepareData();
            VM.getCurrentView().renderOne();
            // VM.getCurrentView().force.resume();

        } else {
            VM.getCurrentView().render();
        }

        if (VM.getCurrentView().name !== 'Admin')
            VM.getUI().updateSelectedDatasets();

    }

});
/**
 * WHICH FEATURES to select for showing in the details area:
 *
 * show:
 * ~ ratable features shown in nx3 matrix
 * ~ datatype fileAudio is loaded into the audio player
 * ~ datatype fileImage is loaded into the image frame
 * ~ datatype fileOther is shown under "attachments"
 * ~ all others fill up h1 and h2 and further matrix columns
 *
 */

var DetailsArea = new Class({

	Extends: UIElement,

	/////////////////
	// Attributes //
	/////////////////

	numberMatrixRows: 3,

	initialize: function(){
        
        var that = this;
        
        // creates this.DOMElement
        that.parent(new Element('div.ui#infobox'));
        
        that.render();
    },
    
    /**
     * prepares the DOM elements in the details area according to the current project's feature definitions
     * called in VM.setCurrentProject()
     * @return -
     */
    render: function(){
    	var that = this;

        ///////////
        // Image //
        ///////////

        if(VM.getCurrentProject().featureGroups.fileImageFeature.length > 0) {
            that.image = new Element('div#dataset-image');
            that.DOMElement.grab(that.image);
        }


        /////////////////////////////////
        // Headings (position 1 and 2) //
        /////////////////////////////////

        // prepare the two heading positions
        var headings = new Element('div#dataset-headings');
        var h1 = new Element('p.h1');
        var h1Value = new Element('span.value', {text: '...'});
        d3.select(h1Value).on('click', function(){
            if(that.currentDataset)
                VM.getUI().get('datasetMask').loadModel(that.currentDataset);
        });
        h1.grab(h1Value);
        headings.grab(h1);

        // BIND feature to DOMElement
        that[VM.getCurrentProject().featureGroups.headingsFeatures[0].get('name')] = h1Value;
        
        // if second heading feature exists
        if(VM.getCurrentProject().featureGroups.headingsFeatures[1]){
            
            var h2 = new Element('p.h2');
            var h2Value = new Element('span.value', {text: '...'});
            h2.grab(h2Value);
            headings.grab(h2);
            
            // BIND feature to DOMElement
            that[VM.getCurrentProject().featureGroups.headingsFeatures[1].get('name')] = h2Value;
        }
        
        that.DOMElement.grab(headings);

        
        ////////////////////////////////////
        // ratable and remaining features //
        ////////////////////////////////////
 
        buildMatrix(VM.getCurrentProject().featureGroups.ratableFeatures, 'dataset-features-ratable');
        buildMatrix(VM.getCurrentProject().featureGroups.remainingFeatures, 'dataset-features-other');
 
        function buildMatrix(features, cssClassName ) {

            for(var i=1; i <= Math.ceil(features.length / that.numberMatrixRows); i++){
            
                var column = new Element('div.' + cssClassName);
                
                for(var j = (i-1)*3; (j < i*3) && (j<features.length); j++){
                        
                    var row = new Element('p.dataset-feature');
                    var label = new Element('span', { text: features[j].get('displayName') });
                    var value = new Element('span.value', {text: ' '});

                    // BIND feature to DOMElement
                    that[features[j].get('name')] = value;
                    
                    row.grab(label);
                    row.grab(value);
                    column.grab(row);
                };

                that.DOMElement.grab(column);
            };
        }

        // var buttons = new Element('div#dataset-buttons');
        // var editBtn = new Element('button', {text: 'Edit'});
        // d3.select(editBtn).on('click', function(){
        //     VM.getUI().get('datasetMask').loadModel(VM.getModel(that.currentDataset));
        // });
        // buttons.grab(editBtn);
        // that.DOMElement.grab(buttons);

        /////////////////////////
        // other file features //
        /////////////////////////

        // TODO create attachments menu

        // append UIElement to live DOM
        VM.getUI().get('outerSpace').grab(that.DOMElement, 'top');
    },

    showDataset: function( d ){
    	var that = this;

        if ( d ) {
            
            that.currentDataset = d;
            
            if ( d.candidate )
                that.DOMElement.addClass('candidate');
            else
                that.DOMElement.removeClass('candidate');
        }


        var featureDefinitions = VM.getCurrentProject().getAllFeatureDefinitions();

        featureDefinitions.each(function( fd ){
            
            // get the belonging DOMElement for the certain feature
            var valueDOMElement = that[fd.get('name')];

            // handle feature value according to its type
            var value = (d && d.getFeature(fd.get('name')) !== null) ? d.getFeature(fd.get('name')) : '...';

            switch( fd.get('dataType') ) {
                
                case VM.settings.DataType.fileAudio:
                
                    var ap = VM.getUI().get('audioPlayer');
                    if(d) {
                        // only if audio file really changed, otherwise avoid stop playing
                        if( value != ap.currentAudioFile )
                            ap.loadSound(value);
                    }
                    else ap.unLoadSound();
                    break;
                
                case VM.settings.DataType.fileImage:
                
                    // TODO handle image value
                    break;
                
                default:
                
                    if(valueDOMElement) valueDOMElement.set('text', value);
            }
        });

    }

});
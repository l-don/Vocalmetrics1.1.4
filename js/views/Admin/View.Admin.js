var Admin = new Class({

	Extends: View,

	/////////////////
	// Attributes //
	/////////////////
	
	name: 'Admin',
	
	settings: {
		cssId_projectsArea: 'admin-projects',
		cssId_usersArea: 'admin-users'
	},
	steps: { login: 0, admin: 1, showUserMask: 2 },
	currentStep: 0,
	
	initialize: function(){
		var that = this;

		// getting globals
		this.parent();
	},

	prepareData: function(){
		var that = this;

	},

	createDOMSkeleton: function() {
		var that = this;

		// view container
		var viewDiv = new Element('div#AdminView');

		// create elements
		var left = new Element('div#admin-left');
		var right = new Element('div#admin-right');
		var headingLeft = new Element('h1', {text: 'Projects'});
		var headingRight = new Element('h1', {text: 'Users'});
		
		var projects = new Element('div#' + that.settings.cssId_projectsArea).addClass('dataset-list');
		var users = new Element('div#' + that.settings.cssId_usersArea).addClass('dataset-list');

		// var addProjectBtn = new Element('div.addBtn').grab(new Element('div.icon', {text: '+'}));
		var addProjectBtn = new Element('div.addBtn')
			addProjectBtn.grab(new Element('div.icon'));
			// addProjectBtn.grab(new Element('div.data', {text: '+'}));
		var addUserBtn = new Element('div.addBtn')
			addUserBtn.grab(new Element('div.icon'));
			// addUserBtn.grab(new Element('div.data', {text: '+'}));

		var logo = new Element('div#logo');

		var editForm = new Element('div#editForm').addClass('hidden');
		
		// throw elements into DOM
		viewDiv.grab(left);
		viewDiv.grab(right);
		viewDiv.grab(editForm);
		viewDiv.grab(logo);

		projects.grab(addProjectBtn);
		left.grab(headingLeft);
		left.grab(projects);

		users.grab(addUserBtn);
		right.grab(headingRight);
		right.grab(users);

		VM.getCanvas().getDom('moo').grab(viewDiv);
		
		that.DOMElements = {
			container: viewDiv,
			left: left,
			right: right,
			editForm: editForm,
			headingLeft: headingLeft,
			headingRight: headingRight,
			projects: projects,
			users: users,
			addProjectBtn: addProjectBtn,
			addUserBtn: addUserBtn,
			logo: logo
		};
	},
	
	addEvents: function() {
		var that = this;

		d3.select(that.DOMElements.addProjectBtn).on('click', function(d,i) {
			if(VM.getCurrentUser().isAuthorized())
				VM.getUI().get('projectMask').loadModel();
		});
		d3.select(that.DOMElements.addUserBtn).on('click', function(d,i) {
			if(VM.getCurrentUser().isAuthorized())
				VM.getUI().get('userMask').loadModel();
		});
	},

	render: function() {
		console.log('render > AdminView');

		var that = this;
		
		if(!that.rendered) {
			that.createDOMSkeleton();
			that.addEvents();
		}

		/* -------------------------------------------------------------
		DATA
		--------------------------------------------------------------*/
		// var projectSel = d3.select(that.DOMElements.container).select('#' + that.settings.cssId_projectsArea).selectAll('div.dataset')
		var projectSel = d3.select(that.DOMElements.projects).selectAll('div.dataset')
			.data(VM.getProjects(), function(d) { return d.get('id'); });

		var userSel = d3.select(that.DOMElements.users).selectAll('div.dataset')
			.data(VM.getUsers(), function(d) { return d.get('id'); });

		/* -------------------------------------------------------------
		D3 loop
		--------------------------------------------------------------*/

		// ENTER
		function createNodes( selection, identifier ) {
			
			selection
				.insert( 'div', 'div.addBtn' )
				.attr({
					class: 'dataset',
					id: function(d) { return d.get('id') }
				})
				.each(function(d,i){
					var datasetSel = d3.select(this);

					/* GENERAL */
					var iconSel = datasetSel
						.append( 'div' ) 
						.attr('class', 'icon');
					
					var dataSel = datasetSel
						.append( 'div' )
						.attr('class', 'data');
					
					dataSel.append('h2').attr('class', 'name');
					dataSel.append('p').attr('class', 'desc');
					dataSel.append('p').attr('class', 'stats');
					
				});
		}

		createNodes( projectSel.enter(), VM.settings.identifiers.project );
		createNodes( userSel.enter(), VM.settings.identifiers.user );

		// UPDATE
		function updateNodes( selection, identifier ) {
			selection
				.each(function(d,i) {
					var datasetSel = d3.select(this);

					var name, desc, stats, current;

					/* GENERAL */
					desc = d.get('desc');
					current = (
						(
							VM.getCurrentUser() && 
							d.get('id') === VM.getCurrentUser().get('id')
						) ||
						(
							VM.getCurrentProject() && 
							d.get('id') === VM.getCurrentProject().get('id')
						)
					);
					datasetSel.classed('current', current);

					/* SPECIAL */
					if( identifier === VM.settings.identifiers.project ) {
						name = d.get('name');
						stats = d.getAllDatasets().length + ' datasets';

						datasetSel.select('.name')
							.on('click', function(d){
								if( 
									that.currentStep === that.steps.admin &&
									VM.getCurrentUser().isAuthorized()

								){
									VM.getUI().get('projectMask').loadModel(d);
								}
							});

						datasetSel.select('.icon').on('click', function(d,i){
							that.selectProject(d);
						});
					}
					else if( identifier === VM.settings.identifiers.user ) {
						name = d.get('firstname') + ' ' + d.get('surname');
						stats = d.getAllRatings().length + ' ratings';

						datasetSel.select('.name')
							.on('click', function(d){
								if(
									that.currentStep === that.steps.admin &&
									(
										VM.getCurrentUser().isAuthorized() ||
										d.get('id') === VM.getCurrentUser().get('id')
									)
								){
									VM.getUI().get('userMask').loadModel(d);
								}
							});
						datasetSel.select('.icon')
							.on('click', function(d,i){
							if( that.currentStep === that.steps.login ) {
								that.login( d );
							} else {
								if( d.get('id') === VM.getCurrentUser().get('id') )
									that.logout();
							}
						});
					}

					datasetSel.select('.name').text( name );
					datasetSel.select('.desc').text(desc);
					datasetSel.select('.stats').text(stats);

				});
		}

		updateNodes( projectSel, VM.settings.identifiers.project );
		updateNodes( userSel, VM.settings.identifiers.user );

		// EXIT
		userSel.exit()
            .remove();

        projectSel.exit()
            .remove();

		// initial actions
		if(!that.rendered) {
			that.loadStep( 0 );
			that.rendered = true;
		}
	},

	login: function( d ) {
		var that = this;

		var granted = false;
		
		if( d.get('role') === 0 ){
			granted = prompt('Password:') === VM.settings.adminPassword;
		} else {
			granted = true;
		}
		
		if(granted){
			d.get('settings').selectedDatasets = [];

			VM.setCurrentUser( d );
			that.render();	// TODO no need if render is invoked globally on data change
			that.loadStep( that.steps.admin );
		}
	},

	logout: function() {
		var that = this;

		VM.setCurrentUser( null );
		that.render();	// TODO no need if render is invoked globally on data change
		that.loadStep( that.steps.login );
	},

	selectProject: function( project ) {
		var that = this;

		var allFeatures = project.getAllFeatureDefinitions();
		var ratableFeatures = _.filter(project.getAllFeatureDefinitions(), function(fd){
			return fd.get('ratable');
		});
		if(
			allFeatures.length < 3 ||
			ratableFeatures.length < 2
		){
			alert('The project needs at least 2 RATABLE and 1 NON-RATABLE feature definitions!');
		}
		else {
			VM.setCurrentProject(project);
			// VM.loadView(new Gravity());		
			VM.loadView(new Flex());		
		}
	},

	loadStep: function( step, options ) {
		var that = this;

		switch( step ) {
			case that.steps.login:
				showLogin();
				break;
			case that.steps.admin:
				showAdmin();
				break;
			// case that.steps.showUserMask:
			// 	showUserMask(options);
			// 	break;
		}

		function showLogin( variant ) {

			/* application start */
			if( that.currentStep === that.steps.login ) {
				
				d3.select(that.DOMElements.headingRight).text('Login');
				d3.selectAll('.addBtn').classed('hidden', true);
				// hide projects
				move(that.DOMElements.left)
					  .set('visibility', 'hidden')
					  .duration(0)
					  .end();
				move(that.DOMElements.right)
					  .set('opacity', 0)
					  .to( -(window.innerWidth / 2 * 0.25) )
				      .duration(0)
					  .then()
					    .set('opacity', 1)
					    .duration('1s')
					    .pop()
					  .end();
			} else
		  	/* after logout */
			if( that.currentStep === that.steps.admin ) {

				d3.select(that.DOMElements.headingRight).text('Login');
				d3.selectAll('.addBtn').classed('hidden', true);
				// hide projects
				move(that.DOMElements.left)
					  .set('opacity', 0)
					  .then()
					  	.set('visibility', 'hidden')
					  	.duration(0)
					  	.pop()
					  .end(function(){
							move(that.DOMElements.right)
								  .to( -(window.innerWidth / 2 * 0.25) )
								  .end();
					  });
			}
		}

		function showAdmin() {
			d3.select(that.DOMElements.headingRight).text('Users');
			d3.selectAll('.addBtn').classed('hidden', false);
			// hide projects
			move(that.DOMElements.right)
				  .to( 0 )
				  .end(function(){
				  	move(that.DOMElements.left)
				  		.set('visibility', 'visible')
				  		.set('opacity', 0)
				  		.duration(0)
				  		.then()
						    .set('opacity', 1)
					    	.pop()
					 	.end();
				  });
		}

		function toggleRecord( show ) {
			d3.select(that.DOMElements.editForm).classed('hidden', show);
			if(show) {
				move(that.DOMElements.editForm)
					.set('opacity', 0)
					.duration(0)
			  		.then()
					    .set('opacity', 1)
				    	.pop()
				 	.end();
			} else {

			}
		}

		that.currentStep = step;

	}

});
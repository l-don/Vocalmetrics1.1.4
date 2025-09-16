const DataType = {
	string: 0,
	number: 1,
	enum: 2,
	bool: 3,
	range: 4,
	fileAudio: 5,
	fileImage: 6,
	fileOther: 7,
	url: 8
};

const DataModel = {
	
	User: {
		tableName: 'users',
		fields: [
			{label: 'ID', name: 'id', locked: true},
			{label: 'Firstname', name: 'firstname', default: ''},
			{label: 'Surname', name: 'surname', default: ''},
			{label: 'Description', name: 'desc', default: ''},
			{label: 'E-Mail', name: 'email', default: ''},
			{label: 'Phone', name: 'phone', default: ''},
			{label: 'Role', name: 'role', default: 1,
				type: DataType.enum,
				options: [
					{ label: 'Admin', value: 0 },
					{ label: 'User', value: 1 }
				]
			},
			{label: 'Settings', name: 'settings',
				default: {
			        view: {
			            gravity: {}
			        },
			        autoplay: true,
			        loop: false,
			        selectedDatasets: []
			    },
			    locked: true,
			    doNotStore: true
			}
			
		],

		fieldsRelational: [
			{label: 'Ratings', modelName: 'Rating', name: 'ratings', default: []}
			// {label: 'Projekte', name: 'projects', default: []}
		]
	},

	Project: {
		tableName: 'projects',
		fields: [
			{label: 'ID', name: 'id', locked: true},
			{label: 'Name', name: 'name', default: ''},
			{label: 'Description', name: 'desc', default: ''},
			// influences FeatureDefinition.rangeOfValues
			{label: 'Dynamic range', name: 'dynamicRangeOfValues', default: true, locked: true}
			// {label: 'Feature groups', name: 'featureGroups', default: {}, locked: true}
		],

		fieldsRelational: [
			// {label: 'Users', name: 'users', default: [], locked: true},
			{label: 'Feature Definitions', modelName: 'FeatureDefinition', name: 'featureDefinitions', default: []},
			{label: 'Datasets', modelName: 'Dataset', name: 'datasets', default: []}
		]
	},

	FeatureDefinition: {
		tableName: 'featureDefinitions',
		fields: [
			{label: 'ID', name: 'id', locked: true},
			{label: 'Name', name: 'name', default: ''},
			{label: 'Display name', name: 'displayName', default: ''},
			{label: 'Sorting', name: 'sort', default: false, type: DataType.number, locked: true},
			{label: 'ratable', name: 'ratable', default: false, type: DataType.bool},
			// specify if the feature is used for distance calculation
			// {label: 'enabledForDC', name: 'enabledForDC', default: false, type: 'bool'},
			// {label: 'Range', name: 'rangeOfValues', default: [0,100], type: DataType.range},
			{label: 'Data type', name: 'dataType', default: 0,
				type: DataType.enum,
				options: [
					{ label: 'String', value: DataType.string },
					{ label: 'Number', value: DataType.number },
					// { label: 'Enumeration', value: 2 },
					{ label: 'Audio file', value: DataType.fileAudio }
					// { label: 'Image File', value: 4 },
					// { label: 'Video File', value: 5 },
					// { label: 'Any other File', value: 6 }
				]
			}
		],

		fieldsRelational: [
			{label: 'Project', modelName: 'Project', name: 'parentModel', default: null}
		]
	},

	Dataset: {
		tableName: 'datasets',
		fields: [
			{label: 'ID', name: 'id', locked: true}
		],

		fieldsRelational: [
			{label: 'Project', modelName: 'Project', name: 'parentModel', default: null},
			{label: 'Features', modelName: 'Feature', name: 'features', default: []},
			{label: 'Ratings', modelName: 'Rating', name: 'ratings', default: []}
		]
	},

	Feature: {
		tableName: 'features',
		fields: [
			{label: 'ID', name: 'id', locked: true},
			{label: 'Value', name: 'value', default: null}
		],

		fieldsRelational: [
			{label: 'Dataset', modelName: 'Dataset', name: 'parentModel', default: null},
			{label: 'Feature definition', modelName: 'FeatureDefinition', name: 'featureDefinition', default: null}
		]
	},

	Rating: {
		tableName: 'ratings',
		fields: [
			{label: 'ID', name: 'id', locked: true},
			{label: 'Values', name: 'values', default: []}
		],

		fieldsRelational: [
			{label: 'Dataset', modelName: 'Dataset', name: 'parentModel', default: null},
			{label: 'User', modelName: 'User', name: 'user', default: null}
		]
	}

};
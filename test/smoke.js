require('dotenv').config();
const apiKey = process.env.INTERNAL_SMOKE_TEST_KEY;

module.exports = [
	{
		description: 'Serve content using lure/ route (no API Key needed)',
		urls: {
			'/lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': {
				description: 'Case of a valid, existing content Id',
				status: 200
			},
			'/lure/v2/content/00000000-0000-0000-0000-000000000000': {
				description: 'Case of a non existing content Id',
				status: 404
			},
			'/lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': {
				description: 'Case of a valid, existing content Id requesting Lure Top Stories',
				status: 200,
				headers: {
					'ft-flags': 'lureTopStories',
				},
			},
			'/lure/v2/content/00000000-0000-0000-0000-000000000000': {
				description: 'Case of a non existing content Id requesting Lure Top Stories',
				status: 404,
				headers: {
					'ft-flags': 'lureTopStories',
				},
			},
		},
	},
	{
		description: 'Serve content using __lure/ route (API Key needed)',
		urls: {
			'/__lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': {
				description: 'Case of a existing content Id with a valid Api Key',
				status: 200,
				headers: {
					'X-API-KEY': apiKey
				},
			},
			'/__lure/v2/content/00000000-0000-0000-0000-000000000000': {
				description: 'Case of a non existing content Id with an invalid Api Key',
				status: 404,
				headers: {
					'X-API-KEY': apiKey
				},
			},
			'/__lure/v2/content/00000000-0000-0000-0000-000000000000': {
				description: 'Case of a non existing content Id where the Api Key is not provided',
				status: 401,
			},
			'/__lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': {
				description: 'Case of an existing content Id where the Api key is not provided',
				status: 401,
			},
			'/__lure/v2/content/00000000-0000-0000-0000-000000000000': {
				description: 'Case of a non existing content Id where the Api key is provided but invalid',
				status: 401,
				headers: {
					'X-API-KEY': 'invalid-key'
				},
			},
			'/__lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': {
				description: 'Case of an existing content Id where the Api key is provided but invalid',
				status: 401,
				headers: {
					'X-API-KEY': 'invalid-key'
				},
			},
		},
	},
];

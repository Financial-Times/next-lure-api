require('dotenv').config();

module.exports = [{
	urls: {
		'/lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': 200,
		'/__lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': 200
	},
	headers: {
		'X-API-KEY': process.env.LURE_API_READ_ONLY_KEY
	}
}, {
	urls: {
		'/lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': 200,
		'/__lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': 200
	},
	urls: {
		'/lure/v2/content/00000000-0000-0000-0000-000000000000': 404,
		'/__lure/v2/content/00000000-0000-0000-0000-000000000000': 404
	},
	headers: {
		'ft-flags': 'lureTopStories',
		'X-API-KEY': process.env.LURE_API_READ_ONLY_KEY
	},
}, {
	urls: {
		'/__lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': 401
	}
}];

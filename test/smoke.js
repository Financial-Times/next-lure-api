require('dotenv').config();
const apiKey = { 'X-API-KEY': process.env.BLABLA }

module.exports = [{
	urls: {
		'/lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': 200,
		'/__lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': 200
	},
	headers: {
		'X-API-KEY': apiKey
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
		'X-API-KEY': apiKey
	},
}, {
	urls: {
		'/__lure/v2/content/a31c3c62-b936-11e7-8c12-5661783e5589': 401
	}
}];

/*eslint-disable*/

const esClient = require('@financial-times/n-es-client');

const region = process.env.REGION === 'US' ? 'us' : 'eu';

const INTERVAL = 60 * 1000;

const statuses = {
	elastic: false,
	lists: false
};

function pingServices () {
	esClient.search({ size: 0 })
		.then((docs) => { statuses.elastic = Boolean(docs); })
		.catch(() => { statuses.elastic = false; });
}

function elasticStatus () {
	return {
		getStatus: () => ({
			id: `elasticsearch-${region}-success`,
			name: `elasticsearch responded successfully in ${region}`,
			ok: statuses.elastic,
			businessImpact: 'Users may not see related content recommendations.',
			severity: 1,
			technicalSummary: 'Runs a search against the content index in elastic search',
			panicGuide: 'Info on what to do in case of elastic search failure is in the next-article runbook'
		})
	};
}


module.exports = {
	init: function () {
		pingServices();
		setInterval(pingServices, INTERVAL);
	},
	checks: [
		elasticStatus()
	]
};

import fs from 'node:fs';
import http from 'node:http';
import url from 'node:url';
import cron from 'node-cron';

const CLOUDFLARE_WORKERS_URL = 'https://defly-websocket.isra.workers.dev/';

const REQUESTS = {
	teams: `${CLOUDFLARE_WORKERS_URL}?region=use&port=3005`,
	defuse: `${CLOUDFLARE_WORKERS_URL}?region=use&port=3002`,
};

async function runRequest(requestType) {
	const response = await fetch(requestType);
	const data = await response.json();

	return data;
}

function getPlayerCount(game) {
	return game.reduce((total, team) => total + (team.players?.length ?? 0), 0);
}

const CSV_FILES = {
	teams: '/app/data/teams.csv',
	defuse: '/app/data/defuse.csv',
};

function appendToCSVfile(location, contents) {
	if (!fs.existsSync(location)) {
		fs.writeFileSync(location, 'time,players');
	}
	fs.appendFileSync(location, '\n' + contents);
}

async function checkServers() {
	let teams, defuse;
	try {
		teams = getPlayerCount(await runRequest(REQUESTS.teams));
		defuse = getPlayerCount(await runRequest(REQUESTS.defuse));

		const time = new Date().toISOString();

		const teamsCSVstring = [time, teams].join(',');
		const defuseCSVstring = [time, defuse].join(',');

		appendToCSVfile(CSV_FILES.teams, teamsCSVstring);
		appendToCSVfile(CSV_FILES.defuse, defuseCSVstring);
	} catch (err) {
		const time = new Date().toISOString();

		appendToCSVfile(CSV_FILES.teams, [time, '-1']);
		appendToCSVfile(CSV_FILES.defuse, [time, '-1']);

		console.log('Error with:');
		console.log(teams, defuse);
		console.error(err);
	}
}

cron.schedule('*/30 * * * *', () => {
	checkServers();
});

const server = http.createServer();

server.on('request', (request, response) => {
	const URL = url.parse(request.url);

	switch (URL.pathname) {
		case '/teams':
			response.writeHead(200, {
				'Content-Type': 'text/csv',
			});
			fs.createReadStream(CSV_FILES.teams).pipe(response);
			break;
		case '/defuse':
			response.writeHead(200, {
				'Content-Type': 'text/csv',
				'Content-Disposition': 'inline',
			});
			fs.createReadStream(CSV_FILES.defuse).pipe(response);
			break;
		default:
			response.writeHead(404);
			response.end('Not found');
	}
});

server.listen(process.env.PORT || 8000);

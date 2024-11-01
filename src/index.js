import fs from 'node:fs';
import http from 'node:http';
import url from 'node:url';
import cron from 'node-cron';

const CLOUDFLARE_WORKERS_URL = 'https://defly-websocket.isra.workers.dev/';

const REQUESTS = {
	teams: `${CLOUDFLARE_WORKERS_URL}?region=use&port=3005`,
	defuse: `${CLOUDFLARE_WORKERS_URL}?region=use&port=3002`,
};

const CSV_FILES = {
	teams: './data/teams.csv',
	defuse: './data/defuse.csv',
};

async function runRequest(requestType) {
	const response = await fetch(requestType);
	const data = await response.json();

	return data;
}

function getPlayerCount(game) {
	console.log(game);
	return game.reduce((total, team) => total + (team.players?.length ?? 0), 0);
}

function appendToCSVfile(location, contents) {
	fs.appendFileSync(location, '\n' + contents);
}

async function checkServers() {
	try {
		const teams = getPlayerCount(await runRequest(REQUESTS.teams));
		const defuse = getPlayerCount(await runRequest(REQUESTS.defuse));

		const time = new Date().toISOString();

		const teamsCSVstring = [time, teams].join(',');
		const defuseCSVstring = [time, defuse].join(',');

		appendToCSVfile(CSV_FILES.teams, teamsCSVstring);
		appendToCSVfile(CSV_FILES.defuse, defuseCSVstring);

		console.log('Successfully logged');
	} catch (err) {
		const time = new Date().toISOString();

		appendToCSVfile(CSV_FILES.teams, [time, '-1']);
		appendToCSVfile(CSV_FILES.defuse, [time, '-1']);

		console.error(err);
	}
}

cron.schedule('*/30 * * * *', () => {
	checkServers();
});

const server = http.createServer();

server.on('request', (request, response) => {
	const URL = url.parse(request.url);

	if (URL.pathname.includes('teams')) {
		response.writeHead(200, { 'Content-Type': 'text/csv' });

		const readStream = fs.createReadStream(CSV_FILES.teams);

		readStream.pipe(response);
	} else if (URL.pathname.includes('defuse')) {
		response.writeHead(200, { 'Content-Type': 'text/csv' });

		const readStream = fs.createReadStream(CSV_FILES.defuse);

		readStream.pipe(response);
	} else {
		response.writeHead(404);
		response.end('Not found');
	}
});

server.listen(process.env.PORT ?? 8000);

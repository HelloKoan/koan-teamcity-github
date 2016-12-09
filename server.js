var request = require('request');
var express = require('express');
var crypto = require('crypto');
var app = express();

app.use(express.urlencoded()); 
app.use(express.json());

app.get('/', function(req, res) {
	res.send('Hello World\n');
});

app.post('/', function(request, response){	
	var data = request.body;
	
	var gitHubEventType = request.headers['x-github-event'];
	var gitLabEventType = request.headers['x-gitlab-event'];
	
	if(typeof data.repository === "undefined"){
		response.send(200);
		return;
	}

	if (typeof gitHubEventType !== 'undefined' && gitHubEventType != '')
	{
		/* GITHUB */
		if (checkSecretIsOk(data, process.env.githubSecret, request.headers['x-hub-signature']) == false) {
			response.send(403);
			return;
		}
		
		var repository = data.repository.name;
		var committer = data.head_commit.committer.name;
		
		if(committer == 'teamcity'){
			response.send(200);
			return;
		}
		
		if(gitHubEventType == 'push'){
			var ref = data.ref;

			if(typeof ref === "undefined"){
				// not a commit
				response.send(200);
				return;
			}
			
			if(ref.indexOf('refs/tags') > -1){
				response.send('Tag push ignored');
				return;
			}
		
			var branch = ref.replace('refs/heads/', '');
			
			var wasDeleted = data.deleted;

			response.send('{"repository": "' + repository + '", "branch": "' + branch + '", "deleted": "' + wasDeleted + '"}');

			if(!wasDeleted){	
				parsePush(repository, branch);
			}
		}
		else if(gitHubEventType == 'pull_request'){
			var id = data.number;
			
			response.send('{"repository: "' + repository + '", "pull_request: "' + id + '"}');
			
			parsePush(repository, id);
		}
		else {
			response.send(400, request.headers);
			return;
		}

	} else if (typeof gitLabEventType !== 'undefined' && gitHubEventType != '') 
	{
		/* GITLAB */
		if (checkSecretIsOk(data, process.env.gitlabSecret, request.headers['x-gitlab-token']) == false) {
			response.send(403);
			return;
		}

		var repository = data.repository.name;
		var eventType = data.object_kind;

		if (eventType == 'push') {
			var ref = data.ref;

			if(typeof ref === "undefined"){
				// not a commit
				response.send(200);
				return;
			}
			
			if(ref.indexOf('refs/tags') > -1){
				response.send('Tag push ignored');
				return;
			}
		
			var branch = ref.replace('refs/heads/', '');
			
			var commits = data.total_commits_count;

			response.send('{"repository": "' + repository + '", "branch": "' + branch + '", "commits": "' + commits + '"}');

			if (commits > 0) {	
				parsePush(repository, branch);
			}
		}

	} else {
		response.send(400, request.headers);
		return;
	}
});

function parsePush(repository, branch){
	switch(repository){
		case 'Flow':
			switch(branch){
				case 'develop':
					triggerBuild('Flow');
					break;
			}
			break;
		
		case 'MailChimpV3API':
 			switch(branch){
 				default:
 					triggerBuild('MailChimpV3API_BuildTestPackage', branch);
 					break;
 			}
	}
}

function triggerBuild(buildId, branch){
	console.log('Triggering build for ' + buildId);

	var url = 'https://teamcity.koan.is/httpAuth/action.html?add2Queue=' + buildId;
	
	if(branch){
		url += '&branchName=' + branch;
	}
	
	request.get(url).auth(process.env.teamcityUser, process.env.teamcityPassword);
}

function checkSecretIsOk(data, secret, header) {
	if (header == secret) {
		return true;
	}
	
	var hmacDigest = crypto.createHmac('sha1', secret).update(JSON.stringify(data)).digest('hex');
	calculatedSignature = 'sha1=' + hmacDigest;
	
	if (calculatedSignature != header) {
		// not correct secret
		return false;
	}

	return true;
}

app.listen(process.env.PORT);
console.log('Server running at http://localhost:' + process.env.PORT);

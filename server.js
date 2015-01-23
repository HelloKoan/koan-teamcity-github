var request = require('request');
var express = require('express');
var app = express();

app.use(express.urlencoded()); 
app.use(express.json());

app.get('/', function(req, res) {
	res.send('Hello World\n');
});

app.post('/', function(request, response){	
	var data = request.body;

	var repository = data.repository.name;
	var ref = data.ref;

	if(typeof ref === "undefined"){
		// not a commit
		return;
	}

	var branch = ref.replace('refs/heads/', '');

	response.send('{"repository: "' + data.repository.name + '", "branch: "' + branch + '"}');

	parsePush(repository, branch);
});

function parsePush(repository, branch){
	switch(repository){
		case 'Owletter':
			switch(branch){
				case 'master':
					triggerBuild('Owletter_StagingBuild');
					break;
				case 'production':
					triggerBuild('Owletter_Build');
					break;
			}
			break;			
	}
}

function triggerBuild(buildId){
	console.log('Triggering build for ' + buildId);
	
	var url = 'http://teamcity.koan.is/httpAuth/action.html?add2Queue=' + buildId;
	request.get(url).auth('github', '8xC@z$0vfkgp');
}

app.listen(3001);
console.log('Server running at http://localhost:3001');

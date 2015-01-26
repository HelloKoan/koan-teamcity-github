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

	if(typeof data.repository === "undefined"){
		response.send(200);
	}

	var repository = data.repository.name;
	var ref = data.ref;

	if(typeof ref === "undefined"){
		// not a commit
		response.send(200);
	}

	var branch = ref.replace('refs/heads/', '');

	response.send('{"repository: "' + repository + '", "branch: "' + branch + '"}');

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
            
		case 'Cocktail':
			switch(branch){
				case 'master':
					triggerBuild('Cocktail_Build');
					break;
			}
			break;
            
		case 'AdminOld':
			switch(branch){
				case 'Legacy':
					triggerBuild('ECommerce_AdminLegacy_Build');
					break;
			}
			break;
            
		case 'BathUnwindOld':
			switch(branch){
				case 'master':
					triggerBuild('Flow_BathUnwindLegacy_Build');
					break;
			}
			break;
            
		case 'WarehouseOld':
			switch(branch){
				case 'master':
					triggerBuild('Flow_LegacyWarehouse_Build');
					break;
			}
			break;
            
		case 'GoogleAdwordsOld':
			switch(branch){
				case 'master':
					triggerBuild('Flow_LegacyGoogleAdwords_Build');
					break;
			}
			break;
	}
}

function triggerBuild(buildId){
	response.send('Triggering build for ' + buildId);

	var url = 'https://teamcity.koan.is/httpAuth/action.html?add2Queue=' + buildId;
	request.get(url).auth(process.env.teamcityUser, process.env.teamcityPassword);
}

app.listen(process.env.PORT);
console.log('Server running at http://localhost:' + process.env.PORT);

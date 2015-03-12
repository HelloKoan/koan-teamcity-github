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
	
	var hmacDigest = crypto.createHmac('sha1', process.env.githubSecret).update(JSON.stringify(data)).digest('hex');
	calculatedSignature = 'sha1=' + hmacDigest;
	if (calculatedSignature != request.headers['x-hub-signature']) {
		// not correct github secret
		response.send(403);
	}

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
					triggerBuild('Owletter_Staging');
					break;
				case 'production':
					triggerBuild('Owletter_Build');
					triggerBuild('Owletter_Production');
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
            
		case 'Flow':
			switch(branch){
				case 'Koan':
					triggerBuild('Flow_AdminKoanStaging_Build');
					triggerBuild('Flow_WarehouseKoan_Build');
					triggerBuild('Flow_FrontendKoan_Build');
					break;
				case 'Barmans':
					triggerBuild('Flow_AdminBarmansStaging_Build');
					triggerBuild('Flow_WarehouseBarmans_Build');
					triggerBuild('Flow_FrontendDrinkstuff_Build');
					break;
			}
			break;
			
		case 'seg-app':
			switch(branch){
				case 'production':
					triggerBuild('Seg_Web_Prod_Build');
					break;
				default:
					triggerBuild('Seg_Staging_Build', branch);
					break;
			}
			break;
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

app.listen(process.env.PORT);
console.log('Server running at http://localhost:' + process.env.PORT);

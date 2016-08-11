var request = require('request');
request.get("https://testing-catapult.herokuapp.com/test", function (err, resp, body){
	console.log(resp.body);
})

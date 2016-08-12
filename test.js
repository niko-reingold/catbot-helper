var userId = process.env.BANDWIDTH_USER_ID;
var apiToken = process.env.BANDWIDTH_API_TOKEN;
var apiSecret = process.env.BANDWIDTH_API_SECRET;
var firstNumber = process.env.PHONE_NUMBER_ONE;
var secondNumber = process.env.PHONE_NUMBER_TWO;
var nodebandwidth = require('node-bandwidth');
var bodyParser = require('body-parser');
var request = require('request');
var http = require('http');
var express = require('express');
var app = express();
var callReceived;
var callId;
var textReceived;

app.get('/text', function (req, res){
	textReceived = {};
	var client = new nodebandwidth({
	  userId : userId,
	  apiToken : apiToken,
	  apiSecret: apiSecret
	});

	client.Message.send({
	  to : secondNumber,
	  from : firstNumber,
	  text : 'Hello world'
	});

	client.Message.send({
	  to : firstNumber,
	  from : secondNumber,
	  text : 'Hello world'
	});

	var response = {};
	var timeout = setTimeout(function(){
		response.outgoingText = (textReceived[firstNumber].state == 'received'
			&& textReceived[firstNumber].text == 'Hello world');
		response.outgoingTextId = textReceived[firstNumber].messageId;
		response.incomingText = (textReceived[secondNumber].state == 'received'
			&& textReceived[secondNumber].text == 'Hello world');
		response.incomingTextId = textReceived[secondNumber].messageId;
		res.send(response);
	}, 1500);
});

app.get('/call', function (req, res){
	callReceived = {};
	callId = {};
	var client = new nodebandwidth({
	  userId : userId,
	  apiToken : apiToken,
	  apiSecret: apiSecret
	});

	client.Call.create({
		to: secondNumber,
		from: firstNumber
	});

	 setTimeout(function(){
	 	client.Call.create({
	 		to: firstNumber,
	 		from: secondNumber
	 	});
	 }, 8000);

	var response = {};
	var timeout = setTimeout(function(){
		response.outgoingCall = callReceived[firstNumber].state == 'complete';
		response.outgoingCallId = callId[firstNumber].callId;
		response.incomingCall = callReceived[secondNumber].state == 'complete';
		response.incomingCallId = callId[secondNumber].callId;
		res.send(response);
	}, 20000);
});

app.use(bodyParser.json());

app.post('/call', function (req, res){
	console.log("Got the call.");
	callId[req.body.to] = req.body;
	var client = new nodebandwidth({
	  userId : userId,
	  apiToken : apiToken,
	  apiSecret: apiSecret
	});
	if(req.body.eventType == 'answer'){
		console.log("answered");
		client.Call.speakSentence(req.body.callId, "Test");
	} else if (req.body.eventType == 'speak'){
		console.log("speaking");
		setTimeout(function() {
			callReceived[req.body.to] = req.body;
			client.Call.hangup(req.body.callId);
		}, 1500);
	} else {
		console.log("other callback");
	}
});

app.post('/text', function (req, res){
	res.send("Got the text.");
	textReceived[req.body.to] = req.body;
});

app.listen(process.env.PORT);
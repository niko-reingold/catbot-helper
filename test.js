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
	var client = new nodebandwidth({
	  userId : userId,
	  apiToken : apiToken,
	  apiSecret: apiSecret
	});

	client.Call.create({
		to: secondNumber,
		from: firstNumber,
		callbackUrl: 'https://' + req.get('host') + '/call',
		callbackHttpMethod: 'POST'
	});

	setTimeout(function(){
		client.Call.create({
			to: firstNumber,
			from: secondNumber,
			callbackUrl: 'https://' + req.get('host') + '/call',
			callbackHttpMethod: 'POST'
	}, 5000);

	var response = {};
	var timeout = setTimeout(function(){
		response.outgoingCall = callReceived[firstNumber].status == 'done';
		response.outgoingCallId = callReceived[firstNumber].callId;
		response.incomingCall = callReceived[secondNumber].status == 'done';
		response.incomingCallId = callReceived[secondNumber].callId;
		res.send(response);
	}, 5000);
});

app.use(bodyParser.json());

app.post('/call', function (req, res){
	res.send("Got the call.");
	var client = new nodebandwidth({
	  userId : userId,
	  apiToken : apiToken,
	  apiSecret: apiSecret
	});
	if(req.body.eventType == 'answer'){
		client.Call.speakSentence(req.body.callId, "Test").then(function (res) {});
	} else if (req.body.eventType == 'speak'){
		setTimeout(function() {
			callReceived[req.body.to] = req.body;
			client.Call.hangup(req.body.callId).then(function () {});
		}, 2000);
	}
});

app.post('/text', function (req, res){
	res.send("Got the text.");
	textReceived[req.body.to] = req.body;
});

app.listen(process.env.PORT);
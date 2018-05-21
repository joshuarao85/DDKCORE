'use strict';

var Router = require('../../helpers/router');
var httpApi = require('../../helpers/httpApi');
var schema = require('../../schema/accounts.js');
var tokenValidator = require('../../tokenValidator');

/**
 * Binds api with modules and creates common url.
 * - End point: `/api/accounts`
 * - Public API:
	- post 	/open
	- get 	/getBalance
	- get 	/getPublicKey
	- post 	/generatePublicKey
	- get 	/delegates
	- get 	/delegates/fee
	- put 	/delegates
	- get 	/
 * - Private API:
 * 	- get 	/count
 * @memberof module:accounts
 * @requires helpers/Router
 * @requires helpers/httpApi
 * @constructor
 * @param {Object} accountsModule - Module account instance.
 * @param {scope} app - Network app.
 */

function AccountsHttpApi (accountsModule, app) {

	var router = new Router();

	router.map(accountsModule.shared, {
		'post /open': 'open',
		'get /getBalance': 'getBalance',
		'get /getPublicKey': 'getPublickey',
		'post /generatePublicKey': 'generatePublicKey',
		'get /delegates': 'getDelegates',
		'get /delegates/fee': 'getDelegatesFee',
		'put /delegates': 'addDelegates',
		'get /': 'getAccount',
		'post /lock': 'lockAccount',
		'post /unlock': 'unlockAccount',
		'post /logout': 'logout',
		'get /count':'totalAccounts',
		'get /getCirculatingSupply':'getCirculatingSupply',
		'get /totalSupply' : 'totalSupply',
		'post /existingETPSUser' : 'existingETPSUser',
		'post /migrateData' : 'migrateData', 
		'post /existingETPSUser/validate' : 'validateExistingUser',
		'post /verifyUserToComment': 'verifyUserToComment',
		'post /generateQRCode': 'generateQRCode',
		'post /verifyOTP': 'verifyOTP',
		'post /enableTwoFactor': 'enableTwoFactor',
		'post /disableTwoFactor': 'disableTwoFactor'

	});

	router.map(accountsModule.internal, {
		'get /count': 'count'
	});

	if (process.env.DEBUG && process.env.DEBUG.toUpperCase() === 'TRUE') {
		router.map(accountsModule.internal, {'get /getAllAccounts': 'getAllAccounts'});
	}

	if (process.env.TOP && process.env.TOP.toUpperCase() === 'TRUE') {
		router.get('/top', httpApi.middleware.sanitize('query', schema.top, accountsModule.internal.top));
	}
	app.use('/api/accounts/getBalance', tokenValidator);
	app.use('/api/accounts/logout', tokenValidator);
	httpApi.registerEndpoint('/api/accounts', app, router, accountsModule.isLoaded);
	
}

module.exports = AccountsHttpApi;

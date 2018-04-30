/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading wasm modules
/******/ 	var installedWasmModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// object with all compiled WebAssembly.Modules
/******/ 	__webpack_require__.w = {};
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/nationalrail_delay.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/creds.js":
/*!**********************!*\
  !*** ./src/creds.js ***!
  \**********************/
/*! exports provided: DARWIN_TOKEN */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"DARWIN_TOKEN\", function() { return DARWIN_TOKEN; });\nconst DARWIN_TOKEN = '5b940e96-2044-4f0e-a6c3-c697e04809d4';\n\n//# sourceURL=webpack:///./src/creds.js?");

/***/ }),

/***/ "./src/nationalrail_delay.js":
/*!***********************************!*\
  !*** ./src/nationalrail_delay.js ***!
  \***********************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! express */ \"express\");\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(express__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var cors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! cors */ \"cors\");\n/* harmony import */ var cors__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(cors__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var body_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! body-parser */ \"body-parser\");\n/* harmony import */ var body_parser__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(body_parser__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\nconst app = express__WEBPACK_IMPORTED_MODULE_0___default()();\nconst Joi = __webpack_require__(/*! joi */ \"joi\");\nconst soap = __webpack_require__(/*! soap */ \"soap\");\n\nconst creds = __webpack_require__(/*! ./creds */ \"./src/creds.js\");\n\nlet database;\nlet MongoClient = __webpack_require__(/*! mongodb */ \"mongodb\").MongoClient;\nlet ObjectID = __webpack_require__(/*! mongodb */ \"mongodb\").ObjectID;\nlet url = 'mongodb://localhost:27017/';\n\n/*let crsDB = {\n  PTR: 'Petersfield',\n  WAT: 'London Waterloo'\n};*/\n\nconst DelaySchema = Joi.object({\n  departureDetails: Joi.object({\n    crs: Joi.string().min(3).max(3).required(),\n    fullName: Joi.string().min(3).max(20).required(),\n    scheduledTimestamp: Joi.string().min(10).max(24).required(),\n    actualTimestamp: Joi.string().min(10).max(24).required()\n  }).required(),\n  arrivalDetails: Joi.object({\n    crs: Joi.string().min(3).max(3).required(),\n    fullName: Joi.string().min(3).max(20).required(),\n    scheduledTimestamp: Joi.string().min(10).max(24).required(),\n    actualTimestamp: Joi.string().min(10).max(24).required()\n  }).required(),\n  trainId: Joi.string().min(3).max(20).required(),\n  delayInSeconds: Joi.number().integer().positive().required(),\n  delayDate: Joi.string().min(2).max(20).required()\n});\n\n/*let sampleDelay = {\n  departureDetails: {\n    crs: 'PTR',\n    fullName: 'Petersfield',\n    scheduledTimestamp: '2018-03-02T06:48:00.000Z',\n    actualTimestamp: '2018-03-02T06:59:00.000Z'\n  },\n  arrivalDetails: {\n    crs: 'WAT',\n    fullName: 'Waterloo',\n    scheduledTimestamp: '2018-03-02T07:54:00.000Z',\n    actualTimestamp: '2018-03-02T08:59:00.000Z'\n  },\n  trainId: 'SW815900',\n  delayInSeconds: '65',\n  delayDate: '2018-02-03',\n};*/\n\nMongoClient.connect(url, (err, db) => {\n  if (err) throw err;\n  database = db.db('delaydb');\n  database.createCollection('delays', (err, res) => {\n    if (err) throw err;\n    console.log('Collection created!');\n  });\n});\n\n/*\nlet wsdlOptions = {\n    ignoredNamespaces: {\n    namespaces: ['targetNamespace', 'typedNamespace'],\n    override: true\n  },\n overrideRootElement: {\n    namespace: 'tns',\n    xmlnsAttributes: [{\n      name: 'xmlns:ns1',\n      value: 'http://thalesgroup.com/RTTI/2014-02-20/ldb/'\n    }, {\n      name: 'xmlns:ns2',\n      value: 'http://thalesgroup.com/RTTI/2010-11-01/ldb/commontypes'\n    }]\n  }\n};*/\n\nlet wsdl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2017-10-01';\n\nlet soapHeader = { AccessToken: { TokenValue: creds.DARWIN_TOKEN } };\n\nfunction monitorDepartures(fromStation, toStation) {\n  let argsDepartures = {\n    numRows: '10',\n    crs: fromStation\n  };\n\n  console.log('monitorDepartures');\n\n  if (toStation !== undefined) {\n    argsDepartures.filterCrs = toStation;\n    argsDepartures.filterType = 'to';\n  }\n\n  // Get Departures\n  soap.createClient(wsdl, (err, client) => {\n    //    setInterval(soap.createClient, 60000, wsdl, function(err, client) {\n    client.addSoapHeader(soapHeader);\n    client.GetDepartureBoard(argsDepartures, (err, result) => {\n      console.log('result ', result);\n      console.log('result.GetStationBoardResult ', result.GetStationBoardResult);\n      console.log('last request: ', client.lastRequest);\n\n      if (result.GetStationBoardResult.trainServices !== undefined) {\n        console.log('result.GetStationBoardResult.trainServices !== undefined ');\n        for (let i = 0, len = result.GetStationBoardResult.trainServices.service.length; i < len; i++) {\n          let generatedDate = result.GetStationBoardResult.generatedAt.toISOString().slice(0, 10);\n          let stdTimestamp = generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].std);\n          let etdTimestamp;\n          if (result.GetStationBoardResult.trainServices.service[i].etd === 'On time') {\n            etdTimestamp = stdTimestamp;\n          } else {\n            etdTimestamp = generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].etd);\n          }\n\n          let serviceDetails = {\n            departureDetails: {\n              crs: result.GetStationBoardResult.crs,\n              fullName: result.GetStationBoardResult.locationName,\n              scheduledTimestamp: new Date(stdTimestamp),\n              actualTimestamp: new Date(etdTimestamp)\n            },\n            trainId: result.GetStationBoardResult.trainServices.service[i].rsid,\n            delayDate: String(result.GetStationBoardResult.generatedAt).slice(0, 10)\n          };\n\n          insertDeparture(serviceDetails, (err, result) => {});\n        }\n      }\n    });\n  });\n}\n\nfunction monitorArrivals(fromStation, toStation) {\n  console.log('monitorArrivals');\n  let argsArrivals = {\n    numRows: '10',\n    crs: toStation\n  };\n\n  if (fromStation !== undefined) {\n    argsArrivals.filterCrs = fromStation;\n    argsArrivals.filterType = 'from';\n  }\n\n  // Get Arrivals\n  soap.createClient(wsdl, (err, client) => {\n    //    setInterval(soap.createClient, 60000, wsdl, function(err, client) {\n    client.addSoapHeader(soapHeader);\n    client.GetArrivalBoard(argsArrivals, (err, result) => {\n      console.log('result ', result);\n      console.log('result.GetStationBoardResult ', result.GetStationBoardResult);\n      console.log('last request: ', client.lastRequest);\n\n      if (result.GetStationBoardResult.trainServices !== undefined) {\n        console.log('result.GetStationBoardResult.trainServices !== undefined ');\n        for (let i = 0, len = result.GetStationBoardResult.trainServices.service.length; i < len; i++) {\n          let generatedDate = result.GetStationBoardResult.generatedAt.toISOString().slice(0, 10);\n          let staTimestamp = generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].sta);\n\n          let etaTimestamp;\n          if (result.GetStationBoardResult.trainServices.service[i].eta === 'On time') {\n            etaTimestamp = staTimestamp;\n          } else {\n            etaTimestamp = generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].eta);\n          }\n\n          let serviceDetails = {\n            arrivalDetails: {\n              crs: result.GetStationBoardResult.crs,\n              fullName: result.GetStationBoardResult.locationName,\n              scheduledTimestamp: new Date(staTimestamp),\n              actualTimestamp: new Date(etaTimestamp)\n            },\n            trainId: result.GetStationBoardResult.trainServices.service[i].rsid,\n            delayDate: String(result.GetStationBoardResult.generatedAt).slice(0, 10)\n          };\n\n          insertArrival(serviceDetails, (err, result) => {});\n        }\n      }\n    });\n  });\n}\n\nsetInterval(() => {\n  monitorArrivals('PTR', 'WAT');monitorDepartures('PTR', 'WAT');\n}, 60000);\n\nfunction findDelay(delayDetails, callBack) {\n  console.log('findDelay');\n\n  database.collection('delays').findOne({ 'departureDetails.scheduledTimestamp': new Date(delayDetails.departureDetails.scheduledTimestamp) }, (err, results) => {\n    if (err) {\n      console.log('Error findOne');\n      callBack({ ErrorMsg: 'Something bad happened' });\n    } else {\n      console.log(results);\n      if (results) {\n        callBack(results);\n      } else {\n        console.log('Not found');\n        callBack({ ErrorMsg: 'Could not find it' });\n      }\n    }\n  });\n};\n\n/*function sleep(ms) {\n  return new Promise(resolve => setTimeout(resolve, ms));\n}*/\n\nfunction insertArrival(delayDetails, callBack) {\n  console.log('insertArrival');\n\n  let localDelayDetails = {\n    arrivalDetails: {\n      crs: delayDetails.arrivalDetails.crs,\n      fullName: delayDetails.arrivalDetails.fullName,\n      scheduledTimestamp: new Date(delayDetails.arrivalDetails.scheduledTimestamp),\n      actualTimestamp: new Date(delayDetails.arrivalDetails.actualTimestamp)\n    },\n    trainId: delayDetails.trainId,\n    delayDate: delayDetails.delayDate\n  };\n\n  let timeDiff = Math.abs(localDelayDetails.arrivalDetails.actualTimestamp.getTime() - localDelayDetails.arrivalDetails.scheduledTimestamp.getTime());\n  let diffSecs = Math.ceil(timeDiff / 1000);\n\n  localDelayDetails.delayInSeconds = diffSecs;\n\n  database.collection('delays').findOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, (err, results) => {\n    if (err) {\n      console.log('Error: ', err);\n      return callBack(-1);\n    } else {\n      if (!results) {\n        console.log('ARRIVAL Adding to DB: ', localDelayDetails.trainId);\n        database.collection('delays').save(localDelayDetails, async (err, results) => {\n          if (err) {\n            console.log('Error: ', err);\n            return callBack(-1);\n          }\n\n          return callBack(1);\n        });\n      } else {\n        console.log('ARRIVAL Already present in DB Updating: ', localDelayDetails.trainId);\n        console.log(results);\n\n        database.collection('delays').updateOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, { $set: localDelayDetails }, (err, results) => {\n          if (err) {\n            console.log('Error: ', err);\n            return callBack(-1);\n          }\n\n          return callBack(0);\n        });\n      }\n    }\n  });\n}\n\nfunction insertDelay(delayDetails, callBack) {\n  console.log('insertDelay');\n\n  let localDelayDetails = {\n    departureDetails: {\n      crs: delayDetails.departureDetails.crs,\n      fullName: delayDetails.departureDetails.fullName,\n      scheduledTimestamp: new Date(delayDetails.departureDetails.scheduledTimestamp),\n      actualTimestamp: new Date(delayDetails.departureDetails.actualTimestamp)\n    },\n    arrivalDetails: {\n      crs: delayDetails.arrivalDetails.crs,\n      fullName: delayDetails.arrivalDetails.fullName,\n      scheduledTimestamp: new Date(delayDetails.arrivalDetails.scheduledTimestamp),\n      actualTimestamp: new Date(delayDetails.arrivalDetails.actualTimestamp)\n    },\n    trainId: delayDetails.trainId,\n    delayDate: delayDetails.delayDate\n  };\n\n  database.collection('delays').findOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, (err, results) => {\n    if (err) {\n      console.log('Error: ', err);\n      return callBack(-1);\n    } else {\n      if (!results) {\n        console.log('Adding to DB: ', localDelayDetails.trainId);\n        database.collection('delays').save(localDelayDetails, async (err, results) => {\n          if (err) {\n            console.log('Error: ', err);\n            return callBack(-1);\n          }\n\n          return callBack(1);\n        });\n      } else {\n        console.log('Already present in DB Updating: ', localDelayDetails.trainId);\n        console.log(localDelayDetails);\n        database.collection('delays').updateOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, { $set: localDelayDetails }, (err, results) => {\n          if (err) {\n            console.log('Error: ', err);\n            return callBack(-1);\n          }\n\n          return callBack(0);\n        });\n      }\n    }\n  });\n}\n\nfunction insertDeparture(delayDetails, callBack) {\n  console.log('insertDeparture');\n\n  let localDelayDetails = {\n    departureDetails: {\n      crs: delayDetails.departureDetails.crs,\n      fullName: delayDetails.departureDetails.fullName,\n      scheduledTimestamp: new Date(delayDetails.departureDetails.scheduledTimestamp),\n      actualTimestamp: new Date(delayDetails.departureDetails.actualTimestamp)\n    },\n    trainId: delayDetails.trainId,\n    delayDate: delayDetails.delayDate\n  };\n\n  database.collection('delays').findOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, (err, results) => {\n    if (err) {\n      console.log('Error: ', err);\n      return callBack(-1);\n    } else {\n      //      console.log(results);\n      if (!results) {\n        console.log('DEPARTURE Adding to DB: ', localDelayDetails.trainId);\n        database.collection('delays').save(localDelayDetails, async (err, results) => {\n          if (err) {\n            console.log('Error: ', err);\n            return callBack(-1);\n          }\n\n          return callBack(1);\n        });\n      } else {\n        console.log('DEPARTURE Already present in DB Updating: ', localDelayDetails.trainId);\n        database.collection('delays').updateOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, { $set: localDelayDetails }, (err, results) => {\n          if (err) {\n            console.log('Error: ', err);\n            return callBack(-1);\n          }\n\n          return callBack(0);\n        });\n      }\n    }\n  });\n}\n\n/**************************************************************************************/\n// APIs\n/**************************************************************************************/\n//app.use(bodyParser.urlencoded({extended: true}))\napp.use(cors__WEBPACK_IMPORTED_MODULE_1___default()());\napp.use(body_parser__WEBPACK_IMPORTED_MODULE_2___default.a.json());\n\napp.use((err, req, res, next) => {\n  let responseData;\n  //    console.log(\"Adding access control headers\");\n  //    res.header(\"Access-Control-Allow-Origin\", \"*\");\n  //    res.header(\"Access-Control-Allow-Headers\", \"Origin, X-Requested-With, Content-Type, Accept\");\n  //    cors();\n\n  if (err.name === 'JsonSchemaValidation') {\n    // Log the error however you please\n    console.log(err.message);\n    // logs \"express-jsonschema: Invalid data found\"\n\n    // Set a bad request http response status or whatever you want\n    res.status(400);\n\n    // Format the response body however you want\n    responseData = {\n      statusText: 'Bad Request',\n      jsonSchemaValidation: true,\n      validations: err.validations // All of your validation information\n    };\n\n    res.json(responseData);\n  } else {\n    // pass error to next error middleware handler\n    next(err);\n  }\n});\n\napp.post('/delays', (req, res) => {\n  console.log('POST request');\n\n  const ret = Joi.validate(req.body, DelaySchema, {\n    // return an error if body has an unrecognised property\n    allowUnknown: false,\n    // return all errors a payload contains, not just the first one Joi finds\n    abortEarly: false\n  });\n\n  if (ret.error) {\n    res.status(400).end(ret.error.toString());\n  } else {\n    insertDelay(req.body, insertResult => {\n      console.log('Here');\n      if (insertResult === 1) {\n        console.log('Returning 201');\n        findDelay(req.body, findResult => {\n          res.status(201).json(findResult);\n        });\n      } else if (insertResult === 0) {\n        console.log('Returning 200');\n        res.status(200).json({ Msg: 'Already present in DB, updated.' });\n      } else {\n        console.log('Returning 500');\n        res.status(500).json({ ErrorMsg: 'Something bad happend' });\n      }\n    });\n  }\n});\n\napp.delete('/delays/:id', (req, res) => {\n  console.log('DELETE request');\n  console.log(req.params.id);\n\n  database.collection('delays').remove({ _id: new ObjectID(req.params.id) }, (err, results) => {\n    if (err) {\n      console.log('Error: ', err);\n      res.status(500).json({ ErrorMsg: 'Something bad happend' });\n    } else {\n      if (results.result.n === 0) {\n        res.status(404).json({ ErrorMsg: \"Couldn't find resource\" });\n      } else {\n        console.log('Delete: Success');\n        console.log(results.result);\n        res.status(204);\n        res.send();\n      }\n    }\n  });\n});\n\napp.delete('/delays', (req, res) => {\n  console.log('DELETE request');\n\n  database.collection('delays').remove({}, (err, results) => {\n    if (err) {\n      console.log('Error: ', err);\n      res.status(500).json({ ErrorMsg: 'Something bad happend' });\n    } else {\n      if (results.result.n === 0) {\n        res.status(404).json({ ErrorMsg: \"Couldn't find resource\" });\n      } else {\n        console.log('Delete: Success');\n        console.log(results.result);\n        res.status(204);\n        res.send();\n      }\n    }\n  });\n});\n\napp.get('/delays', (req, res) => {\n  console.log('GET: /delays');\n\n  let queryArgs = {};\n\n  if (req.query.delayed !== undefined) {\n    queryArgs.delayInSeconds = { gt: 0 };\n  }\n\n  database.collection('delays').find(queryArgs).toArray((err, results) => {\n    if (err) {\n      console.log('Error: ', err);\n      res.status(404).json({ ErrorMsg: 'Something bad happend' });\n    } else {\n      console.log('GET: Success');\n      res.status(200).json(results);\n    }\n  });\n});\n\napp.get('/delays/:fromDate', (req, res) => {\n  console.log('GET fromDate request');\n  console.log(req.params);\n  console.log(req.query);\n\n  let fromDateSplits = req.params.fromDate.split('-');\n  let fromDate = new Date(fromDateSplits[0], fromDateSplits[1] - 1, fromDateSplits[2]);\n\n  let toDate = new Date(fromDate.getFullYear() + 1, fromDateSplits[1] - 1, fromDateSplits[2]);\n\n  let queryArgs = {\n    'departureDetails.scheduledTimestamp': { $gte: fromDate, $lte: toDate }\n  };\n\n  if (req.query.delayed !== undefined) {\n    queryArgs.delayInSeconds = { gt: 0 };\n  }\n\n  console.log(queryArgs);\n\n  database.collection('delays').find(queryArgs).toArray((err, results) => {\n    if (err) {\n      console.log('Error: ', err);\n      res.status(500).json({ ErrorMsg: 'Something bad happend' });\n    } else {\n      console.log('Found: Success');\n      res.status(200).json(results);\n    }\n  });\n});\n\napp.get('/delays/:fromDate/:toDate', (req, res) => {\n  console.log('GET fromDate toDate request');\n  console.log(req.params);\n  console.log(req.query);\n\n  let fromDateSplits = req.params.fromDate.split('-');\n  let fromDate = new Date(fromDateSplits[0], fromDateSplits[1] - 1, fromDateSplits[2]);\n\n  let toDateSplits = req.params.toDate.split('-');\n  let toDate = new Date(toDateSplits[0], toDateSplits[1] - 1, toDateSplits[2]);\n\n  let queryArgs = {\n    'departureDetails.scheduledTimestamp': { $gte: fromDate, $lte: toDate }\n  };\n\n  if (req.query.delayed !== undefined) {\n    queryArgs.delayInSeconds = { gt: 0 };\n  }\n\n  console.log(queryArgs);\n\n  database.collection('delays').find(queryArgs).toArray((err, results) => {\n    if (err) {\n      console.log('Error: ', err);\n      res.status(500).json({ ErrorMsg: 'Something bad happend' });\n    } else {\n      console.log('Found: Success');\n      res.status(200).json(results);\n    }\n  });\n});\n\napp.get('/trains/:from', (req, res) => {\n  console.log('GET: /trains/:from');\n\n  // Get the departures from the \"from\" station and add / update the data in the DB\n  // Get the arrivals in the \"to\" station and add (must add since might have missed the original but its still late on arrival) / update the fdata in the DB\n  // Update the DB delay calcs based on departure and arrival data\n\n\n  console.log(req.params);\n  console.log(req.query);\n\n  monitorArrivals(req.params.from);\n  monitorDepartures(req.params.from);\n\n  res.status(200).json({});\n});\n\napp.get('/trains/:from/:to', (req, res) => {\n  console.log('GET: /trains/:from/:to');\n\n  // Get the departures from the \"from\" station and add / update the data in the DB\n  // Get the arrivals in the \"to\" station and add (must add since might have missed the original but its still late on arrival) / update the fdata in the DB\n  // Update the DB delay calcs based on departure and arrival data\n\n\n  console.log(req.params);\n  monitorArrivals(req.params.from, req.params.to);\n  monitorDepartures(req.params.from, req.params.to);\n  res.status(200).json({});\n});\n\napp.listen(3000, () => {\n  console.log('listening on 3000');\n});\n\n//# sourceURL=webpack:///./src/nationalrail_delay.js?");

/***/ }),

/***/ "body-parser":
/*!******************************!*\
  !*** external "body-parser" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"body-parser\");\n\n//# sourceURL=webpack:///external_%22body-parser%22?");

/***/ }),

/***/ "cors":
/*!***********************!*\
  !*** external "cors" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"cors\");\n\n//# sourceURL=webpack:///external_%22cors%22?");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"express\");\n\n//# sourceURL=webpack:///external_%22express%22?");

/***/ }),

/***/ "joi":
/*!**********************!*\
  !*** external "joi" ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"joi\");\n\n//# sourceURL=webpack:///external_%22joi%22?");

/***/ }),

/***/ "mongodb":
/*!**************************!*\
  !*** external "mongodb" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"mongodb\");\n\n//# sourceURL=webpack:///external_%22mongodb%22?");

/***/ }),

/***/ "soap":
/*!***********************!*\
  !*** external "soap" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"soap\");\n\n//# sourceURL=webpack:///external_%22soap%22?");

/***/ })

/******/ });
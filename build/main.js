/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
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
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
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
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/nationalraildelay.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/nationalraildelay.js":
/*!**********************************!*\
  !*** ./src/nationalraildelay.js ***!
  \**********************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! express */ \"express\");\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(express__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var cors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! cors */ \"cors\");\n/* harmony import */ var cors__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(cors__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var body_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! body-parser */ \"body-parser\");\n/* harmony import */ var body_parser__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(body_parser__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\nconst app = express__WEBPACK_IMPORTED_MODULE_0___default()();\nconst Joi = __webpack_require__(/*! joi */ \"joi\");\n\nlet AWS = __webpack_require__(/*! aws-sdk */ \"aws-sdk\");\nlet table = 'delays';\n\n/**********************************************************/\n\n/*let crsDB = {\n  PTR: 'Petersfield',\n  WAT: 'London Waterloo'\n};*/\n\nconst DelaySchema = Joi.object({\n  departureDetails: Joi.object({\n    crs: Joi.string().min(3).max(3).required(),\n    fullName: Joi.string().min(3).max(20).required(),\n    scheduledTimestamp: Joi.string().min(10).max(24).required(),\n    actualTimestamp: Joi.string().min(10).max(24).required()\n  }).required(),\n  arrivalDetails: Joi.object({\n    crs: Joi.string().min(3).max(3).required(),\n    fullName: Joi.string().min(3).max(20).required(),\n    scheduledTimestamp: Joi.string().min(10).max(24).required(),\n    actualTimestamp: Joi.string().min(10).max(24).required()\n  }).required(),\n  trainId: Joi.string().min(3).max(20).required(),\n  delayInSeconds: Joi.number().integer().positive().required(),\n  delayDate: Joi.string().min(2).max(20).required()\n});\n\n/*let sampleDelay = {\n  departureDetails: {\n    crs: 'PTR',\n    fullName: 'Petersfield',\n    scheduledTimestamp: '2018-03-02T06:48:00.000Z',\n    actualTimestamp: '2018-03-02T06:59:00.000Z'\n  },\n  arrivalDetails: {\n    crs: 'WAT',\n    fullName: 'Waterloo',\n    scheduledTimestamp: '2018-03-02T07:54:00.000Z',\n    actualTimestamp: '2018-03-02T08:59:00.000Z'\n  },\n  trainId: 'SW815900',\n  delayInSeconds: '65',\n  delayDate: '2018-02-03',\n};*/\n/*\nMongoClient.connect(url, (err, db) => {\n  if (err) throw err;\n  database = db.db('delaydb');\n  database.createCollection('delays', (err, res) => {\n    if (err) throw err;\n    console.log('Collection created!');\n  });\n});\n*/\n\nfunction findDelay(delayDetails) {\n  console.log('findDelay');\n\n  let dbQueryParams = {\n    ':t': delayDetails.trainId,\n    ':d': delayDetails.delayDate\n  };\n\n  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);\n\n  let paramsQuery = {\n    TableName: table,\n    ExpressionAttributeValues: marshalledQueryParams,\n    KeyConditionExpression: 'delayDate = :d and trainId = :t',\n    ProjectionExpression: 'arrivalDetails, departureDetails, delayInSeconds, trainId, delayDate'\n  };\n\n  let promiseQuery = dbClient.query(paramsQuery).promise();\n  return promiseQuery.then(data => {\n    if (data.Count !== 0) {\n      console.log('Found: ', data);\n      return { found: true, dbData: processDBData(data)[0] };\n    } else {\n      console.log('Not found');\n      return { found: false, ErrorMsg: 'Could not find it' };\n    }\n  }).catch(err => {\n    console.log('Error findOne');\n    return { found: false, ErrorMsg: err };\n  });\n};\n\nfunction deleteSingleItem(table, delayDate, trainId) {\n  console.log('deleteSingleItem');\n\n  let paramsQuery = {\n    TableName: table\n  };\n  let dbQueryParams = {\n    trainId,\n    delayDate\n  };\n\n  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);\n  paramsQuery.Key = marshalledQueryParams;\n  return dbClient.deleteItem(paramsQuery).promise();\n};\n\n/*function sleep(ms) {\n  return new Promise(resolve => setTimeout(resolve, ms));\n}*/\n\nfunction insertDelay(delayDetails) {\n  console.log('insertDelay');\n  let localDelayDetails = {\n    departureDetails: {\n      crs: delayDetails.departureDetails.crs,\n      fullName: delayDetails.departureDetails.fullName,\n      scheduledTimestamp: delayDetails.departureDetails.scheduledTimestamp,\n      actualTimestamp: delayDetails.departureDetails.actualTimestamp\n    },\n    arrivalDetails: {\n      crs: delayDetails.arrivalDetails.crs,\n      fullName: delayDetails.arrivalDetails.fullName,\n      scheduledTimestamp: delayDetails.arrivalDetails.scheduledTimestamp,\n      actualTimestamp: delayDetails.arrivalDetails.actualTimestamp\n    },\n    trainId: delayDetails.trainId,\n    delayDate: delayDetails.delayDate,\n    delayInSeconds: delayDetails.delayInSeconds\n  };\n\n  let dbQueryParams = {\n    ':t': delayDetails.trainId,\n    ':d': localDelayDetails.delayDate\n  };\n\n  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);\n\n  let paramsQuery = {\n    TableName: table,\n    ExpressionAttributeValues: marshalledQueryParams,\n    KeyConditionExpression: 'delayDate = :d and trainId = :t',\n    ProjectionExpression: 'arrivalDetails, departureDetails, delayInSeconds, trainId, delayDate'\n  };\n\n  let promiseQuery = dbClient.query(paramsQuery).promise();\n\n  return promiseQuery.then(data => {\n    let marshalledAddDelay = AWS.DynamoDB.Converter.marshall(localDelayDetails);\n    let paramsAdd = {\n      TableName: table,\n      Item: marshalledAddDelay\n    };\n\n    if (data.Count === 0) {\n      let promiseAdd = dbClient.putItem(paramsAdd).promise();\n      return promiseAdd.then(data => {\n        console.log('PutItem succeeded:');\n        return { code: 201 };\n      }).catch(err => {\n        console.error('Unable to putItem. Error JSON:', err);\n        return { code: 500, dbData: err };\n      });\n    } else {\n      let updateParams = {\n        ':arrivalFullName': localDelayDetails.arrivalDetails.fullName,\n        ':arrivalCrs': localDelayDetails.arrivalDetails.crs,\n        ':arrivalActualTimestamp': localDelayDetails.arrivalDetails.actualTimestamp,\n        ':arrivalScheduledTimestamp': localDelayDetails.arrivalDetails.scheduledTimestamp,\n        ':departureFullName': localDelayDetails.departureDetails.fullName,\n        ':departureCrs': localDelayDetails.departureDetails.crs,\n        ':departureActualTimestamp': localDelayDetails.departureDetails.actualTimestamp,\n        ':departureScheduledTimestamp': localDelayDetails.departureDetails.scheduledTimestamp,\n        ':delayInSeconds': localDelayDetails.delayInSeconds\n      };\n      let marshalledUpdateDelay = AWS.DynamoDB.Converter.marshall(updateParams);\n\n      let key = {\n        delayDate: localDelayDetails.delayDate,\n        trainId: delayDetails.trainId\n      };\n      let marshalledUpdateKey = AWS.DynamoDB.Converter.marshall(key);\n      let paramsUpdate = {\n        TableName: table,\n        Key: marshalledUpdateKey,\n        UpdateExpression: 'set arrivalDetails.crs = :arrivalCrs, arrivalDetails.fullName = :arrivalFullName, arrivalDetails.scheduledTimestamp = :arrivalScheduledTimestamp, arrivalDetails.actualTimestamp = :arrivalActualTimestamp, departureDetails.crs = :departureCrs, departureDetails.fullName = :departureFullName, departureDetails.scheduledTimestamp = :departureScheduledTimestamp, departureDetails.actualTimestamp = :departureActualTimestamp, delayInSeconds = :delayInSeconds',\n        ExpressionAttributeValues: marshalledUpdateDelay,\n        ReturnValues: 'UPDATED_NEW'\n      };\n\n      let promiseUpdate = dbClient.updateItem(paramsUpdate).promise();\n      return promiseUpdate.then(data => {\n        console.log('Update succeeded');\n        let dbData = AWS.DynamoDB.Converter.unmarshall(data.Attributes);\n        dbData.delayDate = localDelayDetails.delayDate;\n        dbData.trainId = delayDetails.trainId;\n        return { code: 200, dbData };\n      }).catch(err => {\n        console.error('Unable to update. Error JSON:', err);\n        return { code: 500, dbError: err };\n      });\n    }\n  }).catch(err => {\n    console.error('Unable to read item. Error JSON:', err);\n    return { code: 500, dbError: err };\n  });\n};\n\n/**************************************************************************************/\n// APIs\n/**************************************************************************************/\n//app.use(bodyParser.urlencoded({extended: true}))\napp.use(cors__WEBPACK_IMPORTED_MODULE_1___default()());\napp.use(body_parser__WEBPACK_IMPORTED_MODULE_2___default.a.json());\n\napp.use((err, req, res, next) => {\n  let responseData;\n  //    console.log(\"Adding access control headers\");\n  //    res.header(\"Access-Control-Allow-Origin\", \"*\");\n  //    res.header(\"Access-Control-Allow-Headers\", \"Origin, X-Requested-With, Content-Type, Accept\");\n  //    cors();\n\n  if (err.name === 'JsonSchemaValidation') {\n    // Log the error however you please\n    console.log(err.message);\n    // logs \"express-jsonschema: Invalid data found\"\n\n    // Set a bad request http response status or whatever you want\n    res.status(400);\n\n    // Format the response body however you want\n    responseData = {\n      statusText: 'Bad Request',\n      jsonSchemaValidation: true,\n      validations: err.validations // All of your validation information\n    };\n\n    res.json(responseData);\n  } else {\n    // pass error to next error middleware handler\n    next(err);\n  }\n});\n\napp.post('/delays', (req, res) => {\n  console.log('POST request');\n\n  const ret = Joi.validate(req.body, DelaySchema, {\n    // return an error if body has an unrecognised property\n    allowUnknown: false,\n    // return all errors a payload contains, not just the first one Joi finds\n    abortEarly: false\n  });\n\n  if (ret.error) {\n    res.status(400).end(ret.error.toString());\n  } else {\n    insertDelay(req.body).then(insertResult => {\n      console.log('insertResult: ', insertResult);\n      if (insertResult.code === 201) {\n        console.log('Returning 201');\n        findDelay(req.body).then(findResult => {\n          if (findResult.found === true) {\n            res.status(201).json(findResult.dbData);\n          } else {\n            res.status(500).json(findResult.ErrorMsg);\n          };\n        }).catch(err => {\n          res.status(500).json({ ErrorMsg: 'Something bad happened', dbError: err });\n        });\n      } else if (insertResult.code === 200) {\n        console.log('Returning 200');\n        res.status(200).json({ Msg: 'Already present in DB, updated.', dbEntry: insertResult.dbData });\n      } else {\n        console.log('Returning 500');\n        res.status(500).json({ ErrorMsg: 'Something bad happened', dbError: insertResult.dbError });\n      }\n    });\n  }\n});\n\napp.delete('/delays/:delayDate/:trainId', (req, res) => {\n  console.log('DELETE request');\n\n  let paramsQuery = {\n    TableName: table\n  };\n  let dbQueryParams = {\n    trainId: req.params.trainId,\n    delayDate: req.params.delayDate\n  };\n  //  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);\n  //  paramsQuery.Key = marshalledQueryParams;\n  //  let promiseQuery = dbClient.deleteItem(paramsQuery).promise();\n  console.log(dbQueryParams);\n  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);\n  paramsQuery.Key = marshalledQueryParams;\n  console.log(paramsQuery);\n  let promiseQuery = dbClient.deleteItem(paramsQuery).promise();\n\n  promiseQuery.then(data => {\n    console.log('GET: Success');\n    res.status(204).send();\n  }).catch(err => {\n    console.log('Error: ', err);\n    res.status(404).json({ ErrorMsg: 'Something bad happened' });\n  });\n});\n\napp.delete('/delays', (req, res) => {\n  console.log('DELETE request');\n\n  let paramsQuery = {\n    TableName: table\n  };\n\n  let promiseQuery = dbClient.scan(paramsQuery).promise();\n  promiseQuery.then(data => {\n    let unmarshalledData = processDBData(data);\n    let promises = [];\n    for (let i = 0; i < data.Count; i++) {\n      promises.push(deleteSingleItem('delays', unmarshalledData[i].delayDate, unmarshalledData[i].trainId));\n    }\n\n    Promise.all(promises).then(results => {\n      res.status(204).send();\n    }).catch(err => {\n      console.log('Error: ', err);\n      res.status(500).json({ ErrorMsg: 'Something bad happened' }).send();\n    });\n  }).catch(err => {\n    console.log('Error: ', err);\n    res.status(500).json({ ErrorMsg: 'Something bad happened' });\n  });\n});\n\napp.get('/delays', (req, res) => {\n  console.log('GET: /delays');\n\n  let paramsQuery = {\n    TableName: table\n  };\n\n  if (req.query.delayed !== undefined) {\n    let dbQueryParams = {\n      ':s': '0'\n    };\n    let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);\n    paramsQuery.ExpressionAttributeValues = marshalledQueryParams;\n\n    if (req.query.delayed.trim() === 'true') {\n      paramsQuery.FilterExpression = 'delayInSeconds > :s';\n    } else {\n      paramsQuery.FilterExpression = 'delayInSeconds = :s';\n    }\n  }\n\n  let promiseQuery = dbClient.scan(paramsQuery).promise();\n\n  console.log('query string: ', req.query.delayed);\n  console.log('app.get /delays params: ', paramsQuery);\n  promiseQuery.then(data => {\n    console.log('GET: Success');\n    console.log('GET: ', data);\n    res.status(200).json(processDBData(data));\n  }).catch(err => {\n    console.log('Error: ', err);\n    res.status(404).json({ ErrorMsg: 'Something bad happened' });\n  });\n});\n\napp.get('/delays/:fromDate', (req, res) => {\n  console.log('GET fromDate request');\n  console.log(req.params);\n  console.log(req.query);\n\n  let fromDateSplits = req.params.fromDate.split('-');\n  let fromDate = new Date(fromDateSplits[0], fromDateSplits[1] - 1, fromDateSplits[2]);\n\n  let toDate = new Date(fromDate.getFullYear() + 1, fromDateSplits[1] - 1, fromDateSplits[2]);\n\n  let paramsQuery = {\n    TableName: table\n  };\n\n  let dbQueryParams = {\n    ':fromTimestamp': fromDate.toISOString(),\n    ':toTimestamp': toDate.toISOString()\n  };\n\n  console.log(dbQueryParams);\n\n  if (req.query.delayed !== undefined) {\n    dbQueryParams[':s'] = '0';\n\n    if (req.query.delayed.trim() === 'true') {\n      paramsQuery.FilterExpression = 'departureDetails.scheduledTimestamp > :fromTimestamp and departureDetails.scheduledTimestamp <= :toTimestamp and delayInSeconds > :s';\n    } else {\n      paramsQuery.FilterExpression = 'departureDetails.scheduledTimestamp > :fromTimestamp and departureDetails.scheduledTimestamp <= :toTimestamp and delayInSeconds = :s';\n    }\n  } else {\n    paramsQuery.FilterExpression = 'departureDetails.scheduledTimestamp > :fromTimestamp and departureDetails.scheduledTimestamp <= :toTimestamp';\n  }\n\n  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);\n  paramsQuery.ExpressionAttributeValues = marshalledQueryParams;\n\n  console.log('app.get: ', paramsQuery);\n\n  let promiseQuery = dbClient.scan(paramsQuery).promise();\n\n  promiseQuery.then(data => {\n    console.log('GET: Success');\n    console.log('GET: ', data.Items);\n    res.status(200).json(processDBData(data));\n  }).catch(err => {\n    console.log('Error: ', err);\n    res.status(404).json({ ErrorMsg: 'Something bad happened' });\n  });\n});\n\nfunction processDBData(data) {\n  let result = [];\n  for (let i = 0, len = data.Items.length; i < len; i++) {\n    result.push(AWS.DynamoDB.Converter.unmarshall(data.Items[i]));\n  }\n  return result;\n}\n\napp.get('/delays/:fromDate/:toDate', (req, res) => {\n  console.log('GET fromDate toDate request');\n  console.log(req.params);\n  console.log(req.query);\n\n  let fromDateSplits = req.params.fromDate.split('-');\n  let fromDate = new Date(fromDateSplits[0], fromDateSplits[1] - 1, fromDateSplits[2]);\n\n  let toDateSplits = req.params.toDate.split('-');\n  let toDate = new Date(toDateSplits[0], toDateSplits[1] - 1, toDateSplits[2]);\n\n  let paramsQuery = {\n    TableName: table\n  };\n\n  let dbQueryParams = {\n    ':fromTimestamp': fromDate.toISOString(),\n    ':toTimestamp': toDate.toISOString()\n  };\n\n  console.log(dbQueryParams);\n\n  if (req.query.delayed !== undefined) {\n    dbQueryParams[':s'] = '0';\n\n    if (req.query.delayed === true) {\n      paramsQuery.FilterExpression = 'departureDetails.scheduledTimestamp > :fromTimestamp and departureDetails.scheduledTimestamp <= :toTimestamp and delayInSeconds > :s';\n    } else {\n      paramsQuery.FilterExpression = 'departureDetails.scheduledTimestamp > :fromTimestamp and departureDetails.scheduledTimestamp <= :toTimestamp and delayInSeconds = :s';\n    }\n  } else {\n    paramsQuery.FilterExpression = 'departureDetails.scheduledTimestamp > :fromTimestamp and departureDetails.scheduledTimestamp <= :toTimestamp';\n  }\n\n  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);\n  paramsQuery.ExpressionAttributeValues = marshalledQueryParams;\n  paramsQuery.FilterExpression = 'departureDetails.scheduledTimestamp > :fromTimestamp and departureDetails.scheduledTimestamp <= :toTimestamp';\n\n  let promiseQuery = dbClient.scan(paramsQuery).promise();\n\n  promiseQuery.then(data => {\n    console.log('GET: Success');\n    res.status(200).json(processDBData(data));\n  }).catch(err => {\n    console.log('Error: ', err);\n    res.status(404).json({ ErrorMsg: 'Something bad happened' });\n  });\n});\n\n/**************************************************************************/\n/*AWS.config.update({\n  region: 'eu-west-2',\n  endpoint: 'http://localhost:8000'\n});*/\n\n//AWS.config.loadFromPath('./src/config.json');\nlet credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });\n//AWS.config.credentials = credentials;\nAWS.config.update({ region: 'us-east-1', credentials });\n\nlet dbClient = new AWS.DynamoDB();\n\nlet paramsQuery = {\n  TableName: table\n};\n\nlet port = process.env.PORT || 3000;\n\nconsole.log('Trying to connect to the table');\n\ndbClient.describeTable(paramsQuery, (err, data) => {\n  if (err) {\n    console.log('Can\\'t connect to the DynamoDB table.');\n    console.log(err, err.stack); // an error occurred\n    process.exit(1);\n  } else {\n    console.log('Connected to the DynamoDB instance');\n    console.log(data);\n    console.log(data.Table.KeySchema);\n    app.listen(port, () => {\n      console.log('listening on ', port);\n    });\n  }\n});\n\n//# sourceURL=webpack:///./src/nationalraildelay.js?");

/***/ }),

/***/ "aws-sdk":
/*!**************************!*\
  !*** external "aws-sdk" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"aws-sdk\");\n\n//# sourceURL=webpack:///external_%22aws-sdk%22?");

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

/***/ })

/******/ });
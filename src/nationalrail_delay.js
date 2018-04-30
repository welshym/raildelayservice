import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
const app = express();
const Joi = require('joi');
const soap = require('soap');

const creds = require('./creds');

let database;
let MongoClient = require('mongodb').MongoClient;
let ObjectID = require('mongodb').ObjectID;
let url = 'mongodb://localhost:27017/';

/*let crsDB = {
  PTR: 'Petersfield',
  WAT: 'London Waterloo'
};*/

const DelaySchema = Joi.object({
  departureDetails: Joi.object({
    crs: Joi.string().min(3).max(3).required(),
    fullName: Joi.string().min(3).max(20).required(),
    scheduledTimestamp: Joi.string().min(10).max(24).required(),
    actualTimestamp: Joi.string().min(10).max(24).required()
  }).required(),
  arrivalDetails: Joi.object({
    crs: Joi.string().min(3).max(3).required(),
    fullName: Joi.string().min(3).max(20).required(),
    scheduledTimestamp: Joi.string().min(10).max(24).required(),
    actualTimestamp: Joi.string().min(10).max(24).required()
  }).required(),
  trainId: Joi.string().min(3).max(20).required(),
  delayInSeconds: Joi.number().integer().positive().required(),
  delayDate: Joi.string().min(2).max(20).required()
});

/*let sampleDelay = {
  departureDetails: {
    crs: 'PTR',
    fullName: 'Petersfield',
    scheduledTimestamp: '2018-03-02T06:48:00.000Z',
    actualTimestamp: '2018-03-02T06:59:00.000Z'
  },
  arrivalDetails: {
    crs: 'WAT',
    fullName: 'Waterloo',
    scheduledTimestamp: '2018-03-02T07:54:00.000Z',
    actualTimestamp: '2018-03-02T08:59:00.000Z'
  },
  trainId: 'SW815900',
  delayInSeconds: '65',
  delayDate: '2018-02-03',
};*/

MongoClient.connect(url, (err, db) => {
  if (err) throw err;
  database = db.db('delaydb');
  database.createCollection('delays', (err, res) => {
    if (err) throw err;
    console.log('Collection created!');
  });
});

/*
let wsdlOptions = {
    ignoredNamespaces: {
    namespaces: ['targetNamespace', 'typedNamespace'],
    override: true
  },
 overrideRootElement: {
    namespace: 'tns',
    xmlnsAttributes: [{
      name: 'xmlns:ns1',
      value: 'http://thalesgroup.com/RTTI/2014-02-20/ldb/'
    }, {
      name: 'xmlns:ns2',
      value: 'http://thalesgroup.com/RTTI/2010-11-01/ldb/commontypes'
    }]
  }
};*/

let wsdl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2017-10-01';

let soapHeader = { AccessToken: { TokenValue: creds.DARWIN_TOKEN } };

function monitorDepartures(fromStation, toStation) {
  let argsDepartures = {
    numRows: '10',
    crs: fromStation
  };

  console.log('monitorDepartures');

  if (toStation !== undefined) {
    argsDepartures.filterCrs = toStation;
    argsDepartures.filterType = 'to';
  }

  // Get Departures
  soap.createClient(wsdl, (err, client) => {
    //    setInterval(soap.createClient, 60000, wsdl, function(err, client) {
    client.addSoapHeader(soapHeader);
    client.GetDepartureBoard(argsDepartures, (err, result) => {
      console.log('result ', result);
      console.log('result.GetStationBoardResult ', result.GetStationBoardResult);
      console.log('last request: ', client.lastRequest);

      if (result.GetStationBoardResult.trainServices !== undefined) {
        console.log('result.GetStationBoardResult.trainServices !== undefined ');
        for (let i = 0, len = result.GetStationBoardResult.trainServices.service.length; i < len; i++) {
          let generatedDate = result.GetStationBoardResult.generatedAt.toISOString().slice(0, 10);
          let stdTimestamp = generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].std);
          let etdTimestamp;
          if (result.GetStationBoardResult.trainServices.service[i].etd === 'On time') {
            etdTimestamp = stdTimestamp;
          } else {
            etdTimestamp = generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].etd);
          }

          let serviceDetails = {
            departureDetails: {
              crs: result.GetStationBoardResult.crs,
              fullName: result.GetStationBoardResult.locationName,
              scheduledTimestamp: new Date(stdTimestamp),
              actualTimestamp: new Date(etdTimestamp)
            },
            trainId: result.GetStationBoardResult.trainServices.service[i].rsid,
            delayDate: String(result.GetStationBoardResult.generatedAt).slice(0, 10),
          };

          insertDeparture(serviceDetails, (err, result) => {
          });
        }
      }
    });
  });
}


function monitorArrivals(fromStation, toStation) {
  console.log('monitorArrivals');
  let argsArrivals = {
    numRows: '10',
    crs: toStation,
  };

  if (fromStation !== undefined) {
    argsArrivals.filterCrs = fromStation;
    argsArrivals.filterType = 'from';
  }

  // Get Arrivals
  soap.createClient(wsdl, (err, client) => {
  //    setInterval(soap.createClient, 60000, wsdl, function(err, client) {
    client.addSoapHeader(soapHeader);
    client.GetArrivalBoard(argsArrivals, (err, result) => {
      console.log('result ', result);
      console.log('result.GetStationBoardResult ', result.GetStationBoardResult);
      console.log('last request: ', client.lastRequest);

      if (result.GetStationBoardResult.trainServices !== undefined) {
        console.log('result.GetStationBoardResult.trainServices !== undefined ');
        for (let i = 0, len = result.GetStationBoardResult.trainServices.service.length; i < len; i++) {
          let generatedDate = result.GetStationBoardResult.generatedAt.toISOString().slice(0, 10);
          let staTimestamp = generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].sta);

          let etaTimestamp;
          if (result.GetStationBoardResult.trainServices.service[i].eta === 'On time') {
            etaTimestamp = staTimestamp;
          } else {
            etaTimestamp = generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].eta);
          }

          let serviceDetails = {
            arrivalDetails: {
              crs: result.GetStationBoardResult.crs,
              fullName: result.GetStationBoardResult.locationName,
              scheduledTimestamp: new Date(staTimestamp),
              actualTimestamp: new Date(etaTimestamp)
            },
            trainId: result.GetStationBoardResult.trainServices.service[i].rsid,
            delayDate: String(result.GetStationBoardResult.generatedAt).slice(0, 10),
          };

          insertArrival(serviceDetails, (err, result) => {
          });
        }
      }
    });
  });
}

setInterval( () => { monitorArrivals('PTR', 'WAT'); monitorDepartures('PTR', 'WAT'); }, 60000 );

function findDelay(delayDetails, callBack) {
  console.log('findDelay');

  database.collection('delays').findOne({ 'departureDetails.scheduledTimestamp': new Date( delayDetails.departureDetails.scheduledTimestamp ) }, (err, results) => {
    if (err) {
      console.log('Error findOne');
      callBack({ ErrorMsg: 'Something bad happened' });
    } else {
      console.log(results);
      if (results) {
        callBack(results);
      } else {
        console.log('Not found');
        callBack({ ErrorMsg: 'Could not find it' });
      }
    }
  });
};

/*function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}*/

function insertArrival(delayDetails, callBack) {
  console.log('insertArrival');

  let localDelayDetails = {
    arrivalDetails: {
      crs: delayDetails.arrivalDetails.crs,
      fullName: delayDetails.arrivalDetails.fullName,
      scheduledTimestamp: new Date( delayDetails.arrivalDetails.scheduledTimestamp ),
      actualTimestamp: new Date( delayDetails.arrivalDetails.actualTimestamp )
    },
    trainId: delayDetails.trainId,
    delayDate: delayDetails.delayDate,
  };

  let timeDiff = Math.abs(localDelayDetails.arrivalDetails.actualTimestamp.getTime() - localDelayDetails.arrivalDetails.scheduledTimestamp.getTime());
  let diffSecs = Math.ceil(timeDiff / 1000);

  localDelayDetails.delayInSeconds = diffSecs;

  database.collection('delays').findOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, (err, results) => {
    if (err) {
      console.log('Error: ', err);
      return callBack(-1);
    } else {
      if (!results) {
        console.log('ARRIVAL Adding to DB: ', localDelayDetails.trainId);
        database.collection('delays').save(localDelayDetails, async (err, results) => {
          if (err) {
            console.log('Error: ', err);
            return callBack(-1);
          }

          return callBack(1);
        });
      } else {
        console.log('ARRIVAL Already present in DB Updating: ', localDelayDetails.trainId);
        console.log(results);

        database.collection('delays').updateOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, { $set: localDelayDetails }, (err, results) => {
          if (err) {
            console.log('Error: ', err);
            return callBack(-1);
          }

          return callBack(0);
        });
      }
    }
  }
  );
}


function insertDelay(delayDetails, callBack) {
  console.log('insertDelay');

  let localDelayDetails = {
    departureDetails: {
      crs: delayDetails.departureDetails.crs,
      fullName: delayDetails.departureDetails.fullName,
      scheduledTimestamp: new Date(delayDetails.departureDetails.scheduledTimestamp),
      actualTimestamp: new Date(delayDetails.departureDetails.actualTimestamp)
    },
    arrivalDetails: {
      crs: delayDetails.arrivalDetails.crs,
      fullName: delayDetails.arrivalDetails.fullName,
      scheduledTimestamp: new Date(delayDetails.arrivalDetails.scheduledTimestamp),
      actualTimestamp: new Date(delayDetails.arrivalDetails.actualTimestamp)
    },
    trainId: delayDetails.trainId,
    delayDate: delayDetails.delayDate,
  };

  database.collection('delays').findOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, (err, results) => {
    if (err) {
      console.log('Error: ', err);
      return callBack(-1);
    } else {
      if (!results) {
        console.log('Adding to DB: ', localDelayDetails.trainId);
        database.collection('delays').save(localDelayDetails, async (err, results) => {
          if (err) {
            console.log('Error: ', err);
            return callBack(-1);
          }

          return callBack(1);
        });
      } else {
        console.log('Already present in DB Updating: ', localDelayDetails.trainId);
        console.log(localDelayDetails);
        database.collection('delays').updateOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, { $set: localDelayDetails }, (err, results) => {
          if (err) {
            console.log('Error: ', err);
            return callBack(-1);
          }

          return callBack(0);
        });
      }
    }
  }
  );
}


function insertDeparture(delayDetails, callBack) {
  console.log('insertDeparture');

  let localDelayDetails = {
    departureDetails: {
      crs: delayDetails.departureDetails.crs,
      fullName: delayDetails.departureDetails.fullName,
      scheduledTimestamp: new Date(delayDetails.departureDetails.scheduledTimestamp),
      actualTimestamp: new Date(delayDetails.departureDetails.actualTimestamp)
    },
    trainId: delayDetails.trainId,
    delayDate: delayDetails.delayDate,
  };

  database.collection('delays').findOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, (err, results) => {
    if (err) {
      console.log('Error: ', err);
      return callBack(-1);
    } else {
      //      console.log(results);
      if (!results) {
        console.log('DEPARTURE Adding to DB: ', localDelayDetails.trainId);
        database.collection('delays').save(localDelayDetails, async (err, results) => {
          if (err) {
            console.log('Error: ', err);
            return callBack(-1);
          }

          return callBack(1);
        });
      } else {
        console.log('DEPARTURE Already present in DB Updating: ', localDelayDetails.trainId);
        database.collection('delays').updateOne({ trainId: localDelayDetails.trainId, delayDate: localDelayDetails.delayDate }, { $set: localDelayDetails }, (err, results) => {
          if (err) {
            console.log('Error: ', err);
            return callBack(-1);
          }

          return callBack(0);
        });
      }
    }
  }
  );
}


/**************************************************************************************/
// APIs
/**************************************************************************************/
//app.use(bodyParser.urlencoded({extended: true}))
app.use(cors());
app.use(bodyParser.json());

app.use((err, req, res, next) => {
  let responseData;
  //    console.log("Adding access control headers");
  //    res.header("Access-Control-Allow-Origin", "*");
  //    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  //    cors();

  if (err.name === 'JsonSchemaValidation') {
    // Log the error however you please
    console.log(err.message);
    // logs "express-jsonschema: Invalid data found"

    // Set a bad request http response status or whatever you want
    res.status(400);

    // Format the response body however you want
    responseData = {
      statusText: 'Bad Request',
      jsonSchemaValidation: true,
      validations: err.validations // All of your validation information
    };

    res.json(responseData);
  } else {
    // pass error to next error middleware handler
    next(err);
  }
});


app.post('/delays', (req, res) => {
  console.log('POST request');

  const ret = Joi.validate(req.body, DelaySchema, {
    // return an error if body has an unrecognised property
    allowUnknown: false,
    // return all errors a payload contains, not just the first one Joi finds
    abortEarly: false
  });

  if (ret.error) {
    res.status(400).end(ret.error.toString());
  } else {
    insertDelay(req.body, (insertResult) => {
      console.log('Here');
      if (insertResult === 1) {
        console.log('Returning 201');
        findDelay(req.body, (findResult) => {res.status(201).json(findResult); });
      } else if (insertResult === 0) {
        console.log('Returning 200');
        res.status(200).json({ Msg: 'Already present in DB, updated.' });
      } else {
        console.log('Returning 500');
        res.status(500).json({ ErrorMsg: 'Something bad happend' });
      }
    });
  }
});

app.delete('/delays/:id', (req, res) => {
  console.log('DELETE request');
  console.log(req.params.id);

  database.collection('delays').remove({ _id: new ObjectID(req.params.id) }, (err, results) => {
    if (err) {
      console.log('Error: ', err);
      res.status(500).json({ ErrorMsg: 'Something bad happend' });
    } else {
      if (results.result.n === 0) {
        res.status(404).json({ ErrorMsg: "Couldn't find resource" });
      } else {
        console.log('Delete: Success');
        console.log(results.result);
        res.status(204);
        res.send();
      }
    }
  });
});

app.delete('/delays', (req, res) => {
  console.log('DELETE request');

  database.collection('delays').remove({}, (err, results) => {
    if (err) {
      console.log('Error: ', err);
      res.status(500).json({ ErrorMsg: 'Something bad happend' });
    } else {
      if (results.result.n === 0) {
        res.status(404).json({ ErrorMsg: "Couldn't find resource" });
      } else {
        console.log('Delete: Success');
        console.log(results.result);
        res.status(204);
        res.send();
      }
    }
  });
});


app.get('/delays', (req, res) => {
  console.log('GET: /delays');

  let queryArgs = {};

  if (req.query.delayed !== undefined) {
    queryArgs.delayInSeconds = { gt: 0 };
  }

  database.collection('delays').find(queryArgs).toArray((err, results) => {
    if (err) {
      console.log('Error: ', err);
      res.status(404).json({ ErrorMsg: 'Something bad happend' });
    } else {
      console.log('GET: Success');
      res.status(200).json(results);
    }
  });
});

app.get('/delays/:fromDate', (req, res) => {
  console.log('GET fromDate request');
  console.log(req.params);
  console.log(req.query);

  let fromDateSplits = req.params.fromDate.split('-');
  let fromDate = new Date(fromDateSplits[0], fromDateSplits[1] - 1, fromDateSplits[2]);

  let toDate = new Date(fromDate.getFullYear() + 1, fromDateSplits[1] - 1, fromDateSplits[2]);

  let queryArgs = {
    'departureDetails.scheduledTimestamp': { $gte: fromDate, $lte: toDate }
  };

  if (req.query.delayed !== undefined) {
    queryArgs.delayInSeconds = { gt: 0 };
  }

  console.log(queryArgs);

  database.collection('delays').find(queryArgs).toArray((err, results) => {
    if (err) {
      console.log('Error: ', err);
      res.status(500).json({ ErrorMsg: 'Something bad happend' });
    } else {
      console.log('Found: Success');
      res.status(200).json(results);
    }
  });
});


app.get('/delays/:fromDate/:toDate', (req, res) => {
  console.log('GET fromDate toDate request');
  console.log(req.params);
  console.log(req.query);

  let fromDateSplits = req.params.fromDate.split('-');
  let fromDate = new Date(fromDateSplits[0], fromDateSplits[1] - 1, fromDateSplits[2]);

  let toDateSplits = req.params.toDate.split('-');
  let toDate = new Date(toDateSplits[0], toDateSplits[1] - 1, toDateSplits[2]);

  let queryArgs = {
    'departureDetails.scheduledTimestamp': { $gte: fromDate, $lte: toDate }
  };

  if (req.query.delayed !== undefined) {
    queryArgs.delayInSeconds = { gt: 0 };
  }

  console.log(queryArgs);

  database.collection('delays').find(queryArgs).toArray((err, results) => {
    if (err) {
      console.log('Error: ', err);
      res.status(500).json({ ErrorMsg: 'Something bad happend' });
    } else {
      console.log('Found: Success');
      res.status(200).json(results);
    }
  });
});


app.get('/trains/:from', (req, res) => {
  console.log('GET: /trains/:from');


  // Get the departures from the "from" station and add / update the data in the DB
  // Get the arrivals in the "to" station and add (must add since might have missed the original but its still late on arrival) / update the fdata in the DB
  // Update the DB delay calcs based on departure and arrival data


  console.log(req.params);
  console.log(req.query);

  monitorArrivals(req.params.from);
  monitorDepartures(req.params.from);

  res.status(200).json({});
});

app.get('/trains/:from/:to', (req, res) => {
  console.log('GET: /trains/:from/:to');


  // Get the departures from the "from" station and add / update the data in the DB
  // Get the arrivals in the "to" station and add (must add since might have missed the original but its still late on arrival) / update the fdata in the DB
  // Update the DB delay calcs based on departure and arrival data


  console.log(req.params);
  monitorArrivals(req.params.from, req.params.to);
  monitorDepartures(req.params.from, req.params.to);
  res.status(200).json( {} );
});

app.listen(3000, () => {
  console.log('listening on 3000');
});


import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
const app = express();
const Joi = require('joi');

const MAXLENGTH = 10;

let AWS = require('aws-sdk');
let table = 'delays';

/**********************************************************/

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

function findDelay(delayDetails) {
  console.log('findDelay');

  let dbQueryParams = {
    ':t': delayDetails.trainId,
    ':d': delayDetails.delayDate
  };

  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);

  let paramsQuery = {
    TableName: table,
    ExpressionAttributeValues: marshalledQueryParams,
    KeyConditionExpression: 'delayDate = :d and trainId = :t',
    ProjectionExpression: 'arrivalDetails, departureDetails, delayInSeconds, trainId, delayDate'
  };

  let promiseQuery = dbClient.query(paramsQuery).promise();
  return promiseQuery.then((data) => {
    if (data.Count !== 0) {
      console.log('Found: ', data);
      return { found: true, dbData: processDBData(data)[0] };
    } else {
      console.log('Not found');
      return { found: false, ErrorMsg: 'Could not find it' };
    }
  }).catch((err) => {
    console.log('Error findOne');
    return { found: false, ErrorMsg: err };
  });
};

function deleteSingleItem(table, delayDate, trainId) {
  console.log('deleteSingleItem');

  let paramsQuery = {
    TableName: table,
  };
  let dbQueryParams = {
    trainId,
    delayDate
  };

  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);
  paramsQuery.Key = marshalledQueryParams;
  return dbClient.deleteItem(paramsQuery).promise();
};

/*function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}*/


function insertDelay(delayDetails) {
  console.log('insertDelay');
  let localDelayDetails = {
    departureDetails: {
      crs: delayDetails.departureDetails.crs,
      fullName: delayDetails.departureDetails.fullName,
      scheduledTimestamp: delayDetails.departureDetails.scheduledTimestamp,
      actualTimestamp: delayDetails.departureDetails.actualTimestamp
    },
    arrivalDetails: {
      crs: delayDetails.arrivalDetails.crs,
      fullName: delayDetails.arrivalDetails.fullName,
      scheduledTimestamp: delayDetails.arrivalDetails.scheduledTimestamp,
      actualTimestamp: delayDetails.arrivalDetails.actualTimestamp
    },
    trainId: delayDetails.trainId,
    delayDate: delayDetails.delayDate,
    delayInSeconds: delayDetails.delayInSeconds
  };

  let dbQueryParams = {
    ':t': delayDetails.trainId,
    ':d': localDelayDetails.delayDate,
  };

  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);

  let paramsQuery = {
    TableName: table,
    ExpressionAttributeValues: marshalledQueryParams,
    KeyConditionExpression: 'delayDate = :d and trainId = :t',
    ProjectionExpression: 'arrivalDetails, departureDetails, delayInSeconds, trainId, delayDate'
  };

  let promiseQuery = dbClient.query(paramsQuery).promise();

  return promiseQuery.then((data) => {
    let marshalledAddDelay = AWS.DynamoDB.Converter.marshall(localDelayDetails);
    let paramsAdd = {
      TableName: table,
      Item: marshalledAddDelay,
    };

    if (data.Count === 0) {
      let promiseAdd = dbClient.putItem(paramsAdd).promise();
      return promiseAdd.then((data) => {
        console.log('PutItem succeeded:');
        return { code: 201 };
      }).catch((err) => {
        console.error('Unable to putItem. Error JSON:', err);
        return { code: 500, dbData: err };
      });
    } else {
      let updateParams = {
        ':arrivalFullName': localDelayDetails.arrivalDetails.fullName,
        ':arrivalCrs': localDelayDetails.arrivalDetails.crs,
        ':arrivalActualTimestamp': localDelayDetails.arrivalDetails.actualTimestamp,
        ':arrivalScheduledTimestamp': localDelayDetails.arrivalDetails.scheduledTimestamp,
        ':departureFullName': localDelayDetails.departureDetails.fullName,
        ':departureCrs': localDelayDetails.departureDetails.crs,
        ':departureActualTimestamp': localDelayDetails.departureDetails.actualTimestamp,
        ':departureScheduledTimestamp': localDelayDetails.departureDetails.scheduledTimestamp,
        ':delayInSeconds': localDelayDetails.delayInSeconds
      };
      let marshalledUpdateDelay = AWS.DynamoDB.Converter.marshall(updateParams);

      let key = {
        delayDate: localDelayDetails.delayDate,
        trainId: delayDetails.trainId
      };
      let marshalledUpdateKey = AWS.DynamoDB.Converter.marshall(key);
      let paramsUpdate = {
        TableName: table,
        Key: marshalledUpdateKey,
        UpdateExpression: 'set arrivalDetails.crs = :arrivalCrs, arrivalDetails.fullName = :arrivalFullName, arrivalDetails.scheduledTimestamp = :arrivalScheduledTimestamp, arrivalDetails.actualTimestamp = :arrivalActualTimestamp, departureDetails.crs = :departureCrs, departureDetails.fullName = :departureFullName, departureDetails.scheduledTimestamp = :departureScheduledTimestamp, departureDetails.actualTimestamp = :departureActualTimestamp, delayInSeconds = :delayInSeconds',
        ExpressionAttributeValues: marshalledUpdateDelay,
        ReturnValues: 'UPDATED_NEW'
      };

      let promiseUpdate = dbClient.updateItem(paramsUpdate).promise();
      return promiseUpdate.then((data) => {
        console.log('Update succeeded');
        let dbData = AWS.DynamoDB.Converter.unmarshall(data.Attributes);
        dbData.delayDate = localDelayDetails.delayDate;
        dbData.trainId = delayDetails.trainId;
        return { code: 200, dbData };
      }).catch((err) => {
        console.error('Unable to update. Error JSON:', err);
        return { code: 500, dbError: err };
      });
    }
  }).catch((err) => {
    console.error('Unable to read item. Error JSON:', err);
    return { code: 500, dbError: err };
  });
};


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
    insertDelay(req.body).then((insertResult) => {
      console.log('insertResult: ', insertResult);
      if (insertResult.code === 201) {
        console.log('Returning 201');
        findDelay(req.body).then((findResult) => {
          if (findResult.found === true) {
            res.status(201).json(findResult.dbData);
          } else {
            res.status(500).json(findResult.ErrorMsg);
          };
        }).catch((err) => {
          res.status(500).json({ ErrorMsg: 'Something bad happened', dbError: err });
        });
      } else if (insertResult.code === 200) {
        console.log('Returning 200');
        res.status(200).json({ Msg: 'Already present in DB, updated.', dbEntry: insertResult.dbData });
      } else {
        console.log('Returning 500');
        res.status(500).json({ ErrorMsg: 'Something bad happened', dbError: insertResult.dbError });
      }
    });
  }
});

app.delete('/delays/:delayDate/:trainId', (req, res) => {
  console.log('DELETE request');

  let paramsQuery = {
    TableName: table,
  };
  let dbQueryParams = {
    trainId: req.params.trainId,
    delayDate: req.params.delayDate
  };
  //  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);
  //  paramsQuery.Key = marshalledQueryParams;
  //  let promiseQuery = dbClient.deleteItem(paramsQuery).promise();
  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);
  paramsQuery.Key = marshalledQueryParams;
  console.log(paramsQuery);
  let promiseQuery = dbClient.deleteItem(paramsQuery).promise();

  promiseQuery.then((data) => {
    console.log('GET: Success');
    res.status(204).send();
  }).catch((err) => {
    console.log('Error: ', err);
    res.status(404).json({ ErrorMsg: 'Something bad happened' });
  });
});

app.delete('/delays', (req, res) => {
  console.log('DELETE request');

  let paramsQuery = {
    TableName: table,
  };

  let promiseQuery = dbClient.scan(paramsQuery).promise();
  promiseQuery.then((data) => {
    let unmarshalledData = processDBData(data);
    let promises = [];
    for (let i = 0; i < data.Count; i++) {
      promises.push(deleteSingleItem('delays', unmarshalledData[i].delayDate, unmarshalledData[i].trainId));
    }

    Promise.all(promises).then((results) => {
      res.status(204).send();
    }).catch((err) => {
      console.log('Error: ', err);
      res.status(500).json({ ErrorMsg: 'Something bad happened' }).send();
    });
  }).catch((err) => {
    console.log('Error: ', err);
    res.status(500).json({ ErrorMsg: 'Something bad happened' });
  });
});


function processDBData(data) {
  let result = [];
  for (let i = 0, len = data.Items.length; i < len; i++) {
    result.push(AWS.DynamoDB.Converter.unmarshall(data.Items[i]));
  }
  return result;
};


function scanDB (pageSize, pageNumber, processedCount, paramsQuery, respData) {
  let startingPoint = pageNumber * pageSize;
  return new Promise((resolve, reject) => {
    let promiseQuery = dbClient.scan(paramsQuery).promise();
    promiseQuery.then((scanData) => {
      if (((scanData.Count + processedCount) > startingPoint) && (respData.length !== pageSize)) {
        let startProc = 0;
        if (startingPoint > processedCount) {
          startProc = startingPoint - processedCount;
        }

        let endProc = scanData.Count;
        if ((endProc - startProc + respData.length) > pageSize) {
          endProc = startProc + pageSize - respData.length;
        }

        for (let i = startProc; i < endProc; i++) {
          console.log(AWS.DynamoDB.Converter.unmarshall(scanData.Items[i]));
          respData.push(AWS.DynamoDB.Converter.unmarshall(scanData.Items[i]));
        }
      }

      if (scanData.LastEvaluatedKey === undefined) {
        console.log('No more data');
        resolve({ pageSize, pageNumber, totalPages: Math.ceil((processedCount + scanData.Count) / pageSize), delays: respData });
      } else {
        console.log('Scanning again');
        paramsQuery.ExclusiveStartKey = scanData.LastEvaluatedKey;
        resolve(scanDB(pageSize, pageNumber, processedCount + scanData.Count, paramsQuery, respData));
      }
    }).catch((err) => {
      console.log('Error from scan promise: ', err);
      return reject();
    });
  });
}


function factoryGetDBData (req, res, paramsQuery, dbQueryParams) {
  if (req.query.delayed !== undefined) {
    dbQueryParams[':delayed'] = '0';
    if (paramsQuery.FilterExpression === undefined) {
      paramsQuery.FilterExpression = '';
    }

    if (req.query.delayed.trim() === 'true') {
      paramsQuery.FilterExpression += 'and delayInSeconds > :delayed';
    } else {
      paramsQuery.FilterExpression += 'and delayInSeconds = :delayed';
    }

    let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);
    paramsQuery.ExpressionAttributeValues = marshalledQueryParams;
  }

  let pageNumber = 0;
  if ((req.query.pageNumber !== undefined) && (req.query.pageNumber > 0)) {
    pageNumber = Number(req.query.pageNumber);
  }

  let pageSize = Number(req.query.pageSize);
  if ((req.query.pageSize === undefined) || (pageSize > MAXLENGTH) || (pageSize <= 0)) {
    pageSize = MAXLENGTH;
  }
  let data = [];
  let scanDBPromise = scanDB(pageSize, pageNumber, 0, paramsQuery, data);

  scanDBPromise.then((data) => {
    console.log('factoryGetDBData: Success');
    res.status(200).json(data);
  }).catch((err) => {
    console.log('Error: ', err);
    res.status(404).json({ ErrorMsg: 'Something bad happened' });
  });
}

app.get('/delays', (req, res) => {
  console.log('GET: /delays');

  let paramsQuery = {
    TableName: table
  };

  let dbQueryParams = {};
  factoryGetDBData(req, res, paramsQuery, dbQueryParams);
});

app.get('/delays/:fromDate', (req, res) => {
  console.log('GET fromDate request');
  console.log(req.params);
  console.log(req.query);

  let fromDateSplits = req.params.fromDate.split('-');
  let fromDate = new Date(fromDateSplits[0], fromDateSplits[1] - 1, fromDateSplits[2]);

  let toDate = new Date(fromDate.getFullYear() + 1, fromDateSplits[1] - 1, fromDateSplits[2]);

  let paramsQuery = {
    TableName: table
  };

  let dbQueryParams = {
    ':fromTimestamp': fromDate.toISOString(),
    ':toTimestamp': toDate.toISOString()
  };

  console.log(dbQueryParams);
  paramsQuery.FilterExpression = 'departureDetails.scheduledTimestamp > :fromTimestamp and departureDetails.scheduledTimestamp <= :toTimestamp';
  factoryGetDBData(req, res, paramsQuery, dbQueryParams);
});


app.get('/delays/:fromDate/:toDate', (req, res) => {
  console.log('GET fromDate toDate request');
  console.log(req.params);
  console.log(req.query);

  let fromDateSplits = req.params.fromDate.split('-');
  let fromDate = new Date(fromDateSplits[0], fromDateSplits[1] - 1, fromDateSplits[2]);

  let toDateSplits = req.params.toDate.split('-');
  let toDate = new Date(toDateSplits[0], toDateSplits[1] - 1, toDateSplits[2]);

  let paramsQuery = {
    TableName: table
  };

  let dbQueryParams = {
    ':fromTimestamp': fromDate.toISOString(),
    ':toTimestamp': toDate.toISOString()
  };

  console.log(dbQueryParams);
  paramsQuery.FilterExpression = 'departureDetails.scheduledTimestamp > :fromTimestamp and departureDetails.scheduledTimestamp <= :toTimestamp';
  factoryGetDBData(req, res, paramsQuery, dbQueryParams);
});


/**************************************************************************/
// Cloud
//var credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
//AWS.config.update({ region: 'us-east-1', credentials });

// Local
AWS.config.update({
  region: 'eu-west-2',
  endpoint: 'http://localhost:8000'
});

let dbClient = new AWS.DynamoDB();

let paramsQuery = {
  TableName: table,
};

let port = process.env.PORT || 3000;

console.log('Trying to connect to the table');

dbClient.describeTable(paramsQuery, (err, data) => {
  if (err) {
    console.log('Can\'t connect to the DynamoDB table.');
    console.log(err, err.stack); // an error occurred
    process.exit(1);
  } else {
    console.log('Connected to the DynamoDB instance');
    console.log(data);
    console.log(data.Table.KeySchema);
    app.listen(port, () => {
      console.log('listening on ', port);
    });
  }
});

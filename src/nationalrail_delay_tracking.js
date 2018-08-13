import express from 'express';
const app = express();
const soap = require('soap');
const creds = require('./creds');

let AWS = require('aws-sdk');
let table = 'delays';

let wsdl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2017-10-01';

let soapHeader = { AccessToken: { TokenValue: creds.DARWIN_TOKEN } };

function monitorDepartures(fromStation, toStation) {
  let argsDepartures = {
    numRows: '10',
    crs: fromStation
  };

  console.log('monitorDepartures: ', fromStation, toStation);

  if (toStation !== undefined) {
    argsDepartures.filterCrs = toStation;
    argsDepartures.filterType = 'to';
  }

  // Get Departures
  soap.createClient(wsdl, (err, client) => {
    //    setInterval(soap.createClient, 60000, wsdl, function(err, client) {
    client.addSoapHeader(soapHeader);
    client.GetDepartureBoard(argsDepartures, (err, result) => {
      //console.log('result ', result);
      //console.log('result.GetStationBoardResult ', result.GetStationBoardResult);
      //console.log('last request: ', client.lastRequest);

      if ((result !== undefined) && (result.GetStationBoardResult !== undefined) && (result.GetStationBoardResult.trainServices !== undefined)) {
        console.log('result.GetStationBoardResult.trainServices !== undefined ');
        for (let i = 0, len = result.GetStationBoardResult.trainServices.service.length; i < len; i++) {
          let generatedDate = result.GetStationBoardResult.generatedAt.toISOString().slice(0, 10);
          let stdTimestamp = generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].std);

          let etdTimestampStr;
          if (result.GetStationBoardResult.trainServices.service[i].eta === 'On time') {
            etdTimestampStr = (new Date(stdTimestamp)).toISOString();
          } else if ((/^\d+:\d+/.test(result.GetStationBoardResult.trainServices.service[i].eta))) {
            etdTimestampStr = (new Date(generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].etd))).toISOString();
          } else {
            etdTimestampStr = result.GetStationBoardResult.trainServices.service[i].etd;
          }

          /*let trainId;
          if (result.GetStationBoardResult.trainServices.service[i].rsid) {
            trainId = result.GetStationBoardResult.trainServices.service[i].rsid;
          } else {
            trainId = result.GetStationBoardResult.trainServices.service[i].serviceID;
          }*/

          let serviceDetails = {
            departureDetails: {
              crs: result.GetStationBoardResult.crs,
              fullName: result.GetStationBoardResult.locationName,
              scheduledTimestamp: (new Date(stdTimestamp)).toISOString(),
              actualTimestamp: etdTimestampStr
            },
            trainId: result.GetStationBoardResult.trainServices.service[i].serviceID,
            delayDate: String(result.GetStationBoardResult.generatedAt).slice(0, 10)
          };
          insertDeparture(serviceDetails);
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
      //console.log('result ', result);
      //console.log('result.GetStationBoardResult ', result.GetStationBoardResult);
      //console.log('last request: ', client.lastRequest);
      if ((result !== undefined) && (result.GetStationBoardResult !== undefined) && (result.GetStationBoardResult.trainServices !== undefined)) {
        for (let i = 0, len = result.GetStationBoardResult.trainServices.service.length; i < len; i++) {
          let generatedDate = result.GetStationBoardResult.generatedAt.toISOString().slice(0, 10);
          let staTimestamp = generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].sta);

          let etaTimestampStr;
          console.log(result.GetStationBoardResult.trainServices.service[i].eta);
          if (result.GetStationBoardResult.trainServices.service[i].eta === 'On time') {
            etaTimestampStr = (new Date(staTimestamp)).toISOString();
          } else if ((/^\d+:\d+/.test(result.GetStationBoardResult.trainServices.service[i].eta))) {
            etaTimestampStr = (new Date(generatedDate.concat('T', result.GetStationBoardResult.trainServices.service[i].eta))).toISOString();
          } else {
            etaTimestampStr = result.GetStationBoardResult.trainServices.service[i].eta;
          }
          /*
          let trainId;
          if (result.GetStationBoardResult.trainServices.service[i].rsid) {
            trainId = result.GetStationBoardResult.trainServices.service[i].rsid;
          } else {
            trainId = result.GetStationBoardResult.trainServices.service[i].serviceID;
          }
          */
          let serviceDetails = {
            arrivalDetails: {
              crs: result.GetStationBoardResult.crs,
              fullName: result.GetStationBoardResult.locationName,
              scheduledTimestamp: (new Date(staTimestamp)).toISOString(),
              actualTimestamp: etaTimestampStr
            },
            trainId: result.GetStationBoardResult.trainServices.service[i].serviceID,
            delayDate: String(result.GetStationBoardResult.generatedAt).slice(0, 10),
          };
          insertArrival(serviceDetails);
        }
      }
    });
  });
}

function insertArrival(delayDetails, callBack) {
  console.log('insertArrival');

  let localDelayDetails = {
    arrivalDetails: {
      crs: delayDetails.arrivalDetails.crs,
      fullName: delayDetails.arrivalDetails.fullName,
      scheduledTimestamp: delayDetails.arrivalDetails.scheduledTimestamp,
      actualTimestamp: delayDetails.arrivalDetails.actualTimestamp
    },
    trainId: delayDetails.trainId,
    delayDate: delayDetails.delayDate,
  };

  console.log(localDelayDetails.arrivalDetails.actualTimestamp);
  if ((/^\d{4}-\d{2}-\d{2}[T]\d{2}:\d{2}:\d{2}\.\d{3}/.test(localDelayDetails.arrivalDetails.actualTimestamp))) {
    console.log('Arrival Timestamp: ', new Date(localDelayDetails.arrivalDetails.actualTimestamp).getTime());
    console.log('Arrival Timestamp: ', new Date(localDelayDetails.arrivalDetails.scheduledTimestamp).getTime());
    let timeDiff = Math.abs((new Date(localDelayDetails.arrivalDetails.actualTimestamp)).getTime() - (new Date(localDelayDetails.arrivalDetails.scheduledTimestamp)).getTime());
    let diffSecs = Math.ceil(timeDiff / 1000);
    localDelayDetails.delayInSeconds = diffSecs;
  } else {
    localDelayDetails.delayInSeconds = -1;
  }

  let dbQueryParams = {
    ':t': delayDetails.trainId,
    ':d': localDelayDetails.delayDate,
  };

  let marshalledQueryParams = AWS.DynamoDB.Converter.marshall(dbQueryParams);

  let paramsQuery = {
    TableName: table,
    ExpressionAttributeValues: marshalledQueryParams,
    KeyConditionExpression: 'delayDate = :d and trainId = :t',
    ProjectionExpression: 'arrivalDetails, trainId, delayDate'
  };

  let promiseQuery = dbClient.query(paramsQuery).promise();
  promiseQuery.then((data) => {
    if (data.Count === 0) {
      let marshalledAddDelay = AWS.DynamoDB.Converter.marshall(localDelayDetails);
      let paramsAdd = {
        TableName: table,
        Item: marshalledAddDelay
      };

      let promiseAdd = dbClient.putItem(paramsAdd).promise();
      promiseAdd.then((data) => {
        console.log('PutItem succeeded');
      }).catch((err) => {
        console.error('Unable to putItem. Error JSON:', err);
      });
    } else {
      let updateParams = {
        ':fullName': localDelayDetails.arrivalDetails.fullName,
        ':crs': localDelayDetails.arrivalDetails.crs,
        ':actualTimestamp': localDelayDetails.arrivalDetails.actualTimestamp,
        ':delayInSeconds': localDelayDetails.delayInSeconds,
        ':scheduledTimestamp': localDelayDetails.arrivalDetails.scheduledTimestamp
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
        UpdateExpression: 'set arrivalDetails.crs = :crs, arrivalDetails.fullName = :fullName, arrivalDetails.scheduledTimestamp = :scheduledTimestamp, arrivalDetails.actualTimestamp = :actualTimestamp, delayInSeconds = :delayInSeconds',
        ExpressionAttributeValues: marshalledUpdateDelay,
        ReturnValues: 'UPDATED_NEW'
      };

      let promiseUpdate = dbClient.updateItem(paramsUpdate).promise();
      promiseUpdate.then((data) => {
        console.log('Update succeeded');
      }).catch((err) => {
        console.error('Unable to putItem. Error JSON:', err);
      });
    }
  }).catch((err) => {
    console.error('Unable to read item. Error JSON:', err);
  });
}

function insertDeparture(delayDetails) {
  console.log('insertDeparture');

  let localDelayDetails = {
    departureDetails: {
      crs: delayDetails.departureDetails.crs,
      fullName: delayDetails.departureDetails.fullName,
      scheduledTimestamp: delayDetails.departureDetails.scheduledTimestamp,
      actualTimestamp: delayDetails.departureDetails.actualTimestamp
    },
    trainId: delayDetails.trainId,
    delayDate: delayDetails.delayDate,
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
  promiseQuery.then((data) => {
    let marshalledAddDelay = AWS.DynamoDB.Converter.marshall(localDelayDetails);
    let paramsAdd = {
      TableName: table,
      Item: marshalledAddDelay
    };

    if (data.Count === 0) {
      let promiseAdd = dbClient.putItem(paramsAdd).promise();
      promiseAdd.then((data) => {
        console.log('PutItem succeeded:');
      }).catch((err) => {
        console.error('Unable to putItem. Error JSON:', err);
      });
    } else {
      let updateParams = {
        ':fullName': localDelayDetails.departureDetails.fullName,
        ':crs': localDelayDetails.departureDetails.crs,
        ':actualTimestamp': localDelayDetails.departureDetails.actualTimestamp,
        ':scheduledTimestamp': localDelayDetails.departureDetails.scheduledTimestamp
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
        UpdateExpression: 'set departureDetails.crs = :crs, departureDetails.fullName = :fullName, departureDetails.scheduledTimestamp = :scheduledTimestamp, departureDetails.actualTimestamp = :actualTimestamp',
        ExpressionAttributeValues: marshalledUpdateDelay,
        ReturnValues: 'UPDATED_NEW'
      };

      let promiseUpdate = dbClient.updateItem(paramsUpdate).promise();
      promiseUpdate.then((data) => {
        console.log('Update succeeded');
      }).catch((err) => {
        console.error('Unable to update. Error JSON:', err);
      });
    }
  }).catch((err) => {
    console.error('Unable to read item. Error JSON: ', err);
  });
}

let credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
//AWS.config.credentials = credentials;
AWS.config.update({ region: 'us-east-1', credentials });

let dbClient = new AWS.DynamoDB();

let paramsQuery = {
  TableName: table,
};

let port = process.env.PORT || 3001;

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

setInterval( () => { monitorArrivals('PTR', 'WAT'); monitorDepartures('PTR', 'WAT'); }, 10000 );


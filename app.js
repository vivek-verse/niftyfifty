const request = require('request');
const fs       = require('fs');
const Json2csvParser = require('json2csv').Parser;
const dir      = './files/';
 
module.exports = {
 
      getYahooData : function(companyname, timeZone){
          return new Promise(function(resolve, reject) {
 
          var pf = function(a) {
              return parseFloat(a);
          }
 
          var pi = function(a) {
              return parseInt(a);
          }
 
          var abs = function(a) {
              return Math.abs(a);
          }
 
          var getDate = function(con) {
              var myOldDateObj = new Date(con * 1000);
              var myTZO = timeZone;
              var myNewDate = new Date(myOldDateObj.getTime() + (60000 * (myOldDateObj.getTimezoneOffset() - myTZO)));
              var d = myNewDate;
              date = ((d.getDate() < 10) ? "0" + d.getDate() : d.getDate()) + "-" + ((d.getMonth() + 1 < 10) ? "0" + (d.getMonth() + 1) : (d.getMonth() + 1)) + "-" + d.getFullYear();
              return date;
          }
 
          var getTime = function(con) {
              var myOldDateObj = new Date(con * 1000);
              var myTZO = timeZone;
              var myNewDate = new Date(myOldDateObj.getTime() + (60000 * (myOldDateObj.getTimezoneOffset() - myTZO)));
              var d = myNewDate;
              time = ((d.getHours() < 10) ? "0" + d.getHours() : d.getHours()) + ":" + ((d.getMinutes() < 10) ? "0" + d.getMinutes() : d.getMinutes()) + ":" + ((d.getSeconds() < 10) ? "0" + d.getSeconds() : d.getSeconds());
              return time;
          }
 
          var dataSort = function(arr) {
 
              arr.sort(function(a, b) {
                  var aDate = a["DATE"];
                  var aTime = a["TIME"];
                  var bDate = b["DATE"];
                  var bTime = b["TIME"];
                  if (aDate == bDate) {
                      return (aTime < bTime) ? -1 : (aTime > bTime) ? 1 : 0;
                  } else {
                      var aa = aDate.split('-').reverse().join(),
                          bb = bDate.split('-').reverse().join();
                      return aa < bb ? -1 : (aa > bb ? 1 : 0);
                  }
              });
 
              resolve(arr);
 
          }
 
          var crunchData = function(data) {
              var dataPieces = [];
              var onePiece = {};
              for (var i = 0; i < data.chart.result[0].timestamp.length; i++) {
                  onePiece["DATE"] = getDate(data.chart.result[0].timestamp[i]);
                  onePiece["TIME"] = getTime(data.chart.result[0].timestamp[i]);
                  onePiece["OPEN"] = (data.chart.result[0].indicators.quote[0].open[i] == null) ? null : pf(data.chart.result[0].indicators.quote[0].open[i]);
                  onePiece["HIGH"] = (data.chart.result[0].indicators.quote[0].high[i] == null) ? null : pf(data.chart.result[0].indicators.quote[0].high[i]);
                  onePiece["LOW"] = (data.chart.result[0].indicators.quote[0].low[i] == null) ? null : pf(data.chart.result[0].indicators.quote[0].low[i]);
                  onePiece["CLOSE"] = (data.chart.result[0].indicators.quote[0].close[i] == null) ? null : pf(data.chart.result[0].indicators.quote[0].close[i]);
                  dataPieces.push(onePiece);
                  onePiece = {};
              }
              dataSort(dataPieces);
          }
 
          var makeRequest = function() {
              url = "https://query2.finance.yahoo.com/v7/finance/chart/" + companyname + ".NS?range=1wk&interval=1m&indicators=quote&includeTimestamps=true&includePrePost=false&corsDomain=finance.yahoo.com";
              if (companyname == "NIFTY 50") {
                  url = "https://query2.finance.yahoo.com/v7/finance/chart/%5Ensei?range=1wk&interval=1m&indicators=quote&includeTimestamps=true&includePrePost=false&corsDomain=finance.yahoo.com"
              }
              if (companyname == "BANKNIFTY") {
                  url = "https://query2.finance.yahoo.com/v7/finance/chart/%5Ensebank?range=1wk&interval=1m&indicators=quote&includeTimestamps=true&includePrePost=false&corsDomain=finance.yahoo.com"
              }
 
              request(url, function(error, response, data) {
                  crunchData(JSON.parse(data));
              });
          }
 
          makeRequest();
      })
 
    },
    fetchData : function(companyname, timeZone, callback){
      this.getYahooData(companyname, timeZone).then(function(data){
        callback(null, data);
      }).catch(function(err){
        callback(err, null);
      })
    },
    saveDataAsCsv : function(companyname, timeZone, callback){
      this.getYahooData(companyname, timeZone).then(function(data){
 
          var filename = companyname+".csv",
              fields   = [];
 
          for(var key in data[0]){
              fields.push(key);
          }
 
          const opts = { fields };
 
          var parser = new Json2csvParser(opts),
              csv = parser.parse(data);
 
          if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir);
          }

          fs.writeFile(dir + filename, csv, function(err) {
              if (err){
                console.log(err);
                callback("Failed to save data in CSV format.", null);
              }else{
                callback(null, "File Created Successfully");
              }
          });
 
      }).catch(function(err){
          callback("Failed to fetch data", null);
      })
    }
}
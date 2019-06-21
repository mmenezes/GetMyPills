/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
	login = require('./routes/login'),
    http = require('http'),
    path = require('path'),
    fs = require('fs');
NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1');

var app = express();

var db;

var cloudant;

var fileToUpload;

var dbCredentials = {
    dbName: 'getpillsapp'
};

var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();
var userController = require('./controllers/userController');



// all environments
app.set('port', process.env.PORT || 5000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/scripts", express.static(__dirname + '/public/scripts'));
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'javascripts')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));
app.use('/user', user);

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

ageBreakup=[{
            'diseaseName': 'Cholera',
            'symptoms':['Diarrhea','Nausea','Vomiting','Mild to Severe Dehydration'],
            'ageRange': "30-40"
        },{
            'diseaseName': 'Influenza',
            'symptoms':['High Fever','Running Nose','Sore Throat','Muscle pain','headache','Coughing','Feeling Tired'],
            'ageRange': "40-50"
        }];

function getDBCredentialsUrl(jsonData) {
    var vcapServices = JSON.parse(jsonData);
    // Pattern match to find the first instance of a Cloudant service in
    // VCAP_SERVICES. If you know your service key, you can access the
    // service credentials directly by using the vcapServices object.
    for (var vcapService in vcapServices) {
        if (vcapService.match(/cloudant/i)) {
            return vcapServices[vcapService][0].credentials.url;
        }
    }
}


function initDBConnection() {
    //When running on Bluemix, this variable will be set to a json object
    //containing all the service credentials of all the bound services
    if (process.env.VCAP_SERVICES) {
        dbCredentials.url = getDBCredentialsUrl(process.env.VCAP_SERVICES);
    } else { //When running locally, the VCAP_SERVICES will not be set

        // When running this app locally you can get your Cloudant credentials
        // from Bluemix (VCAP_SERVICES in "cf env" output or the Environment
        // Variables section for an app in the Bluemix console dashboard).
        // Once you have the credentials, paste them into a file called vcap-local.json.
        // Alternately you could point to a local database here instead of a
        // Bluemix service.
        // url will be in this format: https://username:password@xxxxxxxxx-bluemix.cloudant.com
        dbCredentials.url = getDBCredentialsUrl(fs.readFileSync("vcap-local.json", "utf-8"));
    }

    cloudant = require('cloudant')(dbCredentials.url);

    // check if DB exists if not create
    cloudant.db.create(dbCredentials.dbName, function (err, res) {
    	console.log(err);
        if (err) {
            console.log('Could not create new db: ' + dbCredentials.dbName + ', it might already exist.');
        }
    });

    db = cloudant.use(dbCredentials.dbName);
}

initDBConnection();

app.get('/', routes.index);
/*app.all('*', function(req, res, next){
  console.log('(2) route middleware for all method and path pattern "*", executed first and can do stuff before going next');
  next();
});*/
app.post('/login', userController.login);
app.post('/getregion', userController.getregion);
/*Added method to get Patient Details */

app.get('/api/getOrders', function (request, response) {
    console.log("Get method invoked.. ")

    db = cloudant.use(dbCredentials.dbName);

    db.list(function (err, body) {
        if (!err) {
            var len = body.rows.length;
            console.log('total # of docs -> ' + len);
            if (len == 0) {

            } else {
                var query = {
                    "selector": {
                        "document_type": "order"
                    }
                };

                db.find(query, function (err, doc) {
                    if (!err) {
                        console.log(doc.docs);
                        return response.json({ result: doc.docs });
                        //   response.write(JSON.stringify(doc.docs));
                        console.log('ending response...');
                        response.end();
                    }
                    else {
                        console.log(err);
                    }
                });
            }

        } else {
            console.log(err);
        }
    });
});

app.get('/api/getSymptoms', function (request, response) {

    var patientName = request.param('patientName');
    var patientAge = request.param('patientAge');
    var patientOccupation = request.param('patientOccupation');
    var patientSymptoms = request.param('patientSymptoms');
    var patientCountry = request.param('patientCountry');
    var patientState = request.param('patientState');
    var patientZip = request.param('patientZip');
    var detectedSystoms = [];
    var maxLength = 0

    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;    //January is 0!
    var yyyy = today.getFullYear();

    if(dd<10) {
        dd = '0'+ dd
    } 

    if(mm<10) {
        mm = '0'+ mm
    } 

    var todayDate = mm + '-' + dd + '-' + yyyy;

    var data = [{
        'diseaseName': 'Cholera',
        'detectedSymptoms': [],
        'symptoms': ['diarrhoea', 'nausea', 'Vomiting', 'Dehydration','muscle pain','dizziness','loose motions'],
        'ageRange': "30-40"
    }, {
        'diseaseName': 'Influenza',
        'detectedSymptoms': [],
        'symptoms': ['Fever', 'Runny Nose', 'soar throat', 'Muscle Pain', 'headache', 'Cough', 'Tired', 'Body Pain'],
        'ageRange': "40-50"
    }];

    var parameters = {
        'text': patientSymptoms,
        'features': {
            'keywords': {
            }
        }
    };

    var naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
        version: '2018-03-16',
        username: '204c4562-2e1e-4f53-9330-9714eab0140c',
        password: 'PTmWCKqrjAoJ',
        url: 'https://gateway.watsonplatform.net/natural-language-understanding/api'
    });


    naturalLanguageUnderstanding.analyze(parameters, function (err, res) {
        if (err)
            console.log('error:', err);
        else {
            console.log(res)
            for (i = 0; i < res['keywords'].length; i++) {
                detectedSystoms.push(res['keywords'][i]['text']);
            }

            // Find Disease based on Symptoms
            for (i = 0; i < data.length; i++) {
                for (j = 0; j< data[i]['symptoms'].length; j++){
                    for (k = 0; k< detectedSystoms.length; k++){
                        if (data[i]['symptoms'][j].toLowerCase().includes(detectedSystoms[k].toLowerCase()) || detectedSystoms[k].toLowerCase().includes(data[i]['symptoms'][j].toLowerCase())){
                            data[i]['detectedSymptoms'].push(detectedSystoms[k]);
                            maxLength = data[i]['detectedSymptoms'].length
                        }
                    }
                }
            }

            var prediction = {}
            var predictedDisease = ''
            var MaxPercent = 0
            // Compute Prediction
            for (i = 0; i < data.length; i++) {
                var percent = (data[i]['detectedSymptoms'].length * 100)/maxLength
                prediction[data[i]['diseaseName']] = percent;

                if (percent > MaxPercent){
                    predictedDisease = data[i]['diseaseName']
                }
            }

            dbInsertQuery = { "document_type": "symptoms", "hospital_name": "All India Institute of Medical Sciences", "location": patientCountry, "patient_name": patientName, "patient_age": patientAge, "patient_occ": patientOccupation, "City": patientState, "Symptoms_reported": patientSymptoms, "disease": predictedDisease, "prediction": prediction, "date_updated": todayDate }
            console.log(dbInsertQuery)

            db = cloudant.use(dbCredentials.dbName);
            db.insert(dbInsertQuery, function (er, result) {
                if (er) {
                    throw er;
                }

                return response.json({ result: data });
                console.log('ending response...');
                response.end();
            });



        }
    });
});

app.get('/api/getHealthTips', function (request, response) {
    console.log("Get method invoked.. ")
	
	db = cloudant.use(dbCredentials.dbName);

    db.list(function (err, body) {
        if (!err) {
            var len = body.rows.length;
            console.log('total # of docs -> ' + len);
            if (len == 0) {

            } else {
                var query = {
                    "selector": {
					"$and": [
							{
								"document_type": {
									"$eq":"health_tips"
								}
							},
							{	"condition": {
									"$eq" : request.query.condition_type
								}
							}
						]
					}
                };

                db.find(query, function (err, doc) {
                    if (!err) {
                        console.log(doc.docs);
                        return response.json({ result: doc.docs });
                        //   response.write(JSON.stringify(doc.docs));
                        console.log('ending response...');
                        response.end();
                    }
                    else {
                        console.log(err);
                    }
                });
            }

        } else {
            console.log(err);
        }
    });
});

app.post('/api/addLogReadings', function (request, response) {
    console.log("Post method invoked.. ")
    console.log(request.body);
    var newLogEntry=request.body;
	var today = new Date();
	var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
	var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	
    dbInsertQuery = { 
					  "document_type": "logs", 
					  "cust_name": newLogEntry.cust_name, 
					  "test_type": newLogEntry.type, 
					  "value": newLogEntry.value,
					  "remarks": newLogEntry.remarks,
					  "log_date": date + " " + time 	
					}
            console.log(dbInsertQuery)

            db = cloudant.use(dbCredentials.dbName);
            db.insert(dbInsertQuery, function (er, result) {
                if (er) {
					response.sendStatus(500);
                    throw er;
                }

                //return response.json({ result: data });
                console.log('ending response...');
				response.sendStatus(200);
                response.end();
     });
	// response.send('POST request to the homepage')
	
});

/*    
    Expected response
    result: {
        "customers": [ 
            {
                "fName" : "John",
                "lName" : "DSilva",
                "city" : "Ponda"
            },
            {
                "fName": "John",
                "lName": "Seth",
                "city": "Panjim",
            }
         ]
    }
*/
app.get('/api/getCustomers', function (request, response) {

    console.log("Get Customers method invoked.. ")

    db = cloudant.use(dbCredentials.dbName);

    db.list(function (err, body) {
        if (!err) {
            var len = body.rows.length;
            console.log('total # of docs -> ' + len);
            if (len == 0) {
                console.log('No docs Found -> ' + len);
            } else {
                var query = {
                    "selector": {
                        "document_type": "customer",
                    }
                };

                db.find(query, function (err, doc) {
                    if (!err) {
                        console.log(doc.docs);
                        return response.json({ result: doc.docs });                        
                    } else {
                        console.log(err);
                    }
                });
            }
        } else {
            console.log(err);
        }
    });    
});

/*
    request.body: { 
        "userName" : "jSeth"
    }
    Expected response
    result: {
        "fName": "John",
        "lName": "Seth",
        "occupation": "Teacher",
        "city": "Panjim",
        "state": "Goa"
    }
*/
app.get('/api/getCustomerDetails', function (request, response) {

    console.log("Get Customer Details method invoked.. ");
    //var userName = request.param('userName');

    db = cloudant.use(dbCredentials.dbName);

    db.list(function (err, body) {
        if (!err) {
            var len = body.rows.length;
            console.log('total # of docs -> ' + len);
            if (len == 0) {
                console.log('No docs Found -> ' + len);
            } else {
                var query = {
                    "selector": {
					"$and": [
							{
								"document_type": {
									"$eq":"customer"
								}
							},
							{	"cust_name": {
									"$eq" : request.query.userName
								}
							}
						]
					}
                };

                db.find(query, function (err, doc) {
                    if (!err) {
                        console.log("customer details:" + doc.docs);
                        return response.json({ result: doc.docs });
                    } else {
                        console.log(err);
                    }
                });                
            }
        } else {
            console.log(err);
        }
    });    
});

/*
eg: request.body = {
    cust_name:"John",
    medications: [
        {
            "disease" : "Diabetes",
            "treatment" :{
                time: "09:00",
                frequency: "Daily/Every Monday/Alternate Days"
                medicine: "Insulin injection"
            }        
        },
        {
            "disease" : "High Blood pressure",
            "treatment" :{
                time: "18:00",
                frequency: "Daily/Every Monday/Alternate Days/Daily before Sleeping"
                medicine: "XYZ Tablet"
            } 
        }
    ]
}
*/


app.post('/api/checkin', function (request, response) {
    console.log("Checkin method invoked.. ")
    console.log(request.body);

    var newCheckin = request.body;
	
	var orderdate;
	if (newCheckin.order_date!=null){
		orderdate = newCheckin.order_date; 
	}else{
		var today = new Date();
		var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
		orderdate = date;	
	}
	
	var ord_id = Math.floor(1000 + Math.random() * 9000);
		
    dbInsertQuery = { 
					  "document_type": "order", 
					  "order_id": "OR" + ord_id,
					  "user_name": newCheckin.cust_name, 
					  "medications": newCheckin.medications,
					  "order_date" : orderdate,
					  "status" : "Pending"
					}
            console.log(dbInsertQuery)

            db = cloudant.use(dbCredentials.dbName);
            db.insert(dbInsertQuery, function (err, result) {
                if (err) {
                    response.sendStatus(500);
                    throw err;
                }

                console.log('ending response...');
                response.sendStatus(200);
                response.end();
    });	
});

app.use(express.static(__dirname));

app.get('*', function(req, res) {
	res.sendfile('./views/index.html')
}) 
	 
exports = module.exports = app;
http.createServer(app).listen(app.get('port'), '0.0.0.0', function () {
    console.log('Express server listening on port ' + app.get('port'));
});



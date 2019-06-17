
var userController = require('../controllers/userController');

// server side apis here


  
console.log('hit');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const btoa = require("btoa");
const wml_credentials = new Map();
exports.login = function(req, res) {
    
    console.log('hi');
    var username = req.body.username ;
    var password = req.body.password ;
 
    if (username == '' || password == '') {
        return res.send(401);
    }
    
    if (username == 'Admin' && password== 'Admin'){
        return res.json({username:"Admin" , password: "Admin"});
    }
    else 
        return res.json({errMsg:"User doesn't exist. Please enter valid user"});
           
};

function apiGet(url, username, password, loadCallback, errorCallback){
        const oReq = new XMLHttpRequest();
        const tokenHeader = "Basic " + btoa((username + ":" + password));
        const tokenUrl = url + "/v3/identity/token";

        oReq.addEventListener("load", loadCallback);
        oReq.addEventListener("error", errorCallback);
        oReq.open("GET", tokenUrl);
        oReq.setRequestHeader("Authorization", tokenHeader);
        oReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        oReq.send();
}

function apiPost(scoring_url, token, payload, loadCallback, errorCallback){
        const oReq = new XMLHttpRequest();
        oReq.addEventListener("load", loadCallback);
        oReq.addEventListener("error", errorCallback);
        oReq.open("POST", scoring_url);
        oReq.setRequestHeader("Accept", "application/json");
        oReq.setRequestHeader("Authorization", token);
        oReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        oReq.send(payload);
}


//var numArray = [140000, 104, 99];

//alert(numArray.join(","));
exports.getregion = function(req, resdata) {


// NOTE: you must manually construct wml_credentials hash map below using information retrieved
// from your IBM Cloud Watson Machine Learning Service instance

wml_credentials.set("url", "https://eu-gb.ml.cloud.ibm.com");
wml_credentials.set("username", "e25714de-183a-437d-8f5f-16da3326526d");
wml_credentials.set("password", "a3024104-a561-42ab-a7ba-be9b362ca89d");



apiGet(wml_credentials.get("url"),
        wml_credentials.get("username"),
        wml_credentials.get("password"),
        function (res) {
        let parsedGetResponse;
        try {
            parsedGetResponse = JSON.parse(this.responseText);
        } catch(ex) {
            // TODO: handle parsing exception
        }
        if (parsedGetResponse && parsedGetResponse.token) {
            const token = parsedGetResponse.token
            const wmlToken = "Bearer " + token;

            // NOTE: manually define and pass the array(s) of values to be scored in the next line
                       const payload = '{"fields": ["Year", "Month", "Season", "Temperature", "Rainfall", "Country", "Occupation"], "values": [[2018,"August","Summer","High","High","India","Agriculture"]]}';
                       const scoring_url = "https://eu-gb.ml.cloud.ibm.com/v3/wml_instances/e2e1cb8a-7fba-4ca2-a61b-e403a4344bbd/deployments/93c9da11-8144-4a21-8dc4-d2df0965e2da/online";

            apiPost(scoring_url, wmlToken, payload, function (resp) {
                let parsedPostResponse;
                try {
                    parsedPostResponse = JSON.parse(this.responseText);
                } catch (ex) {
                    // TODO: handle parsing exception
                }
                console.log("Scoring response");
                console.log(parsedPostResponse.values[0]);
                console.log(parsedPostResponse.values[0][9]);
                console.log(parsedPostResponse.values[0][12]);
				function sortNumber(a,b) {
					return a - b;
				}
				var percentage = parsedPostResponse.values[0][9];
				percentage.sort(sortNumber);
				var diseases = parsedPostResponse.values[0][12];
				var html = '';
				//<div class="layer w-100"><h5 class="mB-5">Malaria</h5><small class="fw-600 c-grey-700">Visitors From USA</small> <span class="pull-right c-grey-600 fsz-sm">50%</span><div class="progress mT-10"><div class="progress-bar bgc-deep-purple-500" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width:50%"><span class="sr-only">50% Complete</span></div></div></div>
				for(var i=0; i<percentage.length; i++){
					var actval = percentage[i]*100;
					actval = actval.toFixed(2);
					
					html+='<div class="layer w-100"><h5 class="mB-5"><a href="/outbreak">'+diseases[i]+'</a></h5><small class="fw-600 c-grey-700"></small>';
					html+='<span class="pull-right c-grey-600 fsz-sm">'+actval+'%</span><div class="progress mT-10"><div class="progress-bar bgc-deep-purple-500" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width:'+actval+'%"><span class="sr-only">'+actval+'% Complete</span></div></div></div>';
				}
				resdata.writeHeader(200, {"Content-Type": "text/html"});  
				resdata.write(html);  
				resdata.end();  
				//return resdata.send();
				 //return resdata.json(parsedPostResponse);
            }, function (error) {
                console.log(error);
            });
        } else {
            console.log("Failed to retrieve Bearer token");
        }
        }, function (err) {
               console.log(err);
        });

           
};




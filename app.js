const axios = require('axios');
const express = require('express');
const morgan = require('morgan');
const winston = require('winston');
const NodeGeocoder = require('node-geocoder');

const app = express();
app.use(express.json());

//Use Morgan for HTTP instrumentation 
app.use(morgan('common'));

winston.level = 'debug';
const console = new winston.transports.Console();
winston.add(console);

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello Again');
});


app.post('/incident', async function(req, res) {
    let incident = {
        processID: req.body.processID,
        category: req.body.category,
        priority: req.body.priority,
        status: req.body.status,
        description: req.body.description,
        created: req.body.created,
        assigned_to: req.body.assigned_to,
        reported_by: req.body.reported_by,
        street_adr: req.body.street_adr,
        town_city: req.body.town_city,
        county: req.body.county,
        location: req.body.location
    };

    //See if we need to lookup the lat & lon
    if (incident.location.lat == 0 && incident.location.lon == 0) {
        //incident = getLocation(incident);

        const options = {
            provider: 'google',
            apiKey: 'YOUR-KEY-GOES-HERE'
        };
    
        const geoCoder = NodeGeocoder(options);
        const addrStr = incident.street_adr + ' ' + incident.town_city + ' ' + incident.county + ' UK';
        const geoResult = await geoCoder.geocode(addrStr);
        incident.location.lat = geoResult[0].latitude;
        incident.location.lon = geoResult[0].longitude;
        winston.info('Updating Incident');
    }

    //Send into elasticsearch
    axios.post('http://localhost:9200/incidents/reports', incident)
        .then((res) => {
            //winston.info(`statusCode: ${res.statusCode}`)
            winston.info(res.status)
        })
        .catch((error) => {
            winston.error(error)
        })

    winston.info('Sending response to client');
    //Send incident back to client
    res.send(incident);

});

function getLocation(incident){

    const options = {
        provider: 'google',
        apiKey: 'AIzaSyC2N1t51eR4ZMd3zJ-MYLlQUOilaj-SmTw'
    };

    const geoCoder = NodeGeocoder(options);
    const addrStr = incident.street_adr + ' ' + incident.town_city + ' ' + incident.county + ' UK';

    try{
        //const geoResult = await geoCoder.geocode(addrStr);
        //incident.location.lat = geoResult[0].latitude;
        //incident.location.lon = geoResult[0].longitude;
        winston.info('Updating Incident');
        
    }
    catch(err){
        winston.error(err);
    }

    return incident;
}

app.listen(port, () => {
    console.log('Ugh');
    winston.info('Incident Location API running on port ' + port);
});

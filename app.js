const axios = require('axios');
const express = require('express');
const morgan = require('morgan');
const winston = require('winston');
const NodeGeocoder = require('node-geocoder');

//Ignore self signed cert problems
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

//Configuration parameters
const port = process.env.PORT || 8080;
const mapKey = process.env.MAPKEY || 'YOUR-KEY-HERE';
const elastic_url = process.env.ELASTIC_URL || 'http://localhost:9200/incidents/reports';
const elastic_user = process.env.ELASTIC_USER || '';
const elastic_password = process.env.ELASTIC_PASSWORD || '';

const app = express();
app.use(express.json());

//Use Morgan for HTTP instrumentation 
app.use(morgan('common'));

winston.level = 'debug';
const console = new winston.transports.Console();
winston.add(console);

app.get('/', (req, res) => {
    res.send('Hello Again Bro!');
});

app.post('/incident', async function (req, res) {
    let incident = {
        processID: req.body.processID,
        category: req.body.category,
        subCategory: req.body.subCategory,
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
            apiKey: mapKey
        };
        const geoCoder = NodeGeocoder(options);
        const addrStr = incident.street_adr + ' ' + incident.town_city + ' ' + incident.county + ' UK';

        try{
            const geoResult = await geoCoder.geocode(addrStr);
            incident.location.lat = geoResult[0].latitude;
            incident.location.lon = geoResult[0].longitude;
            winston.info('Updating Incident');
        }catch(err){
            winston.error('Error Updating Incident');
        } 
    }

    //elastic auth
    const elastic_credentials = {
        username: elastic_user,
        password: elastic_password
    };

    //Send into elasticsearch
    axios.post(elastic_url, incident, {
        auth: elastic_credentials
    }).then((res) => {
        //winston.info(`statusCode: ${res.statusCode}`)
        winston.info(res.status)
    }).catch((error) => {
            winston.error(error)
    })

    winston.info('Sending response back to client');
    //Send incident back to client
    res.send(incident);

});

app.listen(port, () => {
    winston.info('Incident Location API running on port ' + port);
});

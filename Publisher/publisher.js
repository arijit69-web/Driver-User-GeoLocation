const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');
const cors = require('cors'); 

const app = express();
const port = 3001;

const amqpUrl = 'amqp://localhost';
const queueName = 'geolocation-queue';

app.use(bodyParser.json());
app.use(cors()); 

function publishLocation(channel, queueName, location) {
    const message = `Latitude: ${location.latitude}, Longitude: ${location.longitude}`;
    channel.sendToQueue(queueName, Buffer.from(message));
    console.log("Sent message:", message);
}

amqp.connect(amqpUrl, (err, connection) => {
    if (err) {
        throw err;
    }
    connection.createChannel((err, channel) => {
        if (err) {
            throw err;
        }
        channel.assertQueue(queueName, { durable: false });

        app.post('/location', (req, res) => {
            try {
                const location = req.body;
                publishLocation(channel, queueName, location);
                res.json({ status: 'success', message: 'Location published' });
            } catch (error) {
                console.error('Error publishing location:', error);
                res.status(500).json({ status: 'error', message: 'Failed to publish location' });
            }
        });

        app.listen(port, () => {
            console.log(`Server is listening at http://localhost:${port}`);
        });
    });
});

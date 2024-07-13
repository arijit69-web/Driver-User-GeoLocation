const express = require('express');
const amqp = require('amqplib/callback_api');
const cors = require('cors');

const app = express();
const port = 3000;
const messages = [];

const rabbitMqUrl = 'amqp://localhost'; // Replace with your RabbitMQ server URL

app.use(cors());

// RabbitMQ connection
amqp.connect(rabbitMqUrl, (err, connection) => {
    if (err) {
        throw err;
    }

    connection.createChannel((err, channel) => {
        if (err) {
            throw err;
        }

        const queueName = 'geolocation-queue';
        channel.assertQueue(queueName, { durable: false });

        channel.consume(queueName, (msg) => {
            const messageContent = msg.content.toString();
            console.log(`Message: ${messageContent}`);
            messages.push(messageContent);
            channel.ack(msg);
        }, {
            noAck: false
        });

        console.log(`Waiting for messages in ${queueName}. To exit press CTRL+C`);
    });
});

// API endpoint to get messages
app.get('/messages', (req, res) => {
    res.json({ messages });
});

// Serve React app
app.use(express.static('build'));

app.get('*', (req, res) => {
    res.sendFile(__dirname + '/build/index.html');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

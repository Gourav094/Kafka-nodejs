const { Kafka } = require('kafkajs');

module.exports = new Kafka({
    clientId: 'email-service',
    brokers: ['localhost:9092']
})


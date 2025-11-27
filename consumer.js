const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'email-service',
    brokers: ['localhost:9092']
}) 

const consumer = kafka.consumer({groupId: 'email-service-group'});

async function start() {
    await consumer.connect();
    await consumer.subscribe({ topic: 'order-events', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const event = JSON.parse(message.value.toString());
                console.log(`Email -> ${event.userEmail} | order ${event.orderId} | amount $${event.amount}`);
            } catch (e) {
                console.error('Parse error', e);
            }
        }
    });
}

start().catch("failed...",console.error);
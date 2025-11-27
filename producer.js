const { Kafka, Partitioners } = require('kafkajs');
const express = require('express');

const kafka = new Kafka({
    clientId: 'order-service',
    brokers: ['localhost:9092'],
    createPartitioner: Partitioners.LegacyPartitioner
})

const producer = kafka.producer();

const app = express();                      
app.use(express.json());
                                        
app.post('/order', async (req, res) => {
    const event = {
        orderId: req.body.orderId,
        userEmail: req.body.userEmail,
        amount : req.body.amount,
    }    

    await producer.send({
        topic: 'order-events',
        messages: [
            { 
                key: event.orderId,
                value: JSON.stringify(event)
            }
        ]
    })
    res.json({ status: 'Order placed', event });
})

app.get('/', (req, res) => {
    console.log('Order Service is running');
    res.json({ status: 'Order Service is running' });
});

async function start() {
    await producer.connect();
    app.listen(3000, () => {
        console.log('Order service listening on port 3000');
    });
}
start().catch(console.error);
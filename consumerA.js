const kafka = require('./kafka');

const consumer = kafka.consumer({ groupId: 'email-serviceA' });

async function start(){
    await consumer.connect();
    await consumer.subscribe({ topic:'order-events', fromBeginning: true })
    await consumer.run({
        eachMessage: async( {message,partition} )=> {
            try{
                console.log(`[A] Partition: ${partition} →`, message.value.toString());
            }
            catch(error){
                console.log("Error in running consumer group A : ", error)
            }
        }
    })
}

start().catch(console.error);
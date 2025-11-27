# Kafka Producer-Consumer Testing Demo

This project demonstrates Apache Kafka messaging patterns using KafkaJS with different producer-consumer configurations.

## Overview

This demo implements an order processing system that sends order events to Kafka and processes them using different consumer configurations to demonstrate Kafka's message distribution patterns.

## Project Structure

```
.
├── producer.js          # Express server that produces order events
├── consumer.js          # Standalone consumer (group: email-service-group)
├── consumerA.js         # Consumer A in shared group (group: email-serviceA)
├── consumerB.js         # Consumer B in shared group (group: email-serviceA)
├── kafka.js             # Shared Kafka client configuration
├── docker-compose.yaml  # Kafka & Zookeeper setup
└── package.json         # Project dependencies
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Kafka and Zookeeper:**
   ```bash
   docker-compose up -d
   ```

3. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

## Testing Scenarios

### Scenario 1: Single Producer with Single Consumer

This demonstrates basic Kafka messaging where one producer sends messages and one consumer receives all of them.

**Architecture:**
```
Producer (order-service) → Kafka Topic (order-events) → Consumer (email-service-group)
```

**How to Test:**

1. **Terminal 1** - Start the producer:
   ```bash
   node producer.js
   ```
   Expected output: `Order service listening on port 3000`

2. **Terminal 2** - Start the consumer:
   ```bash
   node consumer.js
   ```

3. **Terminal 3** - Send test orders:
   ```bash
   # Send first order
   curl -X POST http://localhost:3000/order \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "order-001",
       "userEmail": "alice@example.com",
       "amount": 99.99
     }'

   # Send second order
   curl -X POST http://localhost:3000/order \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "order-002",
       "userEmail": "bob@example.com",
       "amount": 149.50
     }'

   # Send third order
   curl -X POST http://localhost:3000/order \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "order-003",
       "userEmail": "charlie@example.com",
       "amount": 75.25
     }'
   ```

**Expected Behavior:**
- The consumer receives **ALL** messages
- Consumer output:
  ```
  Email -> alice@example.com | order order-001 | amount $99.99
  Email -> bob@example.com | order order-002 | amount $149.5
  Email -> charlie@example.com | order order-003 | amount $75.25
  ```

**Key Points:**
- Single consumer receives every message published to the topic
- Messages are processed in order within each partition

---

### Scenario 2: Single Producer with Multiple Consumers in Same Group

This demonstrates Kafka's **load balancing** feature. When multiple consumers belong to the same consumer group, Kafka distributes messages among them.

**Architecture:**
```
                          ┌─→ Consumer A (email-serviceA)
Producer → Kafka Topic ───┤
                          └─→ Consumer B (email-serviceA)
```

**How to Test:**

1. **Terminal 1** - Start the producer:
   ```bash
   node producer.js
   ```

2. **Terminal 2** - Start Consumer A:
   ```bash
   node consumerA.js
   ```

3. **Terminal 3** - Start Consumer B:
   ```bash
   node consumerB.js
   ```

4. **Terminal 4** - Send multiple orders:
   ```bash
   # Send 6 orders to see distribution
   for i in {1..6}; do
     curl -X POST http://localhost:3000/order \
       -H "Content-Type: application/json" \
       -d "{
         \"orderId\": \"order-00$i\",
         \"userEmail\": \"user$i@example.com\",
         \"amount\": $((100 * i))
       }"
     sleep 0.5
   done
   ```

**Expected Behavior:**
- Messages are **distributed** between Consumer A and Consumer B
- Each message is processed by **only ONE** consumer in the group
- Example output:

  **Consumer A output:**
  ```
  [A] Partition: 0 → {"orderId":"order-001","userEmail":"user1@example.com","amount":100}
  [A] Partition: 0 → {"orderId":"order-003","userEmail":"user3@example.com","amount":300}
  [A] Partition: 0 → {"orderId":"order-005","userEmail":"user5@example.com","amount":500}
  ```

  **Consumer B output:**
  ```
  [B] partition: 1 → {"orderId":"order-002","userEmail":"user2@example.com","amount":200}
  [B] partition: 1 → {"orderId":"order-004","userEmail":"user4@example.com","amount":400}
  [B] partition: 1 → {"orderId":"order-006","userEmail":"user6@example.com","amount":600}
  ```

**Key Points:**
- Consumers in the **same group** share the workload (load balancing)
- Each partition is assigned to **only one** consumer in the group
- Messages are distributed based on partition assignment
- If one consumer fails, the other takes over its partitions (fault tolerance)


## Configuration Details

### Producer Configuration
- **Client ID:** `order-service`
- **Partitioner:** `LegacyPartitioner` (for consistent partition assignment)
- **Topic:** `order-events`
- **Message Key:** Uses `orderId` for partition distribution

### Consumer Configurations

| Consumer | Group ID | Purpose |
|----------|----------|---------|
| `consumer.js` | `email-service-group` | Standalone consumer for Scenario 1 |
| `consumerA.js` | `email-serviceA` | Consumer A for load balancing demo |
| `consumerB.js` | `email-serviceA` | Consumer B for load balancing demo |

All consumers use `fromBeginning: true` to read historical messages.

---

## Cleanup

**Stop all Node.js processes:**
- Press `Ctrl+C` in each terminal

**Stop and remove Kafka containers:**
```bash
docker-compose down
```

**Remove volumes (complete cleanup):**
```bash
docker-compose down -v
```

---

## Learning Resources

- [KafkaJS Documentation](https://kafka.js.org/)
- [Apache Kafka Concepts](https://kafka.apache.org/documentation/#gettingStarted)
- Consumer Groups: Understand how Kafka distributes messages among consumers
- Partitions: Learn how Kafka organizes and scales message storage

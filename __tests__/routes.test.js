process.env.NODE_ENV = 'test'

const request = require('supertest')
const app = require('../app')
const db = require('../db')

let testCustomer
let testReservation

beforeEach(async () => {
    const customerResult = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
        VALUES ('Alice', 'Tester', '904-686-2332', 'test')
        RETURNING id, first_name, last_name, phone, notes;`
        // `INSERT INTO customers (first_name, last_name, phone, notes)
        // VALUES ('Alice', 'Tester', '904-686-2332', 'test')
        // RETURNING id, first_name, last_name, phone, notes`
    )
    testCustomer = customerResult.rows[0]

    const reservationResult = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
        VALUES (${testCustomer.id}, 2023-02-08 12:20:07-07, 4, 'Double date')
        RETURNING id, customer_id, start_at, num_guests, notes`
    )
    testReservation = reservationResult.rows[0]
})

afterEach(async () => {
    await db.query(`DELETE FROM customers`)
    await db.query(`DELETE FROM reservations`)
})

afterAll(async () => {
    await db.end()
})

// Customer routes

describe('/', () => {
    test("Getting landing page", async () => {
        const resp = await request(app).get('/')
        expect(resp.statusCode).toBe(200)
        expect(resp.text).toContain("<h1>Customers</h1>")
        expect(resp.text).toContain('Alice Tester')
    })
})

describe('/add', () => {
    test("Add customer form", async () => {
        const resp = await request(app).get('/add')
        expect(resp.statusCode).toBe(200)
        expect(resp.text).toContain("<h1>Add a Customer</h1>")
    })
    
    test('Adding new customer', async () => {
        const newCustomer = {
            firstName: "Bob",
            lastName: "Tester",
            phone: "386-986-6987",
            notes: "Test"
        }
        
        const resp = await request(app)
            .post('/add')
            .send(newCustomer)

        // expect(resp.statusCode).toBe(201)
    })
})
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
    )
    testCustomer = customerResult.rows[0]

    const date = getDateString()

    const reservationResult = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
        VALUES (${testCustomer.id}, '2023-02-14 18:30:00', 4, 'Double date')
        RETURNING id, customer_id, start_at, num_guests, notes;`
        // `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
        // VALUES (${testCustomer.id}, ${date}, 4, 'Double date')
        // RETURNING id, customer_id, start_at, num_guests, notes;`
    )
    testReservation = reservationResult.rows[0]
})

afterEach(async () => {
    await db.query(`DELETE FROM reservations`)
    await db.query(`DELETE FROM customers`)
})

afterAll(async () => {
    await db.end()
})

// Customer routes

describe('GET /', () => {
    test("Getting landing page", async () => {
        const resp = await request(app).get('/')
        expect(resp.statusCode).toBe(200)
        expect(resp.text).toContain("<h1>Customers</h1>")
        expect(resp.text).toContain('Alice Tester')
    })
})

describe('GET /add', () => {
    test("Add customer form", async () => {
        const resp = await request(app).get('/add')
        expect(resp.statusCode).toBe(200)
        expect(resp.text).toContain("<h1>Add a Customer</h1>")
    })
})

describe('POST /add', () => {
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

        // expect(resp.statusCode).toBe(302)
    })
})

describe('GET /search', () => {
    test('Search for customer', async () => {
        const resp = await request(app).get('/search?name=Alice')
        
        expect(resp.statusCode).toBe(200)
        expect(resp.text).toContain("Alice")
    })
})

describe('GET /best', () => {
    test('Show customer if there are reservations', async () => {
        const resp = await request(app).get('/best')
        
        expect(resp.statusCode).toBe(200)
        expect(resp.text).toContain('Alice')
    })

    test("Don't list any customers if there aren't any reservations", async () => {
        await db.query('DELETE FROM reservations')
        const resp = await request(app).get('/best')
        
        expect(resp.statusCode).toBe(200)
        expect(resp.text).not.toContain('Alice')
    })
})

describe('GET /:id', () => {
    test('Show customer detail page', async () => {
        const resp = await request(app).get(`/${testCustomer.id}`)

        expect(resp.statusCode).toBe(200)
        expect(resp.text).toContain('Alice')
        expect(resp.text).toContain('February')
    })
})

describe('GET /:id/edit', () => {
    test('Show customer edit form', async () => {
        const resp = await request(app).get(`/${testCustomer.id}/edit`)
        
        expect(resp.text).toContain('Edit Customer')
        expect(resp.text).toContain('Cancel')
        expect(resp.text).toContain('test')
    })
})

describe('POST /:id/add-reservation', () => {
    test('Add reservation', async () => {
        const resp = await request(app)
            .post(`/${testCustomer.id}/add-reservation`)
            .send({
                startAt: "2023-2-14 19:00",
                numGuests: 2
            })

        // expect(resp.statusCode).toBe(200)
    })
})

function getDateString() {
    const d = new Date()
    let year = d.getFullYear()
    let month = d.getMonth() + 1
    let day = d.getDate()
    let hour = d.getHours() 
    let minute = d.getMinutes()
    let seconds = d.getSeconds()
    
    if (month < 10) month = `0${month}`
    if (day < 10) day = `0${day}`
    if (hour < 10) hour = `0${hour}`
    if (minute < 10) minute = `0${minute}`
    if (seconds < 10) seconds = `0${seconds}`

    return `${year}-${month}-${day} ${hour}:${minute}:${seconds}`
}
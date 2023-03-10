/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
    this._fullName = `${this.firstName} ${this.lastName}`
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /* Get customers by name */

  static async getByName(name) {
    const results = await db.query(
      `SELECT id, first_name AS "firstName", last_name AS "lastName", phone, notes
      FROM customers
      WHERE to_tsvector($1) @@ to_tsquery(last_name) = 't' OR to_tsvector($1) @@ to_tsquery(first_name);`,
      [name]
    )
    const customers = results.rows.map(row => new Customer(row))
    console.log(customers)
    return results.rows.map(row => new Customer(row))
  }

  /* Get customers with most reservations */

  static async getBestCustomers(count=10) {
    const results = await db.query(
      `SELECT id, first_name as "firstName", last_name AS "lastName", phone, notes
      FROM customers JOIN
      (SELECT COUNT(*) AS Num_Reservations, customer_id
      FROM reservations
      GROUP BY customer_id) AS counts
      ON id = customer_id
      ORDER BY num_reservations DESC
      LIMIT $1;`, [count]
      )

    return results.rows.map(row => new Customer(row))
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  get fullName() {
    return this._fullName
  }
}

module.exports = Customer;

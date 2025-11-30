import express, { NextFunction, Request, Response } from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({path: path.join(process.cwd(), ".env")});

const app = express();
const port = 5000;

app.use(express.json());

const pool = new Pool({
  connectionString: `${process.env.CONNECTION_STRING}`,
});

const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        age INT,
        phone VARCHAR(15),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS todos(
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_completed BOOLEAN DEFAULT FALSE,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error("Error creating table:", error);
  }
};

initDb();

const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};

app.use(logger);


// Home Route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});


// Create User
app.post("/users", async (req: Request, res: Response) => {
  const {name, email, age, phone, address} = req.body;

  try{
    const result = await pool.query(`INSERT INTO users (name, email, age, phone, address) VALUES($1, $2, $3, $4, $5) RETURNING *`, [name, email, age, phone, address]);
    res.status(201).json({success: true, message: "Data inserted successfully", data: result.rows[0]});
  }
  catch(error: any){
    res.status(500).json({success: false, message: error.message});
  }
});


// Get All Users
app.get("/users", async (req: Request, res: Response) => {

  try{
    const result = await pool.query(`SELECT * FROM users`);
    res.status(200).json({success: true, message: "Users retrieved successfully", data: result.rows});
  }
  catch(error: any){
    res.status(500).json({success: false, message: error.message});
  }
});


// Get User by ID
app.get("/users/:id", async (req: Request, res: Response) => {
  const {id} = req.params;

  try{
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    if(result.rows.length === 0){
      return res.status(404).json({success: false, message: "User not found"});
    }
    res.status(200).json({success: true, message: "Users retrieved successfully", data: result.rows});
  }
  catch(error: any){
    res.status(500).json({success: false, message: error.message});
  }
});


// Update User by ID
app.put("/users/:id", async (req: Request, res: Response) => {
  const {name, email, age, phone, address} = req.body;

  try{
    const result = await pool.query(`UPDATE users SET name=$1, email=$2, age=$3, phone=$4, address=$5 WHERE id = $6 RETURNING *`, [name, email, age, phone, address, req.params.id]);
    if(result.rows.length === 0){
      return res.status(404).json({success: false, message: "User not found"});
    }
    res.status(200).json({success: true, message: "Users updated successfully", data: result.rows});
  }
  catch(error: any){
    res.status(500).json({success: false, message: error.message});
  }
});


// Delete User by ID
app.delete("/users/:id", async (req: Request, res: Response) => {
  const {id} = req.params;

  try{
    const result = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    if(result.rowCount === 0){
      return res.status(404).json({success: false, message: "User not found"});
    }
    res.status(200).json({success: true, message: "Users deleted successfully", data: null});
  }
  catch(error: any){
    res.status(500).json({success: false, message: error.message});
  }
});


// Create Todo
app.post("/todos", async (req: Request, res: Response) => {
  const {user_id, title, description} = req.body;

  try{
    const result = await pool.query(`INSERT INTO todos (user_id, title, description) VALUES($1, $2, $3) RETURNING *`, [user_id, title, description]);
    res.status(201).json({success: true, message: "To-do created successfully", data: result.rows[0]});
  }
  catch(error: any){
    res.status(500).json({success: false, message: error.message});
  }
});


// Get All Todos
app.get("/todos", async (req: Request, res: Response) => {

  try{
    const result = await pool.query(`SELECT * FROM todos`);
    res.status(200).json({success: true, message: "TO-dos retrieved successfully", data: result.rows});
  }
  catch(error: any){
    res.status(500).json({success: false, message: error.message});
  }
});


app.use((req: Request, res: Response) => {
  res.status(404).json({success: false, message: "Route not found", path: req.path});
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
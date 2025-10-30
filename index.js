const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const bodyparser = require("body-parser");
const dotenv = require('dotenv');
const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyparser.json());
dotenv.config();
const connectionString = process.env.DATABASE_URL
const client = new Client(connectionString);
client.connect((err) => {
  if (err) {
    return console.error('Não foi possível conectar ao banco.', err);
  }
  client.query('SELECT NOW()', (err, result) => {
    if (err) {
      return console.error('Erro ao executar a query.', err);
    }
    console.log("Conectado. Hora no servidor: ", result.rows[0]);
  });
});
app.get("/", (req, res) => {
  console.log("Response ok.");
  res.status(200).send("Ok – Servidor disponível.");
});
app.listen(process.env.PORT, () =>
  console.log("Servidor funcionando na porta " + process.env.PORT)
);
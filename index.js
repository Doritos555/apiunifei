// declaracoes de bibliotecas
const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const bodyparser = require("body-parser");
// const dotenv = require('dotenv');
const config = require('./config')

//inicializacao de variaveis
const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyparser.json());
// dotenv.config();

//definicao da conexao
const connectionString = config.DATABASE_URL
const client = new Client(connectionString);
//primeira conexao (teste)
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

// definicao da primeira ROTA ou EndPoint da API 
app.get("/", (req, res) => {
  console.log("Response ok.");//dev
  res.status(200).send("Ok – Servidor disponível.");//usuari
});

// rota para retornar TODOS os usuarios do banco de dados 
app.get("/usuarios", (req, res) => {
  try {
    client.query("SELECT * FROM Usuarios", function (err, result) {
      if (err) {
        res.status(501).send("Erro ao executar a qry " + err);
        return console.error("Erro ao executar a qry de SELECT", err);
      }
      res.status(200).send(result.rows);
      console.log("Rota: get usuarios usada");
    });
  } catch (error) {
    console.log(error);
  }
});

// rota para retornar UM usuario especifico
app.get("/usuarios/:id", (req, res) => {
  try {
    console.log("Rota: usuarios/" + req.params.id);
    client.query(
      "SELECT * FROM Usuarios WHERE id = $1", [req.params.id],
      (err, result) => {
        if (err) {
          res.status(501).send("Erro ao executar a qry " + err);
          return console.error("Erro ao executar a qry de SELECT", err);
        }
        res.status(200).send(result.rows[0]);
        //console.log(result);
      }
    );
  } catch (error) {
    console.log(error);
  }
});

// rota para EXCLUIR UM usuario especifico 
app.delete("/usuarios/:id", (req, res) => {
  try {
    console.log("Rota: delete/" + req.params.id);
    client.query(
      "DELETE FROM Usuarios WHERE id = $1", [req.params.id], (err, result) => {
        if (err) {
          res.status(501).send("Erro ao executar a qry " + err);
          return console.error("Erro ao executar a qry de DELETE", err);
        } else {
          if (result.rowCount == 0) {
            res.status(404).json({ info: "Registro não encontrado." });
          } else {
            res.status(200).json({ info: `Registro excluído. Código: ${req.params.id}` });
          }
        }
        console.log(result);
      }
    );
  } catch (error) {
    console.log(error);
  }
});

// rota para INSERIR UM novo usuario 
app.post("/usuarios", (req, res) => {
  try {
    console.log("Alguém enviou um post com os dados:", req.body);
    const { nome, email, altura, peso } = req.body;
    client.query(
      "INSERT INTO Usuarios (nome, email, altura, peso) VALUES ($1, $2, $3, $4) RETURNING * ", [nome, email, altura, peso],
      (err, result) => {
        if (err) {
          res.status(501).send("Erro ao executar a qry " + err);
          return console.error("Erro ao executar a qry de INSERT", err);
        }
        const { id } = result.rows[0];
        res.setHeader("id", `${id}`);
        res.status(201).json(result.rows[0]);
        console.log(result);
      }
    );
  } catch (erro) {
    console.error(erro);
  }
});

//rota para atualizar um usuario especifico
app.put("/usuarios/:id", (req, res) => {
  try {
    console.log("Alguém enviou um update com os dados:", req.body);
    const id = req.params.id;
    const { nome, email, altura, peso } = req.body;
    client.query(
      "UPDATE Usuarios SET nome=$1, email=$2, altura=$3, peso=$4 WHERE id =$5 ",
      [nome, email, altura, peso, id],
      (err, result) => {
        if (err) {
          res.status(501).send("Erro ao executar a qry " + err);
          return console.error("Erro ao executar a qry de UPDATE", err);
        } else {
          res.setHeader("id", id);
          res.status(202).json({ "identificador": id });
          console.log(result);
        }
      }
    );
  } catch (erro) {
    console.error(erro);
  }
});


//tornar a API ativa na porta 9082 
app.listen(config.PORT, () =>
  console.log("Servidor funcionando na porta " + config.PORT)
);

module.exports = app;

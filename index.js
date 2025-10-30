// declaracoes de bibliotecas
const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const bodyparser = require("body-parser");
const config = require('./config'); // Importa as configurações do arquivo config.js

// inicializacao de variaveis
const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyparser.json());

// ⚠️ CORREÇÃO CRÍTICA: Use config.urlConnection, que é o nome da propriedade exportada 
// no seu arquivo config.js, em vez de config.DATABASE_URL.
const connectionString = config.urlConnection; 
const client = new Client(connectionString);

// primeira conexao (teste)
client.connect((err) => {
  if (err) {
    return console.error('❌ ERRO CRÍTICO: Não foi possível conectar ao banco. Verifique .env e config.js.', err);
  }
  client.query('SELECT NOW()', (err, result) => {
    if (err) {
      return console.error('Erro ao executar a query de teste.', err);
    }
    console.log("✅ Conexão Estabelecida. Hora no servidor: ", result.rows[0].now);
  });
});

// definicao da primeira ROTA ou EndPoint da API 
app.get("/", (req, res) => {
  console.log("Response ok."); // log dev
  res.status(200).send("✅ Ok – Servidor disponível."); // resposta usuário
});

// =========================================================================
// ROTA: GET /usuarios - Retorna TODOS os usuários
// =========================================================================
app.get("/usuarios", (req, res) => {
  try {
    const startTime = Date.now(); // Início da medição de tempo

    // 💡 BOAS PRÁTICAS: Adicione ORDER BY para garantir a ordem (e ORDER BY id para replicar a versão anterior)
    client.query("SELECT * FROM Usuarios ORDER BY id", (err, result) => {
      const duration = Date.now() - startTime; // Fim da medição de tempo
      
      console.log(`LOG: Query GET /usuarios executada. Duração: ${duration}ms`); // Log para identificar a lentidão

      if (err) {
        res.status(500).send("Erro ao executar a qry: " + err); // Status 500 para erro interno do servidor
        return console.error("❌ Erro ao executar a qry de SELECT", err);
      }
      
      res.status(200).json(result.rows); // Use .json() para enviar dados JSON
      console.log("Rota: get usuarios usada. Linhas retornadas:", result.rows.length);
    });
  } catch (error) {
    console.error("❌ Erro no bloco TRY/CATCH da rota GET /usuarios:", error);
    res.status(500).send("Erro interno do servidor.");
  }
});

// =========================================================================
// ROTA: GET /usuarios/:id - Retorna UM usuário específico
// =========================================================================
app.get("/usuarios/:id", (req, res) => {
  try {
    console.log("Rota: GET /usuarios/" + req.params.id);
    client.query(
      "SELECT * FROM Usuarios WHERE id = $1", [req.params.id],
      (err, result) => {
        if (err) {
          res.status(500).send("Erro ao executar a qry: " + err);
          return console.error("❌ Erro ao executar a qry de SELECT por ID", err);
        }
        if (result.rowCount === 0) {
           return res.status(404).json({ info: "Usuário não encontrado." });
        }
        res.status(200).json(result.rows[0]);
      }
    );
  } catch (error) {
    console.error("❌ Erro no bloco TRY/CATCH da rota GET /usuarios/:id:", error);
    res.status(500).send("Erro interno do servidor.");
  }
});

// =========================================================================
// ROTA: DELETE /usuarios/:id - EXCLUI UM usuário específico 
// =========================================================================
app.delete("/usuarios/:id", (req, res) => {
  try {
    console.log("Rota: DELETE /usuarios/" + req.params.id);
    client.query(
      "DELETE FROM Usuarios WHERE id = $1", [req.params.id], (err, result) => {
        if (err) {
          res.status(500).send("Erro ao executar a qry: " + err);
          return console.error("❌ Erro ao executar a qry de DELETE", err);
        } else {
          if (result.rowCount == 0) {
            res.status(404).json({ info: "Registro não encontrado para exclusão." });
          } else {
            res.status(200).json({ info: `Registro excluído com sucesso. Código: ${req.params.id}` });
          }
        }
      }
    );
  } catch (error) {
    console.error("❌ Erro no bloco TRY/CATCH da rota DELETE /usuarios/:id:", error);
    res.status(500).send("Erro interno do servidor.");
  }
});

// =========================================================================
// ROTA: POST /usuarios - INSERE UM novo usuário 
// =========================================================================
app.post("/usuarios", (req, res) => {
  try {
    console.log("Recebida requisição POST com os dados:", req.body);
    const { nome, email, altura, peso } = req.body;
    
    // 💡 BOAS PRÁTICAS: Sempre verifique se os dados obrigatórios estão presentes
    if (!nome || !email) {
      return res.status(400).json({ info: "Nome e email são obrigatórios." });
    }

    client.query(
      "INSERT INTO Usuarios (nome, email, altura, peso) VALUES ($1, $2, $3, $4) RETURNING * ", 
      [nome, email, altura, peso],
      (err, result) => {
        if (err) {
          // 23505 é o código de erro para violação de UNIQUE constraint (ex: email repetido)
          if (err.code === '23505') { 
              return res.status(409).json({ info: "Email já cadastrado." });
          }
          res.status(500).send("Erro ao executar a qry: " + err);
          return console.error("❌ Erro ao executar a qry de INSERT", err);
        }
        const { id } = result.rows[0];
        res.setHeader("Location", `/usuarios/${id}`); // Boas práticas REST: Location header
        res.status(201).json(result.rows[0]);
        console.log("Novo usuário inserido com sucesso. ID:", id);
      }
    );
  } catch (erro) {
    console.error("❌ Erro no bloco TRY/CATCH da rota POST /usuarios:", erro);
    res.status(500).send("Erro interno do servidor.");
  }
});

// =========================================================================
// ROTA: PUT /usuarios/:id - Atualiza um usuário específico
// =========================================================================
app.put("/usuarios/:id", (req, res) => {
  try {
    console.log(`Recebida requisição PUT para ID ${req.params.id} com dados:`, req.body);
    const id = req.params.id;
    const { nome, email, altura, peso } = req.body;

    client.query(
      "UPDATE Usuarios SET nome=$1, email=$2, altura=$3, peso=$4 WHERE id =$5 RETURNING *", // Adicionado RETURNING *
      [nome, email, altura, peso, id],
      (err, result) => {
        if (err) {
          if (err.code === '23505') { 
              return res.status(409).json({ info: "Email já cadastrado em outro usuário." });
          }
          res.status(500).send("Erro ao executar a qry: " + err);
          return console.error("❌ Erro ao executar a qry de UPDATE", err);
        } else {
          if (result.rowCount === 0) {
             return res.status(404).json({ info: "Registro não encontrado para atualização." });
          }
          // Retorna o objeto atualizado (se usou RETURNING *) ou só um status 200/202
          res.status(200).json(result.rows[0]);
          console.log(`Usuário ID ${id} atualizado com sucesso.`);
        }
      }
    );
  } catch (erro) {
    console.error("❌ Erro no bloco TRY/CATCH da rota PUT /usuarios/:id:", erro);
    res.status(500).send("Erro interno do servidor.");
  }
});

// tornar a API ativa na porta
app.listen(config.port, () => // 💡 CORREÇÃO: Usar config.port, que é o nome da propriedade exportada
  console.log("🟢 Servidor funcionando na porta " + config.port)
);

module.exports = app;

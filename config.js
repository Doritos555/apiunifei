const dotenv = require('dotenv');
dotenv.config();
const {
    PORT,
    DATABASE_URL // <-- Mude para DATABASE_URL para corresponder ao .env
} = process.env;
module.exports = {
    port: PORT,
    urlConnection: DATABASE_URL // <-- Mude aqui também
}

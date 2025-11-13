// CRUD for users
const fs = require("fs");
const path = require("path");
const dbPath = path.join(__dirname, "../db/usersDB.json");

const readDB = () => JSON.parse(fs.readFileSync(dbPath, "utf-8"));
const writeDB = (data) =>
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

function createUser(email, password, address) {
  const db = readDB();
  const id = db.length ? Math.max(...db.map((u) => u.id)) + 1 : 1;
  const user = { id, email, password, address };
  db.push(user);
  writeDB(db);
}

function deleteUser(id) {
  let db = readDB();
  db = db.filter((u) => u.id !== id);
  writeDB(db);
}

function updateAddress(id, value) {  
  const db = readDB();
  const user = db.find((u) => u.id === id);
  if (user) {
    user.address = value;
    writeDB(db);
    return true;
  }
  return false;
}

module.exports = {
  createUser,
  deleteUser,
  updateAddress,
};

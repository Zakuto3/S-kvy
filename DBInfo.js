var config1 = {
  user: '', //env var: PGUSER
  database: '', //env var: PGDATABASE
  password: '', //env var: PGPASSWORD
  host: '', // Server hosting the postgres database
  port: , //env var: PGPORT
  max: , // max number of clients in the pool
  idleTimeoutMillis: , // how long a client is allowed to remain idle before being closed
};

var config2 = {
  user: '', //env var: PGUSER
  database: '', //env var: PGDATABASE
  password: '', //env var: PGPASSWORD
  host: '', // Server hosting the postgres database
  port: , //env var: PGPORT
  max: , // max number of clients in the pool
  idleTimeoutMillis: , // how long a client is allowed to remain idle before being closed
};


//ECMAScript 5
module.exports.config1 = config1;
module.exports.config2 = config2;

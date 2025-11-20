Integration / DB helpers
=======================

This folder contains helper artifacts to initialize and seed the MySQL database used by the Express API in `config/`.

Files:
- `schema.sql` - SQL statements to create the `btl_robotics` database and the `contacts` and `products` tables.
- `seed.js` - Node.js script that uses the existing `config/db.js` pool to create tables and insert demo products idempotently.

How to run
----------
1. Ensure MySQL is running and credentials in `.env` (or `config/db.config.js`) are correct.
2. From project root run:

```bash
# use node to run the seed script
node integration/seed.js
```

The script will create tables if they do not exist and insert demo products. It uses the same connection pool as the application (`config/db.js`).

Notes
-----
- The repository appears not to be a git repo in this environment; before running destructive operations, create backups.
- The API routes are already implemented under `config/routes` and `config/controllers`. This integration only seeds the DB and does not modify existing source files.

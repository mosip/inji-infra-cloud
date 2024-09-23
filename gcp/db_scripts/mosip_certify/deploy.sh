
## Properties file
set -e

## Grants
PGPASSWORD=$SU_USER_PWD psql -v ON_ERROR_STOP=1 --username=$SU_USER --host=$DB_SERVERIP --port=$DB_PORT --dbname=$DEFAULT_DB_NAME -f init.sql


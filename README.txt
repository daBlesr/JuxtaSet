Information to run this locally.

I assume you have installed a python virtual environment with the packages from requirements.txt

$ sudo apt-get install postgresql postgresql-contrib
$ sudo -i -u postgres

fill in the name of your linux username
$ createuser --interactive
$ createdb {LINUX_USERNAME}
$ psql

set a password for your postgres user
{LINUX_USERNAME}=# ALTER USER {LINUX_USERNAME} WITH PASSWORD '{your-password}';

create .env by copying contents .env.example and update it.

$ sudo apt-get install pgadmin3
$ pgadmin3

Fill in connection information in pgadmin3.
Then execute raw sql on the data from master/controllers/scripts/postgresinitialize.sql


$ export FLASK_APP=master/app.py
$ export FLASK_ENV=development
$ venv/bin/python3.6 -m flask run

go to http://127.0.0.1:5000
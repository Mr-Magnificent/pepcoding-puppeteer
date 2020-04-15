require('dotenv').config();

require = require('esm')(module);
require('./src/cli').cli(process.argv);
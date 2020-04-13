require('dotenv').config({
    path: process.cwd() + '../.env'
});

require = require('esm')(module);
require('../src/cli').cli(process.argv);
const path = require('path');
const fs = require('fs');

const packageJson = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJson).toString());

const newVersion = process.env.tag_name;
const version = pkg['version'];

if (version !== newVersion) {
    pkg['version'] = newVersion;

    fs.rmSync(packageJson);
    fs.writeFileSync(packageJson, JSON.stringify(pkg, null, 2));

    console.info(`UPDATED_VERSION=true`);
} else
    console.info(`UPDATED_VERSION=false`);

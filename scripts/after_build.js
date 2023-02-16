/**
 * This gets run after building all the js files from ts. Updates some files, and copies some extra.
 * @file after_build.js
 */

// Add .js extension to all imports
import './fix_imports.js';

// Move all sql files
import './copy_sql.js';

// Copy the default config file
import './copy_config';

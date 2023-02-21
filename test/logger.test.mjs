import assert from "node:assert";

import {exposedForTesting as logger, LogLevels} from '../cli/logger.js';

describe('Test log functions', function () {
    it('LogLevels available', function () {
        assert.equal(LogLevels.length, 5);
    });

    it('should find log level', function () {
        assert.equal(logger.findLogLevelIndex('error'), 0);
        assert.equal(logger.findLogLevelIndex('warn'), 1);
        assert.equal(logger.findLogLevelIndex('info'), 2);
        assert.equal(logger.findLogLevelIndex('debug'), 3);
    });

    it('should check log level correctly', function () {
        assert.equal(logger.findLogLevelIndex('error'), 0);
        assert.equal(logger.findLogLevelIndex('warn'), 1);
        assert.equal(logger.findLogLevelIndex('info'), 2);
        assert.equal(logger.findLogLevelIndex('debug'), 3);
    });
});

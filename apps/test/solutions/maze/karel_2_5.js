var testUtils = require('../../util/testUtils');
var TestResults = require('@cdo/apps/constants.js').TestResults;


module.exports = {
  app: "maze",
  levelFile: "karelLevels",
  levelId: "2_5",
  tests: [
    {
      description: "Top Solve: Repeat 3x { Forward, Remove6, Forward }",
      expected: {
        result: true,
        testResult: TestResults.ALL_PASS
      },
      missingBlocks: [],
      xml: '<xml><block type="controls_repeat"><title name="TIMES">3</title><statement name="DO"><block type="maze_moveForward"><next><block type="procedures_callnoreturn"><mutation name="remove 6"></mutation><next><block type="maze_moveForward"></block></next></block></next></block></statement></block><block type="procedures_defnoreturn" deletable="false" editable="false"><mutation></mutation><title name="NAME">remove 6</title><statement name="STACK"><block type="controls_repeat"><title name="TIMES">6</title><statement name="DO"><block type="maze_dig"></block></statement></block></statement></block></xml>'
    }
  ]
};

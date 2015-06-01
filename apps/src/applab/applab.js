/**
 * CodeOrgApp: Applab
 *
 * Copyright 2014-2015 Code.org
 *
 */
/* global $ */
/* global dashboard */

'use strict';
require('./acemode/mode-javascript_codeorg');
var studioApp = require('../StudioApp').singleton;
var commonMsg = require('../locale');
var applabMsg = require('./locale');
var skins = require('../skins');
var codegen = require('../codegen');
var api = require('./api');
var apiBlockly = require('./apiBlockly');
var dontMarshalApi = require('./dontMarshalApi');
var blocks = require('./blocks');
var page = require('../templates/page.html.ejs');
var dom = require('../dom');
var parseXmlElement = require('../xml').parseElement;
var utils = require('../utils');
var dropletUtils = require('../dropletUtils');
var dropletConfig = require('./dropletConfig');
var Slider = require('../slider');
var AppStorage = require('./appStorage');
var constants = require('../constants');
var KeyCodes = constants.KeyCodes;
var _ = utils.getLodash();
// var Hammer = utils.getHammer();
var apiTimeoutList = require('../timeoutList');
var annotationList = require('./acemode/annotationList');
var designMode = require('./designMode');
var applabTurtle = require('./applabTurtle');
var applabCommands = require('./commands');
var JSInterpreter = require('../JSInterpreter');
var StepType = JSInterpreter.StepType;
var elementLibrary = require('./designElements/library');

var vsprintf = require('./sprintf').vsprintf;

var ResultType = studioApp.ResultType;
var TestResults = studioApp.TestResults;

/**
 * Create a namespace for the application.
 */
var Applab = module.exports;

var errorHandler = require('./errorHandler');
var outputApplabConsole = errorHandler.outputApplabConsole;
var outputError = errorHandler.outputError;
var ErrorLevel = errorHandler.ErrorLevel;

var level;
var skin;

//TODO: Make configurable.
studioApp.setCheckForEmptyBlocks(true);

var MAX_INTERPRETER_STEPS_PER_TICK = 10000;

// Default Scalings
Applab.scale = {
  'snapRadius': 1,
  'stepSpeed': 0
};

var twitterOptions = {
  text: applabMsg.shareApplabTwitter(),
  hashtag: "ApplabCode"
};

var MIN_DEBUG_AREA_HEIGHT = 70;
var MAX_DEBUG_AREA_HEIGHT = 400;

// The typical width of the visualization area (indepdendent of appWidth)
var vizAppWidth = 400;
// The default values for appWidth and appHeight (if not specified in the level)
var defaultAppWidth = 400;
var defaultAppHeight = 400;

function loadLevel() {
  Applab.timeoutFailureTick = level.timeoutFailureTick || Infinity;
  Applab.minWorkspaceHeight = level.minWorkspaceHeight;
  Applab.softButtons_ = level.softButtons || {};
  Applab.appWidth = level.appWidth || defaultAppWidth;
  Applab.appHeight = level.appHeight || defaultAppHeight;

  // Override scalars.
  for (var key in level.scale) {
    Applab.scale[key] = level.scale[key];
  }
}

//
// Adjust a media height rule (if needed). This is called by adjustAppSizeStyles
// for all media rules. We look for a specific set of rules that should be in
// the stylesheet and swap out the defaultHeightRules with the newHeightRules
//

function adjustMediaHeightRule(mediaList, defaultHeightRules, newHeightRules) {
  // The media rules we are looking for always have two components. The first
  // component is for screen width, which we ignore. The second is for screen
  // height, which we want to modify:
  if (mediaList.length === 2) {
    var lastHeightRuleIndex = defaultHeightRules.length - 1;
    for (var i = 0; i <= lastHeightRuleIndex; i++) {
      if (-1 !== mediaList.item(1).indexOf("(min-height: " +
          (defaultHeightRules[i] + 1) + "px)")) {
        if (i === 0) {
          // Matched the first rule (no max height)
          mediaList.mediaText = mediaList.item(0) +
              ", screen and (min-height: " + (newHeightRules[i] + 1) + "px)";
        } else {
          // Matched one of the middle rules with a min and a max height
          mediaList.mediaText = mediaList.item(0) +
              ", screen and (min-height: " + (newHeightRules[i] + 1) + "px)" +
              " and (max-height: " + newHeightRules[i - 1] + "px)";
        }
        break;
      } else if (mediaList.item(1) === "screen and (max-height: " +
                 defaultHeightRules[lastHeightRuleIndex] + "px)") {
        // Matched the last rule (no min height)
        mediaList.mediaText = mediaList.item(0) +
            ", screen and (max-height: " +
            newHeightRules[lastHeightRuleIndex] + "px)";
        break;
      }
    }
  }
}

//
// The visualization area adjusts its size using a series of CSS rules that are
// tuned to make adjustments assuming a 400x400 visualization. Since applab
// allows its visualization size to be set on a per-level basis, the function
// below modifies the CSS rules to account for the per-level coordinates
//
// It also adjusts the height rules based on the adjusted visualization size
// and the offset where the app has been embedded in the page
//
// The visualization column will remain at 400 pixels wide in the max-width
// case and scale downward from there. The visualization height will be set
// to preserve the proper aspect ratio with respect to the current width.
//
// The divApplab coordinate space will be Applab.appWidth by Applab.appHeight.
// The scale values are then adjusted such that the max-width case may result
// in a scaled-up version of divApplab and the min-width case will typically
// result in a scaled-down version of divApplab.
//
// @returns {Array.<number>} Array of scale factors which will be used
//     on the applab app area at the following screen widths, respectively:
//     1151px+; 1101-1150px; 1051-1100px; 1001-1050px; 0-1000px.
//

function adjustAppSizeStyles(container) {
  var vizScale = 1;
  // We assume these are listed in this order:
  var defaultScaleFactors = [ 1.0, 0.875, 0.75, 0.625, 0.5 ];
  var scaleFactors = defaultScaleFactors.slice(0);
  if (vizAppWidth !== Applab.appWidth) {
    vizScale = vizAppWidth / Applab.appWidth;
    for (var ind = 0; ind < scaleFactors.length; ind++) {
      scaleFactors[ind] *= vizScale;
    }
  }
  var vizAppHeight = Applab.appHeight * vizScale;

  // Compute new height rules:
  // (1) defaults are scaleFactors * defaultAppHeight + 200 (belowViz estimate)
  // (2) we adjust the height rules to take into account where the codeApp
  // div is anchored on the page. If this changes after this function is called,
  // the media rules for height are no longer valid.
  // (3) we assume that there is nothing below codeApp on the page that also
  // needs to be included in the height rules
  // (4) there is no 5th height rule in the array because the 5th rule in the
  // stylesheet has no minimum specified. It just uses the max-height from the
  // 4th item in the array.
  var defaultHeightRules = [ 600, 550, 500, 450 ];
  var newHeightRules = defaultHeightRules.slice(0);
  for (var z = 0; z < newHeightRules.length; z++) {
    newHeightRules[z] += container.offsetTop +
        (vizAppHeight - defaultAppHeight) * defaultScaleFactors[z];
  }

  var ss = document.styleSheets;
  for (var i = 0; i < ss.length; i++) {
    if (ss[i].href && (ss[i].href.indexOf('applab.css') !== -1)) {
      // We found our applab specific stylesheet:
      var rules = ss[i].cssRules || ss[i].rules;
      var changedRules = 0;
      var curScaleIndex = 0;
      // Change the width/height plus a set of rules for each scale factor:
      var totalRules = 1 + scaleFactors.length;
      for (var j = 0; j < rules.length && changedRules < totalRules; j++) {
        var childRules = rules[j].cssRules || rules[j].rules;
        if (rules[j].selectorText === "div#visualization") {
          // set the 'normal' width/height for the visualization itself
          rules[j].style.cssText = "height: " + vizAppHeight +
                                   "px; width: " + vizAppWidth + "px;";
          changedRules++;
        } else if (rules[j].media && childRules) {
          adjustMediaHeightRule(rules[j].media, defaultHeightRules, newHeightRules);

          // NOTE: selectorText can appear in two different forms when styles and IDs
          // are both present. IE places the styles before the IDs, so we match both forms:
          var changedChildRules = 0;
          var scale = scaleFactors[curScaleIndex];
          for (var k = 0; k < childRules.length && changedChildRules < 8; k++) {
            if (childRules[k].selectorText === "div#visualization.responsive" ||
                childRules[k].selectorText === "div.responsive#visualization") {
              // For this scale factor...
              // set the max-height and max-width for the visualization
              childRules[k].style.cssText = "max-height: " +
                  Applab.appHeight * scale + "px; max-width: " +
                  Applab.appWidth * scale + "px;";
              changedChildRules++;
            } else if (childRules[k].selectorText === "div#visualizationColumn.responsive" ||
                       childRules[k].selectorText === "div.responsive#visualizationColumn") {
              // set the max-width for the parent visualizationColumn
              childRules[k].style.cssText = "max-width: " +
                  Applab.appWidth * scale + "px;";
              changedChildRules++;
            } else if (childRules[k].selectorText === "div#visualizationColumn.responsive.with_padding" ||
                       childRules[k].selectorText === "div.with_padding.responsive#visualizationColumn") {
              // set the max-width for the parent visualizationColumn (with_padding)
              childRules[k].style.cssText = "max-width: " +
                  (Applab.appWidth * scale + 2) + "px;";
              changedChildRules++;
            } else if (childRules[k].selectorText === "div#codeWorkspace") {
              // set the left for the codeWorkspace
              childRules[k].style.cssText = "left: " +
                  Applab.appWidth * scale + "px;";
              changedChildRules++;
            } else if (childRules[k].selectorText === "div#visualizationResizeBar") {
              // set the left for the visualizationResizeBar
              childRules[k].style.cssText = "left: " +
                  Applab.appWidth * scale + "px;";
              changedChildRules++;
            } else if (childRules[k].selectorText === "html[dir='rtl'] div#codeWorkspace") {
              // set the right for the codeWorkspace (RTL mode)
              childRules[k].style.cssText = "right: " +
                  Applab.appWidth * scale + "px;";
              changedChildRules++;
            } else if (childRules[k].selectorText === "html[dir='rtl'] div#visualizationResizeBar") {
              // set the right for the visualizationResizeBar (RTL mode)
              childRules[k].style.cssText = "right: " +
                  Applab.appWidth * scale + "px;";
              changedChildRules++;
            } else if (childRules[k].selectorText === "div#visualization.responsive > *" ||
                       childRules[k].selectorText === "div.responsive#visualization > *") {
              // and set the scale factor for all children of the visualization
              // (importantly, the divApplab element)
              childRules[k].style.cssText = "-webkit-transform: scale(" + scale +
                  ");-ms-transform: scale(" + scale +
                  ");transform: scale(" + scale + ");";
              changedChildRules++;
            }
          }
          if (changedChildRules) {
            curScaleIndex++;
            changedRules++;
          }
        }
      }
      // After processing the applab.css, stop looking for stylesheets:
      break;
    }
  }
}

var drawDiv = function () {
  var divApplab = document.getElementById('divApplab');
  divApplab.style.width = Applab.appWidth + "px";
  divApplab.style.height = Applab.appHeight + "px";
  designMode.onClear();
};

Applab.stepSpeedFromSliderSpeed = function (sliderSpeed) {
  return 300 * Math.pow(1 - sliderSpeed, 2);
};

function getCurrentTickLength() {
  var stepSpeed = Applab.scale.stepSpeed;
  if (Applab.speedSlider) {
    stepSpeed = Applab.stepSpeedFromSliderSpeed(Applab.speedSlider.getValue());
  }
  return stepSpeed;
}

function queueOnTick() {
  window.setTimeout(Applab.onTick, getCurrentTickLength());
}

function onDebugInputKeyDown(e) {
  if (e.keyCode == KeyCodes.ENTER) {
    var input = e.target.textContent;
    e.target.textContent = '';
    outputApplabConsole('> ' + input);
    if (Applab.JSInterpreter) {
      var currentScope = Applab.JSInterpreter.interpreter.getScope();
      var evalInterpreter = new window.Interpreter(input);
      // Set console scope to the current scope of the running program

      // NOTE: we are being a little tricky here (we are re-running
      // part of the Interpreter constructor with a different interpreter's
      // scope)
      evalInterpreter.populateScope_(evalInterpreter.ast, currentScope);
      evalInterpreter.stateStack = [{
          node: evalInterpreter.ast,
          scope: currentScope,
          thisExpression: currentScope
      }];
      // Copy these properties directly into the evalInterpreter so the .isa()
      // method behaves as expected
      ['ARRAY', 'BOOLEAN', 'DATE', 'FUNCTION', 'NUMBER', 'OBJECT', 'STRING',
        'UNDEFINED'].forEach(
        function (prop) {
          evalInterpreter[prop] = Applab.JSInterpreter.interpreter[prop];
        });
      try {
        evalInterpreter.run();
        outputApplabConsole('< ' + String(evalInterpreter.value));
      }
      catch (err) {
        outputApplabConsole('< ' + String(err));
      }
    } else {
      outputApplabConsole('< (not running)');
    }
  }
}

function selectEditorRowCol(row, col) {
  if (studioApp.editor.currentlyUsingBlocks) {
    var style = {color: '#FFFF22'};
    studioApp.editor.clearLineMarks();
    studioApp.editor.markLine(row, style);
  } else {
    var selection = studioApp.editor.aceEditor.getSelection();
    var range = selection.getRange();

    range.start.row = row;
    range.start.column = col;
    range.end.row = row;
    range.end.column = col + 1;

    // setting with the backwards parameter set to true - this prevents horizontal
    // scrolling to the right
    selection.setSelectionRange(range, true);
  }
}

function handleExecutionError(err, lineNumber) {
  if (!lineNumber && err instanceof SyntaxError) {
    // syntax errors came before execution (during parsing), so we need
    // to determine the proper line number by looking at the exception
    lineNumber = err.loc.line - Applab.userCodeLineOffset;
    // Now select this location in the editor, since we know we didn't hit
    // this while executing (in which case, it would already have been selected)
    selectEditorRowCol(lineNumber - 1, err.loc.column);
  }
  if (!lineNumber && Applab.JSInterpreter) {
    lineNumber = 1 + codegen.getNearestUserCodeLine(Applab.JSInterpreter.interpreter,
                                                    Applab.cumulativeLength,
                                                    Applab.userCodeStartOffset,
                                                    Applab.userCodeLength);
  }
  outputError(String(err), ErrorLevel.ERROR, lineNumber);
  Applab.executionError = err;

  // Call onPuzzleComplete() here if we want to create levels that end
  // automatically without requiring a press of the Finish button:
}

Applab.getCode = function () {
  return studioApp.editor.getValue();
};

Applab.getHtml = function () {
  return Applab.levelHtml;
};

Applab.onTick = function() {
  if (!Applab.running) {
    return;
  }

  Applab.tickCount++;
  queueOnTick();

  if (Applab.JSInterpreter) {
    Applab.JSInterpreter.executeInterpreter(Applab.tickCount === 1);
  } else {
    Applab.executeNativeJS();
  }

  if (checkFinished()) {
    Applab.onPuzzleComplete();
  }
};

Applab.executeNativeJS = function () {
  if (Applab.tickCount === 1) {
    try { Applab.whenRunFunc(studioApp, apiBlockly, Applab.Globals); } catch (e) { }
  }
};

/**
 * Initialize Blockly and Applab for read-only (blocks feedback).
 * Called on iframe load for read-only.
 */
Applab.initReadonly = function(config) {
  // Do some minimal level loading so that
  // we can ensure that the blocks are appropriately modified for this level
  skin = config.skin;
  level = config.level;
  loadLevel();

  // Applab.initMinimal();

  studioApp.initReadonly(config);
};

/**
 * Initialize Blockly and the Applab app.  Called on page load.
 */
Applab.init = function(config) {
  // replace studioApp methods with our own
  studioApp.reset = this.reset.bind(this);
  studioApp.runButtonClick = this.runButtonClick.bind(this);

  Applab.clearEventHandlersKillTickLoop();
  skin = config.skin;
  level = config.level;
  Applab.user = {
    applabUserId: config.applabUserId,
    isAdmin: (config.isAdmin === true)
  };

  loadLevel();

  if (studioApp.hideSource) {
    // always run at max speed if source is hidden
    config.level.sliderSpeed = 1.0;
  }

  // If we are in mobile sharing mode, allow the viewport to handle scaling
  // and override our default width target in vizAppWidth with the actual width
  if (dom.isMobile() && config.hideSource) {
    vizAppWidth = Applab.appWidth;
  }

  adjustAppSizeStyles(document.getElementById(config.containerId));

  var showSlider = !config.hideSource && config.level.editCode;
  var showDebugButtons = !config.hideSource && config.level.editCode;
  var showDebugConsole = !config.hideSource && config.level.editCode;
  var firstControlsRow = require('./controls.html.ejs')({
    assetUrl: studioApp.assetUrl,
    showSlider: showSlider,
    finishButton: !level.isProjectLevel
  });
  var extraControlsRow = require('./extraControlRows.html.ejs')({
    assetUrl: studioApp.assetUrl,
    debugButtons: showDebugButtons,
    debugConsole: showDebugConsole
  });

  config.html = page({
    assetUrl: studioApp.assetUrl,
    data: {
      localeDirection: studioApp.localeDirection(),
      visualization: require('./visualization.html.ejs')(),
      controls: firstControlsRow,
      extraControlRows: extraControlsRow,
      blockUsed: undefined,
      idealBlockNumber: undefined,
      editCode: level.editCode,
      blockCounterClass: 'block-counter-default',
      pinWorkspaceToBottom: true,
      // TODO (brent) - seems a little gross that we've made this part of a
      // template shared across all apps
      hasDesignMode: Applab.user.isAdmin
    }
  });

  config.loadAudio = function() {
    studioApp.loadAudio(skin.winSound, 'win');
    studioApp.loadAudio(skin.failureSound, 'failure');
  };

  config.afterInject = function() {
    if (studioApp.isUsingBlockly()) {
      /**
       * The richness of block colours, regardless of the hue.
       * MOOC blocks should be brighter (target audience is younger).
       * Must be in the range of 0 (inclusive) to 1 (exclusive).
       * Blockly's default is 0.45.
       */
      Blockly.HSV_SATURATION = 0.6;

      Blockly.SNAP_RADIUS *= Applab.scale.snapRadius;
    }
    drawDiv();
  };

  config.afterEditorReady = function() {
    // Set up an event handler to create breakpoints when clicking in the
    // ace gutter:
    var aceEditor = studioApp.editor.aceEditor;
    if (aceEditor) {
      aceEditor.on("guttermousedown", function(e) {
        var target = e.domEvent.target;
        if (target.className.indexOf("ace_gutter-cell") == -1) {
          return;
        }
        var row = e.getDocumentPosition().row;
        var bps = e.editor.session.getBreakpoints();
        if (bps[row]) {
          e.editor.session.clearBreakpoint(row);
        } else {
          e.editor.session.setBreakpoint(row);
        }
        e.stop();
      });
    }

    if (studioApp.share) {
      // automatically run in share mode:
      window.setTimeout(Applab.runButtonClick.bind(studioApp), 0);
    }
  };

  // arrangeStartBlocks(config);

  config.twitter = twitterOptions;

  // hide makeYourOwn on the share page
  config.makeYourOwn = false;

  config.varsInGlobals = true;
  config.noButtonsBelowOnMobileShare = true;

  config.dropletConfig = dropletConfig;
  config.pinWorkspaceToBottom = true;

  config.vizAspectRatio = Applab.appWidth / Applab.appHeight;
  config.nativeVizWidth = Applab.appWidth;

  // Since the app width may not be 400, set this value in the config to
  // ensure that the viewport is set up properly for scaling it up/down
  config.mobileNoPaddingShareWidth = config.level.appWidth;

  // Applab.initMinimal();

  Applab.levelHtml = level.levelHtml || "";

  studioApp.init(config);

  var viz = document.getElementById('visualization');
  var vizCol = document.getElementById('visualizationColumn');

  if (!config.noPadding) {
    viz.className += " with_padding";
    vizCol.className += " with_padding";
  }

  if (config.embed || config.hideSource) {
    // no responsive styles active in embed or hideSource mode, so set sizes:
    viz.style.width = Applab.appWidth + 'px';
    viz.style.height = Applab.appHeight + 'px';
    // Use offsetWidth of viz so we can include any possible border width:
    vizCol.style.maxWidth = viz.offsetWidth + 'px';
  }

  if (level.editCode) {
    // Initialize the slider.
    var slider = document.getElementById('applab-slider');
    if (slider) {
      Applab.speedSlider = new Slider(10, 27, 130, slider);

      // Change default speed (eg Speed up levels that have lots of steps).
      if (config.level.sliderSpeed) {
        Applab.speedSlider.setValue(config.level.sliderSpeed);
      }
    }
    var debugInput = document.getElementById('debug-input');
    if (debugInput) {
      debugInput.addEventListener('keydown', onDebugInputKeyDown);
    }
  }

  var debugResizeBar = document.getElementById('debugResizeBar');
  if (debugResizeBar) {
    dom.addMouseDownTouchEvent(debugResizeBar,
                               Applab.onMouseDownDebugResizeBar);
    // Can't use dom.addMouseUpTouchEvent() because it will preventDefault on
    // all touchend events on the page, breaking click events...
    document.body.addEventListener('mouseup', Applab.onMouseUpDebugResizeBar);
    var mouseUpTouchEventName = dom.getTouchEventName('mouseup');
    if (mouseUpTouchEventName) {
      document.body.addEventListener(mouseUpTouchEventName,
                                     Applab.onMouseUpDebugResizeBar);
    }
  }

  var finishButton = document.getElementById('finishButton');
  if (finishButton) {
    dom.addClickTouchEvent(finishButton, Applab.onPuzzleComplete);
  }

  if (level.editCode) {
    var pauseButton = document.getElementById('pauseButton');
    var continueButton = document.getElementById('continueButton');
    var stepInButton = document.getElementById('stepInButton');
    var stepOverButton = document.getElementById('stepOverButton');
    var stepOutButton = document.getElementById('stepOutButton');
    if (pauseButton && continueButton && stepInButton && stepOverButton && stepOutButton) {
      dom.addClickTouchEvent(pauseButton, Applab.onPauseContinueButton);
      dom.addClickTouchEvent(continueButton, Applab.onPauseContinueButton);
      dom.addClickTouchEvent(stepInButton, Applab.onStepInButton);
      dom.addClickTouchEvent(stepOverButton, Applab.onStepOverButton);
      dom.addClickTouchEvent(stepOutButton, Applab.onStepOutButton);
    }
    var viewDataButton = document.getElementById('viewDataButton');
    if (viewDataButton) {
      // Simulate a run button click, to load the channel id.
      var viewDataClick = studioApp.runButtonClickWrapper.bind(
          studioApp, Applab.onViewData);
      var throttledViewDataClick = _.debounce(viewDataClick, 250, true);
      dom.addClickTouchEvent(viewDataButton, throttledViewDataClick);
    }

    designMode.renderDesignModeBox();

    // TODO(dave): make DesignModeHeaders and DesignModeBox share a
    // parent component.
    designMode.configureDesignModeHeaders();

    designMode.configureDesignToggleRow();

    // Start out in regular mode. Eventually likely want this to be a level setting
    designMode.toggleDesignMode(false);

    var designModeClear = document.getElementById('designModeClear');
    if (designModeClear) {
      dom.addClickTouchEvent(designModeClear, designMode.onClear);
    }

    designMode.configureDragAndDrop();
  }
};

Applab.onMouseDownDebugResizeBar = function (event) {
  // When we see a mouse down in the resize bar, start tracking mouse moves:

  if (event.srcElement.id === 'debugResizeBar') {
    Applab.draggingDebugResizeBar = true;
    document.body.addEventListener('mousemove', Applab.onMouseMoveDebugResizeBar);
    Applab.mouseMoveTouchEventName = dom.getTouchEventName('mousemove');
    if (Applab.mouseMoveTouchEventName) {
      document.body.addEventListener(Applab.mouseMoveTouchEventName,
                                     Applab.onMouseMoveDebugResizeBar);
    }

    event.preventDefault();
  }
};

/**
*  Handle mouse moves while dragging the debug resize bar.
*/
Applab.onMouseMoveDebugResizeBar = function (event) {
  var debugResizeBar = document.getElementById('debugResizeBar');
  var codeApp = document.getElementById('codeApp');
  var codeTextbox = document.getElementById('codeTextbox');
  var debugArea = document.getElementById('debug-area');

  var rect = debugResizeBar.getBoundingClientRect();
  var offset = (parseInt(window.getComputedStyle(codeApp).bottom, 10) || 0) -
               rect.height / 2;
  var newDbgHeight = Math.max(MIN_DEBUG_AREA_HEIGHT,
                       Math.min(MAX_DEBUG_AREA_HEIGHT,
                                (window.innerHeight - event.pageY) - offset));

  codeTextbox.style.bottom = newDbgHeight + 'px';
  debugArea.style.height = newDbgHeight + 'px';

  // Prevent the codeTextbox from being shrunk too small vertically
  // (half for code, half for debug-area, minus half toolbar height + 1px border)
  //
  // (we would do this in CSS, but for precedence rules to work properly, if
  //  we explicitly set bottom/height styles on the elements above, we need to
  //  do the same for these styles as well)

  codeTextbox.style.minHeight = 'calc(50% - 21px)';
  debugArea.style.maxHeight = 'calc(50% - 21px)';

  // Fire resize so blockly and droplet handle this type of resize properly:
  utils.fireResizeEvent();
};

Applab.onMouseUpDebugResizeBar = function (event) {
  // If we have been tracking mouse moves, remove the handler now:
  if (Applab.draggingDebugResizeBar) {
    document.body.removeEventListener('mousemove', Applab.onMouseMoveDebugResizeBar);
    if (Applab.mouseMoveTouchEventName) {
      document.body.removeEventListener(Applab.mouseMoveTouchEventName,
                                        Applab.onMouseMoveDebugResizeBar);
    }
    Applab.draggingDebugResizeBar = false;
  }
};

/**
 * Clear the event handlers and stop the onTick timer.
 */
Applab.clearEventHandlersKillTickLoop = function() {
  Applab.whenRunFunc = null;
  Applab.running = false;
  Applab.tickCount = 0;

  var spinner = document.getElementById('spinner');
  if (spinner) {
    spinner.style.visibility = 'hidden';
  }

  var pauseButton = document.getElementById('pauseButton');
  var continueButton = document.getElementById('continueButton');
  var stepInButton = document.getElementById('stepInButton');
  var stepOverButton = document.getElementById('stepOverButton');
  var stepOutButton = document.getElementById('stepOutButton');
  if (pauseButton && continueButton && stepInButton && stepOverButton && stepOutButton) {
    pauseButton.style.display = "inline-block";
    pauseButton.disabled = true;
    continueButton.style.display = "none";
    stepInButton.disabled = true;
    stepOverButton.disabled = true;
    stepOutButton.disabled = true;
  }
};

Applab.isRunning = function () {
  return $('#resetButton').is(':visible');
};

/**
 * Reset the app to the start position and kill any pending animation tasks.
 * @param {boolean} first True if an opening animation is to be played.
 */
Applab.reset = function(first) {
  var i;
  Applab.clearEventHandlersKillTickLoop();

  // Soft buttons
  var softButtonCount = 0;
  for (i = 0; i < Applab.softButtons_.length; i++) {
    document.getElementById(Applab.softButtons_[i]).style.display = 'inline';
    softButtonCount++;
  }
  if (softButtonCount) {
    var softButtonsCell = document.getElementById('soft-buttons');
    softButtonsCell.className = 'soft-buttons-' + softButtonCount;
  }

  // Reset configurable variables
  delete Applab.activeCanvas;
  Applab.turtle = {};
  Applab.turtle.heading = 0;
  Applab.turtle.x = Applab.appWidth / 2;
  Applab.turtle.y = Applab.appHeight / 2;
  apiTimeoutList.clearTimeouts();
  apiTimeoutList.clearIntervals();

  var divApplab = document.getElementById('divApplab');
  while (divApplab.firstChild) {
    divApplab.removeChild(divApplab.firstChild);
  }

  // Clone and replace divApplab (this removes all attached event listeners):
  var newDivApplab = divApplab.cloneNode(true);
  divApplab.parentNode.replaceChild(newDivApplab, divApplab);

  if (level.showTurtleBeforeRun) {
    applabTurtle.turtleSetVisibility(true);
  }

  var allowDragging = Applab.isInDesignMode() && !Applab.isRunning();
  designMode.parseFromLevelHtml(newDivApplab, allowDragging);
  designMode.changeScreen('screen1');
  if (Applab.isInDesignMode()) {
    designMode.clearProperties();
    designMode.resetElementTray(allowDragging);
  }

  newDivApplab.addEventListener('click', designMode.onDivApplabClick);

  // Reset goal successState:
  if (level.goal) {
    level.goal.successState = {};
  }

  if (level.editCode) {
    // Reset the pause button:
    var pauseButton = document.getElementById('pauseButton');
    var continueButton = document.getElementById('continueButton');
    var stepInButton = document.getElementById('stepInButton');
    var stepOverButton = document.getElementById('stepOverButton');
    var stepOutButton = document.getElementById('stepOutButton');
    if (pauseButton && continueButton && stepInButton && stepOverButton && stepOutButton) {
      pauseButton.style.display = "inline-block";
      pauseButton.disabled = true;
      continueButton.style.display = "none";
      stepInButton.disabled = false;
      stepOverButton.disabled = true;
      stepOutButton.disabled = true;
    }
    var spinner = document.getElementById('spinner');
    if (spinner) {
      spinner.style.visibility = 'hidden';
    }
    var debugOutput = document.getElementById('debug-output');
    if (debugOutput) {
      debugOutput.textContent = '';
    }
    var debugInput = document.getElementById('debug-input');
    if (debugInput) {
      debugInput.textContent = '';
    }
  }

  // Reset the Globals object used to contain program variables:
  Applab.Globals = {};
  Applab.eventQueue = [];
  Applab.executionError = null;
  Applab.JSInterpreter = null;
  Applab.interpreter = null;
};

// TODO(dave): remove once channel id is passed in appOptions.
/**
 * If channel id has not yet been loaded, delays calling of the callback
 * until the saveProject response comes back. Otherwise, calls the callback
 * directly.
 * @param callback {Function}
 */
studioApp.runButtonClickWrapper = function (callback) {
  // Behave like other apps when not editing a project or channel id is present.
  if (window.dashboard && (!dashboard.project.isEditing ||
      (dashboard.project.current && dashboard.project.current.id))) {
    $(window).trigger('run_button_pressed');
    callback();
  } else {
    $(window).trigger('run_button_pressed', callback);
  }
};

/**
 * Click the run button.  Start the program.
 */
// XXX This is the only method used by the templates!
Applab.runButtonClick = function() {
  var runButton = document.getElementById('runButton');
  var resetButton = document.getElementById('resetButton');
  // Ensure that Reset button is at least as wide as Run button.
  if (!resetButton.style.minWidth) {
    resetButton.style.minWidth = runButton.offsetWidth + 'px';
  }
  studioApp.toggleRunReset('reset');
  if (studioApp.isUsingBlockly()) {
    Blockly.mainBlockSpace.traceOn(true);
  }
  studioApp.reset(false);
  studioApp.attempts++;
  Applab.execute();

  // Enable the Finish button if is present:
  var shareCell = document.getElementById('share-cell');
  if (shareCell) {
    shareCell.className = 'share-cell-enabled';
  }
};

/**
 * App specific displayFeedback function that calls into
 * studioApp.displayFeedback when appropriate
 */
var displayFeedback = function() {
  if (!Applab.waitingForReport) {
    studioApp.displayFeedback({
      app: 'applab', //XXX
      skin: skin.id,
      feedbackType: Applab.testResults,
      response: Applab.response,
      level: level,
      showingSharing: level.freePlay,
      feedbackImage: Applab.feedbackImage,
      twitter: twitterOptions,
      // allow users to save freeplay levels to their gallery (impressive non-freeplay levels are autosaved)
      saveToGalleryUrl: level.freePlay && Applab.response && Applab.response.save_to_gallery_url,
      appStrings: {
        reinfFeedbackMsg: applabMsg.reinfFeedbackMsg(),
        sharingText: applabMsg.shareGame()
      }
    });
  }
};

/**
 * Function to be called when the service report call is complete
 * @param {object} JSON response (if available)
 */
Applab.onReportComplete = function(response) {
  Applab.response = response;
  Applab.waitingForReport = false;
  displayFeedback();
};

//
// Generates code with user-generated function definitions and evals that code
// so these can be called from event handlers. This should be called for each
// block type that defines functions.
//

var defineProcedures = function (blockType) {
  var code = Blockly.Generator.blockSpaceToCode('JavaScript', blockType);
  // TODO: handle editCode JS interpreter
  try { codegen.evalWith(code, {
                         studioApp: studioApp,
                         Applab: apiBlockly,
                         Globals: Applab.Globals } ); } catch (e) { }
};

/**
 * A miniature runtime in the interpreted world calls this function repeatedly
 * to check to see if it should invoke any callbacks from within the
 * interpreted world. If the eventQueue is not empty, we will return an object
 * that contains an interpreted callback function (stored in "fn") and,
 * optionally, callback arguments (stored in "arguments")
 */
var nativeGetCallback = function () {
  var retVal = Applab.eventQueue.shift();
  if (typeof retVal === "undefined") {
    Applab.JSInterpreter.seenEmptyGetCallbackDuringExecution = true;
  }
  return retVal;
};

var nativeSetCallbackRetVal = function (retVal) {
  if (Applab.eventQueue.length === 0) {
    // If nothing else is in the event queue, then store this return value
    // away so it can be returned in the native event handler
    Applab.JSInterpreter.seenReturnFromCallbackDuringExecution = true;
    Applab.JSInterpreter.lastCallbackRetVal = retVal;
  }
  // Provide warnings to the user if this function has been called with a
  // meaningful return value while we are no longer in the native event handler

  // TODO (cpirich): Check to see if the DOM event object was modified
  // (preventDefault(), stopPropagation(), returnValue) and provide a similar
  // warning since these won't work as expected unless running atMaxSpeed
  if (!Applab.JSInterpreter.runUntilCallbackReturn &&
      typeof Applab.JSInterpreter.lastCallbackRetVal !== 'undefined') {
    outputApplabConsole("Function passed to onEvent() has taken too long - the return value was ignored.");
    if (getCurrentTickLength() !== 0) {
      outputApplabConsole("  (try moving the speed slider to its maximum value)");
    }
  }
};

var consoleApi = {};

consoleApi.log = function() {
  var nativeArgs = [];
  for (var i = 0; i < arguments.length; i++) {
    nativeArgs[i] = codegen.marshalInterpreterToNative(Applab.JSInterpreter.interpreter,
                                                       arguments[i]);
  }
  var output = '';
  var firstArg = nativeArgs[0];
  if (typeof firstArg === 'string' || firstArg instanceof String) {
    output = vsprintf(firstArg, nativeArgs.slice(1));
  } else {
    for (i = 0; i < nativeArgs.length; i++) {
      output += nativeArgs[i].toString();
      if (i < nativeArgs.length - 1) {
        output += '\n';
      }
    }
  }
  outputApplabConsole(output);
};

function populateNonMarshalledFunctions(interpreter, scope, parent) {
  for (var i = 0; i < dropletConfig.blocks.length; i++) {
    var block = dropletConfig.blocks[i];
    if (block.dontMarshal) {
      var func = parent[block.func];
      // 4th param is false to indicate: don't marshal params
      var wrapper = codegen.makeNativeMemberFunction({
          interpreter: interpreter,
          nativeFunc: func,
          nativeParentObj: parent,
          dontMarshal: true
      });
      interpreter.setProperty(scope,
                              block.func,
                              interpreter.createNativeFunction(wrapper));
    }
  }
}

/**
 * Execute the app
 */
Applab.execute = function() {
  Applab.result = ResultType.UNSET;
  Applab.testResults = TestResults.NO_TESTS_RUN;
  Applab.waitingForReport = false;
  Applab.response = null;
  var i;

  studioApp.reset(false);

  // Set event handlers and start the onTick timer

  var codeWhenRun;
  if (level.editCode) {
    codeWhenRun = studioApp.editor.getValue();
    Applab.userCodeStartOffset = 0;
    Applab.userCodeLineOffset = 0;
    Applab.userCodeLength = codeWhenRun.length;
    // Append our mini-runtime after the user's code. This will spin and process
    // callback functions:
    codeWhenRun += '\nwhile (true) { var obj = getCallback(); ' +
      'if (obj) { var ret = obj.fn.apply(null, obj.arguments ? obj.arguments : null);' +
                 'setCallbackRetVal(ret); }}';
    var session = studioApp.editor.aceEditor.getSession();
    annotationList.attachToSession(session);
    Applab.cumulativeLength = codegen.aceCalculateCumulativeLength(session);
  } else {
    // Define any top-level procedures the user may have created
    // (must be after reset(), which resets the Applab.Globals namespace)
    defineProcedures('procedures_defreturn');
    defineProcedures('procedures_defnoreturn');

    var blocks = Blockly.mainBlockSpace.getTopBlocks();
    for (var x = 0; blocks[x]; x++) {
      var block = blocks[x];
      if (block.type === 'when_run') {
        codeWhenRun = Blockly.Generator.blocksToCode('JavaScript', [ block ]);
        break;
      }
    }
  }
  if (codeWhenRun) {
    if (level.editCode) {
      // Use JS interpreter on editCode levels
      var initFunc = function(interpreter, scope) {
        codegen.initJSInterpreter(interpreter,
                                  dropletConfig.blocks,
                                  scope,
                                  { console: consoleApi });

        populateNonMarshalledFunctions(interpreter, scope, dontMarshalApi);

        // Only allow five levels of depth when marshalling the return value
        // since we will occasionally return DOM Event objects which contain
        // properties that recurse over and over...
        var wrapper = codegen.makeNativeMemberFunction({
            interpreter: interpreter,
            nativeFunc: nativeGetCallback,
            maxDepth: 5
        });
        interpreter.setProperty(scope,
                                'getCallback',
                                interpreter.createNativeFunction(wrapper));

        wrapper = codegen.makeNativeMemberFunction({
            interpreter: interpreter,
            nativeFunc: nativeSetCallbackRetVal,
        });
        interpreter.setProperty(scope,
                                'setCallbackRetVal',
                                interpreter.createNativeFunction(wrapper));
      };
      try {
        Applab.interpreter = new window.Interpreter(codeWhenRun, initFunc);
      }
      catch(err) {
        handleExecutionError(err);
      }
      if (Applab.interpreter) {
        Applab.JSInterpreter = new JSInterpreter({
            interpreter: Applab.interpreter,
            studioApp: studioApp,
            codeInfo: {
                cumulativeLength: Applab.cumulativeLength,
                userCodeStartOffset: Applab.userCodeStartOffset,
                userCodeLength: Applab.userCodeLength,
            },
            shouldRunAtMaxSpeed: function() { return getCurrentTickLength() === 0; },
            maxInterpreterStepsPerTick: MAX_INTERPRETER_STEPS_PER_TICK,
            onNextStepChanged: Applab.updatePauseUIState,
            onPause: Applab.onPauseContinueButton,
            onExecutionError: handleExecutionError,
        });
      }
    } else {
      Applab.whenRunFunc = codegen.functionFromCode(codeWhenRun, {
                                          StudioApp: studioApp,
                                          Applab: apiBlockly,
                                          Globals: Applab.Globals } );
    }
  }

  if (level.editCode) {
    var pauseButton = document.getElementById('pauseButton');
    var continueButton = document.getElementById('continueButton');
    var stepInButton = document.getElementById('stepInButton');
    var stepOverButton = document.getElementById('stepOverButton');
    var stepOutButton = document.getElementById('stepOutButton');
    if (pauseButton && continueButton && stepInButton && stepOverButton && stepOutButton) {
      pauseButton.style.display = "inline-block";
      pauseButton.disabled = false;
      continueButton.style.display = "none";
      stepInButton.disabled = true;
      stepOverButton.disabled = true;
      stepOutButton.disabled = true;
    }
    var spinner = document.getElementById('spinner');
    if (spinner) {
      spinner.style.visibility = 'visible';
    }
  }

  // Set focus on divApplab so key events can be handled right from the start
  // without requiring the user to adjust focus:
  var divApplab = document.getElementById('divApplab');
  divApplab.focus();

  Applab.running = true;
  queueOnTick();
};

Applab.onPauseContinueButton = function() {
  if (Applab.running) {
    // We have code and are either running or paused
    if (Applab.JSInterpreter.paused &&
        Applab.JSInterpreter.nextStep === StepType.RUN) {
      Applab.JSInterpreter.paused = false;
    } else {
      Applab.JSInterpreter.paused = true;
      Applab.JSInterpreter.nextStep = StepType.RUN;
    }
    Applab.updatePauseUIState();
    var stepInButton = document.getElementById('stepInButton');
    var stepOverButton = document.getElementById('stepOverButton');
    var stepOutButton = document.getElementById('stepOutButton');
    stepInButton.disabled = !Applab.JSInterpreter.paused;
    stepOverButton.disabled = !Applab.JSInterpreter.paused;
    stepOutButton.disabled = !Applab.JSInterpreter.paused;
  }
};

Applab.updatePauseUIState = function() {
  var pauseButton = document.getElementById('pauseButton');
  var continueButton = document.getElementById('continueButton');
  var spinner = document.getElementById('spinner');

  if (pauseButton && continueButton && spinner) {
    if (Applab.JSInterpreter.paused &&
        Applab.JSInterpreter.nextStep === StepType.RUN) {
      pauseButton.style.display = "none";
      continueButton.style.display = "inline-block";
      spinner.style.visibility = 'hidden';
    } else {
      pauseButton.style.display = "inline-block";
      continueButton.style.display = "none";
      spinner.style.visibility = 'visible';
    }
  }
};

Applab.onStepOverButton = function() {
  if (Applab.running) {
    Applab.JSInterpreter.paused = true;
    Applab.JSInterpreter.nextStep = StepType.OVER;
    Applab.updatePauseUIState();
  }
};

Applab.onStepInButton = function() {
  if (!Applab.running) {
    Applab.runButtonClick();
    Applab.onPauseContinueButton();
  }
  Applab.JSInterpreter.paused = true;
  Applab.JSInterpreter.nextStep = StepType.IN;
  Applab.updatePauseUIState();
};

Applab.onStepOutButton = function() {
  if (Applab.running) {
    Applab.JSInterpreter.paused = true;
    Applab.JSInterpreter.nextStep = StepType.OUT;
    Applab.updatePauseUIState();
  }
};

Applab.feedbackImage = '';
Applab.encodedFeedbackImage = '';

Applab.onViewData = function() {
  window.open(
    '//' + getPegasusHost() + '/edit-csp-app/' + AppStorage.getChannelId(),
    '_blank');
};

Applab.onDesignModeButton = function() {
  designMode.toggleDesignMode(true);
  studioApp.resetButtonClick();
};

Applab.onCodeModeButton = function() {
  designMode.toggleDesignMode(false);
};

Applab.onPuzzleComplete = function() {
  // Submit all results as success / freePlay
  Applab.result = ResultType.SUCCESS;
  Applab.testResults = TestResults.FREE_PLAY;

  // Stop everything on screen
  Applab.clearEventHandlersKillTickLoop();

  var program;

  if (level.editCode) {
    // If we want to "normalize" the JavaScript to avoid proliferation of nearly
    // identical versions of the code on the service, we could do either of these:

    // do an acorn.parse and then use escodegen to generate back a "clean" version
    // or minify (uglifyjs) and that or js-beautify to restore a "clean" version

    program = studioApp.editor.getValue();
  } else {
    var xml = Blockly.Xml.blockSpaceToDom(Blockly.mainBlockSpace);
    program = Blockly.Xml.domToText(xml);
  }

  Applab.waitingForReport = true;

  var sendReport = function() {
    studioApp.report({
      app: 'applab',
      level: level.id,
      result: Applab.result === ResultType.SUCCESS,
      testResult: Applab.testResults,
      program: encodeURIComponent(program),
      image: Applab.encodedFeedbackImage,
      onComplete: Applab.onReportComplete
    });
  };

  if (typeof document.getElementById('divApplab').toDataURL === 'undefined') { // don't try it if function is not defined
    sendReport();
  } else {
    document.getElementById('divApplab').toDataURL("image/png", {
      callback: function(pngDataUrl) {
        Applab.feedbackImage = pngDataUrl;
        Applab.encodedFeedbackImage = encodeURIComponent(Applab.feedbackImage.split(',')[1]);

        sendReport();
      }
    });
  }
};

Applab.executeCmd = function (id, name, opts) {
  var cmd = {
    'id': id,
    'name': name,
    'opts': opts
  };
  return Applab.callCmd(cmd);
};

//
// Execute an API command
//

Applab.callCmd = function (cmd) {
  var retVal = false;
  if (applabCommands[cmd.name] instanceof Function) {
    studioApp.highlight(cmd.id);
    retVal = applabCommands[cmd.name](cmd.opts);
  }
  return retVal;
};

/*
var onWaitComplete = function (opts) {
  if (!opts.complete) {
    if (opts.waitCallback) {
      opts.waitCallback();
    }
    opts.complete = true;
  }
};

Studio.wait = function (opts) {
  if (!opts.started) {
    opts.started = true;

    // opts.value is the number of milliseconds to wait - or 'click' which means
    // "wait for click"
    if ('click' === opts.value) {
      opts.waitForClick = true;
    } else {
      opts.waitTimeout = window.setTimeout(
        delegate(this, onWaitComplete, opts),
        opts.value);
    }
  }

  return opts.complete;
};
*/

Applab.timedOut = function() {
  return Applab.tickCount > Applab.timeoutFailureTick;
};

var checkFinished = function () {
  // if we have a succcess condition and have accomplished it, we're done and successful
  if (level.goal && level.goal.successCondition && level.goal.successCondition()) {
    Applab.result = ResultType.SUCCESS;
    return true;
  }

  // if we have a failure condition, and it's been reached, we're done and failed
  if (level.goal && level.goal.failureCondition && level.goal.failureCondition()) {
    Applab.result = ResultType.FAILURE;
    return true;
  }

  /*
  if (Applab.allGoalsVisited()) {
    Applab.result = ResultType.SUCCESS;
    return true;
  }
  */

  if (Applab.timedOut()) {
    Applab.result = ResultType.FAILURE;
    return true;
  }

  return false;
};

// TODO(dave): move this logic to dashboard.
var getPegasusHost = function() {
  switch (window.location.hostname) {
    case 'studio.code.org':
    case 'learn.code.org':
      return 'code.org';
    default:
      var name = window.location.hostname.split('.')[0];
      switch(name) {
        case 'localhost':
          return 'localhost.code.org:3000';
        case 'development':
        case 'staging':
        case 'test':
        case 'levelbuilder':
          return name + '.code.org';
        case 'staging-studio':
          return 'staging.code.org';
        case 'test-studio':
          return 'test.code.org';
        case 'levelbuilder-studio':
          return 'levelbuilder.code.org';
        default:
          return null;
      }
  }
};

Applab.isInDesignMode = function () {
  return $('#designModeBox').is(':visible');
};

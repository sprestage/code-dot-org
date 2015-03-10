/*jshint multistr: true */

var msg = require('../../locale/current/netsim');
var utils = require('../utils');
var netsimConstants = require('./netsimConstants');
var DnsMode = netsimConstants.DnsMode;
var EncodingType = netsimConstants.EncodingType;

/**
 * A level configuration that can be used by NetSim
 * @typedef {Object} NetSimLevelConfiguration
 *
 * @property {boolean} showClientsInLobby
 * @property {boolean} showRoutersInLobby
 * @property {boolean} showAddRouterButton
 *
 * @property {number} defaultTabIndex - The zero-based index of the tab
 *           that should be active by default, which depends on which tabs
 *           you have enabled.
 *
 * @property {boolean} showInstructionsTab
 *
 * @property {boolean} showMyDeviceTab
 *
 * @property {EncodingType[]} showEncodingControls
 *
 * @property {EncodingType[]} defaultEnabledEncodings
 *
 * @property {boolean} showRouterTab
 *
 * @property {boolean} showDnsTab
 *
 * @property {boolean} showDnsModeControl - Whether the DNS mode controls will
 *           be available to the student.
 *
 * @property {DnsMode} defaultDnsMode - Which DNS mode the simulator should
 *           initialize into.
 */

/*
 * Configuration for all levels.
 */
var levels = module.exports = {};

/**
 * A default level configuration so that we can define the others by delta.
 * This default configuration enables everything possible, so other configs
 * should start with this one and disable features.
 * @type {NetSimLevelConfiguration}
 */
var defaultLevel = {

  // Lobby configuration
  showClientsInLobby: true,
  showRoutersInLobby: true,
  showAddRouterButton: true,

  // Tab-panel control
  defaultTabIndex: 1,

  // Instructions tab and its controls
  showInstructionsTab: true,

  // "My Device" tab and its controls
  showMyDeviceTab: true,
  showEncodingControls: [EncodingType.BINARY, EncodingType.A_AND_B,
      EncodingType.HEXADECIMAL, EncodingType.DECIMAL, EncodingType.ASCII],
  defaultEnabledEncodings: [EncodingType.ASCII, EncodingType.BINARY],

  // Router tab and its controls
  showRouterTab: true,

  // DNS tab and its controls
  showDnsTab: true,
  showDnsModeControl: true,
  defaultDnsMode: DnsMode.NONE
};

/**
 * Just uses the default level configuration.
 * @type {NetSimLevelConfiguration}
 */
levels.netsim_demo = defaultLevel;

/**
 * Level demonstrating configuration that forces students to use "No DNS" mode.
 * @type {NetSimLevelConfiguration}
 */
levels.no_dns = utils.extend(defaultLevel, {
  showClientsInLobby: true,
  showRoutersInLobby: false,
  showAddRouterButton: false,
  showEncodingControls: [],
  defaultEnabledEncodings: [EncodingType.BINARY, EncodingType.HEXADECIMAL],
  showDnsTab: false,
  defaultDnsMode: DnsMode.NONE
});

/**
 * Level demonstrating configuration that forces students to use "Manual DNS" mode.
 * @type {NetSimLevelConfiguration}
 */
levels.manual_dns = utils.extend(defaultLevel, {
  showClientsInLobby: false,
  showEncodingControls: [EncodingType.ASCII],
  defaultEnabledEncodings: [EncodingType.HEXADECIMAL, EncodingType.ASCII],
  showDnsModeControl: false,
  defaultDnsMode: DnsMode.MANUAL
});

/**
 * Level demonstrating configuration that forces students to use "Automatic DNS" mode.
 * @type {NetSimLevelConfiguration}
 */
levels.automatic_dns = utils.extend(defaultLevel, {
  showClientsInLobby: false,
  showDnsModeControl: false,
  defaultDnsMode: DnsMode.AUTOMATIC
});

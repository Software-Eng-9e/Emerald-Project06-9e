import React, { useEffect, useRef, useState, useReducer } from 'react';
import { Link } from 'react-router-dom';

import '../../../ActivityLevels.less';
import { compileArduinoCode } from '../../../Utils/helpers';
import { message, Spin, Row, Col, Alert, Menu, Dropdown } from 'antd';
import CodeModal from '../../modals/CodeModal';
import ConsoleModal from '../../modals/ConsoleModal';
import PlotterModal from '../../modals/PlotterModal';
import {
  connectToPort,
  handleCloseConnection,
  handleOpenConnection,
} from '../../../Utils/consoleHelpers';
import ArduinoLogo from '../../Icons/ArduinoLogo';
import PlotterLogo from '../../Icons/PlotterLogo';
import { getActivityToolbox } from '../../../../../Utils/requests';
import PublicCanvas from '../PublicCanvas';
import './blocks';
import './factory';
import NavBar from '../../../../NavBar/NavBar';

//other imports^

let plotId = 1;

export default function CustomBlock({activity}) {
  const [hoverUndo, setHoverUndo] = useState(false);
  const [hoverRedo, setHoverRedo] = useState(false);
  const [hoverCompile, setHoverCompile] = useState(false);
  const [hoverConsole, setHoverConsole] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [showPlotter, setShowPlotter] = useState(false);
  const [plotData, setPlotData] = useState([]);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [selectedCompile, setSelectedCompile] = useState(false);
  const [compileError, setCompileError] = useState('');

  //  useStates for Program your Arduino... / Custom Blocks
  const [selectedFeature, setSelectedFeature] = useState('Custom Blocks');
  const [blockCode, setBlockCode] = useState('');
  const [generatorCode, setGeneratorCode] = useState('');


  const [forceUpdate] = useReducer((x) => x + 1, 0);

  const workspaceRef = useRef(null);
  // const activity = null;
  const activityRef = useRef(null);

  /* ADDED */ const blockMap = new Map(); // IMPORTANT
  /* ADDED */ const descriptionMap = new Map(); // IMPORTANT

const initializeMainWorkspace = () => { //workspace setup
  // inject into workspace
  workspaceRef.current = window.Blockly.inject('newblockly-canvas', {
    toolbox: document.getElementById('toolbox'),
  });

  // set up root block
  const setupRootBlock = () => {
    const rootBlockXml = '<xml>' +
      '<block type="factory_base" deletable="false" movable="false"></block>' +
      '</xml>';

    const xmlDom = Blockly.Xml.textToDom(rootBlockXml);   //grab xml and put into DOM for updating
    Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
  };

  setupRootBlock();   //set up root block
};

const initializePreviewWorkspace = () => {    //setup preview workspace
  const previewDiv = document.getElementById('preview');

  // inject into preview workspace
  const previewWorkspace = Blockly.inject(previewDiv, {
    media: '../../media/',
    scrollbars: false,
  });

  const renderSampleBlock = () => { //create and render a sample block in the preview workspace
    const block = previewWorkspace.newBlock('math_number');
    block.moveBy(50, 50);
    block.initSvg();
    block.render();
  };

  renderSampleBlock();  //display sample block
};

const setWorkspace = () => {    //initialize both workspaces
  initializeMainWorkspace();
  initializePreviewWorkspace();
};

  /*      first attempt at useEffect, was trying to implement useEffect and addChangeListener seperately
  useEffect(() => {
    const setUp = async () => {
      activityRef.current = activity;
      if (!workspaceRef.current && activity && Object.keys(activity).length !== 0) {
        setWorkspace();
      }
    };
    setUp();
  }, [activity]);

  useEffect(() => {
    const changeListener = () => {
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);
      setBlockCode(xmlText);

      const generatorCode = Blockly.JavaScript.workspaceToCode(workspaceRef.current);
      setGeneratorCode(generatorCode);
    };

    if (workspaceRef.current) {
      workspaceRef.current.addChangeListener(changeListener);
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.removeChangeListener(changeListener);
      }
    };
  }, [workspaceRef.current]);

  const handleUndo = () => {
    if (workspaceRef.current.undoStack_.length > 0)
      workspaceRef.current.undo(false);
  };

  const handleRedo = () => {
    if (workspaceRef.current.redoStack_.length > 0)
      workspaceRef.current.undo(true);
  };

  const handleConsole = async () => {
    if (showPlotter) {
      message.warning('Close serial plotter before opening serial monitor');
      return;
    }

    if (!showConsole) {
      await handleOpenConnection(9600, 'newLine');
      if (typeof window['port'] === 'undefined') {
        message.error('Fail to select serial device');
        return;
      }
      setConnectionOpen(true);
      setShowConsole(true);
    } else {
      if (connectionOpen) {
        await handleCloseConnection();
        setConnectionOpen(false);
      }
      setShowConsole(false);
    }
  };
  */

  useEffect(() => {                                   //not entirely functional, not every change is reflected properly
    const initializeBlocklyWorkspace = () => {  //initialize workspace
      if (!activity || workspaceRef.current) {
        return;
      }
      
      workspaceRef.current = Blockly.inject('blockly-div', {  // Inject Blockly into the DOM element with a specific configuration
        toolbox: document.getElementById('toolbox'),  //blockly toolbox options
      });

      // Convert the initial XML to a DOM and inject it to the workspace
      const initialXml = Blockly.Xml.textToDom(activity.startingBlocks);
      Blockly.Xml.domToWorkspace(initialXml, workspaceRef.current);
    };

    // Call the initialize func
    initializeBlocklyWorkspace();

    // Attach a change listener to update code previews
    const attachChangeListener = () => {
      workspaceRef.current.addChangeListener((event) => {
        if (event.type === Blockly.Events.UI) {   //if UI event happens, nothing, return
          return; 
        }

        const updatedXml = Blockly.Xml.workspaceToDom(workspaceRef.current);    //update code for other events accordingly
        const updatedXmlText = Blockly.Xml.domToText(updatedXml);
        setGeneratorCode(updatedXmlText);     //update block gen code

        const updatedCode = Blockly.JavaScript.workspaceToCode(workspaceRef.current);
        setBlockCode(updatedCode); 
      });
    };

    // Attach the change listener after initializing the workspace
    attachChangeListener();

    return () => {    //meant to clear old workspace
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
      }
    };
  }, [activity]); //re-run if activity is changed
  
  const handleUndo = () => {
    if (workspaceRef.current.undoStack_.length > 0)
      workspaceRef.current.undo(false);
  };

  const handleRedo = () => {
    if (workspaceRef.current.redoStack_.length > 0)
      workspaceRef.current.undo(true);
  };

  const handleConsole = async () => {
    if (showPlotter) {
      message.warning('Close serial plotter before openning serial monitor');
      return;
    }
    // if serial monitor is not shown
    if (!showConsole) {
      // connect to port
      await handleOpenConnection(9600, 'newLine');
      // if fail to connect to port, return
      if (typeof window['port'] === 'undefined') {
        message.error('Fail to select serial device');
        return;
      }
      setConnectionOpen(true);
      setShowConsole(true);
    }
    // if serial monitor is shown, close the connection
    else {
      if (connectionOpen) {
        await handleCloseConnection();
        setConnectionOpen(false);
      }
      setShowConsole(false);
    }
  };

  const handlePlotter = async () => {
    if (showConsole) {
      message.warning('Close serial monitor before openning serial plotter');
      return;
    }

    if (!showPlotter) {
      await handleOpenConnection(
        9600,
        'plot',
        plotData,
        setPlotData,
        plotId,
        forceUpdate
      );
      if (typeof window['port'] === 'undefined') {
        message.error('Fail to select serial device');
        return;
      }
      setConnectionOpen(true);
      setShowPlotter(true);
    } else {
      plotId = 1;
      if (connectionOpen) {
        await handleCloseConnection();
        setConnectionOpen(false);
      }
      setShowPlotter(false);
    }
  };

  const handleCompile = async () => {
    if (showConsole || showPlotter) {
      message.warning(
        'Close Serial Monitor and Serial Plotter before uploading your code'
      );
    } else {
      if (typeof window['port'] === 'undefined') {
        await connectToPort();
      }
      if (typeof window['port'] === 'undefined') {
        message.error('Fail to select serial device');
        return;
      }
      setCompileError('');
      await compileArduinoCode(
        workspaceRef.current,
        setSelectedCompile,
        setCompileError,
        activity,
        false
      );
    }
  };

  const menu = (
    <Menu>
      <Menu.Item onClick={handlePlotter}>
        <PlotterLogo />
        &nbsp; Show Serial Plotter
      </Menu.Item>
      <CodeModal title={'XML'} workspaceRef={workspaceRef.current} />
      <Menu.Item>
        <CodeModal title={'Arduino Code'} workspaceRef={workspaceRef.current} />
      </Menu.Item>
    </Menu>
  );


    /* ADDED */ const askBlockName = (generatorCode) => {
      const blockName = window.prompt('Enter a name for your custom block: ');
      if (blockName) {
        console.log(`Name: ${blockName}`);
      }
      else {
        return '-1';
      }
      return blockName;
    };

    /* ADDED */ const askBlockDescription = (generatorCode) => {
    const blockDescription = window.prompt('Enter a description for your custom block: ');
    if (blockDescription) {
      console.log(`Description: ${blockDescription}`);
    }
    return blockDescription;
  };

   /* ADDED */   const blockSaveProcess = () => { // saves blocks to maps

    // 1. Ask if Name is Final
    let blockName = askBlockName();
    if (blockName != '-1') {
      /* let blockName = genCode.name;
      console.log(`Name: ${blockName}`); */

      // 2. Add Name & Block to blockMap
      while (blockMap.has(blockName)) {
        blockName = window.prompt('The name "' + blockName + '" already exists in database. Enter a new name for your custom block: ');
        if (blockName) {
          console.log(`Name: ${blockName}`);
        }
      }

      blockMap.set(blockName, 'block');

      // 3. Ask Description
      const blockDescription = askBlockDescription();

      // 4. Add Name & Description To descriptionMap
      descriptionMap.set(blockName, blockDescription);
  }

  // include method to DELETE blocks in 'Program your arduino'
  }

  /* ADDED LINE */ const saveBlock = (buttonText) => (

    <button
      style={{
        backgroundColor: 'teal',
        color: 'white',
        transition: 'background-color 0.3s',
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = 'lightblue';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'teal';
      }}
      onClick={blockSaveProcess} // add block to map
    >
      {buttonText}
    </button>
  );

/**
 * Convert XML code to Blockly JavaScript code.
 * @param {string} xmlCode - The input XML code.
 * @returns {string} - The generated Blockly JavaScript code.
 */
function xmlToBlocklyJs(xmlCode) {
  // Parse the XML code into a DOM structure.
  
  var xmlDoc = new DOMParser().parseFromString(xmlCode, 'text/xml');

  // Helper function to process a block and its children.
  function parseBlock(block) {

    var blockType = block.getAttribute('type') || 'unnamed';
    var jsCode = "Blockly.Blocks['" + blockType + "'] = {\n";
    jsCode += "  init: function() {\n";

    // Process fields.
    var fields = block.querySelectorAll('field');
    if (fields.length > 0) {
      fields.forEach(function (field) {
        jsCode += "    this.appendField('" + field.textContent + "');\n";
      });
    }

    // Process inputs.
    var inputs = block.querySelectorAll('value, statement, shadow');
    if (inputs.length > 0) {
      inputs.forEach(function (input) {
        var inputName = input.getAttribute('name');
        jsCode += "    this.append" + input.tagName + "('" + inputName + "', " +
          parseBlock(input.firstElementChild) + ");\n";
      });
    }

    // Process mutations.
    var mutation = block.querySelector('mutation');
    if (mutation) {
      for (var i = 0; i < mutation.attributes.length; i++) {
        var attribute = mutation.attributes[i];
        jsCode += "    this.setMutatorAttribute('" + attribute.name + "', '" +
          attribute.value + "');\n";
      }
    }

    jsCode += "  }\n";
    jsCode += "};\n\n";

    return jsCode;
  }

  // Get the root block and start parsing.
  var rootBlock = xmlDoc.querySelector('block[type="factory_base"]');
  if (rootBlock) {
    return parseBlock(rootBlock);
  } else {
    return ''; // Return an empty string if no block is found.
  }
}

function updateLanguage(xmlCode, varToChange) {
  //const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
  //const xmlCode2 = Blockly.Xml.domToText(xml);
  var xmlDoc = new DOMParser().parseFromString(xmlCode, 'text/xml');
  var blockX = xmlDoc.querySelector('block[type="factory_base"]');
  var temporaryWorkspace = new Blockly.Workspace();
  var rootBlock = Blockly.Xml.domToBlock(blockX, temporaryWorkspace);
  if (!rootBlock) {
    return "block not found";
  }
  var blockType = rootBlock.getFieldValue('NAME');
  if (!blockType) {
    blockType = UNNAMED;
  }
  blockType = blockType.replace(/\W/g, '_').replace(/^(\d)/, '_\\1');

  varToChange = formatJson_(blockType, rootBlock);
  //var code = blockType;
  temporaryWorkspace.clear();
  temporaryWorkspace.dispose();  
  //injectCode(code, 'blocklyCanvasMid')
  return varToChange;
}

function formatJson_(blockType, rootBlock) {
  var JS = {};
  // Type is not used by Blockly, but may be used by a loader.
  JS.type = blockType;
  // Generate inputs.
  var message = [];
  var args = [];
  var contentsBlock = rootBlock.getInputTargetBlock('INPUTS');
  var lastInput = null;
  while (contentsBlock) {
    if (!contentsBlock.disabled && !contentsBlock.getInheritedDisabled()) {
      var fields = getFieldsJson_(contentsBlock.getInputTargetBlock('FIELDS'));
      for (var i = 0; i < fields.length; i++) {
        if (typeof fields[i] == 'string') {
          message.push(fields[i].replace(/%/g, '%%'));
        } else {
          args.push(fields[i]);
          message.push('%' + args.length);
        }
      }

      var input = {type: contentsBlock.type};
      // Dummy inputs don't have names.  Other inputs do.
      if (contentsBlock.type != 'input_dummy') {
        input.name = contentsBlock.getFieldValue('INPUTNAME');
      }
      var check = JSON.parse(getOptTypesFrom(contentsBlock, 'TYPE') || 'null');
      if (check) {
        input.check = check;
      }
      var align = contentsBlock.getFieldValue('ALIGN');
      if (align != 'LEFT') {
        input.align = align;
      }
      args.push(input);
      message.push('%' + args.length);
      lastInput = contentsBlock;
    }
    contentsBlock = contentsBlock.nextConnection &&
        contentsBlock.nextConnection.targetBlock();
  }
  // Remove last input if dummy and not empty.
  if (lastInput && lastInput.type == 'input_dummy') {
    var fields = lastInput.getInputTargetBlock('FIELDS');
    if (fields && getFieldsJson_(fields).join('').trim() != '') {
      var align = lastInput.getFieldValue('ALIGN');
      if (align != 'LEFT') {
        JS.lastDummyAlign0 = align;
      }
      args.pop();
      message.pop();
    }
  }
  JS.message0 = message.join(' ');
  if (args.length) {
    JS.args0 = args;
  }
  // Generate inline/external switch.
  if (rootBlock.getFieldValue('INLINE') == 'EXT') {
    JS.inputsInline = false;
  } else if (rootBlock.getFieldValue('INLINE') == 'INT') {
    JS.inputsInline = true;
  }
  // Generate output, or next/previous connections.
  switch (rootBlock.getFieldValue('CONNECTIONS')) {
    case 'LEFT':
      JS.output =
          JSON.parse(getOptTypesFrom(rootBlock, 'OUTPUTTYPE') || 'null');
      break;
    case 'BOTH':
      JS.previousStatement =
          JSON.parse(getOptTypesFrom(rootBlock, 'TOPTYPE') || 'null');
      JS.nextStatement =
          JSON.parse(getOptTypesFrom(rootBlock, 'BOTTOMTYPE') || 'null');
      break;
    case 'TOP':
      JS.previousStatement =
          JSON.parse(getOptTypesFrom(rootBlock, 'TOPTYPE') || 'null');
      break;
    case 'BOTTOM':
      JS.nextStatement =
          JSON.parse(getOptTypesFrom(rootBlock, 'BOTTOMTYPE') || 'null');
      break;
  }
  // Generate colour.
  var colourBlock = rootBlock.getInputTargetBlock('COLOUR');
  if (colourBlock && !colourBlock.disabled) {
    var hue = parseInt(colourBlock.getFieldValue('HUE'), 10);
    JS.colour = hue;
  }
  JS.tooltip = '';
  JS.helpUrl = 'http://www.example.com/';
  return JSON.stringify(JS, null, '  ');
}

function getFieldsJson_(block) {
  var fields = [];
  while (block) {
    if (!block.disabled && !block.getInheritedDisabled()) {
      switch (block.type) {
        case 'field_static':
          // Result: 'hello'
          fields.push(block.getFieldValue('TEXT'));
          break;
        case 'field_input':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            text: block.getFieldValue('TEXT')
          });
          break;
        case 'field_angle':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            angle: Number(block.getFieldValue('ANGLE'))
          });
          break;
        case 'field_checkbox':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            checked: block.getFieldValue('CHECKED') == 'TRUE'
          });
          break;
        case 'field_colour':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            colour: block.getFieldValue('COLOUR')
          });
          break;
        case 'field_date':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            date: block.getFieldValue('DATE')
          });
          break;
        case 'field_variable':
          fields.push({
            type: block.type,
            name: block.getFieldValue('FIELDNAME'),
            variable: block.getFieldValue('TEXT') || null
          });
          break;
        case 'field_dropdown':
          var options = [];
          for (var i = 0; i < block.optionCount_; i++) {
            options[i] = [block.getFieldValue('USER' + i),
                block.getFieldValue('CPU' + i)];
          }
          if (options.length) {
            fields.push({
              type: block.type,
              name: block.getFieldValue('FIELDNAME'),
              options: options
            });
          }
          break;
        case 'field_image':
          fields.push({
            type: block.type,
            src: block.getFieldValue('SRC'),
            width: Number(block.getFieldValue('WIDTH')),
            height: Number(block.getFieldValue('HEIGHT')),
            alt: block.getFieldValue('ALT')
          });
          break;
      }
    }
    block = block.nextConnection && block.nextConnection.targetBlock();
  }
  return fields;
}

function escapeString(string) {
  return JSON.stringify(string);
}

function getOptTypesFrom(block, name) {
  var types = getTypesFrom_(block, name);
  if (types.length == 0) {
    return undefined;
  } else if (types.indexOf('null') != -1) {
    return 'null';
  } else if (types.length == 1) {
    return types[0];
  } else {
    return '[' + types.join(', ') + ']';
  }
}


function getTypesFrom_(block, name) {
  var typeBlock = block.getInputTargetBlock(name);
  var types;
  if (!typeBlock || typeBlock.disabled) {
    types = [];
  } else if (typeBlock.type == 'type_other') {
    types = [escapeString(typeBlock.getFieldValue('TYPE'))];
  } else if (typeBlock.type == 'type_group') {
    types = [];
    for (var n = 0; n < typeBlock.typeCount_; n++) {
      types = types.concat(getTypesFrom_(typeBlock, 'TYPE' + n));
    }
    // Remove duplicates.
    var hash = Object.create(null);
    for (var n = types.length - 1; n >= 0; n--) {
      if (hash[types[n]]) {
        types.splice(n, 1);
      }
      hash[types[n]] = true;
    }
  } else {
    types = [escapeString(typeBlock.valueType)];
  }
  return types;
}

/*    original attempt at update preview, json code wasn't being parsed properly and preview window wasn't displaying properly at all when change was made
function updatePreview(jsonCode, previewWorkspace) {
  const clearPreview = () => previewWorkspace.clear();

  const isValidJson = (code) => {
    const trimmedCode = code.trim();
    return trimmedCode ? JSON.parse(trimmedCode) : null;
  };

  const createBlock = (definition) => {
    const { type } = definition;
    Blockly.Blocks[type] = {
      init: function () {
        this.jsonInit(definition);
      }
    };

    const newBlock = previewWorkspace.newBlock(type);
    newBlock.moveBy(50, 50);
    newBlock.initSvg();
    newBlock.render();
  };

  const handleError = (error) => console.error('Error updating block preview:', error);

  const restoreOriginalBlocks = (originalBlocks) => Blockly.Blocks = { ...originalBlocks };

  const previewUpdate = (jsonCode) => {
    clearPreview();

    const originalBlocks = { ...Blockly.Blocks };

    try {
      const blockDefinition = isValidJson(jsonCode);
      if (!blockDefinition) {
        console.error('No valid JSON code provided for preview.');
        return;
      }

      createBlock(blockDefinition);
    } catch (error) {
      handleError(error);
    } finally {
      restoreOriginalBlocks(originalBlocks);
    }
  };

  previewUpdate(jsonCode);
}
*/

function updatePreview(jsonCode, previewWorkspace) {    //not entirely functional, block preview appears but not accurate, no param or value display in block
  // clear current preview
  previewWorkspace.clear();

  // trim and format json code
  const trimmedCode = jsonCode.trim();

  // return if nothing new to render
  if (!trimmedCode) {
    console.error('No JSON code provided for preview.');
    return;
  }

  //create backup of current blocks
  const backupBlocks = Blockly.Blocks;

  try {
    //temp block object
    Blockly.Blocks = {...backupBlocks};

    //parse json into block def
    const blockDefinition = JSON.parse(trimmedCode);

    //create new block with new json def
    Blockly.Blocks[blockDefinition.type] = {
      init: function() {
        this.jsonInit(blockDefinition);
      }
    };

    //make and render in workspace preview
    const newBlock = previewWorkspace.newBlock(blockDefinition.type);
    newBlock.moveBy(50, 50); //block positioning
    newBlock.initSvg();
    newBlock.render();
  } catch (e) {
    console.error('Error updating block preview:', e);
  } finally {
    //restore og block object
    Blockly.Blocks = backupBlocks;
  }
}

function createWorkspaceInPreview() {
  // Reference to the #preview element
  const previewDiv = document.getElementById('preview');

  // Create a Blockly workspace in the #preview element
  const workspace = Blockly.inject(previewDiv, {
    media: '../../media/', // Path to media files (icons, etc.)
    scrollbars: true, // Enable scrollbars
  });

  // Create a new block (you can change the type to your desired block type)
  const block = workspace.newBlock('math_number');

  // Position the block within the workspace (optional)
  block.moveBy(50, 50);

  // Render the block in the workspace
  block.initSvg();
  block.render();

  // Return the workspace object (optional, for further manipulation)
  return workspace;
}

function updateGenerator(block) {
  function makeVar(root, name) {
    name = name.toLowerCase().replace(/\W/g, '_');
    return '  var ' + root + '_' + name;
  }
  var language = 'Arduino';
  var code = [];
  code.push("Blockly." + language + "['" + block.type +
            "'] = function(block) {");


  // Generate getters for any fields or inputs.
  for (var i = 0, input; input = block.inputList[i]; i++) {
    for (var j = 0, field; field = input.fieldRow[j]; j++) {
      var name = field.name;
      if (!name) {
        continue;
      }
      if (field instanceof Blockly.FieldVariable) {
        // Subclass of Blockly.FieldDropdown, must test first.
        code.push(makeVar('variable', name) +
                  " = Blockly." + language +
                  ".variableDB_.getName(block.getFieldValue('" + name +
                  "'), Blockly.Variables.NAME_TYPE);");
      } else if (field instanceof Blockly.FieldAngle) {
        // Subclass of Blockly.FieldTextInput, must test first.
        code.push(makeVar('angle', name) +
                  " = block.getFieldValue('" + name + "');");
      } else if (Blockly.FieldDate && field instanceof Blockly.FieldDate) {
        // Blockly.FieldDate may not be compiled into Blockly.
        code.push(makeVar('date', name) +
                  " = block.getFieldValue('" + name + "');");
      } else if (field instanceof Blockly.FieldColour) {
        code.push(makeVar('colour', name) +
                  " = block.getFieldValue('" + name + "');");
      } else if (field instanceof Blockly.FieldCheckbox) {
        code.push(makeVar('checkbox', name) +
                  " = block.getFieldValue('" + name + "') == 'TRUE';");
      } else if (field instanceof Blockly.FieldDropdown) {
        code.push(makeVar('dropdown', name) +
                  " = block.getFieldValue('" + name + "');");
      } else if (field instanceof Blockly.FieldTextInput) {
        code.push(makeVar('text', name) +
                  " = block.getFieldValue('" + name + "');");
      }
    }
    var name = input.name;
    if (name) {
      if (input.type == Blockly.INPUT_VALUE) {
        code.push(makeVar('value', name) +
                  " = Blockly." + language + ".valueToCode(block, '" + name +
                  "', Blockly." + language + ".ORDER_ATOMIC);");
      } else if (input.type == Blockly.NEXT_STATEMENT) {
        code.push(makeVar('statements', name) +
                  " = Blockly." + language + ".statementToCode(block, '" +
                  name + "');");
      }
    }
  }
  code.push("  // TODO: Assemble " + language + " into code variable.");
  code.push("  var code = \'...\';");
  if (block.outputConnection) {
    code.push("  // TODO: Change ORDER_NONE to the correct strength.");
    code.push("  return [code, Blockly." + language + ".ORDER_NONE];");
  } else {
    code.push("  return code;");
  }
  code.push("};");

  return code.join('\n');
};

  // Get the root block and start parsing.

  return (
    <div id='horizontal-container' className='flex flex-column'>
      <script src="blocks.js"></script>
      <script src="factory.js"></script>
      <div className='flex flex-row'>
        <div
          id='bottom-container'
          className='flex flex-column vertical-container overflow-visible'
        >
          <Spin
            tip='Compiling Code Please Wait... It may take up to 20 seconds to compile your code.'
            className='compilePop'
            size='large'
            spinning={selectedCompile}
          >
            <Row id='icon-control-panel'>
              <Col flex='none' id='section-header'>
                {/* Program your Arduino... / Custom Blocks */}
                Custom Block
              </Col>
              <Col flex='auto'>
                <Row align='middle' justify='end' id='description-container'>
                  <Col flex={'30px'}>
                    <Row>
                      <Col>
                        <Link id='link' to={'/'} className='flex flex-column'>
                          <i className='fa fa-home fa-lg' />
                        </Link>
                      </Col>
                    </Row>
                  </Col>
                  <Col flex='auto' />
                  <Col flex={'230px'}>
                  </Col>
                </Row>
              </Col>
            </Row>
            {/* workspaces, preview, def, stub elements */}
            <div id='newblockly-canvas'/>
            <Row id='block-bs'>{saveBlock('Save Block')}</Row>  
            <Row id='pre-text'>Block Preview</Row>
            <div id='preview'  style={{ textAlign: 'left' }}>
            </div>
            <Row id='def-text'>Block Definition</Row>
            <Row id='blocklyCanvasMid'  style={{ textAlign: 'left' }}>
              {generatorCode}
            </Row>
            <Row id='gen-text'>Generator Stub</Row>
            <Row id='blocklyCanvasBottom'  style={{ textAlign: 'left' }}>
              {blockCode}
            </Row>
          </Spin>
        </div>
        <ConsoleModal
          show={showConsole}
          connectionOpen={connectionOpen}
          setConnectionOpen={setConnectionOpen}
        ></ConsoleModal>
        <PlotterModal
          show={showPlotter}
          connectionOpen={connectionOpen}
          setConnectionOpen={setConnectionOpen}
          plotData={plotData}
          setPlotData={setPlotData}
          plotId={plotId}
        />
      </div>

      {/* xml code for block menu including cats and subcats */}
      
      <xml id="toolbox" is = "Blockly workspace">
    <category name="Input">
      <block type="input_value">
        <value name="TYPE">
          <shadow type="type_null"></shadow>
        </value>
      </block>
      <block type="input_statement">
        <value name="TYPE">
          <shadow type="type_null"></shadow>
        </value>
      </block>
      <block type="input_dummy"></block>
    </category>
    <category name="Field">
      <block type="field_static"></block>
      <block type="field_input"></block>
      <block type="field_angle"></block>
      <block type="field_dropdown"></block>
      <block type="field_checkbox"></block>
      <block type="field_colour"></block>
      <block type="field_variable"></block>
      <block type="field_image"></block>
    </category>
    <category name="Colour" id="colourCategory">
      <block type="colour_hue"><mutation colour="20"></mutation><field name="HUE"></field></block>
    </category>
    <category name="Type">
      <block type="type_group"></block>
      <block type="type_null"></block>
      <block type="type_boolean"></block>
      <block type="type_number"></block>
      <block type="type_string"></block>
      <block type="type_list"></block>
      <block type="type_other"></block>
    </category>
  </xml>


      {compileError && (
        <Alert
          message={compileError}
          type='error'
          closable
          onClose={(e) => setCompileError('')}
        ></Alert>
      )}
    </div>
  );
}
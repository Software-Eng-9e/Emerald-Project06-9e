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
import NavBar from '../../../../NavBar/NavBar';



let plotId = 1;

export default function CustomBlock({activity}) {
  const [showConsole, setShowConsole] = useState(false);
  const [showPlotter, setShowPlotter] = useState(false);
  const [plotData, setPlotData] = useState([]);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [selectedCompile, setSelectedCompile] = useState(false);
  const [compileError, setCompileError] = useState('');

  //  useStates for Program your Arduino... / Custom Blocks
  //const [selectedFeature, setSelectedFeature] = useState('Custom Blocks');
  const [blockCode, setBlockCode] = useState('');
  const [generatorCode, setGeneratorCode] = useState('');


  const [forceUpdate] = useReducer((x) => x + 1, 0);

  const workspaceRef = useRef(null);
  const activityRef = useRef(null);

  /* ADDED */ const blockMap = new Map(); // variable to store block name for save button
  /* ADDED */ const descriptionMap = new Map(); // variable to store block contents for save button


  



  const setWorkspace = () => {
    workspaceRef.current = window.Blockly.inject('newblockly-canvas', {
      toolbox: document.getElementById('toolbox'),
    });
  
    // Define the XML for the root block
    const rootBlockXml = '<xml>' +
      '<block type="factory_base" deletable="false" movable="false"></block>' +
      '</xml>';
  
    // Convert the XML string to a DOM element
    const xmlDom = Blockly.Xml.textToDom(rootBlockXml);
  
    // Initialize the workspace with the root block
    Blockly.Xml.domToWorkspace(xmlDom, workspaceRef.current);
    //createWorkspaceInPreview();


    const previewDiv = document.getElementById('preview');
    const previewWorkspace = Blockly.inject(previewDiv, {
      media: '../../media/',
      scrollbars: false,
    });

    const block = previewWorkspace.newBlock('math_number');
    block.moveBy(50, 50);
    block.initSvg();
    block.render();
    // Event listener for block creation
    workspaceRef.current.addChangeListener((event) => {
      const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
      const xmlText = Blockly.Xml.domToText(xml);
      
      const genCode = updateLanguage(xmlText);
      setGeneratorCode(genCode);
      updatePreview(genCode, previewWorkspace);
      var allBlocks = previewWorkspace.getTopBlocks(true);
      if (allBlocks.length > 0) {
        // Get the first block (since there's only one)
        var myBlock = allBlocks[0];
    
        // Now pass this block to your function
        const ardCode = updateGenerator(myBlock);
        setBlockCode(ardCode);
    } else {

      setBlockCode("not working");
    }
      
      //onst abcd = updateGenerator(prevBlock)
      //setBlockCode(abcd);
    });
  };

    useEffect(() => {
      const setUp = async () => {
        activityRef.current = activity;
        if (!workspaceRef.current && activity && Object.keys(activity).length !== 0) {
          setWorkspace();
        }
      };
      setUp();
    }, [activity]);
  
  


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



//algorithm borrowed from ardublockly factory https://github.com/carlosperate/ardublockly
function updateLanguage(xmlCode, varToChange) {

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

  var code = formatJson_(blockType, rootBlock);
  temporaryWorkspace.clear();
  temporaryWorkspace.dispose();  
  return code;
  

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






function updatePreview(jsonCode, previewWorkspace) {
  previewWorkspace.clear();

  var format = 'JSON';
  var code = jsonCode.trim();

  if (!code) {
    // Nothing to render. Happens while cloud storage is loading.
    return;
  }

  var backupBlocks = Blockly.Blocks;

  try {
    // Make a shallow copy.
    Blockly.Blocks = Object.assign({}, backupBlocks);

    if (format === 'JSON') {
      var json = JSON.parse(code);
      Blockly.Blocks[json.id || 'UNNAMED'] = {
        init: function () {
          this.jsonInit(json);
        },
      };
    } else {
      throw 'Unknown format: ' + format;
    }

    // Look for a block on Blockly.Blocks that does not match the backup.

    var blockType = null;


    for (var type in Blockly.Blocks) {
      if (
        typeof Blockly.Blocks[type].init === 'function' &&
        Blockly.Blocks[type] !== backupBlocks[type]
      ) {
        blockType = type;
        break;
      }
    }

    if (!blockType) {
      return;
    }

    const block = previewWorkspace.newBlock(blockType);
    block.moveBy(50, 50);
    block.initSvg();
    block.render();

  } finally {
    Blockly.Blocks = backupBlocks;
  }
  

}



//arduino code generator takes contents from custom block and parses it in arduino code
//algorithm taken from blocklyduino https://github.com/BlocklyDuino/BlocklyDuinoFactory

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
            {/* Code to fix the workspace to half and provide space for the block def and gen code, will need to add a block preview */}
            <div id='newblockly-canvas'/>
            <Row id='block-bs'>{saveBlock('Save Block')}</Row>
            <Row id='pre-text'>Block Preview</Row>
            <div id='preview'  style={{ textAlign: 'left' }}>
              {/* Block Preview */}
              {/* {preview} */}
            </div>
            <Row id='def-text'>Block Definition</Row>
            <Row id='blocklyCanvasMid'  style={{ textAlign: 'left' }}>
              {/* {Block Definition} */}
              {generatorCode}
            </Row>
            <Row id='gen-text'>Generator Stub</Row>
            <Row id='blocklyCanvasBottom'  style={{ textAlign: 'left' }}>
              {/* {Generator Stub} */}
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
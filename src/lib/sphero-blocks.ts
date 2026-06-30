// Sphero Blockly toolbox + JS generator hookup.
import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";

let registered = false;

export function registerSpheroBlocks() {
  if (registered) return;
  registered = true;

  Blockly.defineBlocksWithJsonArray([
    {
      type: "sphero_set_color",
      message0: "set color R %1 G %2 B %3",
      args0: [
        { type: "input_value", name: "R", check: "Number" },
        { type: "input_value", name: "G", check: "Number" },
        { type: "input_value", name: "B", check: "Number" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 20,
    },
    {
      type: "sphero_roll",
      message0: "roll speed %1 heading %2° for %3 ms",
      args0: [
        { type: "input_value", name: "SPEED", check: "Number" },
        { type: "input_value", name: "HEADING", check: "Number" },
        { type: "input_value", name: "DURATION", check: "Number" },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
    },
    {
      type: "sphero_spin",
      message0: "spin to %1°",
      args0: [{ type: "input_value", name: "HEADING", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
    },
    {
      type: "sphero_stop",
      message0: "stop",
      previousStatement: null,
      nextStatement: null,
      colour: 0,
    },
    {
      type: "sphero_wait",
      message0: "wait %1 ms",
      args0: [{ type: "input_value", name: "MS", check: "Number" }],
      previousStatement: null,
      nextStatement: null,
      colour: 230,
    },
  ]);

  const g = javascriptGenerator;
  const num = (b: Blockly.Block, n: string, def = "0") =>
    g.valueToCode(b, n, Order.NONE) || def;

  g.forBlock["sphero_set_color"] = (b) =>
    `await setColor(${num(b, "R")}, ${num(b, "G")}, ${num(b, "B")});\n`;
  g.forBlock["sphero_roll"] = (b) =>
    `await roll(${num(b, "SPEED")}, ${num(b, "HEADING")}, ${num(b, "DURATION", "1000")});\n`;
  g.forBlock["sphero_spin"] = (b) => `await spin(${num(b, "HEADING")});\n`;
  g.forBlock["sphero_stop"] = () => `await stop();\n`;
  g.forBlock["sphero_wait"] = (b) => `await wait(${num(b, "MS", "500")});\n`;
}

export const SPHERO_TOOLBOX = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Sphero",
      colour: "160",
      contents: [
        { kind: "block", type: "sphero_set_color" },
        { kind: "block", type: "sphero_roll" },
        { kind: "block", type: "sphero_spin" },
        { kind: "block", type: "sphero_stop" },
        { kind: "block", type: "sphero_wait" },
      ],
    },
    {
      kind: "category",
      name: "Logic",
      colour: "210",
      contents: [
        { kind: "block", type: "controls_if" },
        { kind: "block", type: "logic_compare" },
        { kind: "block", type: "logic_operation" },
        { kind: "block", type: "logic_boolean" },
      ],
    },
    {
      kind: "category",
      name: "Loops",
      colour: "120",
      contents: [
        { kind: "block", type: "controls_repeat_ext" },
        { kind: "block", type: "controls_whileUntil" },
        { kind: "block", type: "controls_for" },
      ],
    },
    {
      kind: "category",
      name: "Math",
      colour: "230",
      contents: [
        { kind: "block", type: "math_number" },
        { kind: "block", type: "math_arithmetic" },
        { kind: "block", type: "math_random_int" },
      ],
    },
    {
      kind: "category",
      name: "Variables",
      colour: "330",
      custom: "VARIABLE",
    },
  ],
};

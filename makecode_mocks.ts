// Mocks for MakeCode APIs
const Math = global.Math;
const console = global.console;

namespace sprites {
    export function create(img: any, kind: any) { return { x: 0, y: 0, setPosition: function(){} }; }
}
const SpriteKind = { Enemy: 1 };
const img = function(strings: any) { return strings[0]; };

// We also need to define randint, control.panic, etc.
function randint(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
const control = { panic: function(code: number) { throw new Error("Panic " + code); } };

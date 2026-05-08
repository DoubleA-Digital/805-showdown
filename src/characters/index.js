import Ram from './ram.js';
import Arthur from './arthur.js';
import Matteen from './matteen.js';
import Ajay from './ajay.js';
import Cameron from './cameron.js';
import Aarush from './aarush.js';
import Pratik from './pratik.js';
import Mathew from './mathew.js';
import Harshith from './harshith.js';
import Dilion from './dilion.js';

export const CHARACTERS = [Ram, Arthur, Matteen, Ajay, Cameron, Aarush, Pratik, Mathew, Harshith, Dilion];

export const CHARACTER_MAP = Object.fromEntries(CHARACTERS.map(c => [c.name.toLowerCase(), c]));

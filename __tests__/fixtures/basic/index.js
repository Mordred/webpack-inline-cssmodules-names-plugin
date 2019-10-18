import styles from './styles.css';
import { util } from './utils';

console.log(styles.Example);
console.log(styles.Example__button);
console.log(styles['Example__button--quoted']);
console.log(styles["Example__button--doublequoted"]);
console.log(styles[`Example__button--template`]);
console.log(util());

function cx(...args) {
    console.log(...args);
}

const hasLargeFont = true;
const isCompact = true;

cx(styles.Example, hasLargeFont && styles['Example__button--quoted'], isCompact && styles['Example__button--doublequoted'])

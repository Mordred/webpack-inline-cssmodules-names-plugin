import styles from './styles.css';
import { util } from './utils';

console.log(styles.Example);
console.log(styles.Example__button);
const mode = 'variable';
console.log(styles[`Example__button--${mode}`]);
console.log(util());

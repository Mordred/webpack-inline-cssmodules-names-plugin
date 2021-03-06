import styles from './styles.css';
import { util } from './utils';

console.log(styles.Example);
console.log(styles.Example__button);
const mode = 'variable';
const index = 12;
const storage = { [index]: 'variable' };
console.log(styles[`Example__button--${mode}`]);
console.log(styles[`Example__button--${storage[index]}--base`]);
console.log(styles['Example__button--' + mode]);
const color = 1;
cx(
    styles.Example,
    styles[[
        'Example__button--pink',
        'Example__button--violet',
    ][color]],
)

/* declare module '*.svg' {
    const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
    export default content;
} */

declare module '*.svg' {
    const value: never;
    export = value;
}

declare module '*.png' {
    const value: never;
    export = value;
}
/* 
declare module '*.woff' {
  const classes: {}
    const content: React.FunctionComponent<React.font>;
    export default content;
}
 */

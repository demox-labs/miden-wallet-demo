/// <reference types="react" />

declare type ImportedSVGComponent = React.FunctionComponent<
  React.SVGProps<SVGSVGElement> & { title?: string }
>;

declare module '*.svg' {
  export const ReactComponent: ImportedSVGComponent;

  const src: string;
  export default src;
}

import { FrameworkConfiguration } from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources([
    "./elements/pdf-viewer/pdf-viewer"
  ]);
}
